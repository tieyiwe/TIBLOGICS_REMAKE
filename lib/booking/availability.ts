import prisma from "@/lib/prisma";
import {
  DEFAULT_AVAIL_DAYS,
  DEFAULT_AVAIL_SLOTS,
  type Availability,
} from "@/lib/booking/services";

/**
 * The days and times the site currently offers, as configured in
 * admin_pro/appointments/availability.
 *
 * Read by both GET /api/appointments/availability (which the form calls) and
 * the write-time check in POST /api/appointments, so the two cannot disagree.
 */
export async function getAvailability(): Promise<Availability> {
  try {
    const rows = await prisma.adminSettings.findMany({
      where: { key: { in: ["avail_days", "avail_slots"] } },
      select: { key: true, value: true },
    });
    const byKey = new Map(rows.map((r) => [r.key, r.value]));
    const daysRaw = byKey.get("avail_days");
    const slotsRaw = byKey.get("avail_slots");

    const days = daysRaw
      ? daysRaw
          .split(",")
          .map((d) => Number(d.trim()))
          .filter((d) => Number.isInteger(d) && d >= 0 && d <= 6)
      : DEFAULT_AVAIL_DAYS;
    const slots = slotsRaw
      ? slotsRaw.split(",").map((s) => s.trim()).filter(Boolean)
      : DEFAULT_AVAIL_SLOTS;

    // An empty saved value would close booking entirely and read as a bug
    // rather than a decision; fall back instead.
    return {
      days: days.length ? days : DEFAULT_AVAIL_DAYS,
      slots: slots.length ? slots : DEFAULT_AVAIL_SLOTS,
    };
  } catch {
    return { days: DEFAULT_AVAIL_DAYS, slots: DEFAULT_AVAIL_SLOTS };
  }
}

/** Slot times are always quoted in ET, whoever is booking. */
export const BOOKING_TIMEZONE = "America/New_York";

const YMD = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Turn a submitted date into the instant this codebase stores bookings at:
 * UTC midnight of the chosen calendar day.
 *
 * `available` and `blocked-dates` already key off `YYYY-MM-DDT00:00:00.000Z`,
 * so a booking has to land on exactly that instant to be found by them. A bare
 * `YYYY-MM-DD` is the reliable input — an ISO timestamp produced by a
 * browser east of UTC lands on the *previous* calendar day, which is how a
 * visitor in Tokyo could book Monday and have it stored as Sunday.
 */
export function parseBookingDate(input: unknown): Date | null {
  if (typeof input !== "string") {
    if (input instanceof Date && !isNaN(input.getTime())) return input;
    return null;
  }
  if (YMD.test(input)) {
    const d = new Date(`${input}T00:00:00.000Z`);
    return isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(input);
  if (isNaN(d.getTime())) return null;
  // Normalise a full timestamp to the same UTC-midnight convention.
  return new Date(`${d.toISOString().slice(0, 10)}T00:00:00.000Z`);
}

/**
 * Day-of-week of a stored booking date, read in UTC.
 *
 * Bookings are stored at UTC midnight of the calendar day (see
 * parseBookingDate), so UTC is the zone that gives back the day the visitor
 * actually picked. `getDay()` would answer in the server's zone instead.
 */
export function bookingDayOfWeek(date: Date): number {
  return date.getUTCDay();
}
