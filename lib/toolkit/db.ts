import prisma from "@/lib/prisma";

// Creates the Toolkit Live tables if they are missing, once per process, the
// same way lib/monitor/db.ts does: this project has no migrations, and a paid
// tool that 500s until someone runs a sync route loses the first sale.
// Statements are `prisma migrate diff` output for the three models, made
// idempotent.

const STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS "ToolkitSubscription" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "studentId" TEXT NOT NULL,
    "plan" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "currentPeriodEnd" TIMESTAMP(3),
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "ToolkitSubscription_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE TABLE IF NOT EXISTS "ToolkitProfile" (
    "studentId" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "businessName" TEXT NOT NULL DEFAULT '',
    "vertical" TEXT NOT NULL DEFAULT 'general',
    "location" TEXT NOT NULL DEFAULT '',
    "audience" TEXT NOT NULL DEFAULT '',
    "offer" TEXT NOT NULL DEFAULT '',
    "voice" TEXT NOT NULL DEFAULT '',
    "differentiators" TEXT NOT NULL DEFAULT '',
    "compliance" TEXT NOT NULL DEFAULT '',
    CONSTRAINT "ToolkitProfile_pkey" PRIMARY KEY ("studentId")
  )`,
  `CREATE TABLE IF NOT EXISTS "ToolkitRun" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "studentId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "promptId" TEXT,
    "title" TEXT NOT NULL,
    "input" TEXT NOT NULL,
    "output" TEXT NOT NULL,
    "findings" JSONB,
    "inputTokens" INTEGER NOT NULL DEFAULT 0,
    "outputTokens" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "ToolkitRun_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "ToolkitSubscription_studentId_key" ON "ToolkitSubscription"("studentId")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "ToolkitSubscription_stripeSubscriptionId_key" ON "ToolkitSubscription"("stripeSubscriptionId")`,
  `CREATE INDEX IF NOT EXISTS "ToolkitRun_studentId_createdAt_idx" ON "ToolkitRun"("studentId", "createdAt")`,
  `CREATE INDEX IF NOT EXISTS "ToolkitRun_studentId_kind_createdAt_idx" ON "ToolkitRun"("studentId", "kind", "createdAt")`,
];

let ready: Promise<void> | null = null;

export function ensureToolkitTables(): Promise<void> {
  ready ??= (async () => {
    for (const sql of STATEMENTS) await prisma.$executeRawUnsafe(sql);
  })().catch((err) => {
    ready = null;
    throw err;
  });
  return ready;
}
