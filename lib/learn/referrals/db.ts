import prisma from "@/lib/prisma";

// Creates the Learning Box referral tables if they are missing, once per
// process (no migrations in this project). Mirrors the LearnReferral* models
// in prisma/schema.prisma; keep the two in step. No foreign keys: a deleted
// learner's referral history stays for the owner's records.

const STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS "LearnReferralCode" (
    "studentId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LearnReferralCode_pkey" PRIMARY KEY ("studentId")
  )`,
  `CREATE TABLE IF NOT EXISTS "LearnReferral" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "referrerStudentId" TEXT NOT NULL,
    "referredStudentId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'signed_up',
    "reason" TEXT,
    "paidAt" TIMESTAMP(3),
    "payKind" TEXT,
    "amountCents" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LearnReferral_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE TABLE IF NOT EXISTS "LearnReferralReward" (
    "id" TEXT NOT NULL,
    "referralId" TEXT NOT NULL,
    "referrerStudentId" TEXT NOT NULL,
    "referredStudentId" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'free_month',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "grant" TEXT,
    "note" TEXT,
    "decidedAt" TIMESTAMP(3),
    "decidedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LearnReferralReward_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE TABLE IF NOT EXISTS "LearnReferralEvent" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "channel" TEXT,
    "visitorHash" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LearnReferralEvent_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "LearnReferralCode_code_key" ON "LearnReferralCode"("code")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "LearnReferral_referredStudentId_key" ON "LearnReferral"("referredStudentId")`,
  `CREATE INDEX IF NOT EXISTS "LearnReferral_referrerStudentId_idx" ON "LearnReferral"("referrerStudentId")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "LearnReferralReward_referralId_key" ON "LearnReferralReward"("referralId")`,
  `CREATE INDEX IF NOT EXISTS "LearnReferralReward_status_idx" ON "LearnReferralReward"("status")`,
  `CREATE INDEX IF NOT EXISTS "LearnReferralReward_referrerStudentId_createdAt_idx" ON "LearnReferralReward"("referrerStudentId", "createdAt")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "LearnReferralEvent_code_kind_visitorHash_day_key" ON "LearnReferralEvent"("code", "kind", "visitorHash", "day")`,
  `CREATE INDEX IF NOT EXISTS "LearnReferralEvent_code_kind_idx" ON "LearnReferralEvent"("code", "kind")`,
];

let ready: Promise<void> | null = null;

export function ensureReferralTables(): Promise<void> {
  ready ??= (async () => {
    for (const sql of STATEMENTS) await prisma.$executeRawUnsafe(sql);
  })().catch((err) => {
    ready = null;
    throw err;
  });
  return ready;
}

export async function referralTablesReady(): Promise<boolean> {
  try {
    await ensureReferralTables();
    return true;
  } catch (err) {
    console.error("[learn/referrals] tables", err);
    return false;
  }
}
