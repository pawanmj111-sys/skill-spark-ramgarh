import { createFileRoute } from "@tanstack/react-router";
import { ACADEMY } from "@/lib/academy";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Notice — AI Skill Academy" },
      { name: "description", content: "How AI Skill Academy collects, uses and protects your registration information." },
      { property: "og:title", content: "Privacy Notice — AI Skill Academy" },
      { property: "og:description", content: "How we handle your registration data." },
    ],
  }),
  component: Privacy,
});

function Privacy() {
  return (
    <article className="container-page max-w-3xl space-y-5 py-14 leading-relaxed">
      <h1 className="text-4xl font-bold">Privacy notice</h1>
      <p className="text-muted-foreground">Plain-language summary of how we handle your information.</p>
      <h2 className="pt-4 text-xl font-bold">What we collect</h2>
      <p>Your name, mobile/WhatsApp number, village/town, age group, current status, device access, experience, interests, goal and weekly practice time. For learners under 18, a parent/guardian name and mobile number. We also store your chosen course and payment status (order and payment reference numbers from Razorpay).</p>
      <h2 className="pt-4 text-xl font-bold">What we never collect</h2>
      <p>We do not ask for Aadhaar, bank details, card numbers or UPI PINs. Payments are processed entirely on Razorpay's official secure checkout.</p>
      <h2 className="pt-4 text-xl font-bold">How we use it</h2>
      <p>Only to process your registration, recommend a course, and contact you by phone or WhatsApp about your registration and classes. We do not sell or share your data for marketing.</p>
      <h2 className="pt-4 text-xl font-bold">Who can see it</h2>
      <p>Only authorised academy staff using a secure, password-protected admin area.</p>
      <h2 className="pt-4 text-xl font-bold">Your choices</h2>
      <p>You can ask us to correct or delete your information at any time by calling {ACADEMY.phone}.</p>
      <h2 className="pt-4 text-xl font-bold">Contact</h2>
      <p>AI Skill Academy, {ACADEMY.address}. Phone: {ACADEMY.phone}.</p>
    </article>
  );
}
