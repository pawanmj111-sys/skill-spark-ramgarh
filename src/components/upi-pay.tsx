import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Copy, Loader2, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ACADEMY } from "@/lib/academy";

export function UpiPay({ amount, note, onSubmit }: { amount: number; note: string; onSubmit: (utr: string) => Promise<void> }) {
  const [utr, setUtr] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const link = `upi://pay?pa=${encodeURIComponent(ACADEMY.upiId)}&pn=${encodeURIComponent(ACADEMY.upiName)}&am=${amount}.00&cu=INR&tn=${encodeURIComponent(note)}`;

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr("");
    if (!/^\d{12}$/.test(utr.trim())) { setErr("Enter the 12-digit UPI reference (UTR) number from your payment app."); return; }
    setBusy(true);
    try { await onSubmit(utr.trim()); } catch (e: any) { setErr(e?.message ?? "Could not submit. Please retry."); }
    setBusy(false);
  }

  return (
    <div className="mt-4 space-y-4">
      <div className="flex flex-col items-center gap-3 rounded-xl border bg-background p-4">
        <div className="rounded-lg bg-card p-3"><QRCodeSVG value={link} size={180} /></div>
        <p className="text-sm text-muted-foreground">Scan with GPay, PhonePe, Paytm or any UPI app</p>
        <p className="text-2xl font-bold">₹{amount}</p>
        <button type="button" className="flex items-center gap-1 text-sm font-medium text-primary" onClick={() => { navigator.clipboard?.writeText(ACADEMY.upiId); toast.success("UPI ID copied"); }}>
          UPI ID: {ACADEMY.upiId} <Copy className="size-4" />
        </button>
        <Button asChild className="w-full md:hidden" size="lg"><a href={link}><Smartphone /> Pay ₹{amount} with UPI app</a></Button>
      </div>
      <form onSubmit={submit} className="space-y-2">
        <label className="text-sm font-medium" htmlFor="utr">After paying, enter the 12-digit UPI reference (UTR) number</label>
        <Input id="utr" inputMode="numeric" maxLength={12} placeholder="e.g. 412345678901" value={utr} onChange={(e) => setUtr(e.target.value.replace(/\D/g, ""))} />
        {err && <p className="text-sm text-destructive">{err}</p>}
        <Button type="submit" className="w-full" disabled={busy}>{busy && <Loader2 className="animate-spin" />}I have paid — submit reference</Button>
        <p className="text-xs text-muted-foreground">The academy checks each payment and confirms it, usually within a day.</p>
      </form>
    </div>
  );
}
