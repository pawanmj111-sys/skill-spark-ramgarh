import { createFileRoute } from "@tanstack/react-router";
import { hmacSha256Hex, timingSafeEqual } from "@/lib/crypto.server";

// Razorpay webhook: authoritative payment status. Verifies X-Razorpay-Signature
// (HMAC-SHA256 of the raw body with RAZORPAY_WEBHOOK_SECRET) and dedupes by event id.
export const Route = createFileRoute("/api/public/razorpay-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env["RAZORPAY_WEBHOOK_SECRET"];
        if (!secret) return new Response("Webhook not configured", { status: 503 });
        const raw = await request.text();
        const sig = request.headers.get("x-razorpay-signature") ?? "";
        const expected = await hmacSha256Hex(secret, raw);
        if (!timingSafeEqual(expected, sig)) return new Response("Invalid signature", { status: 401 });

        let evt: any;
        try { evt = JSON.parse(raw); } catch { return new Response("Bad JSON", { status: 400 }); }
        const eventId = request.headers.get("x-razorpay-event-id") ?? `${evt.event}:${evt.payload?.payment?.entity?.id ?? evt.created_at}`;
        const payment = evt.payload?.payment?.entity;
        const orderId: string | undefined = payment?.order_id ?? evt.payload?.order?.entity?.id;

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { error: dupErr } = await supabaseAdmin.from("payment_events").insert({
          event_id: eventId, event_type: String(evt.event ?? "unknown"), order_id: orderId ?? null, payment_id: payment?.id ?? null,
        });
        if (dupErr) {
          if (dupErr.code === "23505") return Response.json({ ok: true, duplicate: true });
          console.error(dupErr);
          return new Response("Storage error", { status: 500 });
        }
        if (!orderId) return Response.json({ ok: true });

        const now = new Date().toISOString();
        const captured = evt.event === "payment.captured" || evt.event === "order.paid";
        if (captured && payment?.amount === 14900 && payment?.currency === "INR") {
          await supabaseAdmin.from("applications").update({
            payment_status: "paid", razorpay_payment_id: payment.id, payment_verified_via: "webhook", paid_at: now, updated_at: now,
          }).eq("razorpay_order_id", orderId).neq("payment_status", "paid");
        } else if (evt.event === "payment.failed") {
          await supabaseAdmin.from("applications").update({ payment_status: "failed", updated_at: now })
            .eq("razorpay_order_id", orderId).neq("payment_status", "paid");
          await supabaseAdmin.from("applications").update({ course_payment_status: "failed", updated_at: now })
            .eq("course_order_id", orderId).neq("course_payment_status", "paid");
        }
        if (captured && payment?.currency === "INR" && typeof payment?.amount === "number") {
          await supabaseAdmin.from("applications").update({
            course_payment_status: "paid", course_payment_id: payment.id, course_paid_at: now, updated_at: now,
          }).eq("course_order_id", orderId).eq("course_amount", payment.amount).neq("course_payment_status", "paid");
        }
        return Response.json({ ok: true });
      },
    },
  },
});
