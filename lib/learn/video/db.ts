import prisma from "@/lib/prisma";

// Creates the lesson video tables if they are missing, once per process. This
// project has no migrations: the statements mirror the LessonVideoMeta,
// VideoProgress, VideoScript, LessonVideoPlan, LessonVideoJob,
// LessonVideoAsset and LessonVideoChunk models in prisma/schema.prisma. Keep
// the two in step (app/api/cron/db-prepare runs this too).
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
  // Narrated videos made by the pipeline (lib/learn/video/pipeline.ts): one
  // variant per language { en?, fr? } with its own link, chapters and captions.
  `ALTER TABLE "LessonVideoMeta" ADD COLUMN IF NOT EXISTS "variants" JSONB NOT NULL DEFAULT '{}'`,
  // Whether a lesson gets a generated video, and the scene script once drafted.
  `CREATE TABLE IF NOT EXISTS "LessonVideoPlan" (
    "lessonId" TEXT NOT NULL,
    "contentHash" TEXT NOT NULL,
    "decision" BOOLEAN NOT NULL DEFAULT false,
    "reason" TEXT NOT NULL DEFAULT '',
    "source" TEXT NOT NULL DEFAULT 'rule',
    "override" TEXT,
    "estChars" INTEGER NOT NULL DEFAULT 0,
    "script" JSONB,
    "scriptHash" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LessonVideoPlan_pkey" PRIMARY KEY ("lessonId")
  )`,
  // One generation job per lesson and language.
  `CREATE TABLE IF NOT EXISTS "LessonVideoJob" (
    "id" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "contentHash" TEXT NOT NULL DEFAULT '',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "chars" INTEGER NOT NULL DEFAULT 0,
    "durationSec" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "provider" TEXT,
    "assetId" TEXT,
    "queuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "leaseUntil" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LessonVideoJob_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "LessonVideoJob_lessonId_locale_key" ON "LessonVideoJob"("lessonId", "locale")`,
  `CREATE INDEX IF NOT EXISTS "LessonVideoJob_status_idx" ON "LessonVideoJob"("status")`,
  // A stored video file. Bytes live in Replit Object Storage (storage =
  // 'object', objectKey) or in LessonVideoChunk rows (storage = 'db').
  `CREATE TABLE IF NOT EXISTS "LessonVideoAsset" (
    "id" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "etag" TEXT NOT NULL,
    "storage" TEXT NOT NULL,
    "objectKey" TEXT,
    "chunkSize" INTEGER NOT NULL DEFAULT 0,
    "durationSec" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LessonVideoAsset_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE INDEX IF NOT EXISTS "LessonVideoAsset_lessonId_idx" ON "LessonVideoAsset"("lessonId")`,
  `CREATE TABLE IF NOT EXISTS "LessonVideoChunk" (
    "assetId" TEXT NOT NULL,
    "idx" INTEGER NOT NULL,
    "data" BYTEA NOT NULL,
    CONSTRAINT "LessonVideoChunk_pkey" PRIMARY KEY ("assetId","idx")
  )`,
  `CREATE INDEX IF NOT EXISTS "VideoProgress_lessonId_idx" ON "VideoProgress"("lessonId")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "VideoScript_lessonId_version_key" ON "VideoScript"("lessonId", "version")`,
  ...[
    ["LessonVideoMeta_lessonId_fkey", `ALTER TABLE "LessonVideoMeta" ADD CONSTRAINT "LessonVideoMeta_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE`],
    ["VideoProgress_lessonId_fkey", `ALTER TABLE "VideoProgress" ADD CONSTRAINT "VideoProgress_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE`],
    ["VideoProgress_studentId_fkey", `ALTER TABLE "VideoProgress" ADD CONSTRAINT "VideoProgress_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE`],
    ["VideoScript_lessonId_fkey", `ALTER TABLE "VideoScript" ADD CONSTRAINT "VideoScript_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE`],
    ["LessonVideoPlan_lessonId_fkey", `ALTER TABLE "LessonVideoPlan" ADD CONSTRAINT "LessonVideoPlan_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE`],
    ["LessonVideoJob_lessonId_fkey", `ALTER TABLE "LessonVideoJob" ADD CONSTRAINT "LessonVideoJob_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE`],
    ["LessonVideoAsset_lessonId_fkey", `ALTER TABLE "LessonVideoAsset" ADD CONSTRAINT "LessonVideoAsset_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE`],
    ["LessonVideoChunk_assetId_fkey", `ALTER TABLE "LessonVideoChunk" ADD CONSTRAINT "LessonVideoChunk_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "LessonVideoAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE`],
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
