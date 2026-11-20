// Study reminder helpers that are safe in client and server code: phone
// numbers, the reminder schedule and the learner's local day. No database
// access here. Time zones reuse lib/learn/community/shared.ts.
import { validTimeZone, zonedInstant } from "@/lib/learn/community/shared";

export { validTimeZone };

export const REMINDER_LANGUAGES = ["en", "fr"] as const;
export type ReminderLanguage = (typeof REMINDER_LANGUAGES)[number];

/** Reminders go out within this many hours after the chosen time, never later. */
export const SEND_WINDOW_HOURS = 3;
/** Reminders in a row with no study and no reply before reminders pause. */
export const IGNORED_LIMIT = 3;
/** How long reminders pause after IGNORED_LIMIT ignored reminders. */
export const PAUSE_DAYS = 7;

/**
 * A phone number typed by a learner, in E.164 form ("+2250701020304"), or
 * null. Spaces, dots, dashes and brackets are ignored and a leading "00" is
 * read as "+". A number without a country code is refused rather than
 * guessed.
 */
export function normalizePhone(input: string | null | undefined): string | null {
  if (!input) return null;
  let s = input.trim().replace(/[\s().\-  ]/g, "");
  if (s.startsWith("00")) s = `+${s.slice(2)}`;
  return /^\+[1-9]\d{7,14}$/.test(s) ? s : null;
}

/** "+2250701020304" shown as "+225 ••• •• 04", for confirmations and logs. */
export function maskPhone(e164: string): string {
  return e164.length <= 6 ? e164 : `${e164.slice(0, 4)} ••• ${e164.slice(-2)}`;
}

/** "HH:MM" (24 hour) or null. */
export function parseTime(s: string | null | undefined): { hh: number; mm: number } | null {
  const m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec((s ?? "").trim());
  return m ? { hh: +m[1], mm: +m[2] } : null;
}

/** "1,3,5" to [1, 3, 5]; weekdays 0 (Sunday) to 6, sorted and unique. */
export function parseDays(s: string | null | undefined): number[] {
  return [...new Set((s ?? "").split(",").map((x) => Number(x.trim())).filter((n) => Number.isInteger(n) && n >= 0 && n <= 6))].sort();
}

export function formatDays(days: number[]): string {
  return [...new Set(days.filter((n) => Number.isInteger(n) && n >= 0 && n <= 6))].sort().join(",");
}

export interface LocalClock {
  /** "YYYY-MM-DD" in the zone. */
  day: string;
  y: number;
  m: number;
  d: number;
  /** 0 = Sunday. */
  weekday: number;
  /** Minutes since local midnight. */
  minutes: number;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** The calendar day, weekday and time of day in a zone at an instant. */
export function localClock(tz: string, at = new Date()): LocalClock {
  const zone = validTimeZone(tz) ? tz : "UTC";
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: zone,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
    })
      .formatToParts(at)
      .map((p) => [p.type, p.value]),
  );
  const y = +parts.year;
  const m = +parts.month;
  const d = +parts.day;
  return {
    day: `${parts.year}-${parts.month}-${parts.day}`,
    y,
    m,
    d,
    weekday: WEEKDAYS.indexOf(parts.weekday),
    minutes: (+parts.hour % 24) * 60 + +parts.minute,
  };
}

/** The instant local midnight began, on the clock's day. */
export function localMidnight(tz: string, c: LocalClock): Date {
  return zonedInstant(c.y, c.m, c.d, 0, 0, validTimeZone(tz) ? tz : "UTC");
}

/**
 * Whether a reminder is due now: a chosen weekday, at or after the chosen
 * time, and not more than SEND_WINDOW_HOURS after it (a late or missed run
 * never sends a reminder in the middle of the night).
 */
export function reminderDue(pref: { timeLocal: string; timezone: string; days: string }, at = new Date()): { due: boolean; clock: LocalClock } {
  const clock = localClock(pref.timezone, at);
  const time = parseTime(pref.timeLocal);
  if (!time || !parseDays(pref.days).includes(clock.weekday)) return { due: false, clock };
  const start = time.hh * 60 + time.mm;
  const late = clock.minutes - start;
  return { due: late >= 0 && late < SEND_WINDOW_HOURS * 60, clock };
}

/** Inbound WhatsApp words that opt out (STOP) or back in (START). */
const STOP_WORDS = new Set(["stop", "stopall", "unsubscribe", "cancel", "end", "quit", "arret", "arreter", "desabonner", "desinscrire", "acha"]);
const START_WORDS = new Set(["start", "unstop", "demarrer", "reprendre", "anza"]);

export function inboundKeyword(text: string | null | undefined): "stop" | "start" | null {
  const w = (text ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z]/g, "");
  if (STOP_WORDS.has(w)) return "stop";
  if (START_WORDS.has(w)) return "start";
  return null;
}
