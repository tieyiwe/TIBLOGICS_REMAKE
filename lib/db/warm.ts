import prisma from "@/lib/prisma";

// Run once when the server starts (instrumentation.ts), in the background.
//
// 1. Opens the database connection pool, so the first visitor after a cold
//    start (Replit Autoscale scales to zero) does not also pay for the TCP and
//    TLS handshakes to Postgres.
// 2. Adds indexes for hot reads that the schema did not have. CONCURRENTLY,
//    so a large table is never locked against writes while one is built, and
//    IF NOT EXISTS, so later starts cost one catalog lookup each. Mirrored as
//    @@index in prisma/schema.prisma with the same names.
const INDEXES = [
  // Dashboard streak and "last 7 days": a learner's ledger rows since a date.
  `CREATE INDEX CONCURRENTLY IF NOT EXISTS "PointsLedger_studentId_createdAt_idx" ON "PointsLedger" ("studentId", "createdAt")`,
  // AI Times list and sitemaps: published posts, newest first.
  `CREATE INDEX CONCURRENTLY IF NOT EXISTS "BlogPost_published_createdAt_idx" ON "BlogPost" ("published", "createdAt")`,
];

export async function warmDatabase(): Promise<void> {
  try {
    await prisma.$connect();
    await prisma.$queryRawUnsafe("SELECT 1");
  } catch (err) {
    console.error("[db] warm-up failed", err instanceof Error ? err.message : err);
    return;
  }
  // ARFA learner accounts are English or French only; earlier sign-ups could
  // carry Swahili from the public site. Idempotent and cheap.
  await prisma.$executeRawUnsafe(`UPDATE "Student" SET "locale" = 'en' WHERE "locale" NOT IN ('en', 'fr')`).catch(() => {});
  for (const sql of INDEXES) {
    await prisma.$executeRawUnsafe(sql).catch((err) => console.error("[db] index", err instanceof Error ? err.message : err));
  }
}
