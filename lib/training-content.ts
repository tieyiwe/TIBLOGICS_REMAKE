// ─────────────────────────────────────────────────────────────────────────────
// Editable content model for the training landing page.
//
// Every piece of visible copy on /events/[slug] lives here as DEFAULT_TRAINING_
// CONTENT. The Event.content column stores a JSON override (edited from admin);
// mergeContent() deep-merges that override on top of the defaults so the page
// always has complete, valid copy even if the override is partial or missing.
//
// Use {price} inside CTA / submit strings to inject the live price display.
// ─────────────────────────────────────────────────────────────────────────────

export interface Outcome { icon: string; title: string; desc: string }
export interface Stat { value: string; label: string }
export interface SessionCard { num: string; date: string; title: string; desc: string; badge: string; color: string }
export interface ScheduleRow { session: string; date: string; topic: string; labs: string }
export interface IncludeCard { title: string; subtitle: string; desc: string; color: string }
export interface Requirement { icon: string; title: string; subtitle: string }
export interface Callout { title: string; body: string; color: string }
export interface Faq { q: string; a: string; link?: { href: string; text: string } }

export interface TrainingContent {
  nav: { brand: string; tagline: string; cta: string };
  hero: {
    eyebrow: string;            // empty → falls back to "{location} · {timeSlot}"
    headlineLine1: string;
    headlineLine2: string;
    headlineHighlight: string;
    subtitle: string;
    pills: string[];
    ctaPrimaryFree: string;     // supports {price}
    ctaPrimaryPaid: string;     // supports {price}
    ctaSecondary: string;
  };
  stats: Stat[];
  countdown: { label: string };
  outcomes: { eyebrow: string; heading: string; subtitle: string; items: Outcome[] };
  curriculum: {
    eyebrow: string; heading: string; subtitle: string;
    sessions: SessionCard[];
    scheduleRows: ScheduleRow[];
    schedulePills: string[];
  };
  pricing: {
    eyebrow: string;
    originalPrice: string;
    badge: string;
    saveText: string;
    accessText: string;
    standardLabel: string; standardAmount: string; standardSub: string;
    cohortLabel: string; cohortAmount: string; cohortSub: string;
    includes: string[];
    cta: string;
    warning: string;
    requirementsHeading: string;
    requirements: Requirement[];
  };
  whatsIncluded: {
    eyebrow: string; heading: string;
    cards: IncludeCard[];
    toolsHeading: string;
    tools: string[];
    callouts: Callout[];
  };
  registration: {
    eyebrow: string; heading: string; subtitle: string;
    successHeading: string; successBody: string;
    submitFree: string; submitPaid: string;   // support {price}
    secureNote: string;
    goalPlaceholder: string;
    goalOptions: string[];
  };
  faq: { eyebrow: string; heading: string; items: Faq[] };
  footer: { brand: string; tagline: string; email: string; website: string; copyright: string };
}

