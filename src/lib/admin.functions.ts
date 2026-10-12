import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data } = await ctx.supabase.rpc("has_role", { _user_id: ctx.userId, _role: "admin" });
  if (!data) throw new Error("Forbidden");
}

export const getAdminStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    return {
      isAdmin: Boolean(data),
      bootstrapConfigured: Boolean(process.env["ADMIN_EMAILS"]),
      payments: {
        keyId: Boolean(process.env["RAZORPAY_KEY_ID"]),
        keySecret: Boolean(process.env["RAZORPAY_KEY_SECRET"]),
        webhookSecret: Boolean(process.env["RAZORPAY_WEBHOOK_SECRET"]),
        testMode: Boolean(process.env["RAZORPAY_KEY_ID"]?.startsWith("rzp_test_")),
      },
    };
  });

// Grants admin only if the signed-in user's CONFIRMED email is listed in the
// server-only ADMIN_EMAILS secret. No secret → no bypass.
export const claimAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const allowed = (process.env["ADMIN_EMAILS"] ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
    if (!allowed.length) throw new Error("Admin access is not configured yet (ADMIN_EMAILS secret missing).");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: u } = await supabaseAdmin.auth.admin.getUserById(context.userId);
    const email = u.user?.email?.toLowerCase();
    if (!email || !u.user?.email_confirmed_at || !allowed.includes(email)) throw new Error("This account is not authorised as an admin.");
    await supabaseAdmin.from("user_roles").upsert({ user_id: context.userId, role: "admin" }, { onConflict: "user_id,role" });
    return { ok: true };
  });

export const listApplications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("applications")
      .select("id,created_at,full_name,phone,village,age_group,current_status,device_access,experience,interests,main_goal,practice_time,consent,consent_at,guardian_name,guardian_phone,guardian_consent,recommended_tier,selected_tier,wants_advice,payment_status,payment_amount,razorpay_order_id,razorpay_payment_id,payment_verified_via,paid_at,lead_status,notes")
      .order("created_at", { ascending: false })
      .limit(2000);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const updateApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      id: z.string().uuid(),
      lead_status: z.enum(["new", "contacted", "enrolled", "not_proceeding"]).optional(),
      notes: z.string().max(5000).optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { id, lead_status, notes } = data;
    const { error } = await context.supabase
      .from("applications")
      .update({
        ...(lead_status !== undefined ? { lead_status } : {}),
        ...(notes !== undefined ? { notes } : {}),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
