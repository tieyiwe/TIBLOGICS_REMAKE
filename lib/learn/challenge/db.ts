import prisma from "@/lib/prisma";

// Creates the weekly challenge table if it is missing, once per process
// (this project has no migrations). Mirrors the WeeklyChallengeEntry model
// in prisma/schema.prisma; keep the two in step. Also listed in the STEPS of
// app/api/cron/db-prepare so a development database has it before publishing.
//
// No Prisma relation (Student stays untouched); the foreign key lives here,
// so a learner's entries go when the learner is deleted.

const STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS "WeeklyChallengeEntry" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "week" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "feedback" TEXT NOT NULL,
    "breakdown" JSONB NOT NULL DEFAULT '[]',
    "locale" TEXT NOT NULL DEFAULT 'en',
    "edits" INTEGER NOT NULL DEFAULT 0,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WeeklyChallengeEntry_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "WeeklyChallengeEntry_studentId_week_key" ON "WeeklyChallengeEntry"("studentId", "week")`,
  `CREATE INDEX IF NOT EXISTS "WeeklyChallengeEntry_week_score_submittedAt_idx" ON "WeeklyChallengeEntry"("week", "score", "submittedAt")`,
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'WeeklyChallengeEntry_studentId_fkey') THEN
      ALTER TABLE "WeeklyChallengeEntry" ADD CONSTRAINT "WeeklyChallengeEntry_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
  END $$`,
];

let ready: Promise<void> | null = null;

/** Throws if the table cannot be created; callers decide how to degrade. */
export function ensureChallengeTables(): Promise<void> {
  ready ??= (async () => {
    for (const sql of STATEMENTS) await prisma.$executeRawUnsafe(sql);
  })().catch((err) => {
    ready = null;
    throw err;
  });
  return ready;
}
