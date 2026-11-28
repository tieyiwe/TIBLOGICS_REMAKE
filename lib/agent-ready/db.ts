import prisma from "@/lib/prisma";

// The AgentReadyScan table (runtime DDL like the other tables; also in
// prisma/schema.prisma and the db-prepare list, so a publish never drops it).

const STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS "AgentReadyScan" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "url" TEXT NOT NULL,
    "host" TEXT NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'en',
    "ipHash" TEXT,
    "score" INTEGER NOT NULL DEFAULT 0,
    "verdict" TEXT NOT NULL DEFAULT 'notReady',
    "result" JSONB NOT NULL,
    "tier" TEXT NOT NULL DEFAULT 'free',
    "email" TEXT,
    "reportSessionId" TEXT,
    "kitSessionId" TEXT,
    "amountPaid" INTEGER NOT NULL DEFAULT 0,
    "paidAt" TIMESTAMP(3),
    "rescans" INTEGER NOT NULL DEFAULT 0,
    "staff" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "AgentReadyScan_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "AgentReadyScan_token_key" ON "AgentReadyScan"("token")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "AgentReadyScan_reportSessionId_key" ON "AgentReadyScan"("reportSessionId")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "AgentReadyScan_kitSessionId_key" ON "AgentReadyScan"("kitSessionId")`,
  `CREATE INDEX IF NOT EXISTS "AgentReadyScan_host_idx" ON "AgentReadyScan"("host")`,
  `CREATE INDEX IF NOT EXISTS "AgentReadyScan_tier_idx" ON "AgentReadyScan"("tier")`,
  `CREATE INDEX IF NOT EXISTS "AgentReadyScan_createdAt_idx" ON "AgentReadyScan"("createdAt")`,
];

let ready: Promise<void> | null = null;
export function ensureAgentReadyTables(): Promise<void> {
  ready ??= (async () => {
    for (const sql of STATEMENTS) await prisma.$executeRawUnsafe(sql);
  })().catch((err) => {
    ready = null;
    throw err;
  });
  return ready;
}
