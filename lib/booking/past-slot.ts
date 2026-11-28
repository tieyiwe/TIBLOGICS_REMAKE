// Is a booking slot already past? Slots are times in New York (the owner's
// calendar); a booking's date is the calendar day the visitor picked
// ("YYYY-MM-DD"). Shared by the booking page and POST /api/appointments.

const ET = "America/New_York";

/** Today's date and the time of day (minutes) in New York. */
export function nowInEt(now = new Date()): { dateKey: string; minutes: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: ET, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(now);
  const v = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
  return { dateKey: `${v("year")}-${v("month")}-${v("day")}`, minutes: Number(v("hour")) * 60 + Number(v("minute")) };
}

/** "2:00 PM" → minutes after midnight (NaN when unreadable). */
export function slotMinutes(slot: string): number {
  const m = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(slot.trim());
  if (!m) return NaN;
  return ((Number(m[1]) % 12) + (m[3].toUpperCase() === "PM" ? 12 : 0)) * 60 + Number(m[2]);
}

/** True for a day before today in New York, or a slot today within 30 minutes. */
export function isPastSlot(dateKey: string, slot: string, now = new Date()): boolean {
  const et = nowInEt(now);
  if (dateKey < et.dateKey) return true;
  if (dateKey > et.dateKey) return false;
  const mins = slotMinutes(slot);
  return !Number.isNaN(mins) && mins <= et.minutes + 30;
}
