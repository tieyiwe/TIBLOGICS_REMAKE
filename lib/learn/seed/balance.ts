import type { SeedModule, SeedQuestion } from "./types";

// Spread correct answers across positions in the stored content.
//
// Options are shuffled per learner when served (lib/learn/assessments.ts), so
// stored position does not decide anything today. But writers tend to put the
// right answer in the same slot (the Intermediate banks had it first in every
// question; the original course had it second in 95%), and if shuffling were
// ever bypassed, a bug, an export, an admin preview, "always A" would pass.
// This makes the stored order safe on its own.
//
// Deterministic: the target position comes from a hash of the question text,
// so re-seeding produces the same order every time. Only two options are
// swapped, which keeps the change minimal and easy to reason about.

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function spreadAnswer<Q extends SeedQuestion>(q: Q): Q {
  const n = q.options.length;
  if (n < 2) return q;
  const target = hash(q.question) % n;
  if (target === q.correctIndex) return q;
  const options = [...q.options];
  [options[target], options[q.correctIndex]] = [options[q.correctIndex], options[target]];
  return { ...q, options, correctIndex: target };
}

export function spreadModule(m: SeedModule): SeedModule {
  return {
    ...m,
    lessons: m.lessons.map((l) => ({ ...l, microCheck: l.microCheck?.map(spreadAnswer) })),
    quiz: m.quiz?.map(spreadAnswer),
  };
}
