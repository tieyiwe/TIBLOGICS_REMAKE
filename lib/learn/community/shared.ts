// Community helpers that are safe in client and server code: limits, public
// names, time zones and the cohort schedule. No database access here.

// ── Limits (anti-spam) ──────────────────────────────────────────────────────
export const LIMITS = {
  titleMin: 6,
  titleMax: 140,
  threadBodyMin: 10,
  replyMin: 2,
  bodyMax: 5000,
  reportReasonMax: 300,
  /** Per learner per hour. */
  threadsPerHour: 5,
  repliesPerHour: 20,
  votesPerHour: 120,
  reportsPerDay: 20,
  /** A brand new account cannot post links until it is this old... */
  newAccountDays: 3,
  /** ...or has this many visible posts. */
  newAccountPosts: 3,
  /** Distinct reports that hide a post until a moderator looks at it. */
  autoHideReports: 3,
  peerFeedbackMin: 20,
  peerFeedbackMax: 1000,
  peerReviewsRequired: 2,
} as const;

export const REPORT_REASONS = ["spam", "abuse", "off_topic", "other"] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];

/** True when the text carries a link or something that reads as one. */
export function hasLink(text: string): boolean {
  return /(https?:\/\/|www\.|\]\(|\b[a-z0-9-]+\.(com|net|org|io|co|ly|me|info|biz|xyz|app|dev|ru|cn|tk|gg|site|online|shop|link|click)\b)/i.test(text);
}

/**
 * Learner text rendered through components/learn/Markdown.tsx. That renderer
 * turns ```try, ```playground and ```studio fences into interactive widgets
 * meant for authored lessons; in a post they become plain code blocks.
 */
export function safePostMarkdown(md: string): string {
  return md.replace(/^(\s*)```[^\n`]*$/gm, "$1```");
}

/**
 * "First L.": the only form of a learner's name the community shows. Never
 * an email address: a name that contains one shows as nothing (the caller
 * then shows a generic "Learner").
 */
export function publicName(name: string | null | undefined): string {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0 || parts[0].includes("@")) return "";
  const first = parts[0].slice(0, 24);
  const last = parts.length > 1 && !parts[parts.length - 1].includes("@") ? parts[parts.length - 1] : "";
  return last ? `${first} ${last.charAt(0).toUpperCase()}.` : first;
}

// ── Time zones ──────────────────────────────────────────────────────────────

export function validTimeZone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/** Milliseconds the zone is ahead of UTC at this instant. */
function tzOffsetMs(tz: string, at: Date): number {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
      .formatToParts(at)
      .map((p) => [p.type, p.value]),
  );
  const asUtc = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour % 24, +parts.minute, +parts.second);
  return asUtc - Math.floor(at.getTime() / 1000) * 1000;
}

/** The instant a wall-clock time on a calendar date happens in a time zone. */
export function zonedInstant(y: number, m: number, d: number, hh: number, mm: number, tz: string): Date {
  const guess = Date.UTC(y, m - 1, d, hh, mm);
  const off = tzOffsetMs(tz, new Date(guess));
  let t = guess - off;
  const off2 = tzOffsetMs(tz, new Date(t));
  if (off2 !== off) t = guess - off2;
  return new Date(t);
}

// ── Cohort schedule ─────────────────────────────────────────────────────────

const DAY = 86_400_000;
const WEEK = 7 * DAY;

export interface CohortTiming {
  startDate: Date;
  endDate: Date;
  sessionWeekday: number;
  sessionTime: string;
  timezone: string;
  sessionMinutes: number;
}

export interface LiveSession {
  week: number;
  start: Date;
  end: Date;
}

/** Calendar days are stored as UTC midnight; this reads them back. */
const utcDay = (d: Date) => Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());

export function cohortWeeks(c: Pick<CohortTiming, "startDate" | "endDate">): number {
  const days = Math.max(1, Math.round((utcDay(c.endDate) - utcDay(c.startDate)) / DAY) + 1);
  return Math.max(1, Math.ceil(days / 7));
}

