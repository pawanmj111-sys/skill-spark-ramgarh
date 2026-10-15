import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { TIERS, type TierId } from "@/lib/academy";

export function TierCard({ id, highlight, children, selected }: { id: TierId; highlight?: string | undefined; selected?: boolean; children?: React.ReactNode }) {
  const t = TIERS[id];
  return (
    <div
      className={cn(
        "relative flex flex-col rounded-2xl border bg-card p-6 shadow-card transition-all",
        highlight && "border-primary ring-2 ring-primary/30",
        selected && "border-highlight ring-2 ring-highlight",
      )}
    >
      {highlight && (
        <span className="absolute -top-3 left-6 rounded-full bg-highlight px-3 py-1 text-xs font-semibold text-highlight-foreground">{highlight}</span>
      )}
      <h3 className="text-xl font-bold">{t.name}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{t.tagline}</p>
      <p className="mt-5 font-display text-4xl font-extrabold">
        ₹{t.price}<span className="text-base font-medium text-muted-foreground">/month</span>
      </p>
      <p className="mt-1 text-xs text-muted-foreground">₹149 registration is adjusted in your first month</p>
      <ul className="mt-5 flex-1 space-y-2.5 text-sm">
        {t.topics.map((x) => (
          <li key={x} className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-primary" />{x}</li>
        ))}
      </ul>
      {children && <div className="mt-6">{children}</div>}
    </div>
  );
}
