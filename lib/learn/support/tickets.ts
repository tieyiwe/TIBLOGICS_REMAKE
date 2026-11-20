// Learner support tickets: creation from the "Need help?" widget, learner
// follow-ups, the owner alert throttle, and the admin read/write model.
//
// A learner ticket IS an Inbox thread (InboxThread with campaignId
// "support", first message from the learner) plus a SupportTicket row with
// the topic, priority, assignee, context and status. So the learner sees it
// in /learn/inbox with the usual reply box, and staff replies reuse the
// Inbox reply path (in-app + email in the learner's language).
// A visitor ticket (signed out) has no thread: its messages are SupportEntry
// rows and staff answer by email.
import { randomUUID } from "crypto";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { addAdminReply } from "@/lib/learn/inbox/threads";
import { createNotification } from "@/lib/learn/inbox/notifications";
import { sendAdminReplyEmail } from "@/lib/learn/inbox/email";
import { translator } from "@/lib/learn/i18n";
import { ensureSupportTables } from "./db";
import { sendOwnerSupportAlert, sendSupportAck, sendVisitorReply } from "./email";
import type { SupportContext, SupportPriority, SupportStatus, SupportTopic } from "./shared";

/** InboxThread.campaignId marker of a learner-initiated support thread. */
export const SUPPORT_THREAD_MARK = "support";
/** At most one owner email per ticket in this window; later follow-ups are batched. */
export const NOTIFY_WINDOW_MS = 10 * 60_000;

export interface TicketRow {
  id: string;
  kind: "learner" | "visitor";
  threadId: string | null;
  studentId: string | null;
  name: string;
  email: string;
  locale: string;
  topic: string;
  subject: string;
  priority: string;
  assignee: string | null;
  context: SupportContext | null;
  status: SupportStatus;
  lastSender: string;
  lastMessageAt: Date;
  adminUnread: number;
  notifiedAt: Date | null;
  notifyPending: boolean;
  pendingSince: Date | null;
  createdAt: Date;
}

const log = (what: string) => (err: unknown) => console.error(`[support] ${what}`, err instanceof Error ? err.message : err);

function subjectFor(locale: string, topic: SupportTopic, message: string): string {
  const t = translator(locale);
  const flat = message.replace(/\s+/g, " ").trim();
  const words = flat.length > 60 ? `${flat.slice(0, 57)}…` : flat;
  return `${t(`support.topic.${topic}`)}: ${words}`.slice(0, 200);
}

function withLink(message: string, link: string | null): string {
  return link ? `${message}\n\n${link}` : message;
}

// ── Create ─────────────────────────────────────────────────────────────────

export async function createLearnerTicket(opts: {
  student: { id: string; name: string; email: string; locale: string };
  topic: SupportTopic;
  message: string;
  link: string | null;
  context: SupportContext | null;
}): Promise<{ ticketId: string; threadId: string }> {
  await ensureSupportTables();
  const threadId = randomUUID();
  const now = new Date();
  const locale = opts.student.locale === "fr" ? "fr" : "en";
  const subject = subjectFor(locale, opts.topic, opts.message);
  const body = withLink(opts.message, opts.link);
  await prisma.$transaction([
    prisma.inboxThread.create({
      data: {
        id: threadId,
        studentId: opts.student.id,
        subject,
        campaignId: SUPPORT_THREAD_MARK,
        status: "open",
        learnerUnread: 0,
        adminUnread: 1,
        hasLearnerReply: true,
        lastMessageAt: now,
        lastSender: "learner",
        createdAt: now,
      },
    }),
    prisma.inboxMessage.create({
      data: { id: randomUUID(), threadId, studentId: opts.student.id, sender: "learner", authorName: opts.student.name, authorEmail: opts.student.email, body, createdAt: now },
    }),
    prisma.$executeRaw`
      INSERT INTO "SupportTicket" ("id", "kind", "threadId", "studentId", "name", "email", "locale", "topic", "subject", "context", "status", "lastSender", "lastMessageAt", "adminUnread", "notifiedAt", "createdAt")
      VALUES (${threadId}, 'learner', ${threadId}, ${opts.student.id}, ${opts.student.name}, ${opts.student.email}, ${locale}, ${opts.topic}, ${subject},
              ${opts.context ? JSON.stringify(opts.context) : null}::jsonb, 'open', 'learner', ${now}, 1, ${now}, ${now})`,
  ]);

  // Acknowledgement in-app and by email, owner alert. Never blocks the request.
  const t = translator(locale);
  await createNotification({
    studentId: opts.student.id,
    title: t("support.ack.title"),
    body: t("support.ack.body"),
    linkUrl: `/learn/inbox/${threadId}`,
    linkLabel: t("support.ack.link"),
    kind: "support",
  }).catch(log("ack notification"));
  await Promise.allSettled([
    sendSupportAck({ to: opts.student.email, name: opts.student.name, locale, message: body, threadId }).catch(log("ack email")),
    sendOwnerSupportAlert({
      ticketId: threadId,
      kind: "learner",
      followUp: false,
      topic: opts.topic,
      name: opts.student.name,
      email: opts.student.email,
      plan: opts.context?.plan ?? null,
      locale,
      messages: [{ body, at: now }],
      context: opts.context,
      studentId: opts.student.id,
    }).catch(log("owner alert")),
  ]);
  return { ticketId: threadId, threadId };
}

