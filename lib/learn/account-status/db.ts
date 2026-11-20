import prisma from "@/lib/prisma";

// Account controls for ARFA learners (suspend, block, forced password change,
// "sign out everywhere", admin notes and tags). Kept in their own tables, not
// as Student columns: Student rows are read whole all over the app (sign-in,
// sign-up, Google), and a column the database does not have yet would break
// every one of those reads. A missing LearnerAccount row means "active".
//
// Created at runtime, once per process, like lib/learn/logins.ts (this
// project has no migrations). The statements mirror the LearnerAccount,
// LearnerBlockedEmail and LearnerNote models at the end of
// prisma/schema.prisma; keep them in step. No Prisma relations (Student is
// not edited); the foreign keys below cascade.

const STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS "LearnerAccount" (
    "studentId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "suspendedUntil" TIMESTAMP(3),
    "statusReason" TEXT,
    "statusChangedAt" TIMESTAMP(3),
    "statusChangedBy" TEXT,
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
    "sessionVersion" INTEGER NOT NULL DEFAULT 0,
    "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "marketingOptOut" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LearnerAccount_pkey" PRIMARY KEY ("studentId")
  )`,
  `CREATE INDEX IF NOT EXISTS "LearnerAccount_status_idx" ON "LearnerAccount"("status")`,
  `CREATE INDEX IF NOT EXISTS "LearnerAccount_tags_idx" ON "LearnerAccount" USING GIN ("tags")`,
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'LearnerAccount_studentId_fkey') THEN
      ALTER TABLE "LearnerAccount" ADD CONSTRAINT "LearnerAccount_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
  END $$`,
  // Blocked addresses, as a SHA-256 of the lower-cased email, so a blocked
  // learner cannot sign up again with the same address (even after the
  // account is deleted) and the list itself holds no readable address.
  `CREATE TABLE IF NOT EXISTS "LearnerBlockedEmail" (
    "emailHash" TEXT NOT NULL,
    "studentId" TEXT,
    "reason" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LearnerBlockedEmail_pkey" PRIMARY KEY ("emailHash")
  )`,
  `CREATE INDEX IF NOT EXISTS "LearnerBlockedEmail_studentId_idx" ON "LearnerBlockedEmail"("studentId")`,
  `CREATE TABLE IF NOT EXISTS "LearnerNote" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "authorEmail" TEXT NOT NULL,
    "authorName" TEXT,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LearnerNote_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE INDEX IF NOT EXISTS "LearnerNote_studentId_createdAt_idx" ON "LearnerNote"("studentId", "createdAt")`,
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'LearnerNote_studentId_fkey') THEN
      ALTER TABLE "LearnerNote" ADD CONSTRAINT "LearnerNote_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
  END $$`,
];

let ready: Promise<void> | null = null;

/** Throws if the tables cannot be created; callers decide how to degrade. */
export function ensureAccountTables(): Promise<void> {
  ready ??= (async () => {
    for (const sql of STATEMENTS) await prisma.$executeRawUnsafe(sql);
  })().catch((err) => {
    ready = null;
    throw err;
  });
  return ready;
}
