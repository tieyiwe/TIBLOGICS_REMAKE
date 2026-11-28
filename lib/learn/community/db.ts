import prisma from "@/lib/prisma";

// Creates the community tables (cohorts, discussion, moderation, peer review)
// if they are missing, once per process, the same way lib/learn/method/db.ts
// does. This project has no migrations: the statements mirror the models at
// the end of prisma/schema.prisma, made idempotent. Keep the two in step.
//
// The models have no Prisma relations (so they never edit Student or the
// other shared models); the foreign keys live here. Rows go when their
// learner, track, cohort, thread or capstone submission is deleted.

const TABLES = [
  `CREATE TABLE IF NOT EXISTS "Cohort" (
    "id" TEXT NOT NULL,
    "trackId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "sessionWeekday" INTEGER NOT NULL,
    "sessionTime" TEXT NOT NULL,
    "timezone" TEXT NOT NULL,
    "sessionMinutes" INTEGER NOT NULL DEFAULT 60,
    "meetingUrl" TEXT,
    "capacity" INTEGER NOT NULL DEFAULT 30,
    "enrolmentOpen" BOOLEAN NOT NULL DEFAULT true,
    "priceNote" TEXT,
    "recordings" JSONB NOT NULL DEFAULT '[]',
    "remindedFor" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Cohort_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE TABLE IF NOT EXISTS "CohortMember" (
    "cohortId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastNudgeAt" TIMESTAMP(3),
    CONSTRAINT "CohortMember_pkey" PRIMARY KEY ("cohortId","studentId")
  )`,
  `CREATE TABLE IF NOT EXISTS "CohortAnnouncement" (
    "id" TEXT NOT NULL,
    "cohortId" TEXT NOT NULL,
    "bodyMd" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CohortAnnouncement_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE TABLE IF NOT EXISTS "CommunityThread" (
    "id" TEXT NOT NULL,
    "trackId" TEXT NOT NULL,
    "lessonId" TEXT,
    "cohortId" TEXT,
    "authorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "bodyMd" TEXT NOT NULL,
    "answerPostId" TEXT,
    "answeredAt" TIMESTAMP(3),
    "score" INTEGER NOT NULL DEFAULT 0,
    "replyCount" INTEGER NOT NULL DEFAULT 0,
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "editedAt" TIMESTAMP(3),
    "lastPostAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CommunityThread_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE TABLE IF NOT EXISTS "CommunityPost" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "bodyMd" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "editedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CommunityPost_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE TABLE IF NOT EXISTS "CommunityVote" (
    "studentId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CommunityVote_pkey" PRIMARY KEY ("studentId","targetId")
  )`,
  `CREATE TABLE IF NOT EXISTS "CommunityReport" (
    "id" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    CONSTRAINT "CommunityReport_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE TABLE IF NOT EXISTS "CommunityProfile" (
    "studentId" TEXT NOT NULL,
    "replyDigest" BOOLEAN NOT NULL DEFAULT true,
    "lastDigestAt" TIMESTAMP(3),
    "suspendedUntil" TIMESTAMP(3),
    "suspendReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CommunityProfile_pkey" PRIMARY KEY ("studentId")
  )`,
  `CREATE TABLE IF NOT EXISTS "PeerReviewOptIn" (
    "submissionId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "trackId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PeerReviewOptIn_pkey" PRIMARY KEY ("submissionId")
  )`,
  `CREATE TABLE IF NOT EXISTS "PeerReview" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "trackId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'assigned',
    "feedback" JSONB NOT NULL DEFAULT '[]',
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "helpful" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedAt" TIMESTAMP(3),
    CONSTRAINT "PeerReview_pkey" PRIMARY KEY ("id")
  )`,
];

