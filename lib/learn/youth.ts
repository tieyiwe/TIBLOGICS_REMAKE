// AI-Empowered Youth: Think, Build, Lead (ages 10 to 17). Client-safe.
//
// One program, two lanes, each a track of its own:
//   Explorer (10 to 13) and Builder (14 to 17).
// A purchase of either lane (one time, $247) or its monthly plan ($59.97,
// lib/learn/track-monthly.ts) opens BOTH lanes, so a learner can move up a
// lane without paying again (lib/learn/session.ts getAccess). The program
// is not part of the all-tracks monthly plan.

export const YOUTH_EXPLORER = "ai-empowered-youth-explorer";
export const YOUTH_BUILDER = "ai-empowered-youth-builder";
export const YOUTH_SLUGS = [YOUTH_EXPLORER, YOUTH_BUILDER] as const;

export const YOUTH_PRICE_CENTS = 24700;
export const YOUTH_MONTHLY_CENTS = 5997;
/** Each additional child of the same parent. */
export const YOUTH_SIBLING_DISCOUNT_PCT = 25;

export const isYouthSlug = (slug: string | null | undefined): boolean => !!slug && (YOUTH_SLUGS as readonly string[]).includes(slug);

/** The lane for an age: 10 to 13 Explorer, 14 to 17 Builder. */
export function laneForAge(age: number): typeof YOUTH_EXPLORER | typeof YOUTH_BUILDER {
  return age <= 13 ? YOUTH_EXPLORER : YOUTH_BUILDER;
}
