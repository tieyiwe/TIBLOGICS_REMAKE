// Which featured product gets the spotlight today.
//
// Pinning one product to the top forever means the others are never seen.
// This rotates the spotlight on a fixed cadence so every featured product
// gets its turn.
//
// The choice is derived from the date rather than stored, which means:
//   - no writes, no cron, nothing to go stale
//   - every visitor in the same period sees the same product, so the page is
//     cacheable and server/client render identically (no hydration mismatch)
//   - it advances on its own, even if nobody touches the admin

/** Days each product holds the spotlight before handing over. */
export const SPOTLIGHT_ROTATION_DAYS = 3;

/** Whole days since the Unix epoch, in UTC so the cutover is not per-visitor. */
function daysSinceEpoch(now: Date): number {
  return Math.floor(now.getTime() / 86_400_000);
}

/**
 * Pick the spotlight item for a given moment.
 *
 * Returns null for an empty list so callers can skip the section entirely
 * rather than rendering an empty hero.
 */
export function pickSpotlight<T>(
  items: T[],
  now: Date = new Date(),
  rotationDays: number = SPOTLIGHT_ROTATION_DAYS,
): T | null {
  if (items.length === 0) return null;
  if (items.length === 1) return items[0];
  const period = Math.floor(daysSinceEpoch(now) / Math.max(1, rotationDays));
  return items[period % items.length];
}

/** When the current spotlight period ends — used for the "next up" hint. */
export function spotlightRotatesAt(
  now: Date = new Date(),
  rotationDays: number = SPOTLIGHT_ROTATION_DAYS,
): Date {
  const days = Math.max(1, rotationDays);
  const nextPeriod = Math.floor(daysSinceEpoch(now) / days) + 1;
  return new Date(nextPeriod * days * 86_400_000);
}

/** Whole days remaining in this spotlight period, minimum 1. */
export function daysUntilRotation(
  now: Date = new Date(),
  rotationDays: number = SPOTLIGHT_ROTATION_DAYS,
): number {
  const ms = spotlightRotatesAt(now, rotationDays).getTime() - now.getTime();
  return Math.max(1, Math.ceil(ms / 86_400_000));
}
