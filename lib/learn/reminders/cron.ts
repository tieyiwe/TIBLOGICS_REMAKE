// The "reminders" scheduled job (npm run cron reminders, hourly).
//
// For every learner who opted in (WhatsApp, or email as the fallback for
// learners who chose email but not WhatsApp):
//   1. Due? One of their weekdays, at or after their chosen time in their time
//      zone, within SEND_WINDOW_HOURS of it.
//   2. Already handled today? A StudyReminderLog row for their local day means
//      a reminder was sent, skipped or failed: never more than one a day.
//   3. Claim the day (insert the log row) BEFORE sending, so two overlapping
//      runs can never both send.
//   4. Studied today already (a lesson, points, saved work)? Skip.
//   5. Ignored: when the last IGNORED_LIMIT reminders were each followed by
//      no study and no reply, reminders pause for PAUSE_DAYS days (they start
//      again by themselves; saving settings ends the pause at once).
//   6. Send: WhatsApp template (next lesson, streak) or the email.
import prisma from "@/lib/prisma";
import { ensureReminderTables } from "./db";
import { IGNORED_LIMIT, PAUSE_DAYS, localMidnight, reminderDue, type ReminderLanguage } from "./shared";
import { sendReminderTemplate, whatsappConfigured } from "./whatsapp";
import { sendReminderEmail } from "./email";
import { getResumeTarget } from "@/lib/learn/resume";
import { computeStreak } from "@/lib/learn/points";
import { draftTableReady } from "@/lib/learn/drafts/db";
import { cachedLessons } from "@/lib/i18n/sources/learn";
import { translator } from "@/lib/learn/i18n";

const DAY = 86_400_000;

export interface ReminderReport {
  whatsappConfigured: boolean;
  considered: number;
  sent: { whatsapp: number; email: number };
  skipped: { studiedToday: number; paused: number };
  failed: number;
  errors: string[];
}

/** Any sign of study since an instant: a lesson, points or saved work. */
async function studiedSince(studentId: string, since: Date): Promise<boolean> {
  const [lesson, points, draft] = await Promise.all([
    prisma.lessonProgress.findFirst({ where: { studentId, completedAt: { gte: since } }, select: { lessonId: true } }),
    prisma.pointsLedger.findFirst({ where: { studentId, createdAt: { gte: since } }, select: { id: true } }),
    draftTableReady().then((ok) => (ok ? prisma.learnerDraft.findFirst({ where: { studentId, updatedAt: { gte: since } }, select: { id: true } }) : null)),
  ]);
  return !!(lesson || points || draft);
}

/** The next lesson's title in the reminder language, from cached translations only (no AI call). */
async function nextLessonTitle(studentId: string, language: ReminderLanguage): Promise<string> {
  const t = translator(language);
  const target = await getResumeTarget(studentId).catch(() => null);
  if (!target) return t("pwa.reminders.msg.noLesson");
  if ((target.kind === "lesson" || target.kind === "next") && language !== "en") {
    const hit = (await cachedLessons(language, [target.refId]).catch(() => new Map())).get(target.refId);
    if (hit?.title) return hit.title;
  }
  if (target.kind === "studio") return t("pwa.reminders.msg.studio");
  return target.title || t("pwa.reminders.msg.noLesson");
}

export async function runReminders(now = new Date()): Promise<ReminderReport> {
  await ensureReminderTables();
  const wa = whatsappConfigured();
  const report: ReminderReport = { whatsappConfigured: wa, considered: 0, sent: { whatsapp: 0, email: 0 }, skipped: { studiedToday: 0, paused: 0 }, failed: 0, errors: [] };

  const prefs = await prisma.studyReminderPref.findMany({
    where: {
      AND: [
        { OR: [{ pausedUntil: null }, { pausedUntil: { lte: now } }] },
        {
          OR: [
            { emailOn: true },
            ...(wa ? [{ whatsappOn: true, phoneE164: { not: null }, consentAt: { not: null }, optedOutAt: null }] : []),
          ],
        },
      ],
    },
  });

  for (const pref of prefs) {
    const useWhatsapp = wa && pref.whatsappOn && !!pref.phoneE164 && !!pref.consentAt && !pref.optedOutAt;
    const channel = useWhatsapp ? "whatsapp" : pref.emailOn ? "email" : null;
    if (!channel) continue;
    const { due, clock } = reminderDue(pref, now);
    if (!due) continue;
    report.considered++;

    try {
      // Claim the day first. The unique (studentId, day) makes this the lock.
      const claimed = await prisma.studyReminderLog
        .create({ data: { studentId: pref.studentId, day: clock.day, channel } })
        .then((r) => r.id)
        .catch(() => null);
      if (!claimed) continue;
      const finish = (data: { status: string; providerId?: string; error?: string }) =>
        prisma.studyReminderLog.update({ where: { id: claimed }, data }).catch(() => {});

      const midnight = localMidnight(pref.timezone, clock);
      if (await studiedSince(pref.studentId, midnight)) {
        await finish({ status: "skipped", error: "studied_today" });
        await prisma.studyReminderPref.update({ where: { studentId: pref.studentId }, data: { ignoredCount: 0 } });
        report.skipped.studiedToday++;
        continue;
      }

      // Was the previous reminder ignored? (No study and no reply since it.)
      let ignored = pref.ignoredCount;
      if (pref.lastSentAt) {
        const answered = (pref.lastInboundAt && pref.lastInboundAt > pref.lastSentAt) || (await studiedSince(pref.studentId, pref.lastSentAt));
        ignored = answered ? 0 : ignored + 1;
      }
      if (ignored >= IGNORED_LIMIT) {
        await prisma.studyReminderPref.update({
          where: { studentId: pref.studentId },
          data: { pausedUntil: new Date(now.getTime() + PAUSE_DAYS * DAY), ignoredCount: 0, lastSentAt: null },
        });
        await finish({ status: "skipped", error: "paused_after_ignored" });
        report.skipped.paused++;
        continue;
      }

      const student = await prisma.student.findUnique({ where: { id: pref.studentId }, select: { name: true, email: true } });
      if (!student) {
        await finish({ status: "skipped", error: "no_student" });
        continue;
      }
      const language: ReminderLanguage = pref.language === "fr" ? "fr" : "en";
      const [lesson, streak] = await Promise.all([nextLessonTitle(pref.studentId, language), computeStreak(pref.studentId).catch(() => 0)]);
      const firstName = student.name.trim().split(/\s+/)[0] || "";

      let result: { ok: true; id?: string } | { ok: false; error: string };
      if (channel === "whatsapp") {
        result = await sendReminderTemplate(pref.phoneE164!, language, { name: firstName, lesson, streak });
      } else {
        result = await sendReminderEmail({ email: student.email, name: firstName, language, lesson, streak })
          .then(() => ({ ok: true as const }))
          .catch((err) => ({ ok: false as const, error: err instanceof Error ? err.message : String(err) }));
      }

      if (result.ok) {
        await finish({ status: "sent", providerId: result.id });
        await prisma.studyReminderPref.update({
          where: { studentId: pref.studentId },
          data: { lastSentAt: now, ignoredCount: ignored, ...(channel === "whatsapp" ? { lastStatus: "sent", lastStatusAt: now } : {}) },
        });
        report.sent[channel]++;
      } else {
        // The day stays claimed: a failing provider is not retried every hour.
        await finish({ status: "failed", error: result.error.slice(0, 300) });
        report.failed++;
        report.errors.push(`${channel} ${pref.studentId}: ${result.error}`);
      }
    } catch (err) {
      report.errors.push(`${pref.studentId}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  return report;
}
