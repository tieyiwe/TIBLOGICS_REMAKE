import prisma from "@/lib/prisma";

// Creates the live expert session tables if they are missing, once per
// process, the same way lib/learn/community/db.ts does. This project has no
// migrations: the statements mirror the "Live expert sessions" models at the
// end of prisma/schema.prisma, made idempotent. Keep the two in step.
//
// No Prisma relations (so Student and the other shared models are never
// edited); the foreign keys live here. RSVPs, questions and votes go when
// their session or learner is deleted.

const TABLES = [
  `CREATE TABLE IF NOT EXISTS "ExpertSession" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "expertName" TEXT NOT NULL,
    "expertBio" TEXT,
    "expertPhotoUrl" TEXT,
    "topic" TEXT,
    "trackIds" JSONB NOT NULL DEFAULT '[]',
    "startsAt" TIMESTAMP(3) NOT NULL,
    "durationMinutes" INTEGER NOT NULL DEFAULT 60,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "meetingUrl" TEXT,
    "capacity" INTEGER NOT NULL DEFAULT 100,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "recordingUrl" TEXT,
    "resources" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ExpertSession_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE TABLE IF NOT EXISTS "ExpertSessionRsvp" (
    "sessionId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'going',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "promotedAt" TIMESTAMP(3),
    "reminded24For" TIMESTAMP(3),
    "reminded1For" TIMESTAMP(3),
    "recordingSentFor" TEXT,
    "joinedAt" TIMESTAMP(3),
    CONSTRAINT "ExpertSessionRsvp_pkey" PRIMARY KEY ("sessionId","studentId")
  )`,
  `CREATE TABLE IF NOT EXISTS "ExpertSessionQuestion" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "answeredAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ExpertSessionQuestion_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE TABLE IF NOT EXISTS "ExpertSessionVote" (
    "questionId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ExpertSessionVote_pkey" PRIMARY KEY ("questionId","studentId")
  )`,
];

const INDEXES = [
  `CREATE INDEX IF NOT EXISTS "ExpertSession_startsAt_idx" ON "ExpertSession"("startsAt")`,
  `CREATE INDEX IF NOT EXISTS "ExpertSessionRsvp_studentId_idx" ON "ExpertSessionRsvp"("studentId")`,
  `CREATE INDEX IF NOT EXISTS "ExpertSessionRsvp_sessionId_status_createdAt_idx" ON "ExpertSessionRsvp"("sessionId", "status", "createdAt")`,
  `CREATE INDEX IF NOT EXISTS "ExpertSessionQuestion_sessionId_idx" ON "ExpertSessionQuestion"("sessionId")`,
  `CREATE INDEX IF NOT EXISTS "ExpertSessionQuestion_authorId_idx" ON "ExpertSessionQuestion"("authorId")`,
  `CREATE INDEX IF NOT EXISTS "ExpertSessionVote_studentId_idx" ON "ExpertSessionVote"("studentId")`,
];

const fk = (table: string, column: string, ref: string, name = `${table}_${column}_fkey`) =>
  [name, `ALTER TABLE "${table}" ADD CONSTRAINT "${name}" FOREIGN KEY ("${column}") REFERENCES "${ref}"("id") ON DELETE CASCADE ON UPDATE CASCADE`] as const;

const FOREIGN_KEYS = [
  fk("ExpertSessionRsvp", "sessionId", "ExpertSession"),
  fk("ExpertSessionRsvp", "studentId", "Student"),
  fk("ExpertSessionQuestion", "sessionId", "ExpertSession"),
  fk("ExpertSessionQuestion", "authorId", "Student"),
  fk("ExpertSessionVote", "questionId", "ExpertSessionQuestion"),
  fk("ExpertSessionVote", "studentId", "Student"),
].map(
  ([name, sql]) =>
    `DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '${name}') THEN ${sql}; END IF;
    END $$`,
);

// trackIds is a JSON array of track ids rather than a foreign key: a deleted
// track simply stops matching, and [] means "every track".
const STATEMENTS = [...TABLES, ...INDEXES, ...FOREIGN_KEYS];

let ready: Promise<void> | null = null;

/** Throws if the tables cannot be created; callers decide how to degrade. */
export function ensureLiveTables(): Promise<void> {
  ready ??= (async () => {
    for (const sql of STATEMENTS) await prisma.$executeRawUnsafe(sql);
  })().catch((err) => {
    ready = null;
    throw err;
  });
  return ready;
}

/** Same, but never throws: false when the tables are unavailable. */
export async function liveTablesReady(): Promise<boolean> {
  try {
    await ensureLiveTables();
    return true;
  } catch (err) {
    console.error("[learn/live] tables", err);
    return false;
  }
}
