// Client-only gamification plumbing: a tiny event bus that the runners use to
// ask for a celebration (rendered once, by <GameCelebrations/> in the member
// layout), and the per-browser daily goal counter. Browser storage is only a
// convenience here: every read and write tolerates it being unavailable.

export const GAME_EVENT = "tib:game";

export type XpReason = "lesson" | "micro" | "quiz" | "quizPerfect" | "lab" | "exam";

export interface GameEventDetail {
  points?: number;
  reason?: XpReason;
  newBadges?: string[];
  levelUp?: { index: number } | null;
}

/** Hand an API response's gamification fields to the celebration layer. */
export function celebrate(detail: GameEventDetail): void {
  if (typeof window === "undefined") return;
  const any = (detail.points ?? 0) > 0 || (detail.newBadges?.length ?? 0) > 0 || !!detail.levelUp;
  if (!any) return;
  window.dispatchEvent(new CustomEvent<GameEventDetail>(GAME_EVENT, { detail }));
}

// ── Daily goal ──────────────────────────────────────────────────────────────

const PRACTICE_KEY = "tib:game:practice"; // { "YYYY-MM-DD": count }
const GOAL_KEY = "tib:game:goal";
export const DAILY_EVENT = "tib:game:daily";

/** Local calendar date, e.g. "2026-09-29". */
export function localDay(d: Date = new Date()): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export function readPractice(): Record<string, number> {
  try {
    const raw = window.localStorage.getItem(PRACTICE_KEY);
    const v = raw ? JSON.parse(raw) : {};
    return v && typeof v === "object" ? (v as Record<string, number>) : {};
  } catch {
    return {};
  }
}

/**
 * Count one practice activity (practice pad run, micro-check, quiz or lab
 * attempt) toward today's goal. No points: this never reaches the server.
 */
export function bumpPractice(): void {
  try {
    const all = readPractice();
    const today = localDay();
    all[today] = (all[today] ?? 0) + 1;
    // Keep two weeks: enough for the 7-day strip.
    const keep = Object.keys(all).sort().slice(-14);
    const trimmed: Record<string, number> = {};
    for (const k of keep) trimmed[k] = all[k];
    window.localStorage.setItem(PRACTICE_KEY, JSON.stringify(trimmed));
    window.dispatchEvent(new Event(DAILY_EVENT));
  } catch {
    /* storage unavailable: the goal just won't count this one */
  }
}

export function readGoal(): number {
  try {
    const n = Number(window.localStorage.getItem(GOAL_KEY));
    return Number.isInteger(n) && n >= 1 && n <= 5 ? n : 1;
  } catch {
    return 1;
  }
}

export function writeGoal(n: number): void {
  try {
    window.localStorage.setItem(GOAL_KEY, String(Math.max(1, Math.min(5, Math.round(n)))));
  } catch {
    /* ignore */
  }
}
