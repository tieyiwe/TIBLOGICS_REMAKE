import prisma from "@/lib/prisma";

// Learner support tickets ("Need help?" on every learner page).
//
//   SupportTicket  one request. kind "learner": linked to the learner's Inbox
//                  thread (threadId = InboxThread.id, the conversation itself
//                  lives in InboxMessage). kind "visitor": a signed-out
//                  visitor (login, sign-up, join pages); no Student, the
//                  conversation lives in SupportEntry.
//   SupportEntry   internal staff notes (never shown to the learner) and the
//                  messages of visitor tickets (visitor / staff).
//   SupportCanned  saved reply snippets for the team.
//
// Created at runtime once per process (no migrations in this project); the
// statements mirror the models at the end of prisma/schema.prisma. Queried
// with raw SQL so the feature never depends on a regenerated Prisma client.

const STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS "SupportTicket" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'learner',
    "threadId" TEXT,
    "studentId" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'en',
    "topic" TEXT NOT NULL DEFAULT 'other',
    "subject" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "assignee" TEXT,
    "context" JSONB,
    "status" TEXT NOT NULL DEFAULT 'open',
    "lastSender" TEXT NOT NULL DEFAULT 'learner',
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "adminUnread" INTEGER NOT NULL DEFAULT 1,
    "notifiedAt" TIMESTAMP(3),
    "notifyPending" BOOLEAN NOT NULL DEFAULT false,
    "pendingSince" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "SupportTicket_threadId_key" ON "SupportTicket"("threadId")`,
  `CREATE INDEX IF NOT EXISTS "SupportTicket_status_lastMessageAt_idx" ON "SupportTicket"("status", "lastMessageAt")`,
  `CREATE INDEX IF NOT EXISTS "SupportTicket_studentId_idx" ON "SupportTicket"("studentId")`,
  `CREATE INDEX IF NOT EXISTS "SupportTicket_notifyPending_idx" ON "SupportTicket"("notifyPending")`,
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'SupportTicket_threadId_fkey') THEN
      ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "InboxThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
  END $$`,
  `CREATE TABLE IF NOT EXISTS "SupportEntry" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "authorName" TEXT,
    "authorEmail" TEXT,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SupportEntry_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE INDEX IF NOT EXISTS "SupportEntry_ticketId_createdAt_idx" ON "SupportEntry"("ticketId", "createdAt")`,
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'SupportEntry_ticketId_fkey') THEN
      ALTER TABLE "SupportEntry" ADD CONSTRAINT "SupportEntry_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "SupportTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
  END $$`,
  `CREATE TABLE IF NOT EXISTS "SupportCanned" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "bodyFr" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SupportCanned_pkey" PRIMARY KEY ("id")
  )`,
];

let ready: Promise<void> | null = null;

/** Needs the Inbox tables (foreign key), so callers run ensureCommsTables first; this does it too. */
export function ensureSupportTables(): Promise<void> {
  ready ??= (async () => {
    const { ensureCommsTables } = await import("@/lib/learn/inbox/db");
    await ensureCommsTables();
    for (const sql of STATEMENTS) await prisma.$executeRawUnsafe(sql);
  })().catch((err) => {
    ready = null;
    throw err;
  });
  return ready;
}
