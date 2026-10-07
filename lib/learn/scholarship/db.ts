import prisma from "@/lib/prisma";

// The Tilo Vision Scholarship tables. This project has no migrations: they
// are created here, once per process, before anything reads or writes them.
// The statements match the Scholarship and ScholarshipTrack models in
// prisma/schema.prisma, made idempotent. Keep the two in step.

const STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS "Scholarship" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'en',
    "trackCount" INTEGER NOT NULL,
    "coveragePct" INTEGER NOT NULL,
    "trackIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "message" TEXT,
    "note" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "tokenHash" TEXT,
    "offerDays" INTEGER NOT NULL DEFAULT 30,
    "offerExpiresAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "emailedAt" TIMESTAMP(3),
    "studentId" TEXT,
    "claimedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "revokedBy" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Scholarship_pkey" PRIMARY KEY ("id")
  )`,
  `ALTER TABLE "Scholarship" ADD COLUMN IF NOT EXISTS "stripeCouponId" TEXT`,
  `ALTER TABLE "Scholarship" ADD COLUMN IF NOT EXISTS "sponsorName" TEXT`,
  `ALTER TABLE "Scholarship" ADD COLUMN IF NOT EXISTS "sponsorEmail" TEXT`,
  `ALTER TABLE "Scholarship" ADD COLUMN IF NOT EXISTS "pickDays" INTEGER`,
  `ALTER TABLE "Scholarship" ADD COLUMN IF NOT EXISTS "completeDays" INTEGER`,
  `ALTER TABLE "Scholarship" ADD COLUMN IF NOT EXISTS "welcomedAt" TIMESTAMP(3)`,
  `ALTER TABLE "Scholarship" ADD COLUMN IF NOT EXISTS "applicationId" TEXT`,
  `ALTER TABLE "Scholarship" ADD COLUMN IF NOT EXISTS "partnerName" TEXT`,
  `ALTER TABLE "Scholarship" ADD COLUMN IF NOT EXISTS "partnerRole" TEXT`,
  `CREATE INDEX IF NOT EXISTS "Scholarship_sponsorName_idx" ON "Scholarship"("sponsorName")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Scholarship_code_key" ON "Scholarship"("code")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Scholarship_tokenHash_key" ON "Scholarship"("tokenHash")`,
  `CREATE INDEX IF NOT EXISTS "Scholarship_email_idx" ON "Scholarship"("email")`,
  `CREATE INDEX IF NOT EXISTS "Scholarship_studentId_idx" ON "Scholarship"("studentId")`,
  `CREATE INDEX IF NOT EXISTS "Scholarship_status_createdAt_idx" ON "Scholarship"("status", "createdAt")`,
  `CREATE TABLE IF NOT EXISTS "ScholarshipTrack" (
    "id" TEXT NOT NULL,
    "scholarshipId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "trackId" TEXT NOT NULL,
    "listCents" INTEGER NOT NULL,
    "paidCents" INTEGER NOT NULL,
    "coveredCents" INTEGER NOT NULL,
    "stripeSessionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ScholarshipTrack_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "ScholarshipTrack_stripeSessionId_key" ON "ScholarshipTrack"("stripeSessionId")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "ScholarshipTrack_scholarshipId_trackId_key" ON "ScholarshipTrack"("scholarshipId", "trackId")`,
  `CREATE INDEX IF NOT EXISTS "ScholarshipTrack_studentId_idx" ON "ScholarshipTrack"("studentId")`,
  `CREATE TABLE IF NOT EXISTS "ScholarshipNotice" (
    "id" TEXT NOT NULL,
    "scholarshipId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ScholarshipNotice_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "ScholarshipNotice_scholarshipId_kind_key" ON "ScholarshipNotice"("scholarshipId", "kind")`,
  `CREATE TABLE IF NOT EXISTS "ScholarshipApplication" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "country" TEXT,
    "locale" TEXT NOT NULL DEFAULT 'en',
    "background" TEXT,
    "motivation" TEXT NOT NULL,
    "goals" TEXT,
    "trackIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "links" TEXT,
    "status" TEXT NOT NULL DEFAULT 'new',
    "reviewNote" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "scholarshipId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ScholarshipApplication_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE INDEX IF NOT EXISTS "ScholarshipApplication_email_idx" ON "ScholarshipApplication"("email")`,
  `CREATE INDEX IF NOT EXISTS "ScholarshipApplication_status_createdAt_idx" ON "ScholarshipApplication"("status", "createdAt")`,
];

let ready: Promise<void> | null = null;

/** Throws if the tables cannot be created; callers decide how to degrade. */
export function ensureScholarshipTables(): Promise<void> {
  ready ??= (async () => {
    for (const sql of STATEMENTS) await prisma.$executeRawUnsafe(sql);
  })().catch((err) => {
    ready = null;
    throw err;
  });
  return ready;
}

/** For pages: false (and logged) when the tables cannot be made. */
export async function scholarshipTablesReady(): Promise<boolean> {
  try {
    await ensureScholarshipTables();
    return true;
  } catch (err) {
    console.error("[scholarship] tables", err);
    return false;
  }
}
