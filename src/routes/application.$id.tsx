import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { CheckCircle2, Clock, Loader2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TierCard } from "@/components/tier-card";
import { UpiPay } from "@/components/upi-pay";
import { ACADEMY, TIERS, isMinor, recommendationReason, supportiveGuidance, type TierId } from "@/lib/academy";
import { chooseCourse, getMyApplication, submitUpiRef } from "@/lib/applications.functions";

export const Route = createFileRoute("/application/$id")({
  validateSearch: z.object({ t: z.string().default("") }),
  head: () => ({ meta: [{ title: "Your recommendation — AI Skill Academy" }, { name: "robots", content: "noindex" }, { name: "description", content: "Your course recommendation and UPI payment." }] }),
  ssr: false,
  component: AppPage,
});

function Waiting({ utr }: { utr?: string | null }) {
  return (
    <div className="mt-4 flex gap-2 rounded-lg border border-dashed p-3 text-left text-sm">
      <Clock className="size-5 shrink-0 text-primary" />
      <span>Payment submitted{utr ? ` (UTR ${utr})` : ""}. The academy is checking it and will confirm soon. Wrong number? Call {ACADEMY.phone ?? "the academy"}.</span>
    </div>
  );
}

function AppPage() {
  const { id } = Route.useParams();
  const { t } = Route.useSearch();
  const get = useServerFn(getMyApplication), choose = useServerFn(chooseCourse), upi = useServerFn(submitUpiRef);
  const [app, setApp] = useState<Awaited<ReturnType<typeof getMyApplication>> | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(() => get({ data: { id, token: t } }).then(setApp).catch(() => setError("We couldn't find this registration link.")), [id, t]);
  useEffect(() => { load(); }, [load]);

  if (error) return <div className="container-page py-20 text-center"><p>{error}</p><Button asChild className="mt-4"><Link to="/register">Register</Link></Button></div>;
  if (!app) return <div className="grid place-items-center py-32"><Loader2 className="size-8 animate-spin text-primary" /></div>;

  const rec = app.recommended_tier as TierId;
  const selected = (app.selected_tier ?? null) as TierId | null;
  const fee = selected ? TIERS[selected].price : null;
  const balance = fee ? fee - ACADEMY.registrationFeeINR : null;

  async function pick(tier: TierId | null, advice = false) {
    await choose({ data: { id, token: t, tier, wants_advice: advice } });
    await load();
    toast.success(advice ? "Noted — the academy will advise you." : `${TIERS[tier!].name} selected`);
  }
  async function send(kind: "registration" | "course", utr: string) {
    await upi({ data: { id, token: t, kind, utr } });
    toast.success("Payment reference submitted");
    await load();
  }

  if (app.payment_status === "paid") {
    const coursePaid = app.course_payment_status === "paid";
    return (
      <div className="container-page max-w-xl py-20 text-center">
        <CheckCircle2 className="mx-auto size-16 text-success" />
        <h1 className="mt-4 text-3xl font-bold">{coursePaid ? "First month fully paid" : "Registration confirmed"}</h1>
        <p className="mt-2 text-muted-foreground">Thank you, {app.full_name}. ₹149 received and adjusted in your first month's fee.</p>
        {coursePaid ? (
          <p className="mt-4">Remaining ₹{(app.course_amount ?? 0) / 100} received. The academy will call you to confirm your batch.</p>
        ) : selected && balance ? (
          <div className="mt-6 rounded-2xl border bg-card p-6 text-left shadow-card">
            <h2 className="text-lg font-bold">{TIERS[selected].name} — first month</h2>
            <dl className="mt-3 space-y-1 text-sm">
              <div className="flex justify-between"><dt>Course fee</dt><dd>₹{fee}</dd></div>
              <div className="flex justify-between"><dt>Registration already paid</dt><dd>− ₹149</dd></div>
              <div className="flex justify-between font-bold"><dt>Remaining to pay</dt><dd>₹{balance}</dd></div>
            </dl>
            {app.course_payment_status === "verifying"
              ? <Waiting utr={app.course_upi_ref} />
              : <>
                  {app.course_payment_status === "failed" && <p className="mt-3 text-sm text-destructive">We couldn't confirm your last payment. Please check and submit again.</p>}
                  <UpiPay amount={balance} note={`AISA course ${app.id.slice(0, 8)}`} onSubmit={(u) => send("course", u)} />
                </>}
          </div>
        ) : (
          <p className="mt-4 text-sm">The academy will help you choose a course and pay the remaining fee.</p>
        )}
      </div>
    );
  }

  const tips = supportiveGuidance(app);

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
          <div className="flex justify-between"><dt>Pay now: registration (adjusted in first month)</dt><dd>₹149</dd></div>
          <div className="flex justify-between"><dt>Remaining for first month</dt><dd>{balance ? `₹${balance}` : "—"}</dd></div>
        </dl>
        {isMinor(app.age_group) && <p className="mt-3 rounded-lg bg-highlight/15 p-3 text-sm">Under 18: please make this payment with your parent/guardian present.</p>}
        {app.payment_status === "verifying"
          ? <Waiting utr={app.upi_ref} />
          : <>
              {app.payment_status === "failed" && <p className="mt-3 text-sm text-destructive">We couldn't confirm your last payment. Please check and submit again.</p>}
              <UpiPay amount={ACADEMY.registrationFeeINR} note={`AISA reg ${app.id.slice(0, 8)}`} onSubmit={(u) => send("registration", u)} />
            </>}
      </div>
    </div>
  );
}
