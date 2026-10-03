import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { pruneRateLimits } from "@/lib/rate-limit";

// Creates the RateLimit table (managed DB — no migrations).
//
// Until this has run, lib/rate-limit falls back to a per-instance in-memory
// counter, so nothing breaks; the limits are simply approximate and reset on
// each deploy. Safe to run repeatedly.
export async function POST() {
  const authErr = await requireAdmin();
  if (authErr) return authErr;

  const log: string[] = [];
  const statements = [
    `CREATE TABLE IF NOT EXISTS "RateLimit" (
      "key" TEXT NOT NULL PRIMARY KEY,
      "count" INTEGER NOT NULL DEFAULT 0,
      "resetAt" TIMESTAMP(3) NOT NULL
    )`,
    `CREATE INDEX IF NOT EXISTS "RateLimit_resetAt_idx" ON "RateLimit"("resetAt")`,
  ];

  for (const sql of statements) {
    try {
      await prisma.$executeRawUnsafe(sql);
      log.push(`ok: ${sql.slice(0, 60).replace(/\s+/g, " ")}…`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      log.push(`FAILED: ${sql.slice(0, 60).replace(/\s+/g, " ")}… — ${msg}`);
      return NextResponse.json({ ok: false, log }, { status: 500 });
    }
  }

  const pruned = await pruneRateLimits();

  // Proves the table is usable, not just present.
  let writable = false;
  try {
    await prisma.$executeRaw`
      INSERT INTO "RateLimit" ("key", "count", "resetAt")
      VALUES ('sync-db:probe', 1, now())
      ON CONFLICT ("key") DO UPDATE SET "count" = "RateLimit"."count" + 1
    `;
    await prisma.$executeRaw`DELETE FROM "RateLimit" WHERE "key" = 'sync-db:probe'`;
    writable = true;
  } catch {
    writable = false;
  }

  return NextResponse.json({ ok: true, writable, prunedExpiredRows: pruned, log });
}
