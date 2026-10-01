import { z } from "zod";
import { parseDay, validTimeZone } from "./shared";
import type { CohortInput } from "./cohorts";

// Validation for the cohort form in the admin (English only, like the rest
// of the admin).

const Cohort = z.object({
  trackId: z.string().min(1),
  name: z.string().trim().min(2).max(120),
  startDate: z.string(),
  endDate: z.string(),
  sessionWeekday: z.coerce.number().int().min(0).max(6),
  sessionTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Time must be HH:MM (24h)"),
  timezone: z.string().trim().min(1).max(64),
  sessionMinutes: z.coerce.number().int().min(15).max(480).default(60),
  meetingUrl: z.string().trim().max(500).optional().nullable(),
  capacity: z.coerce.number().int().min(1).max(5000),
  enrolmentOpen: z.boolean(),
  priceNote: z.string().trim().max(200).optional().nullable(),
});

export function parseCohortInput(raw: unknown): { ok: true; value: CohortInput } | { ok: false; error: string } {
  const r = Cohort.safeParse(raw);
  if (!r.success) return { ok: false, error: `${r.error.issues[0]?.path.join(".")}: ${r.error.issues[0]?.message}` };
  const v = r.data;
  const startDate = parseDay(v.startDate);
  const endDate = parseDay(v.endDate);
  if (!startDate || !endDate) return { ok: false, error: "Dates must be YYYY-MM-DD" };
  if (endDate < startDate) return { ok: false, error: "The end date is before the start date" };
  if (!validTimeZone(v.timezone)) return { ok: false, error: `Unknown time zone "${v.timezone}" (use an IANA name such as Africa/Nairobi)` };
  const meetingUrl = v.meetingUrl?.trim() || null;
  if (meetingUrl && !/^https:\/\//i.test(meetingUrl)) return { ok: false, error: "The meeting link must start with https://" };
  return {
    ok: true,
    value: {
      trackId: v.trackId,
      name: v.name,
      startDate,
      endDate,
      sessionWeekday: v.sessionWeekday,
      sessionTime: v.sessionTime,
      timezone: v.timezone,
      sessionMinutes: v.sessionMinutes,
      meetingUrl,
      capacity: v.capacity,
      enrolmentOpen: v.enrolmentOpen,
      priceNote: v.priceNote?.trim() || null,
    },
  };
}
