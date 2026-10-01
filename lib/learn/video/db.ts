import prisma from "@/lib/prisma";

// Creates the lesson video tables if they are missing, once per process. This
// project has no migrations: the statements mirror the LessonVideoMeta,
// VideoProgress and VideoScript models in prisma/schema.prisma. Keep the two
// in step.
//
// The video link itself stays on Lesson.videoUrl (the seed leaves it alone
// once a lesson is edited in the admin); chapters and captions live in their
// own table, which the seed never touches.

const STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS "LessonVideoMeta" (
    "lessonId" TEXT NOT NULL,
    "chapters" JSONB NOT NULL DEFAULT '[]',
    "captions" JSONB NOT NULL DEFAULT '{}',
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LessonVideoMeta_pkey" PRIMARY KEY ("lessonId")
  )`,
  `CREATE TABLE IF NOT EXISTS "VideoProgress" (
    "studentId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "positionSec" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "durationSec" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "coverage" TEXT NOT NULL DEFAULT '',
    "watchedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VideoProgress_pkey" PRIMARY KEY ("studentId","lessonId")
  )`,
  `CREATE TABLE IF NOT EXISTS "VideoScript" (
    "id" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "content" JSONB NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'ai',
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VideoScript_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE INDEX IF NOT EXISTS "VideoProgress_lessonId_idx" ON "VideoProgress"("lessonId")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "VideoScript_lessonId_version_key" ON "VideoScript"("lessonId", "version")`,
  ...[
    ["LessonVideoMeta_lessonId_fkey", `ALTER TABLE "LessonVideoMeta" ADD CONSTRAINT "LessonVideoMeta_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE`],
    ["VideoProgress_lessonId_fkey", `ALTER TABLE "VideoProgress" ADD CONSTRAINT "VideoProgress_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE`],
    ["VideoProgress_studentId_fkey", `ALTER TABLE "VideoProgress" ADD CONSTRAINT "VideoProgress_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE`],
    ["VideoScript_lessonId_fkey", `ALTER TABLE "VideoScript" ADD CONSTRAINT "VideoScript_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE`],
  ].map(
    ([name, sql]) =>
      `DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '${name}') THEN ${sql}; END IF;
      END $$`,
  ),
];

let ready: Promise<void> | null = null;

/** Throws if the tables cannot be created; callers decide how to degrade. */
export function ensureVideoTables(): Promise<void> {
  ready ??= (async () => {
    for (const sql of STATEMENTS) await prisma.$executeRawUnsafe(sql);
  })().catch((err) => {
    ready = null;
    throw err;
  });
  return ready;
}

/** Same, but never throws: false when the tables are unavailable. */
export async function videoTablesReady(): Promise<boolean> {
  try {
    await ensureVideoTables();
    return true;
  } catch (err) {
    console.error("[learn/video] tables", err);
    return false;
  }
}
