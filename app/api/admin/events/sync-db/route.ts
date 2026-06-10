import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TRAINING_EVENT_SEED, TRAINING_EVENT_SLUG } from "@/lib/event-seeds";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const log: string[] = [];

  // 1. Add any missing columns to Event table
  const eventCols = [
    `ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "spots"    INTEGER`,
    `ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "timezone" TEXT NOT NULL DEFAULT 'America/New_York'`,
    `ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "currency" TEXT NOT NULL DEFAULT 'USD'`,
    `ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "content"  TEXT`,
    `ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "stripePaymentLink" TEXT`,
    `ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "coverImage" TEXT`,
    `ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "timeSlot"  TEXT`,
    `ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "endDate"   TIMESTAMP(3)`,
    `ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "capacity"  INTEGER`,
  ];

  // 2. Add any missing columns to EventRegistration table
  const regCols = [
    `ALTER TABLE "EventRegistration" ADD COLUMN IF NOT EXISTS "stripeSessionId" TEXT`,
    `ALTER TABLE "EventRegistration" ADD COLUMN IF NOT EXISTS "notes" TEXT`,
    `ALTER TABLE "EventRegistration" ADD COLUMN IF NOT EXISTS "confirmationNumber" TEXT`,
    `ALTER TABLE "EventRegistration" ADD COLUMN IF NOT EXISTS "currency" TEXT NOT NULL DEFAULT 'USD'`,
    `ALTER TABLE "EventRegistration" ADD COLUMN IF NOT EXISTS "whatsapp" TEXT`,
    `ALTER TABLE "EventRegistration" ADD COLUMN IF NOT EXISTS "role" TEXT`,
    `ALTER TABLE "EventRegistration" ADD COLUMN IF NOT EXISTS "goal" TEXT`,
    `ALTER TABLE "EventRegistration" ADD COLUMN IF NOT EXISTS "referral" TEXT`,
    `ALTER TABLE "EventRegistration" ADD COLUMN IF NOT EXISTS "price" INTEGER NOT NULL DEFAULT 0`,
    `ALTER TABLE "EventRegistration" ADD COLUMN IF NOT EXISTS "eventSlug" TEXT NOT NULL DEFAULT ''`,
    `ALTER TABLE "EventRegistration" ADD COLUMN IF NOT EXISTS "eventName" TEXT NOT NULL DEFAULT ''`,
  ];

  for (const sql of [...eventCols, ...regCols]) {
    try {
      await prisma.$executeRawUnsafe(sql);
      log.push(`✅ ${sql.split('"')[3] ?? sql.slice(0, 60)}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      log.push(`⚠️  ${msg.slice(0, 120)}`);
    }
  }

  // 3. Add unique index on confirmationNumber if missing
  try {
    await prisma.$executeRawUnsafe(
      `CREATE UNIQUE INDEX IF NOT EXISTS "EventRegistration_confirmationNumber_key" ON "EventRegistration"("confirmationNumber")`
    );
    log.push("✅ confirmationNumber unique index");
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    log.push(`⚠️  confirmationNumber index: ${msg.slice(0, 80)}`);
  }

  // 4. Upsert the training event
  try {
    await prisma.event.upsert({
      where: { slug: TRAINING_EVENT_SLUG },
      create: TRAINING_EVENT_SEED,
      update: {},
    });
    log.push(`✅ Training event upserted (${TRAINING_EVENT_SLUG})`);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    log.push(`❌ Training event upsert failed: ${msg.slice(0, 200)}`);
    return NextResponse.json({ ok: false, log }, { status: 500 });
  }

  // 5. Return current event count
  const count = await prisma.event.count().catch(() => -1);
  log.push(`✅ Events in DB: ${count}`);

  return NextResponse.json({ ok: true, log, count });
}
