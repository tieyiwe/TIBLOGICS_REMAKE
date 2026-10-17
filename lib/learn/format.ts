// Learning Box formatting shared by server and client components: durations,
// hour breakdowns, dates and level names in the visitor's language. Pass the
// `t` you already have (getT() on the server, useT() on the client) and the
// locale. Client-safe and dictionary-free, so it adds nothing to a bundle.
import type { Vars } from "@/lib/i18n/config";

export type T = (key: string, vars?: Vars) => string;

// ── Numbers, durations, dates ──────────────────────────────────────────────

export function fmtNumber(n: number, locale: string, maxFraction = 1): string {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: maxFraction }).format(n);
}

/** "25 min", "2 hrs", "1 hr 30 min" in the visitor's language. */
export function fmtMinutes(t: T, mins: number): string {
  const n = Math.max(0, Math.round(mins));
  if (n < 60) return t("learn.time.min", { n });
  const h = Math.floor(n / 60);
  const m = n % 60;
  if (m === 0) return t(h === 1 ? "learn.time.hr.one" : "learn.time.hr.other", { n: h });
  return t("learn.time.hrMin", { h, m });
}

/** "10 hours" / "9.5 hours" with the locale's decimal separator. */
export function fmtHours(t: T, locale: string, hours: number): string {
  return t(hours === 1 ? "learn.time.hours.one" : "learn.time.hours.other", { n: fmtNumber(hours, locale) });
}

const roundHalf = (x: number) => Math.round(x * 2) / 2;

/** Total study time in hours (rounded to the half hour). */
export function totalHours(lessonMinutes: number, handsOnMinutes: number, fallbackHours = 0): number {
  const mins = lessonMinutes + handsOnMinutes;
  return mins > 0 ? Math.max(0.5, roundHalf(mins / 60)) : fallbackHours;
}

/**
 * "About 14 hours: 9 of lessons, 5 hands-on". Hands-on is labs, module
 * quizzes, the final exam and the capstone (see lib/learn/catalog.ts). With
 * no lessons yet (coming soon), falls back to the track's own estimate.
 */
export function fmtBreakdown(
  t: T,
  locale: string,
  x: { lessonMinutes: number; handsOnMinutes: number; estimatedHours?: number },
): string {
  if (x.lessonMinutes <= 0) return t("learn.time.about", { hours: fmtHours(t, locale, x.estimatedHours ?? 0) });
  return t("learn.time.breakdown", {
    total: fmtNumber(totalHours(x.lessonMinutes, x.handsOnMinutes), locale),
    lessons: fmtNumber(Math.max(0.5, roundHalf(x.lessonMinutes / 60)), locale),
    handsOn: fmtNumber(roundHalf(x.handsOnMinutes / 60), locale),
  });
}

/** "About 3 weeks at 3 hours a week". */
export function fmtPacing(t: T, hours: number, perWeek = 3): string {
  const weeks = Math.max(1, Math.round(hours / perWeek));
  return t(weeks === 1 ? "learn.time.pacing.one" : "learn.time.pacing.other", { n: weeks, per: perWeek });
}

export function fmtDate(d: Date | string, locale: string, long = false): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString(locale, long ? { year: "numeric", month: "long", day: "numeric" } : { year: "numeric", month: "short", day: "numeric" });
}

// ── Levels ─────────────────────────────────────────────────────────────────

/** Track difficulty: "Beginner", or "Beginner → Intermediate". */
export function levelLabel(t: T, level: string, levelEnd?: string | null): string {
  const name = (lv: string) => {
    const k = `learn.level.${lv}`;
    const v = t(k);
    return v === k ? lv : v;
  };
  return levelEnd ? `${name(level)} → ${name(levelEnd)}` : name(level);
}

export function levelMeaning(t: T, level: string): string {
  return t(`learn.levelMeaning.${level}`);
}

/** Points rank ("Explorer", "Practitioner", ...) by index from levelFor(). */
export function rankName(t: T, index: number): string {
  return t(`learn.rank.${Math.max(0, Math.min(4, index))}`);
}

/** A plan price in cents, e.g. "$49" / "49 $US". */
export function fmtPrice(cents: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
    maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}
