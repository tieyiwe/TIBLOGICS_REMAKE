import prisma from "@/lib/prisma";

// Creates the promotion tables if they are missing, once per process, the
// same way lib/learn/community/db.ts does. This project has no migrations:
// the statements mirror the Promotion, PromotionRedemption and
// PromotionSetting models at the end of prisma/schema.prisma. Keep the two in
// step. No relations: redemptions are kept even if a promotion is deleted.

const STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS "Promotion" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'draft',
    "kind" TEXT NOT NULL,
    "percentOff" DOUBLE PRECISION,
    "amountOffCents" INTEGER,
    "duration" TEXT NOT NULL DEFAULT 'once',
    "durationMonths" INTEGER,
    "scope" JSONB NOT NULL DEFAULT '[]',
    "mode" TEXT NOT NULL,
    "code" TEXT,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "maxRedemptions" INTEGER,
    "firstTimeOnly" BOOLEAN NOT NULL DEFAULT false,
    "minimumCents" INTEGER,
    "bannerEn" TEXT,
    "bannerFr" TEXT,
    "bannerSw" TEXT,
    "stripeCouponId" TEXT,
    "stripePromotionCodeId" TEXT,
    "stripeCodeActive" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Promotion_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE INDEX IF NOT EXISTS "Promotion_state_idx" ON "Promotion"("state")`,
  `CREATE INDEX IF NOT EXISTS "Promotion_code_idx" ON "Promotion"("code")`,
  `CREATE TABLE IF NOT EXISTS "PromotionRedemption" (
    "id" TEXT NOT NULL,
    "promotionId" TEXT NOT NULL,
    "stripeSessionId" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'auto',
    "product" TEXT,
    "email" TEXT,
    "studentId" TEXT,
    "subtotalCents" INTEGER NOT NULL DEFAULT 0,
    "discountCents" INTEGER NOT NULL DEFAULT 0,
    "totalCents" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PromotionRedemption_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "PromotionRedemption_stripeSessionId_key" ON "PromotionRedemption"("stripeSessionId")`,
  `CREATE INDEX IF NOT EXISTS "PromotionRedemption_promotionId_createdAt_idx" ON "PromotionRedemption"("promotionId", "createdAt")`,
  `CREATE TABLE IF NOT EXISTS "PromotionSetting" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PromotionSetting_pkey" PRIMARY KEY ("key")
  )`,
];

let ready: Promise<void> | null = null;

export function ensurePromotionTables(): Promise<void> {
  ready ??= (async () => {
    for (const sql of STATEMENTS) await prisma.$executeRawUnsafe(sql);
  })().catch((err) => {
    ready = null;
    throw err;
  });
  return ready;
}