/** Every weekly live session between the start and end dates (inclusive). */
export function cohortSessions(c: CohortTiming): LiveSession[] {
  const [hh, mm] = c.sessionTime.split(":").map((x) => Number(x) || 0);
  const tz = validTimeZone(c.timezone) ? c.timezone : "UTC";
  const out: LiveSession[] = [];
  const first = utcDay(c.startDate);
  const last = utcDay(c.endDate);
  for (let t = first; t <= last && out.length < 104; t += DAY) {
    const d = new Date(t);
    if (d.getUTCDay() !== c.sessionWeekday) continue;
    const start = zonedInstant(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate(), hh, mm, tz);
    out.push({ week: Math.floor((t - first) / WEEK) + 1, start, end: new Date(start.getTime() + c.sessionMinutes * 60_000) });
  }
  return out;
}

/** The next session that has not ended yet, or null. */
export function nextSession(c: CohortTiming, now = new Date()): LiveSession | null {
  return cohortSessions(c).find((s) => s.end.getTime() > now.getTime()) ?? null;
}

export interface PlanModule {
  id: string;
  title: string;
  lessons: number;
}

export interface WeekPlan {
  week: number;
  /** Monday-agnostic: the 7-day block starting at startDate + (week-1)*7. */
  from: Date;
  to: Date;
  modules: PlanModule[];
  /** Lessons that should be finished by the end of this week. */
  cumulativeLessons: number;
}

/**
 * Spreads the track's modules over the cohort's weeks in order, by lesson
 * count, so a long module gets its own week and short ones share.
 */
export function weekPlan(c: Pick<CohortTiming, "startDate" | "endDate">, modules: PlanModule[]): WeekPlan[] {
  const weeks = cohortWeeks(c);
  const total = modules.reduce((n, m) => n + m.lessons, 0) || modules.length || 1;
  const plan: WeekPlan[] = Array.from({ length: weeks }, (_, i) => {
    const from = new Date(utcDay(c.startDate) + i * WEEK);
    const to = new Date(Math.min(utcDay(c.endDate), from.getTime() + 6 * DAY));
    return { week: i + 1, from, to, modules: [], cumulativeLessons: 0 };
  });
  let before = 0;
  for (const m of modules) {
    const size = modules.some((x) => x.lessons > 0) ? m.lessons : 1;
    const idx = Math.min(weeks - 1, Math.floor((before / total) * weeks));
    plan[idx].modules.push(m);
    before += size;
  }
  let run = 0;
  for (const w of plan) {
    run += w.modules.reduce((n, m) => n + m.lessons, 0);
    w.cumulativeLessons = run;
  }
  return plan;
}

/** Which week of the cohort "now" is in (0 before it starts). */
export function currentWeek(c: Pick<CohortTiming, "startDate" | "endDate">, now = new Date()): number {
  const start = utcDay(c.startDate);
  if (now.getTime() < start) return 0;
  return Math.min(cohortWeeks(c), Math.floor((now.getTime() - start) / WEEK) + 1);
}

/** Percent of the track the plan expects finished by the end of last week. */
export function expectedPercent(plan: WeekPlan[], week: number, totalLessons: number): number {
  if (week <= 1 || totalLessons === 0) return 0;
  const w = plan[Math.min(plan.length, week - 1) - 1];
  return w ? Math.round((w.cumulativeLessons / totalLessons) * 100) : 0;
}

/** Calendar date "YYYY-MM-DD" for an <input type="date">, from a stored day. */
export function dayInput(d: Date | string): string {
  const x = typeof d === "string" ? new Date(d) : d;
  return x.toISOString().slice(0, 10);
}

/** Parse "YYYY-MM-DD" to the stored form (UTC midnight). */
export function parseDay(s: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s.trim());
  if (!m) return null;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return Number.isNaN(d.getTime()) ? null : d;
}
