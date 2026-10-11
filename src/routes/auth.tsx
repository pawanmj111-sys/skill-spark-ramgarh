import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Admin sign in — AI Skill Academy" }, { name: "robots", content: "noindex" }, { name: "description", content: "Staff sign in." }] }),
  component: AuthPage,
});

function AuthPage() {
  const nav = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState(""); const [pw, setPw] = useState(""); const [busy, setBusy] = useState(false);
  async function go(e: React.FormEvent) {
    e.preventDefault(); setBusy(true);
    try {
      if (mode === "in") {
        const { error } = await supabase.auth.signInWithPassword({ email, password: pw });
        if (error) throw error;
        nav({ to: "/admin" });
      } else {
        const { error } = await supabase.auth.signUp({ email, password: pw, options: { emailRedirectTo: window.location.origin + "/admin" } });
        if (error) throw error;
        toast.success("Check your email to confirm your account, then sign in.");
        setMode("in");
      }
    } catch (err: any) { toast.error(err.message); } finally { setBusy(false); }
  }
  return (
    <div className="container-page max-w-sm py-20">
      <h1 className="text-2xl font-bold">{mode === "in" ? "Admin sign in" : "Create staff account"}</h1>
      <p className="mt-1 text-sm text-muted-foreground">Only authorised academy staff can view registrations.</p>
      <form onSubmit={go} className="mt-6 space-y-4">
        <div className="space-y-1.5"><Label htmlFor="e">Email</Label><Input id="e" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        <div className="space-y-1.5"><Label htmlFor="pw">Password</Label><Input id="pw" type="password" required minLength={8} value={pw} onChange={(e) => setPw(e.target.value)} /></div>
        <Button className="w-full" disabled={busy}>{mode === "in" ? "Sign in" : "Create account"}</Button>
      </form>
      <button className="mt-4 text-sm text-primary underline" onClick={() => setMode(mode === "in" ? "up" : "in")}>{mode === "in" ? "First time? Create a staff account" : "Have an account? Sign in"}</button>
    </div>
  );
}
