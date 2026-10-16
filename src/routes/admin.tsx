import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Download, Loader2, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { claimAdmin, confirmUpiPayment, getAdminStatus, listApplications, updateApplication } from "@/lib/admin.functions";
import { LEAD_STATUSES, TIERS, type TierId } from "@/lib/academy";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({ meta: [{ title: "Admin dashboard — AI Skill Academy" }, { name: "robots", content: "noindex" }, { name: "description", content: "Private admin dashboard." }] }),
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) { const { redirect } = await import("@tanstack/react-router"); throw redirect({ to: "/auth" }); }
  },
  component: Admin,
});

type Row = Awaited<ReturnType<typeof listApplications>>[number];
const tierName = (t?: string | null) => (t ? TIERS[t as TierId]?.name ?? t : "—");
const leadLabel = (l: string) => LEAD_STATUSES.find((x) => x.id === l)?.label ?? l;
const sel = "h-9 rounded-md border bg-card px-2 text-sm";

function Admin() {
  const nav = useNavigate();
  const status = useServerFn(getAdminStatus), claim = useServerFn(claimAdmin), list = useServerFn(listApplications), upd = useServerFn(updateApplication), confirmUpi = useServerFn(confirmUpiPayment);
  async function decide(kind: "registration" | "course", approve: boolean) { if (!open) return; await confirmUpi({ data: { id: open.id, kind, approve } }); toast.success(approve ? "Payment confirmed" : "Marked not received"); const r = await list(); setRows(r); setOpen(r.find((x) => x.id === open.id) ?? null); }
  const [st, setSt] = useState<Awaited<ReturnType<typeof getAdminStatus>> | null>(null);
  const [rows, setRows] = useState<Row[] | null>(null);
  const [q, setQ] = useState(""); const [course, setCourse] = useState(""); const [pay, setPay] = useState(""); const [lead, setLead] = useState(""); const [from, setFrom] = useState(""); const [to, setTo] = useState("");
  const [open, setOpen] = useState<Row | null>(null); const [notes, setNotes] = useState("");

  const refresh = async () => { const s = await status(); setSt(s); if (s.isAdmin) setRows(await list()); };
  useEffect(() => { refresh().catch((e) => toast.error(e.message)); }, []);

  const filtered = useMemo(() => (rows ?? []).filter((r) => {
    const c = r.selected_tier ?? r.recommended_tier;
    if (q && !`${r.full_name} ${r.phone} ${r.village}`.toLowerCase().includes(q.toLowerCase())) return false;
    if (course && c !== course) return false;
    if (pay && r.payment_status !== pay) return false;
    if (lead && r.lead_status !== lead) return false;
    if (from && r.created_at < from) return false;
    if (to && r.created_at.slice(0, 10) > to) return false;
    return true;
  }), [rows, q, course, pay, lead, from, to]);

  async function signOut() { await supabase.auth.signOut(); nav({ to: "/auth", replace: true }); }

  if (!st) return <div className="grid place-items-center py-32"><Loader2 className="size-8 animate-spin text-primary" /></div>;
  if (!st.isAdmin) return (
    <div className="container-page max-w-lg py-20">
      <h1 className="text-2xl font-bold">Not authorised yet</h1>
      <p className="mt-2 text-muted-foreground">Your account doesn't have admin access. If your email is listed in the academy's ADMIN_EMAILS secret (and confirmed), you can claim access.</p>
      {!st.bootstrapConfigured && <p className="mt-3 rounded-lg border border-dashed p-3 text-sm">Admin access isn't configured: the owner must add an ADMIN_EMAILS secret.</p>}
      <div className="mt-6 flex gap-3">
        <Button disabled={!st.bootstrapConfigured} onClick={async () => { try { await claim(); toast.success("Admin access granted"); refresh(); } catch (e: any) { toast.error(e.message); } }}>Claim admin access</Button>
        <Button variant="outline" onClick={signOut}>Sign out</Button>
      </div>
    </div>
  );

  const all = rows ?? [];
  const metrics = [
    ["Total registrations", all.length], ["Pending payment", all.filter((r) => r.payment_status !== "paid").length], ["Paid", all.filter((r) => r.payment_status === "paid").length],
    ...(["basic", "moderate", "advance"] as TierId[]).map((t) => [TIERS[t].name, all.filter((r) => (r.selected_tier ?? r.recommended_tier) === t).length]),
  ] as [string, number][];

  function csv() {
    const cols = ["created_at", "full_name", "phone", "village", "age_group", "current_status", "device_access", "experience", "interests", "main_goal", "practice_time", "guardian_name", "guardian_phone", "recommended_tier", "selected_tier", "wants_advice", "payment_status", "razorpay_order_id", "razorpay_payment_id", "paid_at", "lead_status", "notes"] as const;
    const esc = (v: unknown) => `"${String(Array.isArray(v) ? v.join("; ") : v ?? "").replace(/"/g, '""')}"`;
    const body = [cols.join(","), ...filtered.map((r) => cols.map((c) => esc((r as any)[c])).join(","))].join("\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([body], { type: "text/csv" })); a.download = `registrations-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
  }

  async function save(patch: { lead_status?: any; notes?: string }) {
    if (!open) return;
    await upd({ data: { id: open.id, ...patch } }); toast.success("Saved");
    setRows((rs) => rs!.map((r) => (r.id === open.id ? { ...r, ...patch } : r))); setOpen((o) => (o ? { ...o, ...patch } : o));
  }

  return (
    <div className="container-page py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">Registrations</h1>
        <div className="flex gap-2"><Button variant="outline" onClick={csv}><Download /> CSV</Button><Button variant="ghost" onClick={signOut}><LogOut /> Sign out</Button></div>
      </div>
      <div className="mt-4 rounded-xl border bg-card p-4 text-sm">
        <strong>Payments:</strong>{" "}
        {st.payments.keyId && st.payments.keySecret ? <Badge>{st.payments.testMode ? "Test mode" : "Live mode"}</Badge> : <Badge variant="outline">Setup pending</Badge>}{" "}
        Key ID {st.payments.keyId ? "✓" : "✗"} · Key secret {st.payments.keySecret ? "✓" : "✗"} · Webhook secret {st.payments.webhookSecret ? "✓" : "✗"}
      </div>
      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-6">
        {metrics.map(([l, v]) => <div key={l} className="rounded-xl border bg-card p-4 shadow-card"><p className="text-xs text-muted-foreground">{l}</p><p className="font-display text-2xl font-bold">{v}</p></div>)}
      </div>
      <div className="mt-6 flex flex-wrap gap-2">
        <Input placeholder="Search name, phone, village" value={q} onChange={(e) => setQ(e.target.value)} className="w-56" />
        <select className={sel} value={course} onChange={(e) => setCourse(e.target.value)} aria-label="Course"><option value="">All courses</option>{Object.values(TIERS).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
        <select className={sel} value={pay} onChange={(e) => setPay(e.target.value)} aria-label="Payment"><option value="">All payments</option><option value="pending">Pending</option><option value="verifying">UPI to check</option><option value="paid">Paid</option><option value="failed">Failed</option></select>
        <select className={sel} value={lead} onChange={(e) => setLead(e.target.value)} aria-label="Lead status"><option value="">All leads</option>{LEAD_STATUSES.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}</select>
        <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-40" aria-label="From" />
        <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-40" aria-label="To" />
      </div>
      <div className="mt-4 overflow-x-auto rounded-xl border bg-card">
        <Table>
          <TableHeader><TableRow>{["Name", "Phone", "Village/Town", "Age", "Status", "Rec. / Selected", "Payment", "Lead", "Date"].map((h) => <TableHead key={h}>{h}</TableHead>)}</TableRow></TableHeader>
          <TableBody>
            {filtered.length === 0 && <TableRow><TableCell colSpan={9} className="py-10 text-center text-muted-foreground">No registrations yet.</TableCell></TableRow>}
            {filtered.map((r) => (
              <TableRow key={r.id} className="cursor-pointer" onClick={() => { setOpen(r); setNotes(r.notes ?? ""); }}>
                <TableCell className="font-medium">{r.full_name}</TableCell><TableCell>{r.phone}</TableCell><TableCell>{r.village}</TableCell><TableCell>{r.age_group}</TableCell><TableCell>{r.current_status}</TableCell>
                <TableCell>{tierName(r.recommended_tier)} / {tierName(r.selected_tier)}</TableCell>
                <TableCell><Badge variant={r.payment_status === "paid" ? "default" : "outline"}>{r.payment_status}</Badge></TableCell>
                <TableCell>{leadLabel(r.lead_status)}</TableCell><TableCell>{new Date(r.created_at).toLocaleDateString("en-IN")}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          {open && <>
            <DialogHeader><DialogTitle>{open.full_name}</DialogTitle></DialogHeader>
            <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
              {([["Phone", open.phone], ["Village/Town", open.village], ["Age group", open.age_group], ["Status", open.current_status], ["Device", open.device_access], ["Experience", open.experience], ["Interests", open.interests.join(", ")], ["Goal", open.main_goal], ["Practice", open.practice_time], ["Guardian", open.guardian_name ? `${open.guardian_name} (${open.guardian_phone})` : "—"], ["Recommended", tierName(open.recommended_tier)], ["Selected", tierName(open.selected_tier)], ["Wants advice", open.wants_advice ? "Yes" : "No"], ["Consent", open.consent ? `Yes, ${new Date(open.consent_at!).toLocaleString("en-IN")}` : "No"], ["Payment", `${open.payment_status}${open.payment_verified_via ? ` (via ${open.payment_verified_via})` : ""}`], ["Registration UTR", open.upi_ref ?? "—"], ["First-month balance", `${open.course_payment_status}${open.course_amount ? ` ₹${open.course_amount / 100}` : ""}`], ["Balance UTR", open.course_upi_ref ?? "—"], ["Paid at", open.paid_at ? new Date(open.paid_at).toLocaleString("en-IN") : "—"]] as [string, string][]).map(([k, v]) => <div key={k}><dt className="text-muted-foreground">{k}</dt><dd className="font-medium">{v}</dd></div>)}
            </dl>
            {open.payment_status === "verifying" && <div className="flex flex-wrap items-center gap-2 rounded-lg border p-3 text-sm"><span>Check ₹149 with UTR <b>{open.upi_ref}</b> in your UPI app:</span><Button size="sm" onClick={() => decide("registration", true)}>Received</Button><Button size="sm" variant="outline" onClick={() => decide("registration", false)}>Not received</Button></div>}
            {open.course_payment_status === "verifying" && <div className="flex flex-wrap items-center gap-2 rounded-lg border p-3 text-sm"><span>Check ₹{(open.course_amount ?? 0) / 100} with UTR <b>{open.course_upi_ref}</b>:</span><Button size="sm" onClick={() => decide("course", true)}>Received</Button><Button size="sm" variant="outline" onClick={() => decide("course", false)}>Not received</Button></div>}
            <div className="mt-2 flex flex-wrap gap-2">{LEAD_STATUSES.map((l) => <Button key={l.id} size="sm" variant={open.lead_status === l.id ? "default" : "outline"} onClick={() => save({ lead_status: l.id })}>{l.label}</Button>)}</div>
            <Textarea placeholder="Private notes" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={5000} />
            <Button onClick={() => save({ notes })}>Save notes</Button>
          </>}
        </DialogContent>
      </Dialog>
    </div>
  );
}
