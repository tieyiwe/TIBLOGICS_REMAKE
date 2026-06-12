// Canonical seed for the current live training event. Shared between the public
// event page (lazy-create on first visit) and the admin Events API (ensure it
// always appears in the dashboard). Editing the event in admin never overwrites
// these values — they are create-only defaults.
import type { Prisma } from "@prisma/client";

export const TRAINING_EVENT_SLUG = "ai-practical-training-cohort-1";

export const TRAINING_EVENT_SEED: Prisma.EventCreateInput = {
  slug: TRAINING_EVENT_SLUG,
  title: "AI Practical Training — June Cohort",
  description:
    "A hands-on 4-session live training where you go from curious to capable — writing with AI, building income, creating automations, and getting your first taste of vibe coding. Live on Zoom. Every Saturday 9:30AM–1PM.",
  type: "TRAINING",
  price: 64900,
  currency: "USD",
  capacity: 30,
  spots: 30,
  location: "Live on Zoom",
  date: new Date("2026-06-27T09:30:00"),
  endDate: new Date("2026-07-18T13:00:00"),
  timeSlot: "9:30AM – 1:00PM ET (Saturdays)",
  timezone: "America/New_York",
  coverImage:
    "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&q=80",
  tags: ["ai", "training", "practical", "cohort", "live", "zoom"],
  featured: true,
  published: true,
  registrationOpen: true,
};

// ── Parents AI Training — coming soon ────────────────────────────────────────

export const PARENTS_EVENT_SLUG = "ai-training-for-parents";

export const PARENTS_EVENT_SEED: Prisma.EventCreateInput = {
  slug: PARENTS_EVENT_SLUG,
  title: "AI for Parents — Empower Your Kids & Protect Your Family",
  description:
    "A practical AI training designed specifically for parents. Two powerful modules: using AI to supercharge your children's academic performance, and urgent AI safety every parent needs to know right now. Details coming soon — join the waitlist to be first.",
  type: "TRAINING",
  price: 0,
  currency: "USD",
  location: "Live on Zoom",
  date: null,
  timeSlot: "Date & Time — TBA",
  timezone: "America/New_York",
  coverImage:
    "https://images.unsplash.com/photo-1588072432836-e10032774350?auto=format&fit=crop&w=1200&q=80",
  tags: ["module:AI for Kids' Academics", "module:AI Safety for Parents", "ai", "parents", "kids", "education", "safety", "training"],
  featured: false,
  published: true,
  registrationOpen: false,
};
