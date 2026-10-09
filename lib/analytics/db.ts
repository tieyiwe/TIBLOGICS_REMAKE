import prisma from "@/lib/prisma";

// Runtime tables and columns for first-party analytics: the scan log, click
// events and the location columns on PageView. They mirror the ScanLog and
// ClickEvent models and the PageView fields in prisma/schema.prisma (this
// project has no migrations); the db-prepare job runs this too.
//
// No personal data: addresses are anonymised (/24, /48) before they are
// stored, click labels are filtered (lib/analytics/paths safeLabel), and no
// typed text or input value is ever recorded.

export const ANALYTICS_RETENTION_DAYS = 400;

const STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS "ScanLog" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "url" TEXT NOT NULL,
    "domain" TEXT,
    "outcome" TEXT NOT NULL,
    "errorCode" TEXT,
    "leadId" TEXT,
    "ip" TEXT,
    "country" TEXT,
    "countryName" TEXT,
    "region" TEXT,
    "city" TEXT,
    "device" TEXT,
    "browser" TEXT,
    "os" TEXT,
    "locale" TEXT,
    "fromPage" TEXT,
    "staff" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "ScanLog_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE INDEX IF NOT EXISTS "ScanLog_createdAt_idx" ON "ScanLog"("createdAt")`,
  `CREATE INDEX IF NOT EXISTS "ScanLog_domain_createdAt_idx" ON "ScanLog"("domain", "createdAt")`,
  `CREATE INDEX IF NOT EXISTS "ScanLog_leadId_idx" ON "ScanLog"("leadId")`,
  `CREATE TABLE IF NOT EXISTS "ClickEvent" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sessionId" TEXT,
    "page" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "href" TEXT,
    "device" TEXT,
    "country" TEXT,
    CONSTRAINT "ClickEvent_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE INDEX IF NOT EXISTS "ClickEvent_createdAt_idx" ON "ClickEvent"("createdAt")`,
  `CREATE INDEX IF NOT EXISTS "ClickEvent_page_createdAt_idx" ON "ClickEvent"("page", "createdAt")`,
  `CREATE INDEX IF NOT EXISTS "ClickEvent_label_createdAt_idx" ON "ClickEvent"("label", "createdAt")`,
  `ALTER TABLE "PageView" ADD COLUMN IF NOT EXISTS "region" TEXT`,
  `ALTER TABLE "PageView" ADD COLUMN IF NOT EXISTS "city" TEXT`,
  `CREATE INDEX IF NOT EXISTS "PageView_page_createdAt_idx" ON "PageView"("page", "createdAt")`,
];

let ready: Promise<void> | null = null;

/** Throws if the tables cannot be created; callers decide how to degrade. */
export function ensureAnalyticsTables(): Promise<void> {
  ready ??= (async () => {
    for (const sql of STATEMENTS) await prisma.$executeRawUnsafe(sql);
  })().catch((err) => {
    ready = null;
    throw err;
  });
  return ready;
}

/** Same, never throws. */
export async function analyticsReady(): Promise<boolean> {
  try {
    await ensureAnalyticsTables();
    return true;
  } catch (err) {
    console.error("[analytics/db]", err instanceof Error ? err.message : err);
    return false;
  }
}

/** Deletes click and scan-log rows past retention. Run daily (cron scanner). */
export async function pruneAnalytics(): Promise<{ clicks: number; scans: number }> {
  await ensureAnalyticsTables();
  const cutoff = new Date(Date.now() - ANALYTICS_RETENTION_DAYS * 86_400_000);
  const clicks = await prisma.$executeRawUnsafe(`DELETE FROM "ClickEvent" WHERE "createdAt" < $1`, cutoff);
  const scans = await prisma.$executeRawUnsafe(`DELETE FROM "ScanLog" WHERE "createdAt" < $1`, cutoff);
  return { clicks, scans };
}
