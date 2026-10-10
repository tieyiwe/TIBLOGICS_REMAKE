// WhatsApp webhook deliveries: inbound messages (STOP / START and any reply)
// and delivery statuses for the reminders we sent.
import prisma from "@/lib/prisma";
import { ensureReminderTables } from "./db";
import { inboundKeyword } from "./shared";
import { sendText } from "./whatsapp";
import { translator } from "@/lib/learn/i18n";

interface WaMessage {
  from?: string;
  id?: string;
  type?: string;
  text?: { body?: string };
  button?: { text?: string; payload?: string };
  interactive?: { button_reply?: { title?: string } };
}
interface WaStatus {
  id?: string;
  status?: string;
  recipient_id?: string;
  errors?: Array<{ code?: number; title?: string }>;
}
interface WaPayload {
  object?: string;
  entry?: Array<{ changes?: Array<{ field?: string; value?: { messages?: WaMessage[]; statuses?: WaStatus[] } }> }>;
}

export interface InboundReport {
  messages: number;
  stopped: number;
  started: number;
  statuses: number;
}

const STATUS_ORDER = ["sent", "delivered", "read"];

export async function handleWhatsappWebhook(payload: WaPayload, now = new Date()): Promise<InboundReport> {
  await ensureReminderTables();
  const report: InboundReport = { messages: 0, stopped: 0, started: 0, statuses: 0 };
  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      const value = change.value ?? {};
      for (const m of value.messages ?? []) {
        if (!m.from || !/^\d{6,16}$/.test(m.from)) continue;
        report.messages++;
        const phone = `+${m.from}`;
        const text = m.text?.body ?? m.button?.text ?? m.button?.payload ?? m.interactive?.button_reply?.title ?? "";
        const kw = inboundKeyword(text);
        // We only ever touch learners who saved this number themselves.
        const prefs = await prisma.studyReminderPref.findMany({ where: { phoneE164: phone } });
        if (prefs.length === 0) continue;
        if (kw === "stop") {
          await prisma.studyReminderPref.updateMany({
            where: { phoneE164: phone },
            data: { whatsappOn: false, optedOutAt: now, optOutSource: "whatsapp_stop", lastInboundAt: now },
          });
          report.stopped++;
          await sendText(phone, translator(prefs[0].language)("pwa.reminders.wa.stopped")).catch(() => {});
        } else if (kw === "start") {
          // Only a number that opted out by STOP comes back by START; a
          // learner who turned reminders off in settings turns them on there.
          const back = prefs.filter((p) => p.optOutSource === "whatsapp_stop");
          if (back.length) {
            await prisma.studyReminderPref.updateMany({
              where: { phoneE164: phone, optOutSource: "whatsapp_stop" },
              data: {
                whatsappOn: true,
                optedOutAt: null,
                optOutSource: null,
                consentAt: now,
                consentText: `Replied "${text.trim().slice(0, 20)}" on WhatsApp`,
                pausedUntil: null,
                ignoredCount: 0,
                lastInboundAt: now,
              },
            });
            report.started++;
            await sendText(phone, translator(back[0].language)("pwa.reminders.wa.started")).catch(() => {});
          } else {
            await prisma.studyReminderPref.updateMany({ where: { phoneE164: phone }, data: { lastInboundAt: now, ignoredCount: 0 } });
          }
        } else {
          // Any reply counts as engagement: it resets the "ignored" count.
          await prisma.studyReminderPref.updateMany({ where: { phoneE164: phone }, data: { lastInboundAt: now, ignoredCount: 0 } });
        }
      }
      for (const s of value.statuses ?? []) {
        if (!s.id || !s.status) continue;
        report.statuses++;
        const log = await prisma.studyReminderLog.findFirst({ where: { providerId: s.id }, select: { id: true, studentId: true } });
        if (!log) continue;
        if (s.status === "failed") {
          const why = (s.errors ?? []).map((e) => `${e.code ?? ""} ${e.title ?? ""}`.trim()).join("; ").slice(0, 300) || "failed";
          await prisma.studyReminderLog.update({ where: { id: log.id }, data: { status: "failed", error: why } });
        }
        // Statuses can arrive out of order: never step back from "read" to "delivered".
        const pref = await prisma.studyReminderPref.findUnique({ where: { studentId: log.studentId }, select: { lastStatus: true } });
        const rank = (x: string | null | undefined) => STATUS_ORDER.indexOf(x ?? "");
        if (s.status === "failed" || rank(s.status) > rank(pref?.lastStatus)) {
          await prisma.studyReminderPref.update({ where: { studentId: log.studentId }, data: { lastStatus: s.status, lastStatusAt: now } });
        }
      }
    }
  }
  return report;
}
