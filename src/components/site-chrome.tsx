import { Link } from "@tanstack/react-router";
import { GraduationCap, MessageCircle, Phone, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ACADEMY } from "@/lib/academy";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-navy-foreground/10 bg-navy/95 text-navy-foreground backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold">
          <span className="grid size-9 place-items-center rounded-lg bg-highlight text-highlight-foreground">
            <GraduationCap className="size-5" />
          </span>
          AI Skill Academy
        </Link>
        <nav className="flex items-center gap-2">
          <a href={`tel:${ACADEMY.phoneIntl}`} className="hidden items-center gap-1.5 text-sm text-navy-foreground/80 hover:text-navy-foreground sm:flex">
            <Phone className="size-4" /> {ACADEMY.phone}
          </a>
          <Button asChild variant="hero" size="sm">
            <Link to="/register">Register Now</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="bg-navy text-navy-foreground">
      <div className="container-page grid gap-8 py-12 md:grid-cols-3">
        <div>
          <p className="font-display text-lg font-bold">AI Skill Academy</p>
          <p className="mt-2 text-sm text-navy-foreground/70">Practical AI and digital skills, taught locally in Ramgarh, Jharkhand.</p>
        </div>
        <div className="space-y-2 text-sm text-navy-foreground/80">
          <p className="flex gap-2"><MapPin className="mt-0.5 size-4 shrink-0" />{ACADEMY.address}</p>
          <p className="flex gap-2"><Phone className="size-4" /><a href={`tel:${ACADEMY.phoneIntl}`}>{ACADEMY.phone}</a></p>
          <p className="flex gap-2"><MessageCircle className="size-4" /><a href={ACADEMY.whatsapp} target="_blank" rel="noreferrer">WhatsApp us</a></p>
        </div>
        <div className="flex flex-col gap-2 text-sm text-navy-foreground/80">
          <Link to="/register">Registration</Link>
          <Link to="/privacy">Privacy notice</Link>
          <Link to="/admin">Admin</Link>
        </div>
      </div>
      <p className="border-t border-navy-foreground/10 py-4 text-center text-xs text-navy-foreground/60">
        © {new Date().getFullYear()} AI Skill Academy. We teach skills; we do not guarantee income, clients or jobs.
      </p>
    </footer>
  );
}
