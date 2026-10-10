import prisma from "@/lib/prisma";

// Creates the acquisition tables (lead magnets, campaign landing pages, form
// captures and view/CTA events) if they are missing, once per process, like
// lib/growth/db.ts. This project has no migrations: the statements mirror the
// Acquire* models in prisma/schema.prisma. Keep the two in step. No foreign
// keys: captures and events outlive a deleted magnet or page on purpose (the
// subscriber and the lead they created stay too).

const TABLES = [
  `CREATE TABLE IF NOT EXISTS "AcquireMagnet" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'en',
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "productKey" TEXT,
    "content" JSONB NOT NULL DEFAULT '{}',
    "linkCode" TEXT,
    "noindex" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AcquireMagnet_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE TABLE IF NOT EXISTS "AcquirePage" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'en',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "noindex" BOOLEAN NOT NULL DEFAULT false,
    "kitId" TEXT,
    "productKey" TEXT,
    "content" JSONB NOT NULL DEFAULT '{}',
    "linkCode" TEXT,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AcquirePage_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE TABLE IF NOT EXISTS "AcquireCapture" (
    "id" TEXT NOT NULL,
    "refType" TEXT NOT NULL,
    "refId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "business" TEXT,
    "whatsapp" TEXT,
    "locale" TEXT NOT NULL DEFAULT 'en',
    "consentText" TEXT NOT NULL,
    "consentAt" TIMESTAMP(3) NOT NULL,
    "result" JSONB,
    "subscriberId" TEXT,
    "leadId" TEXT,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "linkCode" TEXT,
    "emailSentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AcquireCapture_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE TABLE IF NOT EXISTS "AcquireEvent" (
    "id" TEXT NOT NULL,
    "refType" TEXT NOT NULL,
    "refId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "visitorHash" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AcquireEvent_pkey" PRIMARY KEY ("id")
  )`,
];

const INDEXES = [
  `CREATE UNIQUE INDEX IF NOT EXISTS "AcquireMagnet_slug_key" ON "AcquireMagnet"("slug")`,
  `CREATE INDEX IF NOT EXISTS "AcquireMagnet_status_idx" ON "AcquireMagnet"("status")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "AcquirePage_slug_key" ON "AcquirePage"("slug")`,
  `CREATE INDEX IF NOT EXISTS "AcquirePage_status_idx" ON "AcquirePage"("status")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "AcquireCapture_refType_refId_email_key" ON "AcquireCapture"("refType", "refId", "email")`,
  `CREATE INDEX IF NOT EXISTS "AcquireCapture_createdAt_idx" ON "AcquireCapture"("createdAt")`,
  `CREATE INDEX IF NOT EXISTS "AcquireCapture_email_idx" ON "AcquireCapture"("email")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "AcquireEvent_refType_refId_kind_visitorHash_day_key" ON "AcquireEvent"("refType", "refId", "kind", "visitorHash", "day")`,
  `CREATE INDEX IF NOT EXISTS "AcquireEvent_refType_refId_kind_idx" ON "AcquireEvent"("refType", "refId", "kind")`,
  `CREATE INDEX IF NOT EXISTS "AcquireEvent_createdAt_idx" ON "AcquireEvent"("createdAt")`,
];

const STATEMENTS = [...TABLES, ...INDEXES];

let ready: Promise<void> | null = null;

/** Throws if the tables cannot be created; callers decide how to degrade. */
export function ensureAcquireTables(): Promise<void> {
  ready ??= (async () => {
    for (const sql of STATEMENTS) await prisma.$executeRawUnsafe(sql);
  })().catch((err) => {
    ready = null;
    throw err;
  });
  return ready;
}

/** Same, but never throws: false when the tables are unavailable. */
export async function acquireTablesReady(): Promise<boolean> {
  try {
    await ensureAcquireTables();
    return true;
  } catch (err) {
    console.error("[growth/acquire] tables", err);
    return false;
  }
}
