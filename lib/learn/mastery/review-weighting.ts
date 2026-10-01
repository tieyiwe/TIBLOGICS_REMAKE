// Weak-spot weighting for Daily Review (lib/learn/method/review.ts): cards
// from weak modules come first, among due cards and among new ones. Additive:
// with no weak modules the order is exactly the old one.
import { WEAK_REVIEW_BOOST } from "./rules";
import { safeModuleWeakness } from "./weakness";

/** moduleId -> weakness (0..1), only for modules counted as weak. */
export async function weakModuleWeights(studentId: string, trackIds: string[] | null): Promise<Map<string, number>> {
  const all = await safeModuleWeakness(studentId, trackIds);
  const out = new Map<string, number>();
  for (const w of all.values()) if (w.weak) out.set(w.moduleId, w.weakness);
  return out;
}

/**
 * Due cards: lowest box first as before, but a weak module's card counts as
 * up to WEAK_REVIEW_BOOST boxes lower. Ties keep the oldest due first.
 */
export function prioritiseDue<T extends { box: number; dueAt: Date }>(
  due: T[],
  moduleOf: (card: T) => string | undefined,
  weights: Map<string, number>,
): T[] {
  if (weights.size === 0) return due;
  const key = (c: T) => c.box - WEAK_REVIEW_BOOST * (weights.get(moduleOf(c) ?? "") ?? 0);
  return [...due].sort((a, b) => key(a) - key(b) || a.dueAt.getTime() - b.dueAt.getTime());
}

/** New cards (already shuffled): weak modules first, the rest in shuffled order. */
export function prioritiseFresh<T>(fresh: T[], moduleOf: (item: T) => string | undefined, weights: Map<string, number>): T[] {
  if (weights.size === 0) return fresh;
  return fresh
    .map((x, i) => ({ x, i, w: weights.get(moduleOf(x) ?? "") ?? 0 }))
    .sort((a, b) => b.w - a.w || a.i - b.i)
    .map((e) => e.x);
}
