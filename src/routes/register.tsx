import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { AGE_GROUPS, DEVICES, EXPERIENCES, GOALS, INTERESTS, PRACTICE, STATUSES, isMinor, isValidIndianMobile } from "@/lib/academy";
import { submitApplication } from "@/lib/applications.functions";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Register — AI Skill Academy" },
      { name: "description", content: "Answer 7 quick questions and get a personalised course recommendation." },
      { property: "og:title", content: "Register — AI Skill Academy" },
      { property: "og:description", content: "Find the right AI course for you in minutes." },
    ],
  }),
  component: Register,
});

function Radio({ label, name, options, value, onChange, error }: { label: string; name: string; options: readonly string[]; value: string; onChange: (v: string) => void; error?: string }) {
  return (
    <fieldset className="space-y-3">
      <legend className="font-semibold">{label}</legend>
      <RadioGroup value={value} onValueChange={onChange} className="grid gap-2 sm:grid-cols-2">
        {options.map((o) => (
          <Label key={o} htmlFor={`${name}-${o}`} className="flex cursor-pointer items-center gap-3 rounded-xl border bg-card p-3 font-normal has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-accent">
            <RadioGroupItem id={`${name}-${o}`} value={o} /> {o}
          </Label>
        ))}
      </RadioGroup>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </fieldset>
  );
}

