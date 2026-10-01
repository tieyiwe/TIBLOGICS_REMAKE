// Campaign engine for the communications center.
//
// Lifecycle: scheduled -> starting (recipients being listed) -> sending ->
// sent (or cancelled before it starts).
//   - "Send now" creates a campaign due now and delivers the first batch in
//     the request; anything left (a large segment, the hourly cap) is picked
//     up by the "comms" cron job (scripts/cron.mjs, every 15 minutes).
//   - A scheduled campaign keeps its audience as a rule; recipients are
//     resolved when it starts, so learners who joined meanwhile are included.
//
// Idempotency: the campaign is claimed (scheduled -> sending) with a
// conditional update, and each recipient is claimed (pending -> sending)
// before anything is sent. Two overlapping runs never deliver twice. A claim
// left behind by a crash is marked failed ("interrupted"), never re-sent.
//
// Rate: at most COMMS_HOURLY_CAP emails (default 300) in any rolling hour,
// across campaigns. In-app messages are not capped.
//
// Rules: marketing messages skip learners who unsubscribed and suspended
// accounts, and carry an unsubscribe link. Service messages (account and
// course notices) always deliver, except to blocked or deleted accounts.
import { randomUUID } from "crypto";
import type { Session } from "next-auth";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { audit } from "@/lib/admin/audit";
import { accountStates } from "@/lib/learn/account-status";
import { progressFor } from "@/lib/learn/admin/learners";
import { LEARN_SITE } from "@/lib/learn/emails";
import { ensureCommsTables } from "./db";
import { AudienceSchema, describeAudience, resolveAudience, type Audience } from "./audience";
import { applyMerge, type MergeValues } from "./markdown";
import { renderCampaignEmail, sendCampaignEmail } from "./email";
import { createAdminThread } from "./threads";

export const SUBJECT_MAX = 200;
export const BODY_MAX = 20_000;

export const ComposeSchema = z
  .object({
    audience: AudienceSchema,
    kind: z.enum(["marketing", "service"]),
    viaEmail: z.boolean(),
    viaInbox: z.boolean(),
    subject: z.string().trim().min(1, "Write a subject").max(SUBJECT_MAX),
    body: z.string().trim().min(1, "Write a message").max(BODY_MAX),
    subjectFr: z.string().trim().max(SUBJECT_MAX).optional().nullable(),
    bodyFr: z.string().trim().max(BODY_MAX).optional().nullable(),
    scheduleAt: z.string().datetime({ offset: true }).optional().nullable(),
    templateId: z.string().max(64).optional().nullable(),
  })
  .refine((v) => v.viaEmail || v.viaInbox, { message: "Choose email, in-app or both", path: ["viaEmail"] });
export type ComposeInput = z.infer<typeof ComposeSchema>;

export function hourlyCap(): number {
  const n = Number.parseInt(process.env.COMMS_HOURLY_CAP ?? "", 10);
  return Number.isFinite(n) && n > 0 ? Math.min(n, 10_000) : 300;
}

const STALE_CLAIM_MS = 15 * 60_000;

// ── Create ─────────────────────────────────────────────────────────────────

export async function createCampaign(session: Session, input: ComposeInput) {
  await ensureCommsTables();
  const ids = await resolveAudience(input.audience);
  if (ids.length === 0) return { error: "No learner matches this audience." as const };
  const at = input.scheduleAt ? new Date(input.scheduleAt) : new Date();
  const later = at.getTime() > Date.now() + 60_000;
  if (at.getTime() > Date.now() + 366 * 86_400_000) return { error: "Schedule within the next year." as const };
  const id = randomUUID();
  const label = await describeAudience(input.audience);
  await prisma.commsCampaign.create({
    data: {
      id,
      kind: input.kind,
      subject: input.subject,
      body: input.body,
      subjectFr: input.subjectFr || null,
      bodyFr: input.bodyFr || null,
      viaEmail: input.viaEmail,
      viaInbox: input.viaInbox,
      audience: input.audience as object,
      audienceLabel: label.slice(0, 300),
      status: "scheduled",
      scheduledAt: later ? at : new Date(),
      recipientCount: ids.length,
      templateId: input.templateId || null,
      createdBy: session.user.email ?? "admin",
    },
  });
  await audit(session, later ? "comms.schedule" : "comms.send", { type: "campaign", id, label: input.subject }, {
    audience: label,
    recipients: ids.length,
    kind: input.kind,
    channels: [input.viaEmail && "email", input.viaInbox && "inbox"].filter(Boolean),
    scheduledAt: later ? at.toISOString() : null,
  });
  let report: RunReport | null = null;
  if (!later) report = await runComms({ campaignId: id, maxRecipients: 100 });
  return { error: null, id, recipients: ids.length, scheduled: later, report };
}

