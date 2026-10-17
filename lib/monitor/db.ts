import prisma from "@/lib/prisma";

// Creates the Readiness Monitor tables if they are missing.
//
// This project has no migrations, and a paid feature that 500s until someone
// remembers to run a sync route is a feature that loses the first customer's
// payment. Every monitor entry point awaits this; it runs its statements once
// per process, and IF NOT EXISTS makes concurrent starts safe.
//
// The statements are what `prisma migrate diff` produces for the two models in
// schema.prisma, made idempotent.

const STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS "MonitorSubscription" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "siteUrl" TEXT NOT NULL,
    "competitors" TEXT[],
    "status" TEXT NOT NULL DEFAULT 'pending',
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "currentPeriodEnd" TIMESTAMP(3),
    "tokenSalt" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "lastRunAt" TIMESTAMP(3),
    "nextRunAt" TIMESTAMP(3),
    "runStartedAt" TIMESTAMP(3),
    "lastManualRunAt" TIMESTAMP(3),
    CONSTRAINT "MonitorSubscription_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE TABLE IF NOT EXISTS "MonitorScan" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "subscriptionId" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "isOwn" BOOLEAN NOT NULL,
    "ok" BOOLEAN NOT NULL,
    "error" TEXT,
    "overallScore" INTEGER,
    "seoScore" INTEGER,
    "perfScore" INTEGER,
    "uxScore" INTEGER,
    "aiScore" INTEGER,
    "findings" JSONB,
    CONSTRAINT "MonitorScan_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "MonitorSubscription_stripeSubscriptionId_key" ON "MonitorSubscription"("stripeSubscriptionId")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "MonitorSubscription_tokenHash_key" ON "MonitorSubscription"("tokenHash")`,
  `CREATE INDEX IF NOT EXISTS "MonitorSubscription_status_nextRunAt_idx" ON "MonitorSubscription"("status", "nextRunAt")`,
  `CREATE INDEX IF NOT EXISTS "MonitorSubscription_email_idx" ON "MonitorSubscription"("email")`,
  `CREATE INDEX IF NOT EXISTS "MonitorScan_subscriptionId_createdAt_idx" ON "MonitorScan"("subscriptionId", "createdAt")`,
  `CREATE INDEX IF NOT EXISTS "MonitorScan_runId_idx" ON "MonitorScan"("runId")`,
  // ADD CONSTRAINT has no IF NOT EXISTS; check the catalogue instead.
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'MonitorScan_subscriptionId_fkey') THEN
      ALTER TABLE "MonitorScan" ADD CONSTRAINT "MonitorScan_subscriptionId_fkey"
        FOREIGN KEY ("subscriptionId") REFERENCES "MonitorSubscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
  END $$`,
];

let ready: Promise<void> | null = null;

export function ensureMonitorTables(): Promise<void> {
  ready ??= (async () => {
    for (const sql of STATEMENTS) await prisma.$executeRawUnsafe(sql);
  })().catch((err) => {
    // Let the next call try again rather than caching a failure for the life
    // of the process: the usual cause is a database that was briefly down.
    ready = null;
    throw err;
  });
  return ready;
}
