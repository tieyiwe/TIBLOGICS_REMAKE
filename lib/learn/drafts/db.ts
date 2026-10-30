import prisma from "@/lib/prisma";

// Creates the LearnerDraft table if it is missing, once per process, the same
// way lib/learn/method/db.ts does for the method tables. This project has no
// migrations: the statements mirror the LearnerDraft model in
// prisma/schema.prisma, made idempotent. Keep the two in step.

const STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS "LearnerDraft" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "size" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "LearnerDraft_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "LearnerDraft_studentId_key_key" ON "LearnerDraft"("studentId", "key")`,
  `CREATE INDEX IF NOT EXISTS "LearnerDraft_studentId_updatedAt_idx" ON "LearnerDraft"("studentId", "updatedAt")`,
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'LearnerDraft_studentId_fkey') THEN
      ALTER TABLE "LearnerDraft" ADD CONSTRAINT "LearnerDraft_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
  END $$`,
];

let ready: Promise<void> | null = null;

/** Throws if the table cannot be created; callers decide how to degrade. */
export function ensureDraftTable(): Promise<void> {
  ready ??= (async () => {
    for (const sql of STATEMENTS) await prisma.$executeRawUnsafe(sql);
  })().catch((err) => {
    ready = null;
    throw err;
  });
  return ready;
}

/** Same, but never throws: false when the table is unavailable. */
export async function draftTableReady(): Promise<boolean> {
  try {
    await ensureDraftTable();
    return true;
  } catch (err) {
    console.error("[learn/drafts] table", err);
    return false;
  }
}