export async function createVisitorTicket(opts: {
  name: string;
  email: string;
  locale: string;
  topic: SupportTopic;
  message: string;
  link: string | null;
  context: SupportContext | null;
}): Promise<{ ticketId: string }> {
  await ensureSupportTables();
  const id = randomUUID();
  const now = new Date();
  const locale = opts.locale === "fr" ? "fr" : "en";
  const subject = subjectFor(locale, opts.topic, opts.message);
  const body = withLink(opts.message, opts.link);
  await prisma.$transaction([
    prisma.$executeRaw`
      INSERT INTO "SupportTicket" ("id", "kind", "threadId", "studentId", "name", "email", "locale", "topic", "subject", "context", "status", "lastSender", "lastMessageAt", "adminUnread", "notifiedAt", "createdAt")
      VALUES (${id}, 'visitor', NULL, NULL, ${opts.name}, ${opts.email}, ${locale}, ${opts.topic}, ${subject},
              ${opts.context ? JSON.stringify(opts.context) : null}::jsonb, 'open', 'visitor', ${now}, 1, ${now}, ${now})`,
    prisma.$executeRaw`
      INSERT INTO "SupportEntry" ("id", "ticketId", "kind", "authorName", "authorEmail", "body", "createdAt")
      VALUES (${randomUUID()}, ${id}, 'visitor', ${opts.name}, ${opts.email}, ${body}, ${now})`,
  ]);
  await Promise.allSettled([
    sendSupportAck({ to: opts.email, name: opts.name, locale, message: body, threadId: null }).catch(log("visitor ack")),
    sendOwnerSupportAlert({
      ticketId: id,
      kind: "visitor",
      followUp: false,
      topic: opts.topic,
      name: opts.name,
      email: opts.email,
      plan: opts.context?.plan ?? "Signed out (visitor)",
      locale,
      messages: [{ body, at: now }],
      context: opts.context,
      studentId: null,
    }).catch(log("owner alert")),
  ]);
  return { ticketId: id };
}

// ── Learner follow-ups and the owner alert throttle ────────────────────────

export async function ticketByThread(threadId: string): Promise<TicketRow | null> {
  await ensureSupportTables();
  const r = await prisma.$queryRaw<TicketRow[]>`SELECT * FROM "SupportTicket" WHERE "threadId" = ${threadId}`;
  return r[0] ?? null;
}

/**
 * Sends the owner one email with every learner message since the last alert,
 * if the 10-minute window is over. The claim is a single conditional UPDATE,
 * so two follow-ups (or the cron) never send the same batch twice.
 */
async function alertIfDue(ticketId: string): Promise<boolean> {
  const since = new Date(Date.now() - NOTIFY_WINDOW_MS);
  const claimed = await prisma.$queryRaw<Array<TicketRow & { prev: Date | null }>>`
    WITH o AS (SELECT "id", "notifiedAt" AS prev FROM "SupportTicket" WHERE "id" = ${ticketId})
    UPDATE "SupportTicket" s SET "notifiedAt" = now(), "notifyPending" = false, "pendingSince" = NULL
    FROM o
    WHERE s."id" = o."id" AND (s."notifiedAt" IS NULL OR s."notifiedAt" < ${since})
    RETURNING s.*, o.prev`;
  const tk = claimed[0];
  if (!tk) return false;
  if (!tk.threadId) return true;
  const msgs = await prisma.inboxMessage.findMany({
    where: { threadId: tk.threadId, sender: "learner", ...(tk.prev ? { createdAt: { gt: tk.prev } } : {}) },
    orderBy: { createdAt: "asc" },
    take: 20,
    select: { body: true, createdAt: true },
  });
  if (!msgs.length) return true;
  await sendOwnerSupportAlert({
    ticketId: tk.id,
    kind: "learner",
    followUp: true,
    topic: tk.topic,
    name: tk.name,
    email: tk.email,
    plan: tk.context?.plan ?? null,
    locale: tk.locale,
    messages: msgs.map((m) => ({ body: m.body, at: m.createdAt })),
    context: tk.context,
    studentId: tk.studentId,
  });
  return true;
}

