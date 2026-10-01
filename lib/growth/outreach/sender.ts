import { randomUUID } from "crypto";
import type { OutreachMessage, Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { mailTransport } from "@/lib/resend";
import { configProblems, inSendWindow, outreachConfig } from "./config";
import { addEvent } from "./leads";
import { SENDABLE_CONSENT, STOP_STAGES } from "./shared";
import { isSuppressed, suppress, unsubscribeUrl } from "./suppression";
import { footerText, textToHtml, whyText } from "./templates";

// The outreach sender. Called by /api/cron/outreach (every 15 minutes) and
// by the "Run sender now" button. Safe to call concurrently and repeatedly:
//
//   1. A lock row (OutreachState "sender") lets one run work at a time.
//   2. Every email is CLAIMED (approved → sending, conditional update) before
//      the SMTP call, so no message can go out twice even if two runs overlap
//      or the lock expires mid-run.
//   3. Every gate is re-checked at send time: rolling 24h cap, sending
//      window, sequence paused, lead stage / do-not-contact, consent basis,
//      global suppression list, previous step sent.
//
// A message left "sending" by a crashed run is marked failed, never retried:
// it may have been delivered, and a duplicate cold email is worse than none.

const LOCK_ID = "sender";
const LOCK_MS = 6 * 60_000;

export interface SenderResult {
  ran: boolean;
  reason?: string;
  sent: number;
  cancelled: number;
  failed: number;
  waiting: number;
  capRemaining: number;
  details: string[];
}

async function acquireLock(): Promise<boolean> {
  await prisma.outreachState.upsert({ where: { id: LOCK_ID }, create: { id: LOCK_ID }, update: {} });
  const now = new Date();
  const r = await prisma.outreachState.updateMany({
    where: { id: LOCK_ID, OR: [{ lockedUntil: null }, { lockedUntil: { lt: now } }] },
    data: { lockedUntil: new Date(now.getTime() + LOCK_MS), lastRunAt: now },
  });
  return r.count === 1;
}

async function releaseLock(result: SenderResult) {
  await prisma.outreachState
    .update({ where: { id: LOCK_ID }, data: { lockedUntil: null, lastResult: result as unknown as Prisma.InputJsonValue } })
    .catch(() => {});
}

export async function sentInLast24h(): Promise<number> {
  const since = new Date(Date.now() - 86_400_000);
  return prisma.outreachMessage.count({
    where: { OR: [{ status: "sent", sentAt: { gte: since } }, { status: "sending" }] },
  });
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function cancel(m: OutreachMessage, reason: string, stopEnrollment = true) {
  await prisma.outreachMessage.updateMany({ where: { id: m.id, status: "approved" }, data: { status: "cancelled", error: reason } });
  if (stopEnrollment) {
    await prisma.outreachEnrollment.updateMany({ where: { id: m.enrollmentId, status: { in: ["active", "pending_approval"] } }, data: { status: "stopped", stopReason: reason } });
    await prisma.outreachMessage.updateMany({ where: { enrollmentId: m.enrollmentId, status: { in: ["draft", "approved"] } }, data: { status: "cancelled", error: reason } });
  }
}

type Verdict = { kind: "send" } | { kind: "cancel"; reason: string } | { kind: "wait"; reason: string };

/** Every gate, re-checked immediately before the claim. */
async function check(m: OutreachMessage): Promise<Verdict> {
  const [enrollment, sequence, lead] = await Promise.all([
    prisma.outreachEnrollment.findUnique({ where: { id: m.enrollmentId } }),
    prisma.outreachSequence.findUnique({ where: { id: m.sequenceId } }),
    prisma.growthLead.findUnique({ where: { id: m.leadId } }),
  ]);
  if (!enrollment || enrollment.status !== "active") return { kind: "cancel", reason: `Enrollment ${enrollment?.status ?? "missing"}` };
  if (!sequence || sequence.status === "archived") return { kind: "cancel", reason: "Sequence archived" };
  if (sequence.status !== "active") return { kind: "wait", reason: "Sequence paused" };
  if (!lead) return { kind: "cancel", reason: "Lead deleted" };
  if (lead.doNotContact) return { kind: "cancel", reason: "Do not contact" };
  if (STOP_STAGES.has(lead.stage)) return { kind: "cancel", reason: `Lead stage ${lead.stage}` };
  if (!SENDABLE_CONSENT.has(lead.consentBasis)) return { kind: "cancel", reason: "No consent basis" };
  if (!m.toEmail) return { kind: "cancel", reason: "No address" };
  if (lead.email && lead.email !== m.toEmail) return { kind: "cancel", reason: "Lead address changed; re-enrol to email the new one" };
  const sup = await isSuppressed(m.toEmail);
  if (sup) return { kind: "cancel", reason: `Suppressed (${sup})` };
  if (m.stepIndex > 0) {
    const prev = await prisma.outreachMessage.findUnique({ where: { enrollmentId_stepIndex: { enrollmentId: m.enrollmentId, stepIndex: m.stepIndex - 1 } } });
    if (!prev || prev.status === "cancelled" || prev.status === "failed") return { kind: "cancel", reason: "Previous step did not send" };
    if (prev.status !== "sent" || !prev.sentAt) return { kind: "wait", reason: "Previous step not sent yet" };
    // Keep the gap the sequence intended, counted from when the previous step actually went.
    const due = prev.sentAt.getTime() + (m.dayOffset - prev.dayOffset) * 86_400_000;
    if (Date.now() < due) {
      await prisma.outreachMessage.updateMany({ where: { id: m.id, status: "approved" }, data: { scheduledFor: new Date(due + Math.floor(Math.random() * 60 * 60_000)) } });
      return { kind: "wait", reason: "Rescheduled after previous step" };
    }
  }
  return { kind: "send" };
}

function isPermanentFailure(err: unknown): boolean {
  const e = err as { responseCode?: number; code?: string };
  return typeof e?.responseCode === "number" && e.responseCode >= 550 && e.responseCode < 560;
}

async function deliver(m: OutreachMessage, consentBasis: string, website: string | null) {
  const cfg = outreachConfig();
  const unsub = unsubscribeUrl(m.toEmail!);
  const footer = footerText(cfg, unsub, whyText({ website, consentBasis }));
  const text = `${m.bodyText.trim()}\n\n${footer}\n`;
  const info = await mailTransport().sendMail({
    from: `"${cfg.fromName.replace(/"/g, "")}" <${cfg.fromEmail}>`,
    to: m.toEmail!,
    replyTo: cfg.replyTo,
    subject: m.subject,
    text,
    html: textToHtml(m.bodyText.trim(), footer, unsub),
    headers: {
      // RFC 8058 one-click unsubscribe (Gmail/Yahoo bulk-sender rules).
      "List-Unsubscribe": `<${unsub}>, <mailto:${cfg.replyTo}?subject=unsubscribe>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      "X-TIB-Outreach": m.id,
    },
  });
  return info?.messageId ?? null;
}

export async function runSender(opts: { ignoreWindow?: boolean } = {}): Promise<SenderResult> {
  const cfg = outreachConfig();
  const res: SenderResult = { ran: false, sent: 0, cancelled: 0, failed: 0, waiting: 0, capRemaining: 0, details: [] };

  const problems = configProblems(cfg);
  if (problems.length) return { ...res, reason: problems[0] };
  if (!(await acquireLock())) return { ...res, reason: "Another sender run is in progress" };
  res.ran = true;

  try {
    // Crashed mid-send: do not resend (it may have gone out).
    const stale = await prisma.outreachMessage.updateMany({
      where: { status: "sending", claimedAt: { lt: new Date(Date.now() - 15 * 60_000) } },
      data: { status: "failed", error: "Interrupted during sending; not retried to avoid a duplicate. Check the sent folder." },
    });
    if (stale.count) res.details.push(`${stale.count} interrupted send(s) marked failed`);

    res.capRemaining = Math.max(0, cfg.dailyCap - (await sentInLast24h()));
    if (!opts.ignoreWindow && !inSendWindow(cfg)) {
      res.reason = `Outside sending hours (${cfg.windowStart}:00-${cfg.windowEnd}:00 ${cfg.timeZone})`;
      return res;
    }
    if (res.capRemaining === 0) {
      res.reason = `Daily cap of ${cfg.dailyCap} reached`;
      return res;
    }

    const budget = Math.min(cfg.perRun, res.capRemaining);
    const tried = new Set<string>();
    while (res.sent < budget && tried.size < 200) {
      const m = await prisma.outreachMessage.findFirst({
        where: { status: "approved", scheduledFor: { lte: new Date() }, id: { notIn: [...tried] } },
        orderBy: [{ scheduledFor: "asc" }, { stepIndex: "asc" }],
      });
      if (!m) break;
      tried.add(m.id);

      const v = await check(m);
      if (v.kind === "wait") {
        res.waiting++;
        continue;
      }
      if (v.kind === "cancel") {
        await cancel(m, v.reason);
        await addEvent(m.leadId, "send_skipped", `Step ${m.stepIndex + 1} not sent: ${v.reason}`);
        res.cancelled++;
        res.details.push(`cancelled ${m.id}: ${v.reason}`);
        continue;
      }

      // Re-check the cap against the database, then claim before sending.
      if ((await sentInLast24h()) >= cfg.dailyCap) {
        res.reason = `Daily cap of ${cfg.dailyCap} reached`;
        break;
      }
      const claimId = randomUUID();
      const claim = await prisma.outreachMessage.updateMany({
        where: { id: m.id, status: "approved" },
        data: { status: "sending", claimId, claimedAt: new Date() },
      });
      if (claim.count !== 1) continue; // someone else took it

      const lead = await prisma.growthLead.findUnique({ where: { id: m.leadId } });
      try {
        const messageId = await deliver(m, lead?.consentBasis ?? "implied_published", lead?.website ?? null);
        const now = new Date();
        await prisma.outreachMessage.updateMany({
          where: { id: m.id, claimId },
          data: { status: "sent", sentAt: now, smtpMessageId: messageId, error: null },
        });
        if (lead) {
          await prisma.growthLead.update({
            where: { id: lead.id },
            data: { lastContactedAt: now, ...(lead.stage === "new" || lead.stage === "enriched" ? { stage: "contacted" } : {}) },
          });
        }
        await addEvent(m.leadId, "emailed", `Step ${m.stepIndex + 1} sent: "${m.subject}"`, { messageId: m.id, to: m.toEmail });
        const remaining = await prisma.outreachMessage.count({ where: { enrollmentId: m.enrollmentId, status: { in: ["draft", "approved", "sending"] } } });
        if (remaining === 0) {
          await prisma.outreachEnrollment.updateMany({ where: { id: m.enrollmentId, status: "active" }, data: { status: "completed" } });
        }
        res.sent++;
        res.details.push(`sent ${m.id} → ${m.toEmail}`);
      } catch (err) {
        const msg = err instanceof Error ? err.message.slice(0, 300) : "Send failed";
        await prisma.outreachMessage.updateMany({ where: { id: m.id, claimId }, data: { status: "failed", error: msg } });
        res.failed++;
        res.details.push(`failed ${m.id}: ${msg}`);
        if (isPermanentFailure(err) && m.toEmail) {
          await suppress(m.toEmail, "bounce", "smtp", msg);
          await addEvent(m.leadId, "bounced", `Hard bounce from SMTP: ${msg}`);
        } else {
          await addEvent(m.leadId, "send_failed", msg);
        }
      }

      if (res.sent < budget) {
        const gap = (cfg.gapMinSec + Math.random() * (cfg.gapMaxSec - cfg.gapMinSec)) * 1000;
        if (gap > 0) await sleep(gap);
      }
    }
    res.capRemaining = Math.max(0, cfg.dailyCap - (await sentInLast24h()));
    return res;
  } finally {
    await releaseLock(res);
  }
}
