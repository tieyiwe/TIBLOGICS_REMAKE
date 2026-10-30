import prisma from "@/lib/prisma";

// Runtime columns for the scanner's report, limit and follow-ups. They mirror
// the ScannerLead model in prisma/schema.prisma (this project has no
// migrations); the db-prepare job runs this too.

const STATEMENTS = [
  `ALTER TABLE "ScannerLead" ADD COLUMN IF NOT EXISTS "domain" TEXT`,
  `ALTER TABLE "ScannerLead" ADD COLUMN IF NOT EXISTS "token" TEXT`,
  `ALTER TABLE "ScannerLead" ADD COLUMN IF NOT EXISTS "locale" TEXT`,
  `ALTER TABLE "ScannerLead" ADD COLUMN IF NOT EXISTS "extra" JSONB`,
  `ALTER TABLE "ScannerLead" ADD COLUMN IF NOT EXISTS "unlockedAt" TIMESTAMP(3)`,
  `ALTER TABLE "ScannerLead" ADD COLUMN IF NOT EXISTS "unlockSource" TEXT`,
  `ALTER TABLE "ScannerLead" ADD COLUMN IF NOT EXISTS "stripeSessionId" TEXT`,
  `ALTER TABLE "ScannerLead" ADD COLUMN IF NOT EXISTS "amountPaid" INTEGER`,
  `ALTER TABLE "ScannerLead" ADD COLUMN IF NOT EXISTS "report" JSONB`,
  `ALTER TABLE "ScannerLead" ADD COLUMN IF NOT EXISTS "reportStatus" TEXT`,
  `ALTER TABLE "ScannerLead" ADD COLUMN IF NOT EXISTS "compare" JSONB`,
  `ALTER TABLE "ScannerLead" ADD COLUMN IF NOT EXISTS "rescanCredits" INTEGER NOT NULL DEFAULT 0`,
  `ALTER TABLE "ScannerLead" ADD COLUMN IF NOT EXISTS "rescanUntil" TIMESTAMP(3)`,
  `ALTER TABLE "ScannerLead" ADD COLUMN IF NOT EXISTS "parentId" TEXT`,
  `ALTER TABLE "ScannerLead" ADD COLUMN IF NOT EXISTS "emailedAt" TIMESTAMP(3)`,
  `ALTER TABLE "ScannerLead" ADD COLUMN IF NOT EXISTS "followupStage" INTEGER NOT NULL DEFAULT 0`,
  `ALTER TABLE "ScannerLead" ADD COLUMN IF NOT EXISTS "followupAt" TIMESTAMP(3)`,
  `ALTER TABLE "ScannerLead" ADD COLUMN IF NOT EXISTS "consentAt" TIMESTAMP(3)`,
  `ALTER TABLE "ScannerLead" ADD COLUMN IF NOT EXISTS "growthLeadId" TEXT`,
  // The booking made from the report (/book?scan=<token>), for the admin.
  `ALTER TABLE "ScannerLead" ADD COLUMN IF NOT EXISTS "appointmentId" TEXT`,
  `CREATE INDEX IF NOT EXISTS "ScannerLead_appointmentId_idx" ON "ScannerLead"("appointmentId")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "ScannerLead_token_key" ON "ScannerLead"("token")`,
  `CREATE INDEX IF NOT EXISTS "ScannerLead_domain_createdAt_idx" ON "ScannerLead"("domain", "createdAt")`,
  `CREATE INDEX IF NOT EXISTS "ScannerLead_followupAt_idx" ON "ScannerLead"("followupAt")`,
];

let ready: Promise<void> | null = null;
export function ensureScannerColumns(): Promise<void> {
  ready ??= (async () => {
    for (const sql of STATEMENTS) await prisma.$executeRawUnsafe(sql);
  })().catch((err) => {
    ready = null;
    throw err;
  });
  return ready;
}
