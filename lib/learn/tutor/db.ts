import prisma from "@/lib/prisma";

// Creates the tables behind Tutor (the AI tutor side panel) if they are
// missing, once per process. This project has no migrations: the statements
// match the TutorThread, TutorMessage and TutorProfile models at the end of
// prisma/schema.prisma, made idempotent. Keep the two in step.
//
// The models carry no Prisma relation fields (so the shared Student model is
// left alone); the foreign keys below still delete a learner's Tutor history
// with their account.

const STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS "TutorThread" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "contextKey" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "lessonId" TEXT,
    "trackId" TEXT,
    "summary" TEXT NOT NULL DEFAULT '',
    "summarizedCount" INTEGER NOT NULL DEFAULT 0,
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TutorThread_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE TABLE IF NOT EXISTS "TutorMessage" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "action" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TutorMessage_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE TABLE IF NOT EXISTS "TutorProfile" (
    "studentId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT '',
    "goal" TEXT NOT NULL DEFAULT '',
    "level" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TutorProfile_pkey" PRIMARY KEY ("studentId")
  )`,
  `CREATE INDEX IF NOT EXISTS "TutorThread_studentId_contextKey_closedAt_idx" ON "TutorThread"("studentId", "contextKey", "closedAt")`,
  `CREATE INDEX IF NOT EXISTS "TutorThread_lessonId_idx" ON "TutorThread"("lessonId")`,
  `CREATE INDEX IF NOT EXISTS "TutorMessage_threadId_createdAt_idx" ON "TutorMessage"("threadId", "createdAt")`,
  `CREATE INDEX IF NOT EXISTS "TutorMessage_createdAt_idx" ON "TutorMessage"("createdAt")`,
  ...[
    ["TutorThread_studentId_fkey", `ALTER TABLE "TutorThread" ADD CONSTRAINT "TutorThread_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE`],
    ["TutorMessage_threadId_fkey", `ALTER TABLE "TutorMessage" ADD CONSTRAINT "TutorMessage_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "TutorThread"("id") ON DELETE CASCADE ON UPDATE CASCADE`],
    ["TutorProfile_studentId_fkey", `ALTER TABLE "TutorProfile" ADD CONSTRAINT "TutorProfile_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE`],
  ].map(
    ([name, sql]) =>
      `DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '${name}') THEN ${sql}; END IF;
      END $$`,
  ),
];

let ready: Promise<void> | null = null;

/** Throws if the tables cannot be created; callers decide how to degrade. */
export function ensureTutorTables(): Promise<void> {
  ready ??= (async () => {
    for (const sql of STATEMENTS) await prisma.$executeRawUnsafe(sql);
  })().catch((err) => {
    ready = null;
    throw err;
  });
  return ready;
}

/** Same, but never throws: false when the tables are unavailable. */
export async function tutorTablesReady(): Promise<boolean> {
  try {
    await ensureTutorTables();
    return true;
  } catch (err) {
    console.error("[learn/tutor] tables", err);
    return false;
  }
}
