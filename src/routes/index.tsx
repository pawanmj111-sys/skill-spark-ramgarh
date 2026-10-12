import { createFileRoute, Link } from "@tanstack/react-router";
import { Award, ClipboardList, Hammer, MessageCircle, Phone, MapPin, Sparkles, Users, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { TierCard } from "@/components/tier-card";
import { ACADEMY } from "@/lib/academy";
import hero from "@/assets/hero-classroom.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AI Skill Academy — Learn AI & digital skills in Ramgarh, Jharkhand" },
      { name: "description", content: "Practical AI, website creation, content creation, freelancing and automation classes in Chainpur, Ramgarh. Courses from ₹499/month." },
      { property: "og:title", content: "AI Skill Academy — Learn AI. Build Real Skills." },
      { property: "og:description", content: "Practical AI and digital skills for every age group in Ramgarh, Jharkhand." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const FAQ = [
  ["Are the course fees monthly?", "Yes. Basic is ₹499/month, Moderate ₹699/month and Advance ₹799/month. The fee is charged per month of learning."],
  ["What is the ₹149 registration fee?", "It is a one-time registration fee paid once when you register. It is separate from — and not included in — your first month's course fee."],
  ["I have never used a computer. Can I join?", "Yes. The Basic course starts from zero, and you can practise on academy computers if you don't have a laptop."],
  ["Is there an age limit?", "No. We welcome learners of every age group. Students under 18 need a parent or guardian involved before enrollment and payment."],
  ["Will I definitely earn money online?", "No one can honestly guarantee income, clients or jobs. We teach practical skills and guide you through real projects and freelancing basics; results depend on your effort and the market."],
  ["Do I get a certificate?", "Yes, a certificate is provided on completing your course."],
] as const;

function Landing() {
  return (
    <>
      <section className="bg-hero text-navy-foreground">
        <div className="container-page grid items-center gap-10 py-14 md:grid-cols-2 md:py-24">
          <div className="animate-rise">
            <span className="inline-flex items-center gap-2 rounded-full border border-navy-foreground/20 bg-navy-foreground/5 px-3 py-1 text-xs font-medium">
              <Users className="size-3.5 text-highlight" /> For every age group · Chainpur, Ramgarh
            </span>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.08] sm:text-5xl lg:text-6xl">
              Learn AI. Build Real Skills. <span className="text-highlight">Explore Online Earning.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-navy-foreground/80">
              Practical AI, website creation, content creation, freelancing and automation for beginners and growing professionals.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild variant="hero" size="lg"><Link to="/register">Find My Course</Link></Button>
              <Button asChild variant="heroOutline" size="lg"><Link to="/register">Register Now</Link></Button>
            </div>
            <p className="mt-4 text-sm text-navy-foreground/60">Courses from ₹499/month · ₹149 one-time registration</p>
          </div>
          <div className="animate-rise [animation-delay:150ms]">
            <img src={hero} alt="Learners practising on computers with an instructor at a local classroom" width={1600} height={1104} className="aspect-[4/3] w-full rounded-3xl object-cover shadow-2xl ring-1 ring-navy-foreground/10" />
          </div>
        </div>
      </section>

      <section className="container-page py-16 md:py-20">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { icon: Hammer, t: "Practical learning", d: "Hands-on classes using real AI tools — not just theory." },
            { icon: Sparkles, t: "Guided projects", d: "Build presentations, images, videos, websites and automations step by step." },
            { icon: Award, t: "Certificate", d: "Receive a certificate on course completion." },
          ].map(({ icon: I, t, d }) => (
            <div key={t} className="rounded-2xl border bg-card p-6 shadow-card">
              <I className="size-6 text-primary" />
              <h3 className="mt-4 text-lg font-bold">{t}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-secondary/60 py-16 md:py-20">
        <div className="container-page">
          <h2 className="text-3xl font-bold md:text-4xl">Courses & monthly fees</h2>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            All course fees are <strong className="text-foreground">per month</strong>. The <strong className="text-foreground">₹149 registration fee is one-time and separate</strong> — it is not part of your first month's fee.
          </p>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            <TierCard id="basic" />
            <TierCard id="moderate" />
            <TierCard id="advance" />
          </div>
          <div className="mt-8 text-center">
            <Button asChild size="lg"><Link to="/register">Not sure? Find my course</Link></Button>
          </div>
        </div>
      </section>

      <section className="container-page py-16 md:py-20">
        <h2 className="text-3xl font-bold md:text-4xl">How it works</h2>
        <ol className="mt-10 grid gap-6 md:grid-cols-4">
          {[
            { icon: ClipboardList, t: "Answer 7 quick questions", d: "Tell us about your experience, interests and goals." },
            { icon: Compass, t: "Get a recommendation", d: "See the course that suits you, compare all three and choose." },
            { icon: Award, t: "Pay ₹149 registration", d: "Secure payment via Razorpay — once only." },
            { icon: Phone, t: "We contact you", d: "The academy calls to confirm your batch and timing." },
          ].map(({ icon: I, t, d }, i) => (
            <li key={t} className="rounded-2xl border bg-card p-6">
              <span className="text-sm font-bold text-primary">Step {i + 1}</span>
              <I className="mt-3 size-6 text-primary" />
              <h3 className="mt-3 font-bold">{t}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{d}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="bg-secondary/60 py-16 md:py-20">
        <div className="container-page max-w-3xl">
          <h2 className="text-3xl font-bold md:text-4xl">Frequently asked questions</h2>
          <Accordion type="single" collapsible className="mt-8">
            {FAQ.map(([q, a]) => (
              <AccordionItem key={q} value={q}>
                <AccordionTrigger className="text-left text-base">{q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      <section className="container-page py-16 md:py-20">
        <div className="grid gap-8 rounded-3xl bg-hero p-8 text-navy-foreground md:grid-cols-2 md:p-12">
          <div>
            <h2 className="text-3xl font-bold">Visit or contact us</h2>
            <p className="mt-3 text-navy-foreground/80">Questions about courses, timings or which level suits you? We're happy to help.</p>
          </div>
          <div className="space-y-4">
            <p className="flex gap-3"><MapPin className="size-5 shrink-0 text-highlight" />{ACADEMY.address}</p>
            <p className="flex gap-3"><Phone className="size-5 text-highlight" /><a href={`tel:${ACADEMY.phoneIntl}`} className="underline-offset-4 hover:underline">{ACADEMY.phone}</a></p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Button asChild variant="hero"><a href={ACADEMY.whatsapp} target="_blank" rel="noreferrer"><MessageCircle /> WhatsApp</a></Button>
              <Button asChild variant="heroOutline"><a href={`tel:${ACADEMY.phoneIntl}`}><Phone /> Call now</a></Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
