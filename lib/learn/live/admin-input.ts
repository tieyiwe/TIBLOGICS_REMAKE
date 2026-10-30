import { z } from "zod";
import { validTimeZone, zonedInstant } from "@/lib/learn/community/shared";
import { LIVE_STATUSES, type Resource } from "./shared";
import type { SessionInput } from "./sessions";

// Validation for the live session form in the admin (English only, like the
// rest of the admin). The start is typed as a date and a 24h time in the
// session's own time zone, then stored as a UTC instant.

const https = (label: string) =>
  z
    .string()
    .trim()
    .max(1000)
    .optional()
    .nullable()
    .refine((v) => !v || /^https:\/\//i.test(v), `${label} must start with https://`);

const Session = z.object({
  title: z.string().trim().min(3).max(160),
  expertName: z.string().trim().min(2).max(120),
  expertBio: z.string().trim().max(2000).optional().nullable(),
  expertPhotoUrl: https("The photo URL"),
  topic: z.string().trim().max(200).optional().nullable(),
  trackIds: z.array(z.string().min(1).max(64)).max(50).default([]),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Time must be HH:MM (24h)"),
  timezone: z.string().trim().min(1).max(64),
  durationMinutes: z.coerce.number().int().min(15).max(480).default(60),
  meetingUrl: https("The meeting link"),
  capacity: z.coerce.number().int().min(1).max(10000),
  status: z.enum(LIVE_STATUSES),
  recordingUrl: z
    .string()
    .trim()
    .max(1000)
    .optional()
    .nullable()
    .refine((v) => !v || /^https:\/\//i.test(v) || /^\/[^/].*\.(mp4|webm|m4v|m3u8)$/i.test(v), "The recording must be an https:// link or a /videos/... file"),
  resources: z
    .array(z.object({ title: z.string().trim().min(1).max(160), url: z.string().trim().max(1000).regex(/^https:\/\//i, "Resource links must start with https://") }))
    .max(20)
    .default([]),
});

export function parseSessionInput(raw: unknown): { ok: true; value: SessionInput } | { ok: false; error: string } {
  const r = Session.safeParse(raw);
  if (!r.success) return { ok: false, error: `${r.error.issues[0]?.path.join(".")}: ${r.error.issues[0]?.message}` };
  const v = r.data;
  if (!validTimeZone(v.timezone)) return { ok: false, error: `Unknown time zone "${v.timezone}" (use an IANA name such as Africa/Nairobi)` };
  const [y, m, d] = v.date.split("-").map(Number);
  const [hh, mm] = v.time.split(":").map(Number);
  const startsAt = zonedInstant(y, m, d, hh, mm, v.timezone);
  if (Number.isNaN(startsAt.getTime())) return { ok: false, error: "Invalid date" };
  const nul = (s: string | null | undefined) => s?.trim() || null;
  return {
    ok: true,
    value: {
      title: v.title,
      expertName: v.expertName,
      expertBio: nul(v.expertBio),
      expertPhotoUrl: nul(v.expertPhotoUrl),
      topic: nul(v.topic),
      trackIds: [...new Set(v.trackIds)],
      startsAt,
      durationMinutes: v.durationMinutes,
      timezone: v.timezone,
      meetingUrl: nul(v.meetingUrl),
      capacity: v.capacity,
      status: v.status,
      recordingUrl: nul(v.recordingUrl),
      resources: v.resources as Resource[],
    },
  };
}

/** The stored instant back as the form's date and time in the session's zone. */
export function zonedParts(at: Date, timezone: string): { date: string; time: string } {
  const tz = validTimeZone(timezone) ? timezone : "UTC";
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", { timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })
      .formatToParts(at)
      .map((p) => [p.type, p.value]),
  );
  return { date: `${parts.year}-${parts.month}-${parts.day}`, time: `${parts.hour}:${parts.minute}` };
}
