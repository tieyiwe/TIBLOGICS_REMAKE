import prisma from "@/lib/prisma";

// Creates the Growth leads/outreach tables if they are missing, once per
// process, the same way lib/learn/community/db.ts does. This project has no
// migrations: the statements mirror the Growth/Outreach models at the end of
// prisma/schema.prisma, made idempotent. Keep the two in step.
//
// No foreign keys: leads can come from AgentLead, Prospect or a CSV, and a
// deleted lead's messages are removed explicitly by the code that deletes it.

const TABLES = [
  `CREATE TABLE IF NOT EXISTS "GrowthLead" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "sourceId" TEXT,
    "companyName" TEXT NOT NULL,
    "contactName" TEXT,
    "role" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "phoneNorm" TEXT,
    "website" TEXT,
    "domain" TEXT,
    "industry" TEXT,
    "area" TEXT,
    "linkedinUrl" TEXT,
    "stage" TEXT NOT NULL DEFAULT 'new',
    "score" INTEGER,
    "scoreReasons" JSONB NOT NULL DEFAULT '[]',
    "bestOffer" TEXT,
    "offerReason" TEXT,
    "opener" TEXT,
    "signals" JSONB NOT NULL DEFAULT '{}',
    "socials" JSONB NOT NULL DEFAULT '{}',
    "publicEmails" JSONB NOT NULL DEFAULT '[]',
    "emailStatus" TEXT NOT NULL DEFAULT 'unknown',
    "enrichStatus" TEXT NOT NULL DEFAULT 'idle',
    "enrichError" TEXT,
    "enrichedAt" TIMESTAMP(3),
    "consentBasis" TEXT NOT NULL DEFAULT 'unset',
    "consentNote" TEXT,
    "doNotContact" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "tags" JSONB NOT NULL DEFAULT '[]',
    "lastContactedAt" TIMESTAMP(3),
    "repliedAt" TIMESTAMP(3),
    "handedOverAt" TIMESTAMP(3),
    "handoverRef" TEXT,
    "convertedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GrowthLead_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE TABLE IF NOT EXISTS "GrowthLeadEvent" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "detail" TEXT,
    "meta" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GrowthLeadEvent_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE TABLE IF NOT EXISTS "OutreachSequence" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "offerKey" TEXT,
    "steps" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OutreachSequence_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE TABLE IF NOT EXISTS "OutreachEnrollment" (
    "id" TEXT NOT NULL,
    "sequenceId" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending_approval',
    "stopReason" TEXT,
    "approvedAt" TIMESTAMP(3),
    "linkCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OutreachEnrollment_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE TABLE IF NOT EXISTS "OutreachMessage" (
    "id" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "sequenceId" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "stepIndex" INTEGER NOT NULL,
    "dayOffset" INTEGER NOT NULL DEFAULT 0,
    "toEmail" TEXT,
    "subject" TEXT NOT NULL,
    "bodyText" TEXT NOT NULL,
    "personalised" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "approvedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "scheduledFor" TIMESTAMP(3),
    "claimId" TEXT,
    "claimedAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "error" TEXT,
    "smtpMessageId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OutreachMessage_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE TABLE IF NOT EXISTS "OutreachSuppression" (
    "value" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "source" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OutreachSuppression_pkey" PRIMARY KEY ("value")
  )`,
  `CREATE TABLE IF NOT EXISTS "OutreachState" (
    "id" TEXT NOT NULL,
    "lockedUntil" TIMESTAMP(3),
    "lastRunAt" TIMESTAMP(3),
    "lastResult" JSONB NOT NULL DEFAULT '{}',
    CONSTRAINT "OutreachState_pkey" PRIMARY KEY ("id")
  )`,
];

const INDEXES = [
  `CREATE UNIQUE INDEX IF NOT EXISTS "GrowthLead_source_sourceId_key" ON "GrowthLead"("source", "sourceId")`,
  `CREATE INDEX IF NOT EXISTS "GrowthLead_stage_idx" ON "GrowthLead"("stage")`,
  `CREATE INDEX IF NOT EXISTS "GrowthLead_domain_idx" ON "GrowthLead"("domain")`,
  `CREATE INDEX IF NOT EXISTS "GrowthLead_email_idx" ON "GrowthLead"("email")`,
  `CREATE INDEX IF NOT EXISTS "GrowthLead_phoneNorm_idx" ON "GrowthLead"("phoneNorm")`,
  `CREATE INDEX IF NOT EXISTS "GrowthLead_enrichStatus_idx" ON "GrowthLead"("enrichStatus")`,
  `CREATE INDEX IF NOT EXISTS "GrowthLeadEvent_leadId_createdAt_idx" ON "GrowthLeadEvent"("leadId", "createdAt")`,
  `CREATE INDEX IF NOT EXISTS "GrowthLeadEvent_type_createdAt_idx" ON "GrowthLeadEvent"("type", "createdAt")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "OutreachEnrollment_sequenceId_leadId_key" ON "OutreachEnrollment"("sequenceId", "leadId")`,
  `CREATE INDEX IF NOT EXISTS "OutreachEnrollment_leadId_idx" ON "OutreachEnrollment"("leadId")`,
  `CREATE INDEX IF NOT EXISTS "OutreachEnrollment_status_idx" ON "OutreachEnrollment"("status")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "OutreachMessage_enrollmentId_stepIndex_key" ON "OutreachMessage"("enrollmentId", "stepIndex")`,
  `CREATE INDEX IF NOT EXISTS "OutreachMessage_status_scheduledFor_idx" ON "OutreachMessage"("status", "scheduledFor")`,
  `CREATE INDEX IF NOT EXISTS "OutreachMessage_leadId_idx" ON "OutreachMessage"("leadId")`,
  `CREATE INDEX IF NOT EXISTS "OutreachMessage_sentAt_idx" ON "OutreachMessage"("sentAt")`,
];

const STATEMENTS = [...TABLES, ...INDEXES];

let ready: Promise<void> | null = null;

/** Throws if the tables cannot be created; callers decide how to degrade. */
export function ensureOutreachTables(): Promise<void> {
  ready ??= (async () => {
    for (const sql of STATEMENTS) await prisma.$executeRawUnsafe(sql);
  })().catch((err) => {
    ready = null;
    throw err;
  });
  return ready;
}

/** Same, but never throws: false when the tables are unavailable. */
export async function outreachTablesReady(): Promise<boolean> {
  try {
    await ensureOutreachTables();
    return true;
  } catch (err) {
    console.error("[growth/outreach] tables", err);
    return false;
  }
}