function Register() {
  const nav = useNavigate();
  const submit = useServerFn(submitApplication);
  const [f, setF] = useState({
    full_name: "", phone: "", village: "", age_group: "", current_status: "", device_access: "", experience: "",
    interests: [] as string[], main_goal: "", practice_time: "", consent: false, guardian_name: "", guardian_phone: "", guardian_consent: false, website: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f, v: any) => setF((p) => ({ ...p, [k]: v }));
  const minor = isMinor(f.age_group);

  function validate() {
    const e: Record<string, string> = {};
    if (f.full_name.trim().length < 2) e.full_name = "Enter your full name";
    if (!isValidIndianMobile(f.phone)) e.phone = "Enter a valid 10-digit mobile number";
    if (f.village.trim().length < 2) e.village = "Enter your village/town";
    for (const k of ["age_group", "current_status", "device_access", "experience", "main_goal", "practice_time"] as const) if (!f[k]) e[k] = "Please choose one option";
    if (!f.interests.length) e.interests = "Pick at least one interest";
    if (minor) {
      if (f.guardian_name.trim().length < 2) e.guardian_name = "Parent/guardian name is required";
      if (!isValidIndianMobile(f.guardian_phone)) e.guardian_phone = "Valid parent/guardian mobile is required";
      if (!f.guardian_consent) e.guardian_consent = "Parent/guardian involvement is required";
    }
    if (!f.consent) e.consent = "Please give consent so we can contact you";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function onSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validate()) { toast.error("Please fix the highlighted fields"); return; }
    setBusy(true);
    try {
      const r = await submit({ data: { ...f, guardian_name: minor ? f.guardian_name : undefined, guardian_phone: minor ? f.guardian_phone : undefined } as any });
      nav({ to: "/application/$id", params: { id: r.id }, search: { t: r.token } });
    } catch (err: any) {
      toast.error(err?.message ?? "Something went wrong");
    } finally { setBusy(false); }
  }

  const err = (k: string) => errors[k] && <p className="text-sm text-destructive">{errors[k]}</p>;

  return (
    <div className="container-page max-w-3xl py-12">
      <h1 className="text-3xl font-bold md:text-4xl">Find your course</h1>
      <p className="mt-2 text-muted-foreground">Takes about 2 minutes. Fields marked * are required.</p>
      <form onSubmit={onSubmit} className="mt-8 space-y-10" noValidate>
        <div className="grid gap-4 rounded-2xl border bg-card p-6 shadow-card sm:grid-cols-2">
          <div className="sm:col-span-2 space-y-1.5"><Label htmlFor="n">Full name *</Label><Input id="n" maxLength={100} value={f.full_name} onChange={(e) => set("full_name", e.target.value)} />{err("full_name")}</div>
          <div className="space-y-1.5"><Label htmlFor="p">Mobile / WhatsApp *</Label><Input id="p" inputMode="tel" maxLength={14} placeholder="10-digit number" value={f.phone} onChange={(e) => set("phone", e.target.value)} />{err("phone")}</div>
          <div className="space-y-1.5"><Label htmlFor="v">Village / Town *</Label><Input id="v" maxLength={100} value={f.village} onChange={(e) => set("village", e.target.value)} />{err("village")}</div>
          <input type="text" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" value={f.website} onChange={(e) => set("website", e.target.value)} />
        </div>

        <Radio label="1. Age group *" name="age" options={AGE_GROUPS} value={f.age_group} onChange={(v) => set("age_group", v)} error={errors.age_group} />
        {minor && (
          <div className="grid gap-4 rounded-2xl border border-highlight bg-highlight/10 p-6 sm:grid-cols-2">
            <p className="sm:col-span-2 text-sm">Learners under 18 need a parent or guardian involved before enrollment and payment.</p>
            <div className="space-y-1.5"><Label htmlFor="gn">Parent/guardian name *</Label><Input id="gn" value={f.guardian_name} onChange={(e) => set("guardian_name", e.target.value)} />{err("guardian_name")}</div>
            <div className="space-y-1.5"><Label htmlFor="gp">Parent/guardian mobile *</Label><Input id="gp" inputMode="tel" value={f.guardian_phone} onChange={(e) => set("guardian_phone", e.target.value)} />{err("guardian_phone")}</div>
            <label className="sm:col-span-2 flex gap-3 text-sm"><Checkbox checked={f.guardian_consent} onCheckedChange={(v) => set("guardian_consent", v === true)} />My parent/guardian knows about this registration and will be involved before enrollment or payment.</label>
            {err("guardian_consent")}
          </div>
        )}
        <Radio label="2. Current status *" name="st" options={STATUSES} value={f.current_status} onChange={(v) => set("current_status", v)} error={errors.current_status} />
        <Radio label="3. Device access *" name="dv" options={DEVICES} value={f.device_access} onChange={(v) => set("device_access", v)} error={errors.device_access} />
        <Radio label="4. Experience *" name="ex" options={EXPERIENCES} value={f.experience} onChange={(v) => set("experience", v)} error={errors.experience} />
        <fieldset className="space-y-3">
          <legend className="font-semibold">5. Interests * <span className="font-normal text-muted-foreground">(choose all that apply)</span></legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {INTERESTS.map((o) => (
              <label key={o} className="flex cursor-pointer items-center gap-3 rounded-xl border bg-card p-3 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-accent">
                <Checkbox checked={f.interests.includes(o)} onCheckedChange={(v) => set("interests", v ? [...f.interests, o] : f.interests.filter((x) => x !== o))} /> {o}
              </label>
            ))}
          </div>
          {err("interests")}
        </fieldset>
        <Radio label="6. Main goal *" name="gl" options={GOALS} value={f.main_goal} onChange={(v) => set("main_goal", v)} error={errors.main_goal} />
        <Radio label="7. Weekly practice time *" name="pt" options={PRACTICE} value={f.practice_time} onChange={(v) => set("practice_time", v)} error={errors.practice_time} />

        <div className="space-y-2 rounded-2xl border bg-card p-6">
          <label className="flex gap-3 text-sm"><Checkbox checked={f.consent} onCheckedChange={(v) => set("consent", v === true)} />
            <span>I agree that AI Skill Academy may contact me by phone/WhatsApp about this registration. I have read the <Link to="/privacy" className="text-primary underline" target="_blank">privacy notice</Link>. *</span>
          </label>
          {err("consent")}
        </div>
        <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={busy}>{busy && <Loader2 className="animate-spin" />} See my recommendation</Button>
      </form>
    </div>
  );
}
