import prisma from "@/lib/prisma";

// Creates the Growth content + attribution tables if they are missing, once
// per process, like lib/learn/community/db.ts. This project has no
// migrations: the statements mirror the Growth* models and
// ConversionAttribution at the end of prisma/schema.prisma. Keep the two in
// step. No foreign keys: kits, posts and links outlive each other on purpose
// (a deleted kit must not erase the click history of its links).

const TABLES = [
  `CREATE TABLE IF NOT EXISTS "GrowthSettings" (
    "id" TEXT NOT NULL,
    "data" JSONB NOT NULL DEFAULT '{}',
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GrowthSettings_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE TABLE IF NOT EXISTS "GrowthKit" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "productKey" TEXT NOT NULL,
    "productType" TEXT NOT NULL,
    "productTitle" TEXT NOT NULL,
    "productUrl" TEXT,
    "language" TEXT NOT NULL DEFAULT 'en',
    "audienceId" TEXT,
    "content" JSONB NOT NULL DEFAULT '{}',
    "warnings" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GrowthKit_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE TABLE IF NOT EXISTS "GrowthPost" (
    "id" TEXT NOT NULL,
    "kitId" TEXT,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "sourceKey" TEXT,
    "platform" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'en',
    "body" TEXT NOT NULL,
    "hashtags" JSONB NOT NULL DEFAULT '[]',
    "linkCode" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "scheduledAt" TIMESTAMP(3),
    "claimedAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "externalUrl" TEXT,
    "error" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GrowthPost_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE TABLE IF NOT EXISTS "GrowthLink" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "targetUrl" TEXT NOT NULL,
    "utmSource" TEXT NOT NULL,
    "utmMedium" TEXT NOT NULL,
    "utmCampaign" TEXT NOT NULL,
    "utmContent" TEXT,
    "label" TEXT,
    "kitId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GrowthLink_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE TABLE IF NOT EXISTS "GrowthClick" (
    "id" TEXT NOT NULL,
    "linkCode" TEXT NOT NULL,
    "visitorHash" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "referrer" TEXT,
    "country" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GrowthClick_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE TABLE IF NOT EXISTS "ConversionAttribution" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "refId" TEXT NOT NULL,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "utmContent" TEXT,
    "linkCode" TEXT,
    "amountCents" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ConversionAttribution_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE TABLE IF NOT EXISTS "GrowthCampaign" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "goalType" TEXT NOT NULL,
    "goalTarget" INTEGER NOT NULL,
    "goalLabel" TEXT NOT NULL,
    "productKeys" JSONB NOT NULL DEFAULT '[]',
    "audienceId" TEXT,
    "language" TEXT NOT NULL DEFAULT 'en',
    "budget" JSONB NOT NULL DEFAULT '{}',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "plan" JSONB NOT NULL DEFAULT '{}',
    "leadFilter" JSONB NOT NULL DEFAULT '{}',
    "kitId" TEXT,
    "sequenceId" TEXT,
    "assets" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GrowthCampaign_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE TABLE IF NOT EXISTS "GrowthContentState" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL DEFAULT '{}',
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GrowthContentState_pkey" PRIMARY KEY ("key")
  )`,
];

const INDEXES = [
  `CREATE UNIQUE INDEX IF NOT EXISTS "GrowthKit_slug_key" ON "GrowthKit"("slug")`,
  `CREATE INDEX IF NOT EXISTS "GrowthKit_productKey_idx" ON "GrowthKit"("productKey")`,
  `CREATE INDEX IF NOT EXISTS "GrowthKit_createdAt_idx" ON "GrowthKit"("createdAt")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "GrowthPost_sourceKey_key" ON "GrowthPost"("sourceKey")`,
  `CREATE INDEX IF NOT EXISTS "GrowthPost_status_scheduledAt_idx" ON "GrowthPost"("status", "scheduledAt")`,
  `CREATE INDEX IF NOT EXISTS "GrowthPost_kitId_idx" ON "GrowthPost"("kitId")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "GrowthLink_code_key" ON "GrowthLink"("code")`,
  `CREATE INDEX IF NOT EXISTS "GrowthLink_utmCampaign_idx" ON "GrowthLink"("utmCampaign")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "GrowthClick_linkCode_visitorHash_day_key" ON "GrowthClick"("linkCode", "visitorHash", "day")`,
  `CREATE INDEX IF NOT EXISTS "GrowthClick_linkCode_createdAt_idx" ON "GrowthClick"("linkCode", "createdAt")`,
  `CREATE INDEX IF NOT EXISTS "GrowthClick_createdAt_idx" ON "GrowthClick"("createdAt")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "ConversionAttribution_kind_refId_key" ON "ConversionAttribution"("kind", "refId")`,
  `CREATE INDEX IF NOT EXISTS "ConversionAttribution_utmCampaign_idx" ON "ConversionAttribution"("utmCampaign")`,
  `CREATE INDEX IF NOT EXISTS "ConversionAttribution_linkCode_idx" ON "ConversionAttribution"("linkCode")`,
  `CREATE INDEX IF NOT EXISTS "ConversionAttribution_createdAt_idx" ON "ConversionAttribution"("createdAt")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "GrowthCampaign_slug_key" ON "GrowthCampaign"("slug")`,
  `CREATE INDEX IF NOT EXISTS "GrowthCampaign_createdAt_idx" ON "GrowthCampaign"("createdAt")`,
];

// Columns added after the first release (tables created earlier lack them).
const COLUMNS = [
  `ALTER TABLE "GrowthPost" ADD COLUMN IF NOT EXISTS "image" JSONB`,
];

const STATEMENTS = [...TABLES, ...COLUMNS, ...INDEXES];

let ready: Promise<void> | null = null;

/** Throws if the tables cannot be created; callers decide how to degrade. */
export function ensureGrowthTables(): Promise<void> {
  ready ??= (async () => {
    for (const sql of STATEMENTS) await prisma.$executeRawUnsafe(sql);
  })().catch((err) => {
    ready = null;
    throw err;
  });
  return ready;
}

/** Same, but never throws: false when the tables are unavailable. */
export async function growthTablesReady(): Promise<boolean> {
  try {
    await ensureGrowthTables();
    return true;
  } catch (err) {
    console.error("[growth] tables", err);
    return false;
  }
}
