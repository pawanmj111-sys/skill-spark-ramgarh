# Skill Spark Ramgarh

Build a full-stack responsive English-language website called AI Skill Academy for a local academy in Atna, Banker, Chainpur, Ramgarh, Jharkhand, India. Contact 6299632662. This is a real app, not just a mockup.

DESIGN: Premium approachable edtech, deep navy/royal blue, white and yellow accents, mobile-first, great typography, whitespace, subtle motion, trustworthy local academy, realistic imagery of Indian learners/computer classroom.

PUBLIC LANDING PAGE:
Headline: “Learn AI. Build Real Skills. Explore Online Earning.”
Subheading: “Practical AI, website creation, content creation, freelancing and automation for beginners and growing professionals.”
Mention “For every age group”. CTA “Find My Course” and “Register Now”.
Course tiers, monthly pricing:
Basic ₹499/month: AI fundamentals, prompts, PPT, image and video creation, beginner projects.
Moderate ₹699/month: AI-assisted website creation, digital skills, freelancing basics, portfolio.
Advance ₹799/month: advanced websites, software development, n8n/AI automation, professional freelancing, YouTube/content workflow.
Make clear course fees are monthly and ₹149 registration fee is one-time and separate, not inclusive of month one. No guaranteed income/client/job promises.
Benefits: practical learning, guided projects, certificate on course completion. FAQ, How It Works, Contact section. Phone 6299632662, address Atna, Banker, Chainpur, Ramgarh, Jharkhand – 829134. Link to WhatsApp +916299632662 if reliable.

REGISTRATION FORM IN ENGLISH:
Required: full name, mobile/WhatsApp, village/town.
1 Age group: Under 14, 14–18, 19–25, 26–35, Above 35.
2 Current status: School student, College student, Job seeker, Working professional, Business owner, Other.
3 Device access: Smartphone only, Personal laptop/computer, Can use academy computer, No regular device access.
4 Experience: Complete beginner, Basic computer knowledge, Uses ChatGPT/AI tools, Website development or coding, Automation experience, Not sure about my level.
5 Multi-select interests: Learn AI from zero; PPT, image and video creation; Website development; Online earning and freelancing; Advanced coding and software development; AI and n8n automation; YouTube and content creation; Not sure yet—guide me.
6 Main goal: Understand and use AI; Develop practical digital skills; Earn money online but don't know where to start; Start freelancing and find clients; Build websites, software or automation; Improve job/business skills.
7 Weekly practice time: Less than 2 hours, 3–5 hours, 6–10 hours, More than 10 hours.
Include consent checkbox for contact about registration and link to privacy notice. If under 18, ask for parent/guardian involvement before enrollment/payment. Do not ask for sensitive unnecessary data.

COURSE RECOMMENDATION LOGIC:
- Recommend Basic ₹499/month if complete beginner, “Not sure about my level,” or interest includes “Not sure yet—guide me.” If answers are ambiguous, default Basic. Explain why this is a suitable starting point; no income guarantees.
- Recommend Advance only if experience is Website development or coding OR Automation experience, AND interests include Advanced coding and software development OR AI and n8n automation.
- Otherwise recommend Moderate ₹699/month when there is some basic computer/AI familiarity.
- Device access and practice time should inform supportive guidance but not automatically exclude students.
- Show recommended tier with a rationale plus all three tiers for comparison. Let student select a different course or ask the academy for advice.
- Show selected course monthly fee separately from one-time registration fee ₹149.

DATABASE AND PRIVATE ADMIN:
Use Lovable backend/Supabase if available. Persist applicant records including answers, recommendation, chosen course, submitted consent, timestamp, payment status and Razorpay identifiers. Proper RLS: public may create applications, never read any applicant's data; only authenticated authorized admin can read/manage.
Create secure /admin login and dashboard. No public/hardcoded admin password, no frontend secrets or open database policies. Use secure auth and document how owner gets admin access; if configuration is incomplete, do not create an insecure bypass.
Dashboard metrics: total registrations, pending payment, paid, distribution per course. Table with name, phone, village/town, age group, status, recommended/selected course, payment status, date. Search/filter by course, payment, lead status and date. Detailed view with all answers. CSV export. Lead status New, Contacted, Enrolled, Not proceeding, plus private notes.

RAZORPAY PAYMENT INTEGRATION — HIGH PRIORITY:
Implement Razorpay checkout for one-time registration fee exactly INR 14900 paise. Create Razorpay order on secure server/Edge Function, not in client. Verify payment signature server-side with HMAC using secret key stored only as a server secret. Never trust client callback alone. Support verified webhook for authoritative status, idempotency and duplicate-event safety. Store order ID/payment ID, verification status and payment timestamp. Mark registration PAID only after verified signature/webhook; before that PENDING. Handle user cancellation/failure, retry payment and clear confirmation states. Never collect card, UPI PIN or bank credentials in our own form; use Razorpay-hosted/official checkout. Include test mode and clear setup guide for owner showing required environment secrets RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET and webhook secret if used, webhook endpoint setup, test then production switch. No credentials provided, so do not claim live payments enabled and do not put fake keys. When credentials are absent show “Payments setup pending” with a graceful demo/test-only state and prevent a fake paid confirmation. If a connected Razorpay integration/connector is available, use it; otherwise implement integration-ready secure server functions, schema and setup guide.

QUALITY/SECURITY:
Use clean TypeScript, accessible shadcn/ui components, robust phone/required-field validation, rate-limit/CAPTCHA affordance if feasible, loading/error states, success page, responsive layout, empty states, privacy notice, clear consent. No fake testimonials/stats or made-up claims. Pages/routes: landing, registration questions, recommendation, payment/confirmation, secure admin/login, privacy. Create working DB/backend, actual recommendation logic and admin functions, not just visual design. Validate the main paths and report preview URL plus what remains to activate live Razorpay payments.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://skill-spark-ramgarh.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/21fd6dd4-599c-40ee-9f66-137ca670480f).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
