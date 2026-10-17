import { randomUUID } from "crypto";
import prisma from "@/lib/prisma";

// One-time track purchases: pay once, keep that track for life.
//
// This project has no migrations. The table is created here, once per process,
// before anything reads or writes it; the statements match the TrackPurchase
// model in prisma/schema.prisma, made idempotent. Keep the two in step.

const STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS "TrackPurchase" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "trackId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "stripeSessionId" TEXT,
    "stripePaymentIntent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TrackPurchase_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "TrackPurchase_stripeSessionId_key" ON "TrackPurchase"("stripeSessionId")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "TrackPurchase_studentId_trackId_key" ON "TrackPurchase"("studentId", "trackId")`,
  `CREATE INDEX IF NOT EXISTS "TrackPurchase_trackId_idx" ON "TrackPurchase"("trackId")`,
  `CREATE INDEX IF NOT EXISTS "TrackPurchase_createdAt_idx" ON "TrackPurchase"("createdAt")`,
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'TrackPurchase_studentId_fkey') THEN
      ALTER TABLE "TrackPurchase" ADD CONSTRAINT "TrackPurchase_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
  END $$`,
];

let ready: Promise<void> | null = null;

/** Throws if the table cannot be created; callers decide how to degrade. */
export function ensureTrackPurchaseTable(): Promise<void> {
  ready ??= (async () => {
    for (const sql of STATEMENTS) await prisma.$executeRawUnsafe(sql);
  })().catch((err) => {
    ready = null;
    throw err;
  });
  return ready;
}

/** Ids of the tracks this learner bought. Empty on any failure (fails closed). */
export async function purchasedTrackIds(studentId: string): Promise<string[]> {
  try {
    await ensureTrackPurchaseTable();
    const rows = await prisma.trackPurchase.findMany({ where: { studentId }, select: { trackId: true } });
    return rows.map((r) => r.trackId);
  } catch (err) {
    console.error("[learn/purchases] read", err);
    return [];
  }
}

/**
 * Records a paid one-time purchase. Idempotent: a retried webhook (same
 * Stripe session) or a second purchase of a track already owned inserts
 * nothing. Returns true when a row was created.
 */
export async function recordTrackPurchase(p: {
  studentId: string;
  trackId: string;
  amountCents: number;
  currency: string;
  stripeSessionId: string;
  stripePaymentIntent: string | null;
}): Promise<boolean> {
  await ensureTrackPurchaseTable();
  // ON CONFLICT without a target covers both unique constraints.
  const n = await prisma.$executeRaw`
    INSERT INTO "TrackPurchase" ("id", "studentId", "trackId", "amountCents", "currency", "stripeSessionId", "stripePaymentIntent")
    SELECT ${randomUUID()}, ${p.studentId}, ${p.trackId}, ${p.amountCents}, ${p.currency.toLowerCase()}, ${p.stripeSessionId}, ${p.stripePaymentIntent}
    WHERE EXISTS (SELECT 1 FROM "LearnTrack" WHERE "id" = ${p.trackId})
      AND EXISTS (SELECT 1 FROM "Student" WHERE "id" = ${p.studentId})
    ON CONFLICT DO NOTHING`;
  return n > 0;
}
