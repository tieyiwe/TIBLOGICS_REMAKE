import { PLATFORM_INFO, type Platform } from "./platforms";

// Best-time suggestions: static, sensible defaults per platform
// (PLATFORM_INFO.bestTimes), read in the audience's time zone. Client-safe.

/** Minutes the zone is ahead of UTC at instant `t`. */
function zoneOffsetMinutes(t: number, tz: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit",
  }).formatToParts(new Date(t));
  const g = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  const asUtc = Date.UTC(g("year"), g("month") - 1, g("day"), g("hour") % 24, g("minute"), g("second"));
  return Math.round((asUtc - t) / 60_000);
}

/** The UTC instant of a wall-clock time ("2026-10-05", "08:30") in `tz`. */
export function zonedToUtc(ymd: string, hm: string, tz: string): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  const [h, mi] = hm.split(":").map(Number);
  const guess = Date.UTC(y, m - 1, d, h, mi);
  let t = guess - zoneOffsetMinutes(guess, tz) * 60_000;
  t = guess - zoneOffsetMinutes(t, tz) * 60_000; // settle across a DST change
  return new Date(t);
}

/** "YYYY-MM-DD" of instant `t` in `tz`. */
export function ymdIn(t: Date, tz: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(t);
}

/** "HH:MM" of instant `t` in `tz`. */
export function hmIn(t: Date, tz: string): string {
  return new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(t);
}

export function addDays(ymd: string, n: number): string {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

/** ISO weekday 1 (Mon) .. 7 (Sun) of a calendar date. */
export function isoWeekday(ymd: string): number {
  const [y, m, d] = ymd.split("-").map(Number);
  const w = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return w === 0 ? 7 : w;
}

/** The next `count` suggested slots for a platform after `from`, in `tz`. */
export function suggestSlots(platform: Platform, tz: string, from = new Date(), count = 3): Date[] {
  const { days, times } = PLATFORM_INFO[platform].bestTimes;
  const out: Date[] = [];
  let day = ymdIn(from, tz);
  for (let i = 0; i < 21 && out.length < count; i++, day = addDays(day, 1)) {
    if (!days.includes(isoWeekday(day))) continue;
    for (const hm of times) {
      const at = zonedToUtc(day, hm, tz);
      if (at.getTime() > from.getTime() + 10 * 60_000) out.push(at);
      if (out.length >= count) break;
    }
  }
  return out;
}

/**
 * A slot on a given calendar day: the platform's best time that day (the
 * n-th one when several posts share a day), moved to the next suggested day
 * if the platform's best days skip it.
 */
export function slotOnDay(platform: Platform, tz: string, ymd: string, n = 0): Date {
  const { days, times } = PLATFORM_INFO[platform].bestTimes;
  let day = ymd;
  for (let i = 0; i < 7 && !days.includes(isoWeekday(day)); i++) day = addDays(day, 1);
  return zonedToUtc(day, times[n % times.length], tz);
}
