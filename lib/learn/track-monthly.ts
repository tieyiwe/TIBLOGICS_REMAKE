// Tracks sold on their own monthly plan instead of inside the all-tracks
// monthly plan. Client-safe (no database): pages, checkout and the join
// flow read the same numbers.
//
//   Vibe Coding: $99/month for that track only. The $89 all-tracks plan
//   covers every other track; learners who were already on it when this
//   started keep Vibe Coding (LearnSubscription.allTracksLegacy). Team plans,
//   comps and one-time purchases are unchanged.
//
// A monthly choice that names one of these tracks ({ kind: "monthly", track })
// buys that track's own plan; any other monthly choice buys all tracks.

export const TRACK_MONTHLY_PRODUCT = "learn-track-monthly";

export const TRACK_MONTHLY_CENTS: Readonly<Record<string, number>> = {
  "vibe-coding-engineer": 9900,
  // AI-Empowered Youth (lib/learn/youth.ts): either lane's plan opens both.
  "ai-empowered-youth-explorer": 5997,
  "ai-empowered-youth-builder": 5997,
};

/** The track's own monthly price, or null when it is part of the all-tracks plan. */
export function trackMonthlyCents(slug: string | null | undefined): number | null {
  return slug ? TRACK_MONTHLY_CENTS[slug] ?? null : null;
}

export const SEPARATE_MONTHLY_SLUGS = Object.keys(TRACK_MONTHLY_CENTS);

/** Short names for "… is sold separately" next to the all-tracks plan. */
export const SEPARATE_MONTHLY_NAMES: Readonly<Record<string, string>> = {
  "vibe-coding-engineer": "Vibe Coding",
  "ai-empowered-youth-explorer": "AI-Empowered Youth",
  "ai-empowered-youth-builder": "AI-Empowered Youth",
};
export const separateMonthlyNames = () => [...new Set(SEPARATE_MONTHLY_SLUGS.map((s) => SEPARATE_MONTHLY_NAMES[s] ?? s))].join(", ");
