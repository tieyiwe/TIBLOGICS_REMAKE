import prisma from "@/lib/prisma";

// Creates the tables behind the TIBLOGICS Learn method (Daily Review, the
// Learning Loop's reflections and the Proof-of-Skill Portfolio) if they are
// missing, once per process. This project has no migrations: the statements
// are `prisma migrate diff` output for the three models in
// prisma/schema.prisma, made idempotent. Keep the two in step.

const STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS "ReviewCard" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "trackId" TEXT NOT NULL,
    "box" INTEGER NOT NULL DEFAULT 1,
    "dueAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3),
    "streak" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ReviewCard_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE TABLE IF NOT EXISTS "LessonReflection" (
    "studentId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "LessonReflection_pkey" PRIMARY KEY ("studentId","lessonId")
  )`,
  `CREATE TABLE IF NOT EXISTS "PortfolioSettings" (
    "studentId" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "slug" TEXT NOT NULL,
    "includeWork" BOOLEAN NOT NULL DEFAULT false,
    "hidden" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PortfolioSettings_pkey" PRIMARY KEY ("studentId")
  )`,
  `CREATE INDEX IF NOT EXISTS "ReviewCard_studentId_dueAt_idx" ON "ReviewCard"("studentId", "dueAt")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "ReviewCard_studentId_questionId_key" ON "ReviewCard"("studentId", "questionId")`,
  `CREATE INDEX IF NOT EXISTS "LessonReflection_studentId_idx" ON "LessonReflection"("studentId")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "PortfolioSettings_slug_key" ON "PortfolioSettings"("slug")`,
  ...[
    ["ReviewCard_studentId_fkey", `ALTER TABLE "ReviewCard" ADD CONSTRAINT "ReviewCard_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE`],
    ["LessonReflection_studentId_fkey", `ALTER TABLE "LessonReflection" ADD CONSTRAINT "LessonReflection_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE`],
    ["LessonReflection_lessonId_fkey", `ALTER TABLE "LessonReflection" ADD CONSTRAINT "LessonReflection_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE`],
    ["PortfolioSettings_studentId_fkey", `ALTER TABLE "PortfolioSettings" ADD CONSTRAINT "PortfolioSettings_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE`],
  ].map(
    ([name, sql]) =>
      `DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '${name}') THEN ${sql}; END IF;
      END $$`,
  ),
];

let ready: Promise<void> | null = null;

/** Throws if the tables cannot be created; callers decide how to degrade. */
export function ensureMethodTables(): Promise<void> {
  ready ??= (async () => {
    for (const sql of STATEMENTS) await prisma.$executeRawUnsafe(sql);
  })().catch((err) => {
    ready = null;
    throw err;
  });
  return ready;
}

/** Same, but never throws: returns false when the tables are unavailable. */
export async function methodTablesReady(): Promise<boolean> {
  try {
    await ensureMethodTables();
    return true;
  } catch (err) {
    console.error("[learn/method] tables", err);
    return false;
  }
}
