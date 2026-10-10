import prisma from "@/lib/prisma";

// Creates the tables behind mastery-based learning paths (placement
// diagnostic, mastery estimates and tested-out lessons) if they are missing,
// once per process, the same way lib/learn/method/db.ts does. This project has
// no migrations: the statements mirror the MasteryEstimate, DiagnosticSession
// and LessonMastery models at the end of prisma/schema.prisma, made
// idempotent. Keep the two in step.
//
// The models carry plain id columns (no Prisma relations) so they do not touch
// the Student, Lesson or LearnModule models; the foreign keys below still
// cascade deletes in the database.

const STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS "MasteryEstimate" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "trackId" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "correct" INTEGER NOT NULL DEFAULT 0,
    "asked" INTEGER NOT NULL DEFAULT 0,
    "source" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MasteryEstimate_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE TABLE IF NOT EXISTS "DiagnosticSession" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "trackId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'in_progress',
    "plan" JSONB NOT NULL,
    "answers" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    CONSTRAINT "DiagnosticSession_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE TABLE IF NOT EXISTS "LessonMastery" (
    "studentId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "trackId" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'test_out',
    "masteredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LessonMastery_pkey" PRIMARY KEY ("studentId","lessonId")
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "MasteryEstimate_studentId_moduleId_key" ON "MasteryEstimate"("studentId", "moduleId")`,
  `CREATE INDEX IF NOT EXISTS "MasteryEstimate_studentId_trackId_idx" ON "MasteryEstimate"("studentId", "trackId")`,
  `CREATE INDEX IF NOT EXISTS "DiagnosticSession_studentId_trackId_createdAt_idx" ON "DiagnosticSession"("studentId", "trackId", "createdAt")`,
  `CREATE INDEX IF NOT EXISTS "LessonMastery_studentId_moduleId_idx" ON "LessonMastery"("studentId", "moduleId")`,
  `CREATE INDEX IF NOT EXISTS "LessonMastery_trackId_idx" ON "LessonMastery"("trackId")`,
  ...[
    ["MasteryEstimate_studentId_fkey", `ALTER TABLE "MasteryEstimate" ADD CONSTRAINT "MasteryEstimate_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE`],
    ["MasteryEstimate_moduleId_fkey", `ALTER TABLE "MasteryEstimate" ADD CONSTRAINT "MasteryEstimate_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "LearnModule"("id") ON DELETE CASCADE ON UPDATE CASCADE`],
    ["DiagnosticSession_studentId_fkey", `ALTER TABLE "DiagnosticSession" ADD CONSTRAINT "DiagnosticSession_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE`],
    ["LessonMastery_studentId_fkey", `ALTER TABLE "LessonMastery" ADD CONSTRAINT "LessonMastery_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE`],
    ["LessonMastery_lessonId_fkey", `ALTER TABLE "LessonMastery" ADD CONSTRAINT "LessonMastery_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE`],
  ].map(
    ([name, sql]) =>
      `DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '${name}') THEN ${sql}; END IF;
      END $$`,
  ),
];

let ready: Promise<void> | null = null;

/** Throws if the tables cannot be created; callers decide how to degrade. */
export function ensureMasteryTables(): Promise<void> {
  ready ??= (async () => {
    for (const sql of STATEMENTS) await prisma.$executeRawUnsafe(sql);
  })().catch((err) => {
    ready = null;
    throw err;
  });
  return ready;
}

/** Same, but never throws: false when the tables are unavailable. */
export async function masteryTablesReady(): Promise<boolean> {
  try {
    await ensureMasteryTables();
    return true;
  } catch (err) {
    console.error("[learn/mastery] tables", err);
    return false;
  }
}
