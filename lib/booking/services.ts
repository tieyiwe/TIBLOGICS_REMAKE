// The consultation topics, in one place.
//
// This list used to live only inside the booking page, which meant the API
// accepted whatever `serviceType`, `serviceDuration`, `servicePrice` and
// `totalAmount` the client sent. A crafted request could book a topic that
// does not exist, at a price the site never offers. Both sides now read this
// file, so the form cannot drift from what the server will accept.

export interface ConsultationTopic {
  id: string;
  name: string;
  duration: string;
  /** Cents. Consultations are free; kept so a paid topic can be added later. */
  price: number;
  badge: string | null;
  description: string;
  color: string;
}

export const CONSULTATION_TOPICS: ConsultationTopic[] = [
  {
    id: "discovery",
    name: "Project Discovery",
    duration: "30 min",
    price: 0,
    badge: "Start here",
    description:
      "Not sure where to begin? An intro call to explore your project, zero commitment.",
    color: "#F47C20",
  },
  {
    id: "strategy",
    name: "AI Strategy",
    duration: "45 min",
    price: 0,
    badge: "Popular",
    description:
      "Talk through where AI could genuinely help your business, and where it wouldn't.",
    color: "#2251A3",
  },
  {
    id: "audit",
    name: "AI Readiness",
    duration: "45 min",
    price: 0,
    badge: null,
    description:
      "Look at your current tech and processes, and what adopting AI would actually take.",
    color: "#1B3A6B",
  },
  {
    id: "website",
    name: "Website & AI",
    duration: "45 min",
    price: 0,
    badge: null,
    description: "Review your current website and discuss an AI-powered upgrade.",
    color: "#0F6E56",
  },
  {
    id: "cost",
    name: "AI Cost & Pricing",
    duration: "45 min",
    price: 0,
    badge: null,
    description:
      "For AI product builders: what your AI actually costs to run, and how to price it.",
    color: "#7c3aed",
  },
  {
    id: "tech",
    name: "Something Else",
    duration: "45 min",
    price: 0,
    badge: null,
    description: "Apps, SaaS, a specific feature, or any other technical question.",
    color: "#3A4A5C",
  },
];

/**
 * Project Discovery is the default: most visitors do not yet know which
 * specific conversation they need, and making them choose is friction.
 */
export const PRIMARY_TOPIC = CONSULTATION_TOPICS[0];
export const OTHER_TOPICS = CONSULTATION_TOPICS.slice(1);

/** Resolve a submitted topic name to the real topic, or null if it is invented. */
export function findTopicByName(name: unknown): ConsultationTopic | null {
  if (typeof name !== "string") return null;
  return CONSULTATION_TOPICS.find((t) => t.name === name) ?? null;
}

// ── Availability ────────────────────────────────────────────────────────────
// Defaults live here too, so the availability API, the booking form and the
// write-time check in POST /api/appointments all agree on the fallback.

export const DEFAULT_AVAIL_DAYS = [1, 2, 3, 4, 5];
export const DEFAULT_AVAIL_SLOTS = [
  "9:00 AM",
  "10:00 AM",
  "11:00 AM",
  "2:00 PM",
  "3:00 PM",
  "4:00 PM",
];

export interface Availability {
  /** Day-of-week numbers, 0 = Sunday. */
  days: number[];
  slots: string[];
}
