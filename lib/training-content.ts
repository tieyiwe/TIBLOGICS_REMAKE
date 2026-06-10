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
export interface Faq { q: string; a: string }

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
      "📅 Starts June 20, 2026",
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
    { value: "$649", label: "All Inclusive" },
    { value: "🔥", label: "Limited Seats Per Cohort — First Come, First Served" },
  ],
  countdown: { label: "Registration Closes — Training Starts June 20, 2026" },
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
      { num: "S1", date: "June 20", title: "AI Foundations", desc: "Hands-on from minute one. You use AI before the session ends.", badge: "Beginner-friendly", color: "#2251A3" },
      { num: "S2", date: "June 27", title: "AI in Your Work", desc: "Configure AI to empower your personal life and career.", badge: "Hands-on lab", color: "#F9A738" },
      { num: "S3", date: "July 4", title: "Build Income with AI", desc: "Pick your income model, write your offer, build something you can send today.", badge: "Revenue focused", color: "#22A387" },
      { num: "S4", date: "July 11", title: "Agents, Automation & Vibe Coding", desc: "Build AI agents, automate your workflow, and vibe code your first real tool — using only words.", badge: "Advanced build", color: "#8B5CF6" },
      { num: "S5", date: "TBA", title: "Certificate Ceremony", desc: "Date announced after Session 4. Certificate presentation, wins spotlight & cohort graduation.", badge: "🎓 Bonus · TBA", color: "#1B3A6B" },
    ],
    scheduleRows: [
      { session: "Session 1", date: "June 20, 2026", topic: "AI Foundations", labs: "First prompt · Comparison test · Use case finder · AI browsing intro" },
      { session: "Session 2", date: "June 27, 2026", topic: "AI in Your Daily Work", labs: "Writing sprint · AI blueprint · Time audit" },
      { session: "Session 3", date: "July 4, 2026", topic: "Build Income with AI", labs: "5 income models · Offer design · Marketing asset build" },
      { session: "Session 4", date: "July 11, 2026", topic: "AI Agents, Automation & Vibe Coding", labs: "AI agent build · Automation build · Intro to vibe coding" },
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
    eyebrow: "Cohort 1 · June 20 – July 11, 2026 + Graduation TBA",
    originalPrice: "$1,600",
    badge: "June Cohort Price",
    saveText: "🎁 You save $951 — Cohort 1 only",
    accessText: "Full access · All 4 live sessions · Everything below",
    standardLabel: "Standard Rate",
    standardAmount: "$1,600",
    standardSub: "≈ $400/week for 4 weeks",
    cohortLabel: "Your Cohort 1 Price",
    cohortAmount: "$649",
    cohortSub: "≈ $162/week for 4 weeks",
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
    subtitle: "Training starts June 20, 2026. Fill in your details — confirmation and all session details sent within a few minutes. Limited seats per cohort — first come, first served.",
    successHeading: "You're registered!",
    successBody: "Check your email within a few minutes for confirmation and all session information. Welcome to Cohort 1.",
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
      { q: "Is the $649 all-inclusive?", a: "Yes. The $649 covers everything: all 4 live sessions, all handouts, the TIBLOGICS AI Playbook, session recordings, the cohort WhatsApp group, mid-week check-ins, 2 weeks of post-training support, and your numbered certificate including the graduation ceremony." },
      { q: "What is vibe coding — do I need to know how to code?", a: "No coding knowledge required. Vibe coding is a new way of building software where you describe what you want in plain English and AI writes the code for you. In Session 4, we'll introduce the concept and walk you through building a simple working tool using only natural language — covering the full flow from idea to a finished, working result, the way a software engineer would. You don't need to understand a single line of code; everything is taught live, step by step." },
      { q: "What happens after the 4 sessions?", a: "After Session 4, you have 2 weeks of post-training support — ask questions in the WhatsApp group and get responses from the training team. The graduation and certificate ceremony is held separately (date announced after Session 4). Your session recordings are yours for lifetime access." },
      { q: "Can I get a refund?", a: "Refund requests made more than 72 hours before the first session (June 20, 2026) will be honored in full. Requests made within 72 hours of the start date are not eligible for a refund but can be transferred to a future cohort. No refunds after Session 1." },
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

export function mergeContent(raw: string | null | undefined): TrainingContent {
  if (!raw) return DEFAULT_TRAINING_CONTENT;
  let parsed: unknown;
  try {
    parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch {
    return DEFAULT_TRAINING_CONTENT;
  }
  return deepMerge(DEFAULT_TRAINING_CONTENT, parsed);
}

export function applyPrice(text: string, priceDisplay: string): string {
  return text.replace(/\{price\}/g, priceDisplay);
}
