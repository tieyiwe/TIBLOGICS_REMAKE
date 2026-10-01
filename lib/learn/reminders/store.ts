// Reading and saving a learner's study reminder settings.
import prisma from "@/lib/prisma";
import { ensureReminderTables } from "./db";
import { formatDays, normalizePhone, parseDays, parseTime, validTimeZone, type ReminderLanguage } from "./shared";
import { whatsappConfigured } from "./whatsapp";

export interface ReminderSettings {
  whatsappAvailable: boolean;
  whatsappOn: boolean;
  phone: string | null;
  emailOn: boolean;
  timeLocal: string;
  timezone: string;
  days: number[];
  language: ReminderLanguage;
  consentAt: string | null;
  optedOutAt: string | null;
  optOutSource: string | null;
  pausedUntil: string | null;
}

const lang = (l: string | null | undefined): ReminderLanguage => (l === "fr" ? "fr" : "en");

export async function getReminderSettings(studentId: string, fallbackLocale?: string | null): Promise<ReminderSettings> {
  await ensureReminderTables();
  const p = await prisma.studyReminderPref.findUnique({ where: { studentId } });
  return {
    whatsappAvailable: whatsappConfigured(),
    whatsappOn: !!p?.whatsappOn && whatsappConfigured(),
    phone: p?.phoneE164 ?? null,
    emailOn: !!p?.emailOn,
    timeLocal: p?.timeLocal ?? "18:00",
    timezone: p?.timezone ?? "UTC",
    days: parseDays(p?.days ?? "1,2,3,4,5"),
    language: lang(p?.language ?? fallbackLocale),
    consentAt: p?.consentAt?.toISOString() ?? null,
    optedOutAt: p?.optedOutAt?.toISOString() ?? null,
    optOutSource: p?.optOutSource ?? null,
    pausedUntil: p?.pausedUntil && p.pausedUntil > new Date() ? p.pausedUntil.toISOString() : null,
  };
}

export interface ReminderInput {
  whatsappOn: boolean;
  phone: string | null;
  emailOn: boolean;
  timeLocal: string;
  timezone: string;
  days: number[];
  language: ReminderLanguage;
  /** The learner ticked the consent box on this save. */
  consent: boolean;
  /** The consent wording shown, stored with the timestamp. */
  consentText: string;
}

export type SaveError = "phone" | "consent" | "time" | "timezone" | "days" | "unavailable";

export async function saveReminderSettings(studentId: string, input: ReminderInput): Promise<{ ok: true } | { ok: false; error: SaveError }> {
  await ensureReminderTables();
  if (!parseTime(input.timeLocal)) return { ok: false, error: "time" };
  if (!validTimeZone(input.timezone)) return { ok: false, error: "timezone" };
  const days = formatDays(input.days);
  if ((input.whatsappOn || input.emailOn) && !days) return { ok: false, error: "days" };

  const phone = input.phone ? normalizePhone(input.phone) : null;
  if (input.phone && !phone) return { ok: false, error: "phone" };

  const before = await prisma.studyReminderPref.findUnique({ where: { studentId } });
  const now = new Date();

  let consentAt = before?.consentAt ?? null;
  let consentText = before?.consentText ?? null;
  let optedOutAt = before?.optedOutAt ?? null;
  let optOutSource = before?.optOutSource ?? null;

  if (input.whatsappOn) {
    if (!whatsappConfigured()) return { ok: false, error: "unavailable" };
    if (!phone) return { ok: false, error: "phone" };
    // Consent belongs to a number. A new number, or turning WhatsApp back on
    // after opting out, needs the box ticked again on this save.
    const stillValid = !!before?.whatsappOn && before.phoneE164 === phone && !!before.consentAt && !before.optedOutAt;
    if (!stillValid) {
      if (!input.consent) return { ok: false, error: "consent" };
      consentAt = now;
      consentText = input.consentText.slice(0, 500);
    }
    optedOutAt = null;
    optOutSource = null;
  } else if (before?.whatsappOn) {
    optedOutAt = now;
    optOutSource = "settings";
  }

  const data = {
    whatsappOn: input.whatsappOn,
    phoneE164: phone,
    emailOn: input.emailOn,
    timeLocal: input.timeLocal,
    timezone: input.timezone,
    days: days || "1,2,3,4,5",
    language: input.language,
    consentAt,
    consentText,
    optedOutAt,
    optOutSource,
    // Saving settings is a fresh start: a pause from ignored reminders ends.
    pausedUntil: null,
    ignoredCount: 0,
  };
  await prisma.studyReminderPref.upsert({ where: { studentId }, create: { studentId, ...data }, update: data });
  return { ok: true };
}

/** One click "stop all reminders" (account settings). Keeps the number for a later re-enable. */
export async function stopAllReminders(studentId: string, source = "settings"): Promise<void> {
  await ensureReminderTables();
  await prisma.studyReminderPref.updateMany({
    where: { studentId },
    data: { whatsappOn: false, emailOn: false, optedOutAt: new Date(), optOutSource: source },
  });
}
