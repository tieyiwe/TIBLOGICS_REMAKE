import prisma from "@/lib/prisma";

// Communications center (admin to learners) and the learner Inbox.
//
//   CommsTemplate   saved messages with merge fields
//   CommsCampaign   one send: audience, channels (email and/or in-app),
//                   marketing or service, schedule, counters
//   CommsRecipient  one learner of one campaign; claimed before sending, so
//                   overlapping cron runs never send twice
//   InboxThread     a conversation in the learner's Inbox (one per in-app
//                   message); a learner reply puts it in the admin Inbox
//   InboxMessage    one message in a thread, from "admin" or "learner"
//
// Created at runtime once per process (no migrations in this project); the
// statements mirror the models at the end of prisma/schema.prisma.

const STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS "CommsTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'service',
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "subjectFr" TEXT,
    "bodyFr" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CommsTemplate_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE TABLE IF NOT EXISTS "CommsCampaign" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'service',
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "subjectFr" TEXT,
    "bodyFr" TEXT,
    "viaEmail" BOOLEAN NOT NULL DEFAULT true,
    "viaInbox" BOOLEAN NOT NULL DEFAULT true,
    "audience" JSONB NOT NULL,
    "audienceLabel" TEXT,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "scheduledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "recipientCount" INTEGER NOT NULL DEFAULT 0,
    "sentCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "skippedCount" INTEGER NOT NULL DEFAULT 0,
    "templateId" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CommsCampaign_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE INDEX IF NOT EXISTS "CommsCampaign_status_scheduledAt_idx" ON "CommsCampaign"("status", "scheduledAt")`,
  `CREATE INDEX IF NOT EXISTS "CommsCampaign_createdAt_idx" ON "CommsCampaign"("createdAt")`,
  `CREATE TABLE IF NOT EXISTS "CommsRecipient" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'en',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "error" TEXT,
    "claimedAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "emailed" BOOLEAN NOT NULL DEFAULT false,
    "threadId" TEXT,
    CONSTRAINT "CommsRecipient_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "CommsRecipient_campaignId_studentId_key" ON "CommsRecipient"("campaignId", "studentId")`,
  `CREATE INDEX IF NOT EXISTS "CommsRecipient_campaignId_status_idx" ON "CommsRecipient"("campaignId", "status")`,
  `CREATE INDEX IF NOT EXISTS "CommsRecipient_studentId_idx" ON "CommsRecipient"("studentId")`,
  `CREATE INDEX IF NOT EXISTS "CommsRecipient_sentAt_idx" ON "CommsRecipient"("sentAt")`,
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CommsRecipient_campaignId_fkey') THEN
      ALTER TABLE "CommsRecipient" ADD CONSTRAINT "CommsRecipient_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "CommsCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
  END $$`,
  `CREATE TABLE IF NOT EXISTS "InboxThread" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "campaignId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "learnerUnread" INTEGER NOT NULL DEFAULT 0,
    "adminUnread" INTEGER NOT NULL DEFAULT 0,
    "hasLearnerReply" BOOLEAN NOT NULL DEFAULT false,
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSender" TEXT NOT NULL DEFAULT 'admin',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InboxThread_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE INDEX IF NOT EXISTS "InboxThread_studentId_lastMessageAt_idx" ON "InboxThread"("studentId", "lastMessageAt")`,
  `CREATE INDEX IF NOT EXISTS "InboxThread_hasLearnerReply_status_lastMessageAt_idx" ON "InboxThread"("hasLearnerReply", "status", "lastMessageAt")`,
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'InboxThread_studentId_fkey') THEN
      ALTER TABLE "InboxThread" ADD CONSTRAINT "InboxThread_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
  END $$`,
  `CREATE TABLE IF NOT EXISTS "InboxMessage" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "sender" TEXT NOT NULL,
    "authorName" TEXT,
    "authorEmail" TEXT,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InboxMessage_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE INDEX IF NOT EXISTS "InboxMessage_threadId_createdAt_idx" ON "InboxMessage"("threadId", "createdAt")`,
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'InboxMessage_threadId_fkey') THEN
      ALTER TABLE "InboxMessage" ADD CONSTRAINT "InboxMessage_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "InboxThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
  END $$`,
];

let ready: Promise<void> | null = null;

export function ensureCommsTables(): Promise<void> {
  ready ??= (async () => {
    for (const sql of STATEMENTS) await prisma.$executeRawUnsafe(sql);
  })().catch((err) => {
    ready = null;
    throw err;
  });
  return ready;
}
