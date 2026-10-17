import prisma from "@/lib/prisma";

// Creates the study reminder tables if they are missing, once per process, the
// same way lib/learn/community/db.ts does. This project has no migrations: the
// statements mirror StudyReminderPref and StudyReminderLog at the end of
// prisma/schema.prisma, made idempotent. Keep the two in step.

const STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS "StudyReminderPref" (
    "studentId" TEXT NOT NULL,
    "whatsappOn" BOOLEAN NOT NULL DEFAULT false,
    "phoneE164" TEXT,
    "emailOn" BOOLEAN NOT NULL DEFAULT false,
    "timeLocal" TEXT NOT NULL DEFAULT '18:00',
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "days" TEXT NOT NULL DEFAULT '1,2,3,4,5',
    "language" TEXT NOT NULL DEFAULT 'en',
    "consentAt" TIMESTAMP(3),
    "consentText" TEXT,
    "optedOutAt" TIMESTAMP(3),
    "optOutSource" TEXT,
    "pausedUntil" TIMESTAMP(3),
    "ignoredCount" INTEGER NOT NULL DEFAULT 0,
    "lastSentAt" TIMESTAMP(3),
    "lastStatus" TEXT,
    "lastStatusAt" TIMESTAMP(3),
    "lastInboundAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StudyReminderPref_pkey" PRIMARY KEY ("studentId")
  )`,
  `CREATE TABLE IF NOT EXISTS "StudyReminderLog" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'claimed',
    "providerId" TEXT,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StudyReminderLog_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE INDEX IF NOT EXISTS "StudyReminderPref_phoneE164_idx" ON "StudyReminderPref"("phoneE164")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "StudyReminderLog_studentId_day_key" ON "StudyReminderLog"("studentId", "day")`,
  `CREATE INDEX IF NOT EXISTS "StudyReminderLog_providerId_idx" ON "StudyReminderLog"("providerId")`,
  ...[
    ["StudyReminderPref_studentId_fkey", "StudyReminderPref"],
    ["StudyReminderLog_studentId_fkey", "StudyReminderLog"],
  ].map(
    ([name, table]) =>
      `DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '${name}') THEN
          ALTER TABLE "${table}" ADD CONSTRAINT "${name}" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
      END $$`,
  ),
];

let ready: Promise<void> | null = null;

/** Throws if the tables cannot be created; callers decide how to degrade. */
export function ensureReminderTables(): Promise<void> {
  ready ??= (async () => {
    for (const sql of STATEMENTS) await prisma.$executeRawUnsafe(sql);
  })().catch((err) => {
    ready = null;
    throw err;
  });
  return ready;
}

/** Same, but never throws: false when the tables are unavailable. */
export async function reminderTablesReady(): Promise<boolean> {
  try {
    await ensureReminderTables();
    return true;
  } catch (err) {
    console.error("[learn/reminders] tables", err);
    return false;
  }
}
