// Inbox threads: what a learner sees at /learn/inbox and what the ARFA team
// sees at /admin_pro/communications (Inbox tab). A thread starts with an
// admin message (from a campaign or a direct message); a learner reply makes
// it a support conversation for the team.
import { cache } from "react";
import { randomUUID } from "crypto";
import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { ensureCommsTables } from "./db";

export const REPLY_MAX = 5000;

type Tx = Prisma.TransactionClient;

/** New thread with its first admin message. Returns the thread id. */
export async function createAdminThread(
  db: Tx | typeof prisma,
  opts: { studentId: string; subject: string; body: string; campaignId?: string | null; authorName?: string | null; authorEmail?: string | null },
): Promise<string> {
  const id = randomUUID();
  const now = new Date();
  await db.inboxThread.create({
    data: {
      id,
      studentId: opts.studentId,
      subject: opts.subject.slice(0, 200),
      campaignId: opts.campaignId ?? null,
      learnerUnread: 1,
      lastMessageAt: now,
      lastSender: "admin",
      createdAt: now,
    },
  });
  await db.inboxMessage.create({
    data: {
      id: randomUUID(),
      threadId: id,
      studentId: opts.studentId,
      sender: "admin",
      authorName: opts.authorName ?? "ARFA team",
      authorEmail: opts.authorEmail ?? null,
      body: opts.body,
      createdAt: now,
    },
  });
  return id;
}

// ── Learner side ───────────────────────────────────────────────────────────

/** Unread threads for the nav badge. Cached per request; never throws. */
export const unreadCount = cache(async (studentId: string): Promise<number> => {
  try {
    await ensureCommsTables();
    return await prisma.inboxThread.count({ where: { studentId, learnerUnread: { gt: 0 } } });
  } catch (err) {
    console.error("[inbox] unread", err);
    return 0;
  }
});

export async function learnerThreads(studentId: string) {
  await ensureCommsTables();
  const threads = await prisma.inboxThread.findMany({
    where: { studentId },
    orderBy: { lastMessageAt: "desc" },
    take: 200,
  });
  const last = threads.length
    ? await prisma.inboxMessage.findMany({
        where: { threadId: { in: threads.map((t) => t.id) } },
        orderBy: { createdAt: "desc" },
        distinct: ["threadId"],
        select: { threadId: true, body: true, sender: true },
      })
    : [];
  const byThread = new Map(last.map((m) => [m.threadId, m]));
  return threads.map((t) => ({ ...t, last: byThread.get(t.id) ?? null }));
}

/** One thread of this learner (null when it is not theirs), marked read. */
export async function learnerThread(studentId: string, threadId: string) {
  await ensureCommsTables();
  const thread = await prisma.inboxThread.findFirst({ where: { id: threadId, studentId } });
  if (!thread) return null;
  const messages = await prisma.inboxMessage.findMany({ where: { threadId }, orderBy: { createdAt: "asc" } });
  if (thread.learnerUnread > 0) await prisma.inboxThread.update({ where: { id: threadId }, data: { learnerUnread: 0 } });
  return { thread, messages };
}

export async function markLearnerRead(studentId: string, threadId: string): Promise<boolean> {
  await ensureCommsTables();
  const r = await prisma.inboxThread.updateMany({ where: { id: threadId, studentId }, data: { learnerUnread: 0 } });
  return r.count > 0;
}

/** Learner reply. The caller rate-limits and validates length. */
export async function addLearnerReply(studentId: string, threadId: string, body: string, author: { name: string; email: string }) {
  await ensureCommsTables();
  const thread = await prisma.inboxThread.findFirst({ where: { id: threadId, studentId } });
  if (!thread) return { error: "not_found" as const };
  if (thread.status === "closed") return { error: "closed" as const };
  const now = new Date();
  await prisma.$transaction([
    prisma.inboxMessage.create({
      data: { id: randomUUID(), threadId, studentId, sender: "learner", authorName: author.name, authorEmail: author.email, body, createdAt: now },
    }),
    prisma.inboxThread.update({
      where: { id: threadId },
      data: { adminUnread: { increment: 1 }, hasLearnerReply: true, lastMessageAt: now, lastSender: "learner", learnerUnread: 0 },
    }),
  ]);
  return { error: null, thread };
}

