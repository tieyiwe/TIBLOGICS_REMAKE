import prisma from "@/lib/prisma";

// Creates the SkillBadgeAward table if it is missing, once per process, the
// same way lib/learn/community/db.ts does. This project has no migrations:
// the statements mirror the model at the end of prisma/schema.prisma, made
// idempotent. Keep the two in step. Rows go when their learner is deleted.

const STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS "SkillBadgeAward" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "badgeKey" TEXT NOT NULL,
    "family" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "trackSlugs" JSONB NOT NULL DEFAULT '[]',
    "evidence" JSONB NOT NULL DEFAULT '[]',
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "salt" TEXT NOT NULL,
    "credential" JSONB NOT NULL,
    "keyFp" TEXT NOT NULL DEFAULT '',
    "signed" BOOLEAN NOT NULL DEFAULT false,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "notifiedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "revokedReason" TEXT,
    CONSTRAINT "SkillBadgeAward_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "SkillBadgeAward_studentId_badgeKey_key" ON "SkillBadgeAward"("studentId", "badgeKey")`,
  `CREATE INDEX IF NOT EXISTS "SkillBadgeAward_studentId_idx" ON "SkillBadgeAward"("studentId")`,
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'SkillBadgeAward_studentId_fkey') THEN
      ALTER TABLE "SkillBadgeAward" ADD CONSTRAINT "SkillBadgeAward_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
  END $$`,
];

let ready: Promise<void> | null = null;

/** Throws if the table cannot be created; callers decide how to degrade. */
export function ensureSkillBadgeTables(): Promise<void> {
  ready ??= (async () => {
    for (const sql of STATEMENTS) await prisma.$executeRawUnsafe(sql);
  })().catch((err) => {
    ready = null;
    throw err;
  });
  return ready;
}