/**
 * A learner answered in a support thread (existing Inbox reply route).
 * Returns false when the thread is not a support ticket (the caller then
 * sends the usual "learner replied" alert).
 */
export async function onLearnerFollowUp(threadId: string): Promise<boolean> {
  const tk = await ticketByThread(threadId).catch(() => null);
  if (!tk) return false;
  await prisma.$executeRaw`
    UPDATE "SupportTicket" SET "status" = 'open', "lastSender" = 'learner', "lastMessageAt" = now(),
      "adminUnread" = "adminUnread" + 1, "notifyPending" = true, "pendingSince" = COALESCE("pendingSince", now())
    WHERE "id" = ${tk.id}`;
  await alertIfDue(tk.id).catch(log("follow-up alert"));
  return true;
}

/** Sends batched follow-up alerts whose window is over (comms cron). */
export async function flushSupportAlerts(): Promise<number> {
  await ensureSupportTables();
  const due = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT "id" FROM "SupportTicket" WHERE "notifyPending" = true
      AND ("notifiedAt" IS NULL OR "notifiedAt" < ${new Date(Date.now() - NOTIFY_WINDOW_MS)}) LIMIT 100`;
  let sent = 0;
  for (const d of due) if (await alertIfDue(d.id).catch(() => false)) sent++;
  return sent;
}

// ── Learner read model ─────────────────────────────────────────────────────

/** Status of this learner's support threads, by thread id. */
export async function learnerTicketStatus(studentId: string): Promise<Map<string, { status: SupportStatus; topic: string }>> {
  try {
    await ensureSupportTables();
    const rows = await prisma.$queryRaw<Array<{ threadId: string; status: SupportStatus; topic: string }>>`
      SELECT "threadId", "status", "topic" FROM "SupportTicket" WHERE "studentId" = ${studentId} AND "threadId" IS NOT NULL`;
    return new Map(rows.map((r) => [r.threadId, { status: r.status, topic: r.topic }]));
  } catch (err) {
    console.error("[support] learner status", err);
    return new Map();
  }
}

// ── Admin read model ───────────────────────────────────────────────────────

export interface AdminFilters {
  status: SupportStatus | "all";
  topic: SupportTopic | null;
  assignee: string | null; // email, "none" for unassigned
}

export async function adminTickets(f: AdminFilters) {
  await ensureSupportTables();
  const conds: Prisma.Sql[] = [Prisma.sql`TRUE`];
  if (f.status !== "all") conds.push(Prisma.sql`s."status" = ${f.status}`);
  if (f.topic) conds.push(Prisma.sql`s."topic" = ${f.topic}`);
  if (f.assignee === "none") conds.push(Prisma.sql`s."assignee" IS NULL`);
  else if (f.assignee) conds.push(Prisma.sql`s."assignee" = ${f.assignee}`);
  const where = Prisma.join(conds, " AND ");
  const [rows, counts] = await Promise.all([
    prisma.$queryRaw<Array<TicketRow & { lastBody: string | null }>>`
      SELECT s.*,
        COALESCE(
          (SELECT m."body" FROM "InboxMessage" m WHERE m."threadId" = s."threadId" ORDER BY m."createdAt" DESC LIMIT 1),
          (SELECT e."body" FROM "SupportEntry" e WHERE e."ticketId" = s."id" AND e."kind" <> 'note' ORDER BY e."createdAt" DESC LIMIT 1)
        ) AS "lastBody"
      FROM "SupportTicket" s WHERE ${where}
      ORDER BY CASE s."status" WHEN 'open' THEN 0 WHEN 'answered' THEN 1 ELSE 2 END,
        CASE s."priority" WHEN 'urgent' THEN 0 WHEN 'high' THEN 1 WHEN 'normal' THEN 2 ELSE 3 END,
        s."lastMessageAt" DESC
      LIMIT 300`,
    prisma.$queryRaw<Array<{ status: string; n: bigint | number; unread: bigint | number }>>`
      SELECT "status", count(*) AS n, count(*) FILTER (WHERE "adminUnread" > 0) AS unread FROM "SupportTicket" GROUP BY "status"`,
  ]);
  const c = (s: string) => Number(counts.find((x) => x.status === s)?.n ?? 0);
  const unread = counts.filter((x) => x.status !== "closed").reduce((a, x) => a + Number(x.unread), 0);
  return {
    tickets: rows,
    counts: { open: c("open"), answered: c("answered"), closed: c("closed"), all: c("open") + c("answered") + c("closed"), unread },
  };
}

/** Requests waiting for the team (sidebar badge, Today dashboard). Never throws. */
export async function waitingCount(): Promise<number> {
  try {
    await ensureSupportTables();
    const r = await prisma.$queryRaw<Array<{ n: bigint | number }>>`SELECT count(*) AS n FROM "SupportTicket" WHERE "status" = 'open'`;
    return Number(r[0]?.n ?? 0);
  } catch {
    return 0;
  }
}

export interface TimelineItem {
  id: string;
  kind: "learner" | "visitor" | "staff" | "note";
  authorName: string | null;
  authorEmail: string | null;
  body: string;
  createdAt: Date;
}

export async function adminTicket(id: string, markRead = true) {
  await ensureSupportTables();
  const r = await prisma.$queryRaw<TicketRow[]>`SELECT * FROM "SupportTicket" WHERE "id" = ${id}`;
  const tk = r[0];
  if (!tk) return null;
  const [messages, entries] = await Promise.all([
    tk.threadId ? prisma.inboxMessage.findMany({ where: { threadId: tk.threadId }, orderBy: { createdAt: "asc" } }) : Promise.resolve([]),
    prisma.$queryRaw<Array<{ id: string; kind: string; authorName: string | null; authorEmail: string | null; body: string; createdAt: Date }>>`
      SELECT * FROM "SupportEntry" WHERE "ticketId" = ${id} ORDER BY "createdAt" ASC`,
  ]);
  const timeline: TimelineItem[] = [
    ...messages.map((m) => ({ id: m.id, kind: (m.sender === "learner" ? "learner" : "staff") as TimelineItem["kind"], authorName: m.authorName, authorEmail: m.authorEmail, body: m.body, createdAt: m.createdAt })),
    ...entries.map((e) => ({ id: e.id, kind: (e.kind === "note" ? "note" : e.kind === "staff" ? "staff" : "visitor") as TimelineItem["kind"], authorName: e.authorName, authorEmail: e.authorEmail, body: e.body, createdAt: e.createdAt })),
  ].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  if (markRead && tk.adminUnread > 0) {
    await prisma.$executeRaw`UPDATE "SupportTicket" SET "adminUnread" = 0 WHERE "id" = ${id}`;
    if (tk.threadId) await prisma.inboxThread.updateMany({ where: { id: tk.threadId }, data: { adminUnread: 0 } });
  }
  return { ticket: tk, timeline };
}

// ── Admin actions ──────────────────────────────────────────────────────────

export async function staffReply(id: string, body: string, author: { name: string | null; email: string }, email: boolean) {
  await ensureSupportTables();
  const r = await prisma.$queryRaw<TicketRow[]>`SELECT * FROM "SupportTicket" WHERE "id" = ${id}`;
  const tk = r[0];
  if (!tk) return null;
  let emailed = false;
  if (tk.kind === "learner" && tk.threadId) {
    const thread = await addAdminReply(tk.threadId, body, author);
    if (!thread) return null;
    if (email) {
      const student = tk.studentId ? await prisma.student.findUnique({ where: { id: tk.studentId }, select: { email: true, name: true, locale: true } }) : null;
      if (student && !student.email.endsWith("@deleted.arfa.invalid")) {
        try {
          await sendAdminReplyEmail({ to: student.email, name: student.name, locale: student.locale, subject: thread.subject, body, threadId: tk.threadId });
          emailed = true;
        } catch (err) {
          log("reply email")(err);
        }
      }
    }
  } else {
    await prisma.$executeRaw`
      INSERT INTO "SupportEntry" ("id", "ticketId", "kind", "authorName", "authorEmail", "body", "createdAt")
      VALUES (${randomUUID()}, ${id}, 'staff', ${author.name ?? "ARFA team"}, ${author.email}, ${body}, now())`;
    try {
      await sendVisitorReply({ to: tk.email, name: tk.name, locale: tk.locale, body });
      emailed = true;
    } catch (err) {
      log("visitor reply")(err);
    }
  }
  await prisma.$executeRaw`
    UPDATE "SupportTicket" SET "status" = 'answered', "lastSender" = 'staff', "lastMessageAt" = now(), "adminUnread" = 0,
      "assignee" = COALESCE("assignee", ${author.email})
    WHERE "id" = ${id}`;
  return { ticket: tk, emailed };
}

export async function addNote(id: string, body: string, author: { name: string | null; email: string }): Promise<boolean> {
  await ensureSupportTables();
  const n = await prisma.$executeRaw`
    INSERT INTO "SupportEntry" ("id", "ticketId", "kind", "authorName", "authorEmail", "body", "createdAt")
    SELECT ${randomUUID()}, "id", 'note', ${author.name}, ${author.email}, ${body}, now() FROM "SupportTicket" WHERE "id" = ${id}`;
  return n > 0;
}

export async function setTicketStatus(id: string, status: "closed" | "open"): Promise<TicketRow | null> {
  await ensureSupportTables();
  const r = await prisma.$queryRaw<TicketRow[]>`
    UPDATE "SupportTicket" SET "status" = CASE WHEN ${status} = 'closed' THEN 'closed' WHEN "lastSender" = 'staff' THEN 'answered' ELSE 'open' END,
      "adminUnread" = CASE WHEN ${status} = 'closed' THEN 0 ELSE "adminUnread" END,
      "notifyPending" = CASE WHEN ${status} = 'closed' THEN false ELSE "notifyPending" END
    WHERE "id" = ${id} RETURNING *`;
  const tk = r[0] ?? null;
  if (tk?.threadId) await prisma.inboxThread.updateMany({ where: { id: tk.threadId }, data: { status: status === "closed" ? "closed" : "open", ...(status === "closed" ? { adminUnread: 0 } : {}) } });
  return tk;
}

export async function setTicketFields(id: string, f: { priority?: SupportPriority; assignee?: string | null }): Promise<boolean> {
  await ensureSupportTables();
  const sets: Prisma.Sql[] = [];
  if (f.priority) sets.push(Prisma.sql`"priority" = ${f.priority}`);
  if (f.assignee !== undefined) sets.push(Prisma.sql`"assignee" = ${f.assignee}`);
  if (!sets.length) return true;
  const n = await prisma.$executeRaw`UPDATE "SupportTicket" SET ${Prisma.join(sets, ", ")} WHERE "id" = ${id}`;
  return n > 0;
}

// ── Canned replies ─────────────────────────────────────────────────────────

export interface CannedRow {
  id: string;
  title: string;
  body: string;
  bodyFr: string | null;
  createdBy: string | null;
  updatedAt: Date;
}

export async function listCanned(): Promise<CannedRow[]> {
  await ensureSupportTables();
  return prisma.$queryRaw<CannedRow[]>`SELECT "id", "title", "body", "bodyFr", "createdBy", "updatedAt" FROM "SupportCanned" ORDER BY "title" ASC LIMIT 200`;
}

export async function saveCanned(c: { id?: string | null; title: string; body: string; bodyFr: string | null; by: string }): Promise<string | null> {
  await ensureSupportTables();
  if (c.id) {
    const n = await prisma.$executeRaw`UPDATE "SupportCanned" SET "title" = ${c.title}, "body" = ${c.body}, "bodyFr" = ${c.bodyFr}, "updatedAt" = now() WHERE "id" = ${c.id}`;
    return n ? c.id : null;
  }
  const id = randomUUID();
  await prisma.$executeRaw`INSERT INTO "SupportCanned" ("id", "title", "body", "bodyFr", "createdBy") VALUES (${id}, ${c.title}, ${c.body}, ${c.bodyFr}, ${c.by})`;
  return id;
}

export async function deleteCanned(id: string): Promise<boolean> {
  await ensureSupportTables();
  return (await prisma.$executeRaw`DELETE FROM "SupportCanned" WHERE "id" = ${id}`) > 0;
}

/** Staff who can be assigned: the owner and active collaborators who can read learners. */
export async function assignableStaff(): Promise<Array<{ email: string; name: string }>> {
  const { OWNER_EMAIL } = await import("@/lib/auth");
  const collabs = await prisma.collaborator
    .findMany({ where: { active: true }, select: { email: true, name: true, isAdmin: true, permissions: true }, orderBy: { name: "asc" }, take: 100 })
    .catch(() => []);
  const ok = collabs.filter((c) => c.isAdmin || c.permissions.some((p) => ["*", "learners", "events"].includes(p)));
  const out = [{ email: OWNER_EMAIL, name: "Owner" }, ...ok.map((c) => ({ email: c.email, name: c.name }))];
  return out.filter((x, i) => out.findIndex((y) => y.email.toLowerCase() === x.email.toLowerCase()) === i);
}