// ── Admin side ─────────────────────────────────────────────────────────────

export type InboxView = "open" | "unread" | "closed" | "all";

export async function adminInbox(view: InboxView) {
  await ensureCommsTables();
  const where: Prisma.InboxThreadWhereInput = { hasLearnerReply: true };
  if (view === "open") where.status = "open";
  if (view === "closed") where.status = "closed";
  if (view === "unread") where.adminUnread = { gt: 0 };
  const [threads, counts] = await Promise.all([
    prisma.inboxThread.findMany({ where, orderBy: { lastMessageAt: "desc" }, take: 200 }),
    prisma.inboxThread.groupBy({ by: ["status"], where: { hasLearnerReply: true }, _count: { _all: true } }),
  ]);
  const unread = await prisma.inboxThread.count({ where: { hasLearnerReply: true, adminUnread: { gt: 0 } } });
  const students = threads.length
    ? await prisma.student.findMany({ where: { id: { in: [...new Set(threads.map((t) => t.studentId))] } }, select: { id: true, name: true, email: true } })
    : [];
  const last = threads.length
    ? await prisma.inboxMessage.findMany({
        where: { threadId: { in: threads.map((t) => t.id) } },
        orderBy: { createdAt: "desc" },
        distinct: ["threadId"],
        select: { threadId: true, body: true, sender: true },
      })
    : [];
  const sBy = new Map(students.map((s) => [s.id, s]));
  const lBy = new Map(last.map((m) => [m.threadId, m]));
  const c = (st: string) => counts.find((x) => x.status === st)?._count._all ?? 0;
  return {
    threads: threads.map((t) => ({ ...t, student: sBy.get(t.studentId) ?? null, last: lBy.get(t.id) ?? null })),
    counts: { open: c("open"), closed: c("closed"), unread, all: c("open") + c("closed") },
  };
}

export async function adminThread(threadId: string, markRead = true) {
  await ensureCommsTables();
  const thread = await prisma.inboxThread.findUnique({ where: { id: threadId } });
  if (!thread) return null;
  const [messages, student] = await Promise.all([
    prisma.inboxMessage.findMany({ where: { threadId }, orderBy: { createdAt: "asc" } }),
    prisma.student.findUnique({ where: { id: thread.studentId }, select: { id: true, name: true, email: true, locale: true } }),
  ]);
  if (markRead && thread.adminUnread > 0) await prisma.inboxThread.update({ where: { id: threadId }, data: { adminUnread: 0 } });
  return { thread, messages, student };
}

export async function addAdminReply(threadId: string, body: string, author: { name: string | null; email: string }) {
  await ensureCommsTables();
  const now = new Date();
  const thread = await prisma.inboxThread.findUnique({ where: { id: threadId } });
  if (!thread) return null;
  await prisma.$transaction([
    prisma.inboxMessage.create({
      data: { id: randomUUID(), threadId, studentId: thread.studentId, sender: "admin", authorName: author.name ?? "ARFA team", authorEmail: author.email, body, createdAt: now },
    }),
    prisma.inboxThread.update({
      where: { id: threadId },
      data: { learnerUnread: { increment: 1 }, adminUnread: 0, lastMessageAt: now, lastSender: "admin", status: "open" },
    }),
  ]);
  return thread;
}

/** Threads and messages of one learner, for the admin learner page. */
export async function threadsForLearner(studentId: string) {
  try {
    await ensureCommsTables();
    const threads = await prisma.inboxThread.findMany({ where: { studentId }, orderBy: { lastMessageAt: "desc" }, take: 50 });
    const messages = threads.length
      ? await prisma.inboxMessage.findMany({ where: { threadId: { in: threads.map((t) => t.id) } }, orderBy: { createdAt: "asc" } })
      : [];
    return threads.map((t) => ({ ...t, messages: messages.filter((m) => m.threadId === t.id) }));
  } catch (err) {
    console.error("[inbox] learner threads", err);
    return [];
  }
}
