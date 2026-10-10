// Which challenge runs when. Weeks start Monday 00:00 UTC (the same week as
// the XP leaderboard, lib/learn/leaderboard.ts). Client-safe.
import { CHALLENGES, type WeeklyChallenge } from "./content";

const DAY = 86_400_000;
const WEEK = 7 * DAY;
/** A Monday: week 0 of the rotation. */
const EPOCH = Date.UTC(2024, 0, 1);

/** Monday 00:00 UTC of the week containing `now`. */
export function weekStartUtc(now = new Date()): Date {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d;
}

/** "YYYY-MM-DD" of the week's Monday: the key stored with each entry. */
export function weekKey(start: Date): string {
  return start.toISOString().slice(0, 10);
}

/** Valid week key ("YYYY-MM-DD", a Monday), or null. */
export function parseWeekKey(key: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return null;
  const d = new Date(`${key}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) || d.getUTCDay() !== 1 ? null : d;
}

/** The challenge for the week starting at `start` (rotates by week number). */
export function challengeForWeek(start: Date): WeeklyChallenge {
  const n = Math.round((start.getTime() - EPOCH) / WEEK);
  const i = ((n % CHALLENGES.length) + CHALLENGES.length) % CHALLENGES.length;
  return CHALLENGES[i];
}

export interface ChallengeWeek {
  key: string;
  start: Date;
  /** Next Monday 00:00 UTC: submissions close. */
  end: Date;
  challenge: WeeklyChallenge;
}

export function currentWeek(now = new Date()): ChallengeWeek {
  const start = weekStartUtc(now);
  return { key: weekKey(start), start, end: new Date(start.getTime() + WEEK), challenge: challengeForWeek(start) };
}

export function previousWeek(now = new Date()): ChallengeWeek {
  return currentWeek(new Date(weekStartUtc(now).getTime() - DAY));
}
