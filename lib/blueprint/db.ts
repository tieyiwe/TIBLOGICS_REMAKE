import prisma from "@/lib/prisma";

// Creates the Blueprint table if missing, once per process (no migrations in
// this project). `prisma migrate diff` output for the model, made idempotent.
const STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS "Blueprint" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "intake" JSONB NOT NULL,
    "result" JSONB,
    "error" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "generationStartedAt" TIMESTAMP(3),
    "stripeSessionId" TEXT,
    "amountPaid" INTEGER NOT NULL DEFAULT 0,
    "paidAt" TIMESTAMP(3),
    "readyAt" TIMESTAMP(3),
    "creditCode" TEXT NOT NULL,
    "creditExpiresAt" TIMESTAMP(3),
    "creditUsedAt" TIMESTAMP(3),
    "tokenSalt" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "inputTokens" INTEGER NOT NULL DEFAULT 0,
    "outputTokens" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Blueprint_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Blueprint_stripeSessionId_key" ON "Blueprint"("stripeSessionId")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Blueprint_creditCode_key" ON "Blueprint"("creditCode")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Blueprint_tokenHash_key" ON "Blueprint"("tokenHash")`,
  `CREATE INDEX IF NOT EXISTS "Blueprint_status_idx" ON "Blueprint"("status")`,
  `CREATE INDEX IF NOT EXISTS "Blueprint_email_idx" ON "Blueprint"("email")`,
  `CREATE INDEX IF NOT EXISTS "Blueprint_createdAt_idx" ON "Blueprint"("createdAt")`,
];

let ready: Promise<void> | null = null;

export function ensureBlueprintTables(): Promise<void> {
  ready ??= (async () => {
    for (const sql of STATEMENTS) await prisma.$executeRawUnsafe(sql);
  })().catch((err) => {
    ready = null;
    throw err;
  });
  return ready;
}