export async function cancelCampaign(session: Session, id: string): Promise<boolean> {
  await ensureCommsTables();
  const r = await prisma.commsCampaign.updateMany({ where: { id, status: "scheduled" }, data: { status: "cancelled", finishedAt: new Date() } });
  if (r.count) await audit(session, "comms.cancel", { type: "campaign", id }, null);
  return r.count > 0;
}

// ── Merge values ───────────────────────────────────────────────────────────

async function mergeValuesFor(ids: string[]): Promise<Map<string, MergeValues>> {
  const [students, progress] = await Promise.all([
    prisma.student.findMany({ where: { id: { in: ids } }, select: { id: true, name: true } }),
    progressFor(ids),
  ]);
  const trackIds = [...new Set([...progress.values()].flatMap((p) => p.tracks))];
  const titles = trackIds.length
    ? new Map((await prisma.learnTrack.findMany({ where: { id: { in: trackIds } }, select: { id: true, title: true } })).map((t) => [t.id, t.title]))
    : new Map<string, string>();
  const out = new Map<string, MergeValues>();
  for (const s of students) {
    const p = progress.get(s.id);
    out.set(s.id, {
      firstName: (s.name.split(" ")[0] || s.name).slice(0, 60),
      trackTitle: (p?.tracks[0] && titles.get(p.tracks[0])) || "ARFA",
      progress: `${p?.percent ?? 0}%`,
      loginLink: `${LEARN_SITE}/learn/login`,
    });
  }
  return out;
}

export function sampleMergeValues(name = "Amina"): MergeValues {
  return { firstName: name.split(" ")[0] || name, trackTitle: "AI Foundations", progress: "40%", loginLink: `${LEARN_SITE}/learn/login` };
}

/** Subject and body for a learner's language (French when written, else English). */
export function localised(c: { subject: string; body: string; subjectFr: string | null; bodyFr: string | null }, locale: string) {
  const fr = locale === "fr" && c.bodyFr && c.subjectFr;
  return { subject: fr ? c.subjectFr! : c.subject, body: fr ? c.bodyFr! : c.body };
}

// ── Run ────────────────────────────────────────────────────────────────────

export interface RunReport {
  started: string[];
  sent: number;
  failed: number;
  skipped: number;
  emailed: number;
  capRemaining: number;
  finished: string[];
  interrupted: number;
  errors: string[];
}

async function materialise(campaignId: string, audience: Audience) {
  const ids = await resolveAudience(audience);
  const students = ids.length
    ? await prisma.student.findMany({ where: { id: { in: ids } }, select: { id: true, email: true, locale: true } })
    : [];
  for (let i = 0; i < students.length; i += 1000) {
    await prisma.commsRecipient.createMany({
      data: students.slice(i, i + 1000).map((s) => ({ id: randomUUID(), campaignId, studentId: s.id, email: s.email, locale: s.locale })),
      skipDuplicates: true,
    });
  }
  const n = await prisma.commsRecipient.count({ where: { campaignId } });
  await prisma.commsCampaign.update({ where: { id: campaignId }, data: { recipientCount: n } });
}

