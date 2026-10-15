// Shared, client-safe academy data and the course recommendation logic.

export const ACADEMY = {
  name: "AI Skill Academy",
  phone: "6299632662",
  phoneIntl: "+916299632662",
  whatsapp: "https://wa.me/916299632662",
  address: "Atna, Banker, Chainpur, Ramgarh, Jharkhand – 829134",
  registrationFeeINR: 149,
  registrationFeePaise: 14900,
  upiId: "pawanmj111-1@okicici",
  upiName: "Pawan Kumar",
} as const;

export type TierId = "basic" | "moderate" | "advance";

export const TIERS: Record<
  TierId,
  { id: TierId; name: string; price: number; tagline: string; topics: string[] }
> = {
  basic: {
    id: "basic",
    name: "Basic",
    price: 499,
    tagline: "Start from zero with confidence",
    topics: ["AI fundamentals", "Writing effective prompts", "PPT creation with AI", "Image and video creation", "Beginner projects"],
  },
  moderate: {
    id: "moderate",
    name: "Moderate",
    price: 699,
    tagline: "Turn AI into practical digital skills",
    topics: ["AI-assisted website creation", "Core digital skills", "Freelancing basics", "Building your portfolio"],
  },
  advance: {
    id: "advance",
    name: "Advance",
    price: 799,
    tagline: "Build, automate and work professionally",
    topics: ["Advanced websites", "Software development", "n8n / AI automation", "Professional freelancing", "YouTube & content workflow"],
  },
};
export const TIER_LIST = [TIERS.basic, TIERS.moderate, TIERS.advance];

export const AGE_GROUPS = ["Under 14", "14–18", "19–25", "26–35", "Above 35"] as const;
export const STATUSES = ["School student", "College student", "Job seeker", "Working professional", "Business owner", "Other"] as const;
export const DEVICES = ["Smartphone only", "Personal laptop/computer", "Can use academy computer", "No regular device access"] as const;
export const EXPERIENCES = [
  "Complete beginner",
  "Basic computer knowledge",
  "Uses ChatGPT/AI tools",
  "Website development or coding",
  "Automation experience",
  "Not sure about my level",
] as const;
export const INTERESTS = [
  "Learn AI from zero",
  "PPT, image and video creation",
  "Website development",
  "Online earning and freelancing",
  "Advanced coding and software development",
  "AI and n8n automation",
  "YouTube and content creation",
  "Not sure yet—guide me",
] as const;
export const GOALS = [
  "Understand and use AI",
  "Develop practical digital skills",
  "Earn money online but don't know where to start",
  "Start freelancing and find clients",
  "Build websites, software or automation",
  "Improve job/business skills",
] as const;
export const PRACTICE = ["Less than 2 hours", "3–5 hours", "6–10 hours", "More than 10 hours"] as const;

export const LEAD_STATUSES = [
  { id: "new", label: "New" },
  { id: "contacted", label: "Contacted" },
  { id: "enrolled", label: "Enrolled" },
  { id: "not_proceeding", label: "Not proceeding" },
] as const;

export function isMinor(age: string) {
  return age === "Under 14" || age === "14–18";
}

export interface RecommendInput {
  experience: string;
  interests: string[];
  device_access?: string;
  practice_time?: string;
}

export function recommendTier(a: RecommendInput): TierId {
  const exp = a.experience;
  const ints = a.interests ?? [];
  if (exp === "Complete beginner" || exp === "Not sure about my level" || ints.includes("Not sure yet—guide me")) {
    return "basic";
  }
  const advancedExp = exp === "Website development or coding" || exp === "Automation experience";
  const advancedInt = ints.includes("Advanced coding and software development") || ints.includes("AI and n8n automation");
  if (advancedExp && advancedInt) return "advance";
  const someFamiliarity =
    exp === "Basic computer knowledge" || exp === "Uses ChatGPT/AI tools" || advancedExp;
  if (someFamiliarity) return "moderate";
  return "basic";
}

export function recommendationReason(tier: TierId, a: RecommendInput): string {
  if (tier === "basic") {
    return "Basic is a comfortable starting point: you build a strong foundation in AI tools, prompts and creative projects at a steady pace before moving to websites or freelancing. You can move up a level whenever you feel ready.";
  }
  if (tier === "advance") {
    return "You already have hands-on experience with coding or automation and want to go deeper. Advance focuses on advanced websites, software development and n8n/AI automation through guided, real projects.";
  }
  return `With your existing familiarity (${a.experience.toLowerCase()}), Moderate lets you apply AI to practical work like website creation, digital skills, freelancing basics and building a portfolio.`;
}

export function supportiveGuidance(a: RecommendInput): string[] {
  const tips: string[] = [];
  if (a.device_access === "Smartphone only")
    tips.push("Many beginner activities work on a smartphone. For website and project work, you can practise on academy computers.");
  if (a.device_access === "No regular device access")
    tips.push("No device? No problem to start — ask the academy about practice time on academy computers.");
  if (a.practice_time === "Less than 2 hours")
    tips.push("Even short, regular practice helps. We'll suggest small weekly tasks that fit your schedule.");
  if (a.practice_time === "More than 10 hours" || a.practice_time === "6–10 hours")
    tips.push("Your practice time means you can take on extra projects and progress faster.");
  return tips;
}

export const normalizePhone = (p: string) => p.replace(/[\s-]/g, "").replace(/^(\+91|91|0)(?=[6-9]\d{9}$)/, "");
export const isValidIndianMobile = (p: string) => /^[6-9]\d{9}$/.test(normalizePhone(p));
