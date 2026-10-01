// Live expert sessions: rules shared by client and server code (the join
// window, what a session's state is right now, limits). No database access.

export const LIVE_STATUSES = ["scheduled", "live", "ended", "cancelled"] as const;
export type LiveStatus = (typeof LIVE_STATUSES)[number];

export const LIVE_LIMITS = {
  /** The join button appears this long before the start. */
  joinEarlyMs: 15 * 60_000,
  questionMin: 10,
  questionMax: 500,
  /** Per learner per hour (on top of one-per-session caps below). */
  questionsPerHour: 5,
  questionsPerSession: 3,
  votesPerHour: 120,
  rsvpPerHour: 30,
} as const;

export interface Resource {
  title: string;
  url: string;
}

export interface SessionTiming {
  startsAt: Date | string;
  durationMinutes: number;
  status: string;
}

const ms = (d: Date | string) => (typeof d === "string" ? new Date(d) : d).getTime();

export function sessionEnd(s: SessionTiming): Date {
  return new Date(ms(s.startsAt) + s.durationMinutes * 60_000);
}

/**
 * The join window: from 15 minutes before the start until the end. A
 * session staff marked "live" stays open past its planned end (an expert
 * running over) until they mark it ended.
 */
export function joinOpen(s: SessionTiming, now = Date.now()): boolean {
  if (s.status === "cancelled" || s.status === "ended") return false;
  if (now < ms(s.startsAt) - LIVE_LIMITS.joinEarlyMs) return false;
  return now <= sessionEnd(s).getTime() || s.status === "live";
}

/** Over: ended by staff, cancelled, or past its end (unless still "live"). */
export function sessionOver(s: SessionTiming, now = Date.now()): boolean {
  if (s.status === "ended" || s.status === "cancelled") return true;
  return now > sessionEnd(s).getTime() && s.status !== "live";
}

/** RSVPs and questions are open until the session is over. */
export function rsvpOpen(s: SessionTiming, now = Date.now()): boolean {
  return !sessionOver(s, now);
}

/** Questions are asked before the session starts. */
export function questionsOpen(s: SessionTiming, now = Date.now()): boolean {
  return !sessionOver(s, now) && now < ms(s.startsAt) && s.status !== "live";
}

/** Only http(s) links leave the page. */
export function safeUrl(url: string | null | undefined): string | null {
  return url && /^https?:\/\//i.test(url) ? url : null;
}