async function refreshCounts(campaignId: string): Promise<boolean> {
  const g = await prisma.commsRecipient.groupBy({ by: ["status"], where: { campaignId }, _count: { _all: true } });
  const n = (s: string) => g.find((x) => x.status === s)?._count._all ?? 0;
  const done = n("pending") === 0 && n("sending") === 0;
  await prisma.commsCampaign.update({
    where: { id: campaignId },
    data: {
      sentCount: n("sent"),
      failedCount: n("failed"),
      skippedCount: n("skipped"),
      ...(done ? { status: "sent", finishedAt: new Date() } : {}),
    },
  });
  return done;
}

/**
 * One pass: start due campaigns, then deliver pending recipients within the
 * hourly email cap. `campaignId` limits the pass to one campaign ("Send now").
 */
export async function runComms(opts: { campaignId?: string; maxRecipients?: number; deadlineMs?: number } = {}): Promise<RunReport> {
  await ensureCommsTables();
  const report: RunReport = { started: [], sent: 0, failed: 0, skipped: 0, emailed: 0, capRemaining: 0, finished: [], interrupted: 0, errors: [] };
  const deadline = Date.now() + (opts.deadlineMs ?? 240_000);
  const max = opts.maxRecipients ?? 2000;

  // Claims a crash left behind are never re-sent.
  const stale = await prisma.commsRecipient.updateMany({
    where: { status: "sending", claimedAt: { lt: new Date(Date.now() - STALE_CLAIM_MS) } },
    data: { status: "failed", error: "Interrupted while sending; not retried to avoid a duplicate" },
  });
  report.interrupted = stale.count;
  // A run that died while listing recipients: listing again is safe
  // (duplicates are skipped), so put the campaign back in the queue.
  await prisma.commsCampaign.updateMany({
    where: { status: "starting", startedAt: { lt: new Date(Date.now() - STALE_CLAIM_MS) } },
    data: { status: "scheduled" },
  });

  // 1. Start due campaigns (claim first).
  const due = await prisma.commsCampaign.findMany({
    where: { status: "scheduled", scheduledAt: { lte: new Date() }, ...(opts.campaignId ? { id: opts.campaignId } : {}) },
    orderBy: { scheduledAt: "asc" },
    take: 20,
    select: { id: true, audience: true },
  });
  for (const c of due) {
    // "starting" while recipients are listed: other runs leave it alone and
    // never see a half-listed campaign as finished.
    const claimed = await prisma.commsCampaign.updateMany({ where: { id: c.id, status: "scheduled" }, data: { status: "starting", startedAt: new Date() } });
    if (!claimed.count) continue;
    try {
      await materialise(c.id, AudienceSchema.parse(c.audience));
      await prisma.commsCampaign.update({ where: { id: c.id }, data: { status: "sending" } });
      report.started.push(c.id);
    } catch (err) {
      report.errors.push(`${c.id}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // 2. Hourly email budget.
  const sentLastHour = await prisma.commsRecipient.count({ where: { emailed: true, sentAt: { gte: new Date(Date.now() - 3_600_000) } } });
  let budget = Math.max(0, hourlyCap() - sentLastHour);

  // 3. Deliver.
  const active = await prisma.commsCampaign.findMany({
    where: { status: "sending", ...(opts.campaignId ? { id: opts.campaignId } : {}) },
    orderBy: { scheduledAt: "asc" },
  });
  let handled = 0;
  for (const c of active) {
    if (Date.now() > deadline || handled >= max) break;
    const marketing = c.kind === "marketing";
    while (Date.now() < deadline && handled < max) {
      if (c.viaEmail && budget <= 0) break;
      const batch = await prisma.commsRecipient.findMany({
        where: { campaignId: c.id, status: "pending" },
        take: Math.min(50, max - handled, c.viaEmail ? budget : 50),
        select: { id: true, studentId: true, email: true, locale: true, threadId: true },
      });
      if (batch.length === 0) break;
      const states = await accountStates(batch.map((b) => b.studentId));
      const merge = await mergeValuesFor(batch.map((b) => b.studentId));
      for (const r of batch) {
        if (c.viaEmail && budget <= 0) break;
        // Claim before sending: another run may have taken it.
        const claim = await prisma.commsRecipient.updateMany({ where: { id: r.id, status: "pending" }, data: { status: "sending", claimedAt: new Date() } });
        if (!claim.count) continue;
        handled++;
        const st = states.get(r.studentId);
        const skip =
          st?.status === "deleted" ? "Account deleted"
          : st?.status === "blocked" ? "Account blocked"
          : marketing && st?.marketingOptOut ? "Unsubscribed from news"
          : marketing && st?.status === "suspended" ? "Account suspended"
          : null;
        if (skip) {
          await prisma.commsRecipient.update({ where: { id: r.id }, data: { status: "skipped", error: skip } });
          report.skipped++;
          continue;
        }
        const values = merge.get(r.studentId);
        if (!values) {
          await prisma.commsRecipient.update({ where: { id: r.id }, data: { status: "skipped", error: "Learner not found" } });
          report.skipped++;
          continue;
        }
        const text = localised(c, r.locale);
        const subject = applyMerge(text.subject, values);
        const body = applyMerge(text.body, values);
        let threadId = r.threadId;
        let inboxError: string | null = null;
        let emailError: string | null = null;
        if (c.viaInbox && !threadId) {
          try {
            threadId = await createAdminThread(prisma, { studentId: r.studentId, subject, body, campaignId: c.id, authorName: "ARFA team", authorEmail: c.createdBy });
          } catch (err) {
            inboxError = err instanceof Error ? err.message : String(err);
          }
        }
        let emailed = false;
        if (c.viaEmail) {
          budget--;
          try {
            await sendCampaignEmail(r.email, renderCampaignEmail({ locale: r.locale, subject, body, marketing, studentId: r.studentId, withInboxLink: !!threadId }));
            emailed = true;
            report.emailed++;
          } catch (err) {
            emailError = err instanceof Error ? err.message : String(err);
          }
        }
        const delivered = emailed || (c.viaInbox && !!threadId);
        await prisma.commsRecipient.update({
          where: { id: r.id },
          data: {
            status: delivered ? "sent" : "failed",
            sentAt: new Date(),
            emailed,
            threadId: threadId ?? null,
            error: [emailError && `Email: ${emailError}`, inboxError && `Inbox: ${inboxError}`].filter(Boolean).join(" · ").slice(0, 500) || null,
          },
        });
        if (delivered) report.sent++;
        else report.failed++;
      }
    }
    if (await refreshCounts(c.id)) report.finished.push(c.id);
  }
  report.capRemaining = budget;
  return report;
}

// ── Read models ────────────────────────────────────────────────────────────

export async function listCampaigns(limit = 100) {
  await ensureCommsTables();
  return prisma.commsCampaign.findMany({ orderBy: { createdAt: "desc" }, take: limit });
}

export async function campaignDetail(id: string) {
  await ensureCommsTables();
  const campaign = await prisma.commsCampaign.findUnique({ where: { id } });
  if (!campaign) return null;
  const recipients = await prisma.commsRecipient.findMany({ where: { campaignId: id }, orderBy: [{ status: "asc" }, { sentAt: "desc" }], take: 500 });
  const students = recipients.length
    ? await prisma.student.findMany({ where: { id: { in: recipients.map((r) => r.studentId) } }, select: { id: true, name: true } })
    : [];
  const names = new Map(students.map((s) => [s.id, s.name]));
  return { campaign, recipients: recipients.map((r) => ({ ...r, name: names.get(r.studentId) ?? "" })) };
}

/** Campaigns a learner received (learner page, Messages tab). */
export async function campaignsForLearner(studentId: string) {
  try {
    await ensureCommsTables();
    const rows = await prisma.commsRecipient.findMany({ where: { studentId }, orderBy: { sentAt: "desc" }, take: 100 });
    const camps = rows.length ? await prisma.commsCampaign.findMany({ where: { id: { in: rows.map((r) => r.campaignId) } } }) : [];
    const by = new Map(camps.map((c) => [c.id, c]));
    return rows.flatMap((r) => (by.get(r.campaignId) ? [{ recipient: r, campaign: by.get(r.campaignId)! }] : []));
  } catch (err) {
    console.error("[comms] learner campaigns", err);
    return [];
  }
}
