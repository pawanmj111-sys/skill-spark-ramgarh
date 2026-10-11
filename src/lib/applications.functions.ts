import { createServerFn } from "@tanstack/react-start";
import { getRequestIP } from "@tanstack/react-start/server";
import { z } from "zod";
import {
  ACADEMY, AGE_GROUPS, DEVICES, EXPERIENCES, GOALS, INTERESTS, PRACTICE, STATUSES,
  isMinor, isValidIndianMobile, normalizePhone, recommendTier,
} from "./academy";
import { hmacSha256Hex, randomToken, razorpayConfig, sha256Hex, timingSafeEqual } from "./crypto.server";

const phone = z.string().trim().refine(isValidIndianMobile, "Enter a valid 10-digit Indian mobile number");

const applicationSchema = z
  .object({
    full_name: z.string().trim().min(2, "Enter your full name").max(100),
    phone,
    village: z.string().trim().min(2, "Enter your village/town").max(100),
    age_group: z.enum(AGE_GROUPS),
    current_status: z.enum(STATUSES),
    device_access: z.enum(DEVICES),
    experience: z.enum(EXPERIENCES),
    interests: z.array(z.enum(INTERESTS)).min(1, "Pick at least one interest").max(8),
    main_goal: z.enum(GOALS),
    practice_time: z.enum(PRACTICE),
    consent: z.literal(true, { errorMap: () => ({ message: "Consent is required" }) }),
    guardian_name: z.string().trim().max(100).optional(),
    guardian_phone: z.string().trim().max(20).optional(),
    guardian_consent: z.boolean().optional(),
    website: z.string().max(0).optional(), // honeypot
  })
  .superRefine((d, ctx) => {
    if (isMinor(d.age_group)) {
      if (!d.guardian_name || d.guardian_name.length < 2)
        ctx.addIssue({ code: "custom", path: ["guardian_name"], message: "Parent/guardian name is required" });
      if (!d.guardian_phone || !isValidIndianMobile(d.guardian_phone))
        ctx.addIssue({ code: "custom", path: ["guardian_phone"], message: "Valid parent/guardian mobile is required" });
      if (!d.guardian_consent)
        ctx.addIssue({ code: "custom", path: ["guardian_consent"], message: "Parent/guardian involvement is required" });
    }
  });

export type ApplicationInput = z.input<typeof applicationSchema>;

async function admin() {
  return (await import("@/integrations/supabase/client.server")).supabaseAdmin;
}

const accessSchema = z.object({ id: z.string().uuid(), token: z.string().min(20).max(100) });

async function loadWithToken(id: string, token: string) {
  const db = await admin();
  const { data } = await db.from("applications").select("*").eq("id", id).maybeSingle();
  if (!data) throw new Error("Application not found");
  const hash = await sha256Hex(token);
  if (!timingSafeEqual(hash, data.access_token_hash)) throw new Error("Application not found");
  return { db, app: data };
}

export const submitApplication = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => applicationSchema.parse(d))
  .handler(async ({ data }) => {
    if (data.website) throw new Error("Submission rejected");
    const db = await admin();
    const ip = getRequestIP({ xForwardedFor: true }) ?? "unknown";
    const ipHash = await sha256Hex(`aisa:${ip}`);
    const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count } = await db.from("applications").select("id", { count: "exact", head: true }).eq("ip_hash", ipHash).gte("created_at", since);
    if ((count ?? 0) >= 5) throw new Error("Too many registrations from this network. Please try again later or call the academy.");

    const token = randomToken();
    const minor = isMinor(data.age_group);
    const now = new Date().toISOString();
    const { data: row, error } = await db
      .from("applications")
      .insert({
        full_name: data.full_name,
        phone: normalizePhone(data.phone),
        village: data.village,
        age_group: data.age_group,
        current_status: data.current_status,
        device_access: data.device_access,
        experience: data.experience,
        interests: data.interests,
        main_goal: data.main_goal,
        practice_time: data.practice_time,
        consent: true,
        consent_at: now,
        guardian_name: minor ? data.guardian_name : null,
        guardian_phone: minor && data.guardian_phone ? normalizePhone(data.guardian_phone) : null,
        guardian_consent: minor ? Boolean(data.guardian_consent) : false,
        recommended_tier: recommendTier(data),
        access_token_hash: await sha256Hex(token),
        ip_hash: ipHash,
      })
      .select("id")
      .single();
    if (error || !row) {
      console.error("insert failed", error);
      throw new Error("Could not save your registration. Please try again.");
    }
    return { id: row.id, token };
  });

