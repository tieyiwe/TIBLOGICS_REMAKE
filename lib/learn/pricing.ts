// Learning Box pricing. Client-safe (no database), so the public pages, the
// checkout route and the admin editor all read the same numbers.
//
// Two ways to buy:
//   1. One track, one payment, lifetime access to that track. The price
//      follows the track's level: the basic level is $297 and each level
//      above adds $190 (starter/beginner $297, intermediate $487,
//      advanced $677). A track can override it (LearnTrack.priceCents, set in
//      the admin track editor).
//   2. All tracks: the monthly subscription (PLANS.monthly in
//      lib/payments/provider.ts).

export const TRACK_CURRENCY = "USD";
export const TRACK_BASE_PRICE_CENTS = 29700;
export const TRACK_LEVEL_STEP_CENTS = 19000;

const LEVEL_STEP: Record<string, number> = {
  starter: 0,
  beginner: 0,
  intermediate: 1,
  advanced: 2,
};

/** Price in cents for one track, from its level unless the track overrides it. */
export function trackPriceCents(level: string | null | undefined, overrideCents?: number | null): number {
  if (overrideCents != null && Number.isFinite(overrideCents) && overrideCents > 0) return Math.round(overrideCents);
  const step = LEVEL_STEP[(level ?? "").toLowerCase()] ?? 0;
  return TRACK_BASE_PRICE_CENTS + step * TRACK_LEVEL_STEP_CENTS;
}
