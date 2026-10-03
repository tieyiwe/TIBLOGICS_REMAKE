// Mastery-based learning paths: the rules in one place, pure (no database),
// so pages, APIs and tests agree.

export const MASTERY_LEVELS = ["mastered", "partial", "new"] as const;
export type MasteryLevel = (typeof MASTERY_LEVELS)[number];

/** Diagnostic questions per module: two, and a third when the first two do not settle it. */
export const DIAG_BASE_PER_MODULE = 2;
export const DIAG_MAX_PER_MODULE = 3;
/** A diagnostic may be retaken this long after the last finished one. */
export const DIAG_RETAKE_MS = 24 * 3_600_000;
/** An unfinished diagnostic older than this is dropped and a new one starts. */
export const DIAG_STALE_MS = 24 * 3_600_000;
/** Rough answering time per question, for the "about N minutes" line. */
export const DIAG_SECONDS_PER_QUESTION = 35;

/** Share of a module's lesson time a skim takes (summary plus quick checks). */
export const SKIM_SHARE = 0.35;

/**
 * Whether a module needs another diagnostic question, given how many were
 * asked, how many were right and how many the bank can offer (up to 3).
 *
 * - 0 of 2 right: stop (New).
 * - 1 of 2 or 2 of 2 right: ask a third to separate Partly from New, or
 *   to confirm Mastered (Mastered needs every answer right, at least 2).
 */
export function needsMore(asked: number, correct: number, poolSize: number): boolean {
  const cap = Math.min(DIAG_MAX_PER_MODULE, poolSize);
  if (asked >= cap) return false;
  if (asked < Math.min(DIAG_BASE_PER_MODULE, cap)) return true;
  // asked === 2 and a third question exists
  return correct > 0;
}

/** Questions a module will most likely take, for the progress bar. */
export function plannedQuestions(asked: number, correct: number, poolSize: number): number {
  if (!needsMore(asked, correct, poolSize)) return asked;
  const cap = Math.min(DIAG_MAX_PER_MODULE, poolSize);
  return asked < Math.min(DIAG_BASE_PER_MODULE, cap) ? Math.min(DIAG_BASE_PER_MODULE, cap) : cap;
}

/**
 * Level from a finished module: Mastered = every answer right with at least
 * two questions; Partly = at least half right; New otherwise.
 */
export function levelFor(asked: number, correct: number): MasteryLevel {
  if (asked >= 2 && correct === asked) return "mastered";
  if (asked > 0 && correct * 2 >= asked) return "partial";
  return "new";
}

export function scoreFor(asked: number, correct: number): number {
  return asked === 0 ? 0 : Math.round((correct / asked) * 100);
}

/** Path step for a module from its estimate (and what has happened since). */
export type PathStep = "skip" | "skim" | "study";

export function stepFor(level: MasteryLevel | null): PathStep {
  return level === "mastered" ? "skip" : level === "partial" ? "skim" : "study";
}

/** Minutes saved by a module's step, from its lesson minutes. */
export function minutesSaved(step: PathStep, lessonMinutes: number): number {
  if (step === "skip") return lessonMinutes;
  if (step === "skim") return Math.round(lessonMinutes * (1 - SKIM_SHARE));
  return 0;
}

// ── Weak spots ────────────────────────────────────────────────────────────

/** Answers older than this count half as much. */
export const WEAK_HALF_LIFE_DAYS = 21;
/** Signals needed before a module can be called weak. */
export const WEAK_MIN_SIGNALS = 3;
/** Weighted share of wrong answers at or above which a module is weak. */
export const WEAK_THRESHOLD = 0.4;
/** How far a weak module's cards move up in Daily Review (in boxes, at weakness 1). */
export const WEAK_REVIEW_BOOST = 2;

export function signalWeight(at: Date, now: number = Date.now()): number {
  const days = Math.max(0, (now - at.getTime()) / 86_400_000);
  return Math.pow(0.5, days / WEAK_HALF_LIFE_DAYS);
}

/** Display state of a module in the mastery grid. */
export type GridState = "mastered" | "partial" | "weak" | "new";