export const getMyApplication = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => accessSchema.parse(d))
  .handler(async ({ data }) => {
    const { app } = await loadWithToken(data.id, data.token);
    const cfg = razorpayConfig();
    return {
      id: app.id,
      full_name: app.full_name,
      age_group: app.age_group,
      experience: app.experience,
      interests: app.interests,
      device_access: app.device_access,
      practice_time: app.practice_time,
      recommended_tier: app.recommended_tier,
      selected_tier: app.selected_tier,
      wants_advice: app.wants_advice,
      payment_status: app.payment_status,
      paid_at: app.paid_at,
      razorpay_payment_id: app.razorpay_payment_id,
      payments: { configured: cfg.configured, testMode: cfg.testMode },
    };
  });

export const chooseCourse = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    accessSchema.extend({ tier: z.enum(["basic", "moderate", "advance"]).nullable(), wants_advice: z.boolean() }).parse(d),
  )
  .handler(async ({ data }) => {
    const { db } = await loadWithToken(data.id, data.token);
    await db.from("applications").update({ selected_tier: data.tier, wants_advice: data.wants_advice, updated_at: new Date().toISOString() }).eq("id", data.id);
    return { ok: true };
  });

export const createPaymentOrder = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => accessSchema.parse(d))
  .handler(async ({ data }) => {
    const { db, app } = await loadWithToken(data.id, data.token);
    if (app.payment_status === "paid") return { status: "already_paid" as const };
    const cfg = razorpayConfig();
    if (!cfg.configured) return { status: "not_configured" as const };

    const res = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Basic " + btoa(`${cfg.keyId}:${cfg.keySecret}`) },
      body: JSON.stringify({
        amount: ACADEMY.registrationFeePaise,
        currency: "INR",
        receipt: `reg_${app.id.slice(0, 30)}`,
        notes: { application_id: app.id, purpose: "One-time registration fee" },
      }),
    });
    if (!res.ok) {
      console.error("Razorpay order error", res.status, await res.text());
      throw new Error("Payment service is unavailable right now. Please try again shortly.");
    }
    const order = (await res.json()) as { id: string; amount: number };
    if (order.amount !== ACADEMY.registrationFeePaise) throw new Error("Unexpected order amount");
    await db.from("applications").update({ razorpay_order_id: order.id, payment_status: "pending", updated_at: new Date().toISOString() }).eq("id", app.id);
    return {
      status: "created" as const,
      orderId: order.id,
      amount: order.amount,
      keyId: cfg.keyId!,
      testMode: cfg.testMode,
      name: app.full_name,
      phone: app.phone,
    };
  });

export const verifyPayment = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    accessSchema
      .extend({
        razorpay_order_id: z.string().min(5).max(60),
        razorpay_payment_id: z.string().min(5).max(60),
        razorpay_signature: z.string().regex(/^[a-f0-9]{64}$/),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { db, app } = await loadWithToken(data.id, data.token);
    const cfg = razorpayConfig();
    if (!cfg.configured) throw new Error("Payments are not configured");
    if (app.payment_status === "paid") return { paid: true };
    if (app.razorpay_order_id !== data.razorpay_order_id) throw new Error("Order does not match this registration");
    const expected = await hmacSha256Hex(cfg.keySecret!, `${data.razorpay_order_id}|${data.razorpay_payment_id}`);
    if (!timingSafeEqual(expected, data.razorpay_signature)) {
      await db.from("applications").update({ payment_status: "failed", updated_at: new Date().toISOString() }).eq("id", app.id).neq("payment_status", "paid");
      return { paid: false };
    }
    await db
      .from("applications")
      .update({
        payment_status: "paid",
        razorpay_payment_id: data.razorpay_payment_id,
        payment_verified_via: "signature",
        paid_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", app.id)
      .neq("payment_status", "paid");
    return { paid: true };
  });

export const markPaymentFailed = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => accessSchema.parse(d))
  .handler(async ({ data }) => {
    const { db } = await loadWithToken(data.id, data.token);
    await db.from("applications").update({ payment_status: "failed", updated_at: new Date().toISOString() }).eq("id", data.id).neq("payment_status", "paid");
    return { ok: true };
  });
