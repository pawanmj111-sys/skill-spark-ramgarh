import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { CheckCircle2, Loader2, AlertTriangle, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TierCard } from "@/components/tier-card";
import { ACADEMY, TIERS, isMinor, recommendationReason, supportiveGuidance, type TierId } from "@/lib/academy";
import { chooseCourse, createPaymentOrder, getMyApplication, markPaymentFailed, verifyPayment } from "@/lib/applications.functions";

export const Route = createFileRoute("/application/$id")({
  validateSearch: z.object({ t: z.string().default("") }),
  head: () => ({ meta: [{ title: "Your recommendation — AI Skill Academy" }, { name: "robots", content: "noindex" }, { name: "description", content: "Your course recommendation and registration payment." }] }),
  ssr: false,
  component: AppPage,
});

declare global { interface Window { Razorpay?: any } }

function loadRzp() {
  return new Promise<boolean>((res) => {
    if (window.Razorpay) return res(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => res(true); s.onerror = () => res(false);
    document.body.appendChild(s);
  });
}

function AppPage() {
  const { id } = Route.useParams();
  const { t } = Route.useSearch();
  const get = useServerFn(getMyApplication), choose = useServerFn(chooseCourse), order = useServerFn(createPaymentOrder), verify = useServerFn(verifyPayment), fail = useServerFn(markPaymentFailed);
  const [app, setApp] = useState<Awaited<ReturnType<typeof getMyApplication>> | null>(null);
  const [error, setError] = useState("");
  const [paying, setPaying] = useState(false);
  const [payMsg, setPayMsg] = useState("");

  const load = useCallback(() => get({ data: { id, token: t } }).then(setApp).catch(() => setError("We couldn't find this registration link.")), [id, t]);
  useEffect(() => { load(); }, [load]);

  if (error) return <div className="container-page py-20 text-center"><p>{error}</p><Button asChild className="mt-4"><Link to="/register">Register</Link></Button></div>;
  if (!app) return <div className="grid place-items-center py-32"><Loader2 className="size-8 animate-spin text-primary" /></div>;

  const rec = app.recommended_tier as TierId;
  const selected = (app.selected_tier ?? null) as TierId | null;

  async function pick(tier: TierId | null, advice = false) {
    await choose({ data: { id, token: t, tier, wants_advice: advice } });
    await load();
    toast.success(advice ? "Noted — the academy will advise you." : `${TIERS[tier!].name} selected`);
  }

  async function pay() {
    setPaying(true); setPayMsg("");
    try {
      const o = await order({ data: { id, token: t } });
      if (o.status === "already_paid") { await load(); return; }
      if (o.status === "not_configured") { setPayMsg("Payments setup pending. Online payment isn't active yet — your registration is saved and the academy will contact you."); return; }
      if (!(await loadRzp())) throw new Error("Could not load Razorpay checkout. Check your internet and retry.");
      const rzp = new window.Razorpay({
        key: o.keyId, order_id: o.orderId, amount: o.amount, currency: "INR",
        name: "AI Skill Academy", description: "One-time registration fee",
        prefill: { name: o.name, contact: o.phone }, theme: { color: "#2b4fd8" },
        handler: async (r: any) => {
          setPayMsg("Verifying payment…");
          try {
            const v = await verify({ data: { id, token: t, ...r } });
            setPayMsg(v.paid ? "" : "Payment could not be verified. If money was deducted, it will be confirmed automatically or refunded — please contact the academy.");
          } catch { setPayMsg("Verification failed. Please retry or contact the academy."); }
          await load(); setPaying(false);
        },
        modal: { ondismiss: () => { setPayMsg("Payment cancelled. You can retry anytime."); setPaying(false); } },
      });
      rzp.on("payment.failed", () => { fail({ data: { id, token: t } }); setPayMsg("Payment failed. Please try again."); });
      rzp.open();
      return;
    } catch (e: any) { setPayMsg(e?.message ?? "Payment error"); }
    setPaying(false);
  }

  if (app.payment_status === "paid") {
    return (
      <div className="container-page max-w-xl py-20 text-center">
        <CheckCircle2 className="mx-auto size-16 text-success" />
        <h1 className="mt-4 text-3xl font-bold">Registration confirmed</h1>
        <p className="mt-2 text-muted-foreground">Thank you, {app.full_name}. Your ₹149 registration fee is received{app.razorpay_payment_id ? ` (ref ${app.razorpay_payment_id})` : ""}. The academy will call you to confirm your batch.</p>
        {selected && <p className="mt-4">Selected course: <strong>{TIERS[selected].name}</strong> — ₹{TIERS[selected].price}/month (paid monthly, separately).</p>}
      </div>
    );
  }

  const tips = supportiveGuidance(app);
  const fee = selected ? TIERS[selected].price : null;

  return (
    <div className="container-page py-12">
      <p className="text-sm font-semibold text-primary">Hi {app.full_name.split(" ")[0]}, here's our suggestion</p>
      <h1 className="mt-1 text-3xl font-bold md:text-4xl">We recommend: {TIERS[rec].name} — ₹{TIERS[rec].price}/month</h1>
      <p className="mt-3 max-w-3xl text-muted-foreground">{recommendationReason(rec, app)}</p>
      {tips.length > 0 && <ul className="mt-4 max-w-3xl list-disc space-y-1 pl-5 text-sm">{tips.map((x) => <li key={x}>{x}</li>)}</ul>}
      <p className="mt-3 text-xs text-muted-foreground">We teach practical skills; we do not guarantee income, clients or jobs.</p>

      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {(["basic", "moderate", "advance"] as TierId[]).map((id2) => (
          <TierCard key={id2} id={id2} highlight={id2 === rec ? "Recommended for you" : undefined} selected={selected === id2}>
            <Button className="w-full" variant={selected === id2 ? "hero" : "outline"} onClick={() => pick(id2)}>{selected === id2 ? "Selected" : "Choose " + TIERS[id2].name}</Button>
          </TierCard>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-3">
        <Button variant="ghost" onClick={() => pick(null, true)}>{app.wants_advice ? "✓ Academy will advise me" : "I'd like the academy to advise me"}</Button>
        <Button asChild variant="ghost"><a href={ACADEMY.whatsapp} target="_blank" rel="noreferrer"><MessageCircle /> Ask on WhatsApp</a></Button>
      </div>

      <div className="mt-10 max-w-xl rounded-2xl border bg-card p-6 shadow-card">
        <h2 className="text-xl font-bold">Fee summary</h2>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between"><dt>Course fee (monthly){selected ? ` — ${TIERS[selected].name}` : ""}</dt><dd>{fee ? `₹${fee}/month` : "Choose a course"}</dd></div>
          <div className="flex justify-between"><dt>Registration fee (one-time, separate)</dt><dd>₹149</dd></div>
        </dl>
        <p className="mt-3 text-xs text-muted-foreground">Pay now: only the ₹149 registration fee. It does not include your first month's course fee.</p>
        {isMinor(app.age_group) && <p className="mt-3 rounded-lg bg-highlight/15 p-3 text-sm">Under 18: please make this payment with your parent/guardian present.</p>}
        {!app.payments.configured ? (
          <div className="mt-5 flex gap-2 rounded-lg border border-dashed p-3 text-sm"><AlertTriangle className="size-5 shrink-0 text-highlight-foreground" />Payments setup pending. Your registration is saved; the academy will contact you about payment.</div>
        ) : (
          <>
            {app.payments.testMode && <p className="mt-4 text-xs font-semibold text-primary">TEST MODE — no real money is charged.</p>}
            <Button className="mt-4 w-full" size="lg" onClick={pay} disabled={paying}>{paying && <Loader2 className="animate-spin" />}{app.payment_status === "failed" ? "Retry payment of ₹149" : "Pay ₹149 registration fee"}</Button>
          </>
        )}
        {payMsg && <p className="mt-3 text-sm" role="status">{payMsg}</p>}
      </div>
    </div>
  );
}