export const DEFAULT_TRAINING_CONTENT: TrainingContent = {
  nav: { brand: "TIBLOGICS", tagline: "Education Center", cta: "Reserve My Spot" },
  hero: {
    eyebrow: "",
    headlineLine1: "Stop watching AI",
    headlineLine2: "happen to others.",
    headlineHighlight: "Start building with it.",
    subtitle:
      "A hands-on 4-session live training where you go from curious to capable — writing with AI, building income, creating automations, and getting your first taste of vibe coding. Live on Zoom. Every Saturday 9:30AM–1PM.",
    pills: [
      "📅 Starts June 27, 2026",
      "💻 Live on Zoom",
      "⏰ Saturdays 9:30AM–1PM",
      "🏆 Certificate Included",
      "🎯 100% Practical",
    ],
    ctaPrimaryFree: "Secure My Spot — Free",
    ctaPrimaryPaid: "Secure My Spot — {price}",
    ctaSecondary: "See What's Inside",
  },
  stats: [
    { value: "4", label: "Weekend Sessions" },
    { value: "12", label: "Hours of Training" },
    { value: "Custom", label: "Powerful Prompts in Library" },
    { value: "$849", label: "All Inclusive" },
    { value: "🔥", label: "Limited Seats Per Cohort — First Come, First Served" },
  ],
  countdown: { label: "Registration Closes — Training Starts June 27, 2026" },
  outcomes: {
    eyebrow: "What You Get",
    heading: "What you walk away with.",
    subtitle: "Every session builds a skill you can use the same day.",
    items: [
      { icon: "✍️", title: "Interact with AI like a pro", desc: "Know exactly what to say to AI — and get results that actually work." },
      { icon: "🤖", title: "Your personal AI blueprint", desc: "A powerful configuration that changes everything." },
      { icon: "💰", title: "Turn AI skills into income", desc: "5 income models. Your offer written, priced, and ready to send." },
      { icon: "⚡", title: "AI agents that work while you sleep", desc: "Set it up once. Runs on its own. No code." },
      { icon: "🔍", title: "Your full AI power stack", desc: "The tools that handle anything you throw at them." },
      { icon: "💻", title: "Intro to vibe coding like a Software Engineer", desc: "Describe it. AI builds it. like a pro." },
      { icon: "🏅", title: "Official certificate of completion", desc: "Numbered. LinkedIn-ready. Earned live on Zoom." },
    ],
  },
  curriculum: {
    eyebrow: "The Curriculum",
    heading: "4 sessions. 4 weekends. One transformation.",
    subtitle: "Each session is 3 hours live on Zoom — every Saturday from 9:30AM to 1PM.",
    sessions: [
      { num: "S1", date: "June 27", title: "AI Foundations", desc: "Hands-on from minute one. You use AI before the session ends.", badge: "Beginner-friendly", color: "#2251A3" },
      { num: "S2", date: "July 4", title: "AI in Your Work", desc: "Configure AI to empower your personal life and career.", badge: "Hands-on lab", color: "#F9A738" },
      { num: "S3", date: "July 11", title: "Build Income with AI", desc: "Pick your income model, write your offer, build something you can send today.", badge: "Revenue focused", color: "#22A387" },
      { num: "S4", date: "July 18", title: "Agents, Automation & Vibe Coding", desc: "Build AI agents, automate your workflow, and vibe code your first real tool — using only words.", badge: "Advanced build", color: "#8B5CF6" },
      { num: "S5", date: "TBA", title: "Certificate Ceremony", desc: "Date announced after Session 4. Certificate presentation, wins spotlight & cohort graduation.", badge: "🎓 Bonus · TBA", color: "#1B3A6B" },
    ],
    scheduleRows: [
      { session: "Session 1", date: "June 27, 2026", topic: "AI Foundations", labs: "First prompt · Comparison test · Use case finder · AI browsing intro" },
      { session: "Session 2", date: "July 4, 2026", topic: "AI in Your Daily Work", labs: "Writing sprint · AI blueprint · Time audit" },
      { session: "Session 3", date: "July 11, 2026", topic: "Build Income with AI", labs: "5 income models · Offer design · Marketing asset build" },
      { session: "Session 4", date: "July 18, 2026", topic: "AI Agents, Automation & Vibe Coding", labs: "AI agent build · Automation build · Intro to vibe coding" },
      { session: "Bonus", date: "TBA", topic: "Certificate & Graduation Ceremony", labs: "Certificate presentation · Wins spotlight · Cohort photo" },
    ],
    schedulePills: [
      "Every Saturday · 9:30AM–1PM · incl. breaks",
      "Open to all timezones",
      "Recordings shared within 24hrs",
      "Mid-week check-ins",
    ],
  },
  pricing: {
    eyebrow: "June Cohort · June 27 – July 18, 2026 + Graduation TBA",
    originalPrice: "$3,000",
    badge: "June Cohort Price",
    saveText: "🎁 You save $2,151 — June Cohort only",
    accessText: "Full access · All 4 live sessions · Everything below",
    standardLabel: "Standard Rate",
    standardAmount: "$3,000",
    standardSub: "≈ $750/week for 4 weeks",
    cohortLabel: "Your June Cohort Price",
    cohortAmount: "$849",
    cohortSub: "≈ $212/week for 4 weeks",
    includes: [
      "4 live Zoom sessions (3hrs each · Saturdays 9:30AM–1PM)",
      "All session handouts & lab worksheets",
      "TIBLOGICS AI Playbook (100+ ready-to-use AI scripts)",
      "Your personal AI blueprint",
      "Intro to vibe coding — build real tools with AI, no code needed",
      "Session recordings (lifetime access)",
      "Cohort WhatsApp community",
      "Mid-week check-ins & tips",
      "2-weeks post-training support",
      "Numbered certificate + LinkedIn instructions",
      "Certificate & graduation ceremony (date TBA)",
    ],
    cta: "Register Now — Secure My Spot",
    warning: "Limited seats per cohort — first come, first served",
    requirementsHeading: "What you need",
    requirements: [
      { icon: "🧠", title: "Claude preferred", subtitle: "ChatGPT & others also welcome" },
      { icon: "📹", title: "Zoom account", subtitle: "Free tier sufficient" },
      { icon: "⚙️", title: "Automation account", subtitle: "Free tier covers labs · shared at training" },
      { icon: "💻", title: "Laptop or tablet", subtitle: "Recommended · stable internet" },
    ],
  },
  whatsIncluded: {
    eyebrow: "Everything Inside",
    heading: "Built to be your toolkit long after the training ends.",
    cards: [
      { title: "TIBLOGICS AI Playbook", subtitle: "100+ Ready-to-Use AI Scripts", desc: "Organised by use case — sales, writing, operations, marketing, and more. Ready on day one.", color: "#2251A3" },
      { title: "Your AI Blueprint", subtitle: "Personalised AI configuration", desc: "Set it up in Session 2. Every AI response will feel made for you from that moment on.", color: "#22A387" },
      { title: "4 Session Handouts + Labs", subtitle: "Worksheets for every session", desc: "Step-by-step lab sheets you work through live. Yours to keep and revisit anytime.", color: "#F9A738" },
      { title: "2 Live-Built AI Automations", subtitle: "Working automations from Session 4", desc: "You'll build them yourself in the session. Not demos — actual automations you can use.", color: "#8B5CF6" },
      { title: "Your First AI Income Offer", subtitle: "Built and written in Session 3", desc: "You'll leave Session 3 with an offer that's ready to send. Not theory. A real offer.", color: "#F47C4C" },
      { title: "Official Numbered Certificate", subtitle: "LinkedIn-ready on graduation day", desc: "Issued at the certificate ceremony. Each certificate is numbered and unique to you.", color: "#1B3A6B" },
    ],
    toolsHeading: "Tools you'll use across the training",
    tools: [
      "Claude", "ChatGPT", "AI browsers & research", "Automation platform",
      "AI design tools", "Forms & spreadsheets", "AI workspace tools",
      "AI voice agents (demo)", "Email automation", "Digital product platforms",
      "AI coding tools (vibe coding intro)",
    ],
    callouts: [
      { title: "🔥 Live Fix — every session", body: "One volunteer. Real problem. Fixed live with AI. Unscripted. Every session ends with a live demonstration on a real challenge from inside the room.", color: "#F47C4C" },
      { title: "💬 Mid-Week Check-In", body: "A prompt, tip, or challenge dropped in the cohort group between sessions to keep your momentum alive between weekends.", color: "#60A5FA" },
    ],
  },
  registration: {
    eyebrow: "Registration",
    heading: "Reserve your spot.",
    subtitle: "Training starts June 27, 2026. Fill in your details — confirmation and all session details sent within a few minutes. Limited seats per cohort — first come, first served.",
    successHeading: "You're registered!",
    successBody: "Check your email within a few minutes for confirmation and all session information. Welcome to the June Cohort.",
    submitFree: "Complete Registration",
    submitPaid: "Complete Registration — {price}",
    secureNote: "🔒 Secure registration · Confirmation sent within a few minutes · arfa_edu@tiblogics.com",
    goalPlaceholder: "What do you most want to achieve with AI?",
    goalOptions: [
      "Save time and automate repetitive tasks",
      "Create a new income stream using AI",
      "Improve my business operations",
      "Level up my skills for my career",
      "Build my first AI-powered product",
      "Stay current with AI trends and tools",
      "Other",
    ],
  },
  faq: {
    eyebrow: "FAQ",
    heading: "Common questions.",
    items: [
      { q: "Do I need any prior AI or tech experience?", a: "No. This training is designed for people who are curious about AI but haven't yet used it consistently or confidently. You don't need to know how to code, understand machine learning, or have used any AI tool before. We start from the very beginning in Session 1." },
      { q: "What do I need to prepare before Session 1?", a: "Create a free Claude account at claude.ai (paid plan recommended — ChatGPT and other AI tools are also welcome). Have Zoom installed. That's it. We'll set up everything else together in the sessions. A laptop or tablet is recommended — phones can work for some activities but aren't ideal for the labs." },
      { q: "What if I miss a session?", a: "All sessions are recorded and the recordings are shared within 24 hours of each session. You won't fall behind. That said, the live sessions are where the real value is — the Live Fix demos, the hands-on labs, and the real-time Q&A are things the recording can't fully replicate." },
      { q: "Is the $849 all-inclusive?", a: "Yes. The $849 covers everything: all 4 live sessions, all handouts, the TIBLOGICS AI Playbook, session recordings, the cohort WhatsApp group, mid-week check-ins, 2 weeks of post-training support, and your numbered certificate including the graduation ceremony." },
      { q: "What is vibe coding — do I need to know how to code?", a: "No coding knowledge required. Vibe coding is a new way of building software where you describe what you want in plain English and AI writes the code for you. In Session 4, we'll introduce the concept and walk you through building a simple working tool using only natural language — covering the full flow from idea to a finished, working result, the way a software engineer would. You don't need to understand a single line of code; everything is taught live, step by step." },
      { q: "What happens after the 4 sessions?", a: "After Session 4, you have 2 weeks of post-training support — ask questions in the WhatsApp group and get responses from the training team. The graduation and certificate ceremony is held separately (date announced after Session 4). Your session recordings are yours for lifetime access." },
      { q: "Can I get a refund?", a: "Full refund ($849) if you cancel 5+ days before Session 1 — by June 22, 2026. A 50% refund ($424.50) applies for cancellations 3–4 days before Session 1 (June 23–24). No refunds within 48 hours of Session 1 or after it has begun. No-shows without prior written notice are not eligible for a refund. If TIBLOGICS cancels the program, all participants receive a full refund within 10 business days. To cancel, email arfa_edu@tiblogics.com.", link: { href: "/training-terms", text: "View full Terms & Conditions →" } },
    ],
  },
  footer: {
    brand: "TIBLOGICS",
    tagline: "Education Center",
    email: "arfa_edu@tiblogics.com",
    website: "tiblogics.com",
    copyright: "© 2026 TIBLOGICS · All rights reserved",
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// AI for Parents — "coming soon" training. Same page structure/design as the
// flagship training, but parent-focused copy across two modules:
//   1. AI for Kids' Academics — supercharge your children's learning
//   2. AI Safety for Parents  — protect your family in the AI age
// Rendered in "coming soon" mode (waitlist instead of paid checkout).
// ─────────────────────────────────────────────────────────────────────────────
export const PARENTS_TRAINING_CONTENT: TrainingContent = {
  nav: { brand: "TIBLOGICS", tagline: "Education Center", cta: "Join the Waitlist" },
  hero: {
    eyebrow: "",
    headlineLine1: "AI is already in",
    headlineLine2: "your kids' world.",
    headlineHighlight: "Make it work for your family.",
    subtitle:
      "A practical live training built for parents — no tech background needed. Learn to use AI to supercharge your children's academics, and master the urgent AI-safety every parent needs to protect their family right now. Live on Zoom. Dates announced soon.",
    pills: [
      "🗓️ Dates — Announced Soon",
      "💻 Live on Zoom",
      "👨‍👩‍👧‍👦 Built for Parents",
      "📚 2 Powerful Modules",
      "🎯 100% Practical",
    ],
    ctaPrimaryFree: "Join the Waitlist",
    ctaPrimaryPaid: "Join the Waitlist",
    ctaSecondary: "See What's Inside",
  },
  stats: [
    { value: "2", label: "Focused Modules" },
    { value: "Live", label: "Interactive on Zoom" },
    { value: "0", label: "Tech Background Needed" },
    { value: "All", label: "Ages & Grade Levels" },
    { value: "🔔", label: "Waitlist Open — Be First to Know" },
  ],
  countdown: { label: "Dates announced soon — join the waitlist to be first" },
  outcomes: {
    eyebrow: "What You Get",
    heading: "Walk away confident — not worried.",
    subtitle: "Every part of this training gives you something you can use with your kids the same day.",
    items: [
      { icon: "📚", title: "Turn AI into a study partner", desc: "Help your child learn faster, understand deeper, and study smarter — without doing the work for them." },
      { icon: "✍️", title: "Homework help that teaches", desc: "Use AI to explain, quiz, and coach your child through tough topics the right way." },
      { icon: "🛡️", title: "Spot the real dangers early", desc: "Understand deepfakes, AI scams, chatbots and the risks kids face online today." },
      { icon: "🔒", title: "Set up family AI guardrails", desc: "Practical settings, boundaries, and habits that keep your household safe." },
      { icon: "🧠", title: "Raise AI-smart kids", desc: "Teach your children to use AI honestly, safely, and to their advantage." },
      { icon: "💬", title: "Have the right conversations", desc: "Know exactly what to say to your kids about AI at every age." },
      { icon: "🏅", title: "Certificate of completion", desc: "A TIBLOGICS parent certificate — earned live on Zoom." },
    ],
  },
  curriculum: {
    eyebrow: "The Curriculum",
    heading: "Two modules. One confident, protected family.",
    subtitle: "A focused live training — the exact dates and schedule will be announced soon.",
    sessions: [
      { num: "M1", date: "Module 1", title: "AI for Kids' Academics", desc: "Use AI to boost grades, build study skills, and make learning stick — the safe, honest way.", badge: "Academics", color: "#2251A3" },
      { num: "M2", date: "Module 2", title: "AI Safety for Parents", desc: "The urgent risks every parent must know — scams, deepfakes, chatbots — and how to protect your family.", badge: "Family Safety", color: "#F47C4C" },
      { num: "L1", date: "Live Labs", title: "Hands-On With Your Kids", desc: "Build real study aids and safety settings live in the session — nothing theoretical.", badge: "Hands-on lab", color: "#22A387" },
      { num: "Q&A", date: "Live Q&A", title: "Ask Anything", desc: "Bring your specific worries and questions. Get real answers from the training team, live.", badge: "Parent Q&A", color: "#8B5CF6" },
      { num: "🎓", date: "TBA", title: "Certificate & Recap", desc: "Certificate presentation plus a take-home parent action plan. Date announced with the schedule.", badge: "🎓 Bonus · TBA", color: "#1B3A6B" },
    ],
    scheduleRows: [
      { session: "Module 1", date: "TBA", topic: "AI for Kids' Academics", labs: "Study partner setup · Homework coaching · Quiz & practice builder · Honest-use rules" },
      { session: "Module 2", date: "TBA", topic: "AI Safety for Parents", labs: "Scam & deepfake spotting · Chatbot risks · Family guardrails · Privacy settings" },
      { session: "Live Labs", date: "TBA", topic: "Hands-On Practice", labs: "Build a study aid · Set up safety controls · Age-by-age game plan" },
      { session: "Q&A", date: "TBA", topic: "Parent Q&A", labs: "Your questions · Real scenarios · Household action plan" },
      { session: "Bonus", date: "TBA", topic: "Certificate & Recap", labs: "Certificate presentation · Take-home action plan" },
    ],
    schedulePills: [
      "Live on Zoom · dates announced soon",
      "Open to all timezones",
      "Recordings shared after each session",
      "Built for busy parents",
    ],
  },
  pricing: {
    eyebrow: "Coming Soon · Early-bird pricing for waitlist members",
    originalPrice: "",
    badge: "Early-Bird Price",
    saveText: "🔔 Early-bird price — waitlist members get first access when doors open",
    accessText: "Both modules · Live labs · Parent Q&A · Certificate",
    standardLabel: "Standard Rate",
    standardAmount: "TBA",
    standardSub: "Announced with the schedule",
    cohortLabel: "Waitlist Perk",
    cohortAmount: "Early-Bird",
    cohortSub: "Best price · first to know",
    includes: [
      "Module 1 — AI for Kids' Academics (live)",
      "Module 2 — AI Safety for Parents (live)",
      "Hands-on live labs you complete with your family",
      "Age-by-age AI game plan for your kids",
      "Family AI-safety checklist & guardrail settings",
      "Session recordings after each session",
      "Live parent Q&A",
      "Parent certificate of completion",
      "First access & early-bird pricing for waitlist members",
    ],
    cta: "Join the Waitlist",
    warning: "Waitlist members are notified first when dates open",
    requirementsHeading: "What you'll need",
    requirements: [
      { icon: "📹", title: "Zoom account", subtitle: "Free tier is fine" },
      { icon: "💻", title: "Laptop or tablet", subtitle: "Recommended for labs" },
      { icon: "🧠", title: "Curiosity", subtitle: "No tech background needed" },
      { icon: "👨‍👩‍👧", title: "Your questions", subtitle: "Bring them to the live Q&A" },
    ],
  },
  whatsIncluded: {
    eyebrow: "Everything Inside",
    heading: "Practical tools you'll keep using long after the session.",
    cards: [
      { title: "Kids' Study Partner Playbook", subtitle: "AI prompts for learning", desc: "Ready-to-use prompts that turn AI into a patient tutor for any subject or grade level.", color: "#2251A3" },
      { title: "Family AI-Safety Checklist", subtitle: "Protect your household", desc: "A step-by-step checklist to lock down devices, accounts, and habits against AI-era risks.", color: "#F47C4C" },
      { title: "Age-by-Age Game Plan", subtitle: "Right guidance for every age", desc: "What to allow, teach, and watch for — tailored from young kids to teens.", color: "#22A387" },
      { title: "Scam & Deepfake Field Guide", subtitle: "Know the red flags", desc: "Real examples of AI scams and deepfakes so you and your kids can spot them instantly.", color: "#8B5CF6" },
      { title: "Homework-Help Boundaries", subtitle: "Honest AI use", desc: "Simple household rules so AI helps your child learn instead of doing it for them.", color: "#F9A738" },
      { title: "Parent Certificate", subtitle: "Earned live on Zoom", desc: "A TIBLOGICS certificate recognising you as an AI-ready parent.", color: "#1B3A6B" },
    ],
    toolsHeading: "Tools & topics we'll cover",
    tools: [
      "AI tutors & study aids", "Homework coaching", "Deepfake detection",
      "AI scam awareness", "Chatbot safety", "Parental controls",
      "Privacy & data basics", "Screen-time & AI habits", "Honest-use rules",
      "Age-appropriate AI",
    ],
    callouts: [
      { title: "🛡️ Real-Family Scenarios", body: "We walk through real situations parents face today — from AI homework shortcuts to suspicious messages — and exactly how to handle each one.", color: "#F47C4C" },
      { title: "💬 Live Parent Q&A", body: "Bring your specific worries. Every session includes time to ask the training team anything about your kids and AI.", color: "#60A5FA" },
    ],
  },
  registration: {
    eyebrow: "Waitlist",
    heading: "Be first when doors open.",
    subtitle: "Dates and pricing are announced soon. Join the waitlist and you'll be the first to know — plus early-bird pricing reserved for waitlist members.",
    successHeading: "You're on the list! 🎉",
    successBody: "We'll email you the moment dates and pricing are announced — with your early-bird access. Watch your inbox from arfa_edu@tiblogics.com.",
    submitFree: "Join the Waitlist",
    submitPaid: "Join the Waitlist",
    secureNote: "🔒 No spam · We only email you about this training · arfa_edu@tiblogics.com",
    goalPlaceholder: "What matters most to you as a parent?",
    goalOptions: [
      "Help my child do better in school with AI",
      "Keep my kids safe from AI risks online",
      "Understand what AI even is",
      "Set healthy AI rules at home",
      "Talk to my kids about AI the right way",
      "All of the above",
      "Other",
    ],
  },
  faq: {
    eyebrow: "FAQ",
    heading: "Common questions.",
    items: [
      { q: "When does this training start?", a: "Dates are being finalised and will be announced soon. Join the waitlist and you'll be the first to know the schedule — plus you'll get early-bird pricing reserved for waitlist members." },
      { q: "Do I need any tech or AI experience?", a: "None at all. This training is built specifically for parents who feel behind on AI. We start from the very basics and everything is hands-on and jargon-free." },
      { q: "Is this for my kids or for me?", a: "It's for you, the parent. You'll learn how to guide your children's learning with AI and how to protect your family online. You can absolutely involve your kids in the hands-on parts if you'd like." },
      { q: "What ages does this cover?", a: "All of them. The Age-by-Age Game Plan gives you specific guidance from young children through teenagers, so it's useful whatever stage your kids are at." },
      { q: "How much will it cost?", a: "The early-bird price is $269.99 for both modules — including the live labs, parent Q&A, and certificate. Waitlist members lock in this early-bird price and get first access before public registration opens." },
      { q: "What if I can't attend live?", a: "Session recordings are shared after each session so you can catch up anytime. The live sessions are where the Q&A and hands-on help happen, so we recommend attending when you can." },
    ],
  },
  footer: {
    brand: "TIBLOGICS",
    tagline: "Education Center",
    email: "arfa_edu@tiblogics.com",
    website: "tiblogics.com",
    copyright: "© 2026 TIBLOGICS · All rights reserved",
  },
};

// Deep-merge a (possibly partial / stringified) override onto the defaults.
// Arrays are replaced wholesale when present in the override; objects merge key
// by key; anything missing or invalid falls back to the default.
function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function deepMerge<T>(base: T, override: unknown): T {
  if (override === undefined || override === null) return base;
  if (Array.isArray(base)) {
    return (Array.isArray(override) ? override : base) as T;
  }
  if (isObject(base) && isObject(override)) {
    const out: Record<string, unknown> = { ...base };
    for (const key of Object.keys(base)) {
      if (key in override) out[key] = deepMerge((base as Record<string, unknown>)[key], override[key]);
    }
    return out as T;
  }
  // primitive: take override if it is a primitive of a usable type
  return (typeof override === typeof base ? override : base) as T;
}

export function mergeContent(
  raw: string | null | undefined,
  base: TrainingContent = DEFAULT_TRAINING_CONTENT,
): TrainingContent {
  if (!raw) return base;
  let parsed: unknown;
  try {
    parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch {
    return base;
  }
  return deepMerge(base, parsed);
}

export function applyPrice(text: string, priceDisplay: string): string {
  return text.replace(/\{price\}/g, priceDisplay);
}