const INDEXES = [
  `CREATE INDEX IF NOT EXISTS "Cohort_trackId_idx" ON "Cohort"("trackId")`,
  `CREATE INDEX IF NOT EXISTS "CohortMember_studentId_idx" ON "CohortMember"("studentId")`,
  `CREATE INDEX IF NOT EXISTS "CohortAnnouncement_cohortId_createdAt_idx" ON "CohortAnnouncement"("cohortId", "createdAt")`,
  `CREATE INDEX IF NOT EXISTS "CommunityThread_trackId_lastPostAt_idx" ON "CommunityThread"("trackId", "lastPostAt")`,
  `CREATE INDEX IF NOT EXISTS "CommunityThread_lessonId_idx" ON "CommunityThread"("lessonId")`,
  `CREATE INDEX IF NOT EXISTS "CommunityThread_cohortId_idx" ON "CommunityThread"("cohortId")`,
  `CREATE INDEX IF NOT EXISTS "CommunityThread_authorId_idx" ON "CommunityThread"("authorId")`,
  `CREATE INDEX IF NOT EXISTS "CommunityPost_threadId_createdAt_idx" ON "CommunityPost"("threadId", "createdAt")`,
  `CREATE INDEX IF NOT EXISTS "CommunityPost_authorId_idx" ON "CommunityPost"("authorId")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "CommunityReport_reporterId_targetId_key" ON "CommunityReport"("reporterId", "targetId")`,
  `CREATE INDEX IF NOT EXISTS "CommunityReport_status_createdAt_idx" ON "CommunityReport"("status", "createdAt")`,
  `CREATE INDEX IF NOT EXISTS "PeerReviewOptIn_trackId_idx" ON "PeerReviewOptIn"("trackId")`,
  `CREATE INDEX IF NOT EXISTS "PeerReviewOptIn_studentId_idx" ON "PeerReviewOptIn"("studentId")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "PeerReview_submissionId_reviewerId_key" ON "PeerReview"("submissionId", "reviewerId")`,
  `CREATE INDEX IF NOT EXISTS "PeerReview_reviewerId_idx" ON "PeerReview"("reviewerId")`,
  `CREATE INDEX IF NOT EXISTS "PeerReview_trackId_idx" ON "PeerReview"("trackId")`,
];

const fk = (table: string, column: string, ref: string, name = `${table}_${column}_fkey`) =>
  [name, `ALTER TABLE "${table}" ADD CONSTRAINT "${name}" FOREIGN KEY ("${column}") REFERENCES "${ref}"("id") ON DELETE CASCADE ON UPDATE CASCADE`] as const;

const FOREIGN_KEYS = [
  fk("Cohort", "trackId", "LearnTrack"),
  fk("CohortMember", "cohortId", "Cohort"),
  fk("CohortMember", "studentId", "Student"),
  fk("CohortAnnouncement", "cohortId", "Cohort"),
  fk("CommunityThread", "trackId", "LearnTrack"),
  fk("CommunityThread", "authorId", "Student"),
  fk("CommunityThread", "cohortId", "Cohort"),
  fk("CommunityPost", "threadId", "CommunityThread"),
  fk("CommunityPost", "authorId", "Student"),
  fk("CommunityVote", "studentId", "Student"),
  fk("CommunityReport", "reporterId", "Student"),
  fk("CommunityProfile", "studentId", "Student"),
  fk("PeerReviewOptIn", "submissionId", "CapstoneSubmission"),
  fk("PeerReviewOptIn", "studentId", "Student"),
  fk("PeerReview", "submissionId", "CapstoneSubmission"),
  fk("PeerReview", "reviewerId", "Student"),
].map(
  ([name, sql]) =>
    `DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '${name}') THEN ${sql}; END IF;
    END $$`,
);

// A lesson that is deleted leaves its threads in place (they become track
// threads); lessonId is not a foreign key for that reason.
const STATEMENTS = [...TABLES, ...INDEXES, ...FOREIGN_KEYS];

let ready: Promise<void> | null = null;

/** Throws if the tables cannot be created; callers decide how to degrade. */
export function ensureCommunityTables(): Promise<void> {
  ready ??= (async () => {
    for (const sql of STATEMENTS) await prisma.$executeRawUnsafe(sql);
  })().catch((err) => {
    ready = null;
    throw err;
  });
  return ready;
}

/** Same, but never throws: false when the tables are unavailable. */
export async function communityTablesReady(): Promise<boolean> {
  try {
    await ensureCommunityTables();
    return true;
  } catch (err) {
    console.error("[learn/community] tables", err);
    return false;
  }
}
