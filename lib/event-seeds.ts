// Create-only seeds for the training events. Shared between the public event
// page (lazy-create on first visit) and the admin Events API (so they always
// appear in the dashboard). Editing an event in admin never overwrites these
// values.
//
// Keeping a finished cohort here as `registrationOpen: true` meant a fresh
// database recreated a past event badged "Open Now" and taking $849
// registrations. Dates and open/closed state for a NEW cohort belong in admin,
// not in this file.
import type { Prisma } from "@prisma/client";

export const TRAINING_EVENT_SLUG = "ai-practical-training-cohort-1";

export const TRAINING_EVENT_SEED: Prisma.EventCreateInput = {
  slug: TRAINING_EVENT_SLUG,
  title: "AI Practical Training — June Cohort",
  description:
    "A hands-on 4-session live training where you go from curious to capable — writing with AI, building income, creating automations, and getting your first taste of vibe coding. Live on Zoom. Every Saturday 9:30AM–1PM.",
  type: "TRAINING",
  price: 84900,
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
  // This cohort has run. Left published so its page and the certificates that
  // link to it keep working, but not featured and not taking registrations —
  // the API refuses a finished cohort regardless, and the card reads
  // "Completed" rather than "Open Now".
  featured: false,
  published: true,
  registrationOpen: false,
};

// ── Parents AI Training — coming soon ────────────────────────────────────────

export const PARENTS_EVENT_SLUG = "ai-training-for-parents";

export const PARENTS_EVENT_SEED: Prisma.EventCreateInput = {
  slug: PARENTS_EVENT_SLUG,
  title: "AI for Parents — Empower Your Kids & Protect Your Family",
  description:
    "A practical AI training designed specifically for parents. Two powerful modules: using AI to supercharge your children's academic performance, and urgent AI safety every parent needs to know right now. Details coming soon — join the waitlist to be first.",
  type: "TRAINING",
  price: 26999,
  currency: "USD",
  location: "Live on Zoom",
  date: null,
  timeSlot: "Date & Time — TBA",
  timezone: "America/New_York",
  coverImage:
    "https://images.unsplash.com/photo-1588072432836-e10032774350?auto=format&fit=crop&w=1200&q=80",
  tags: ["module:AI for Kids' Academics", "module:AI Safety for Parents", "ai", "parents", "kids", "education", "safety", "training"],
  capacity: 50,
  spots: 50,
  featured: false,
  published: true,
  registrationOpen: false,
};
