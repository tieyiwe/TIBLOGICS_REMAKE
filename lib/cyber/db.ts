import prisma from "@/lib/prisma";

// The cyber scanner's tables (runtime DDL, listed in prisma/schema.prisma and
// app/api/cron/db-prepare so Replit's publish keeps them).
//   CyberEngagement  a client's written authorisation: scope and dates
//   CyberScan        one scan: options, status, result, share token

const STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS "CyberEngagement" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "client" TEXT NOT NULL,
    "contactName" TEXT,
    "contactEmail" TEXT,
    "authorizedBy" TEXT NOT NULL,
    "scope" JSONB NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "note" TEXT,
    "revokedAt" TIMESTAMP(3),
    CONSTRAINT "CyberEngagement_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE INDEX IF NOT EXISTS "CyberEngagement_endsAt_idx" ON "CyberEngagement"("endsAt")`,
  `CREATE TABLE IF NOT EXISTS "CyberScan" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'running',
    "progress" TEXT,
    "deep" BOOLEAN NOT NULL DEFAULT false,
    "engagementId" TEXT,
    "company" TEXT,
    "contactName" TEXT,
    "score" INTEGER,
    "grade" TEXT,
    "counts" JSONB,
    "result" JSONB,
    "error" TEXT,
    "finishedAt" TIMESTAMP(3),
    "sharedAt" TIMESTAMP(3),
    "sent" JSONB,
    CONSTRAINT "CyberScan_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "CyberScan_token_key" ON "CyberScan"("token")`,
  `CREATE INDEX IF NOT EXISTS "CyberScan_domain_idx" ON "CyberScan"("domain")`,
  `CREATE INDEX IF NOT EXISTS "CyberScan_createdAt_idx" ON "CyberScan"("createdAt")`,
];

let ready: Promise<void> | null = null;
export function ensureCyberTables(): Promise<void> {
  ready ??= (async () => {
    for (const sql of STATEMENTS) await prisma.$executeRawUnsafe(sql);
  })().catch((err) => {
    ready = null;
    throw err;
  });
  return ready;
}

export interface EngagementRow {
  id: string;
  createdAt: Date;
  createdBy: string;
  client: string;
  contactName: string | null;
  contactEmail: string | null;
  authorizedBy: string;
  scope: string[];
  startsAt: Date;
  endsAt: Date;
  note: string | null;
  revokedAt: Date | null;
}

export interface ScanRow {
  id: string;
  createdAt: Date;
  createdBy: string;
  token: string;
  url: string;
  domain: string;
  status: "running" | "done" | "failed";
  progress: string | null;
  deep: boolean;
  engagementId: string | null;
  company: string | null;
  contactName: string | null;
  score: number | null;
  grade: string | null;
  counts: Record<string, number> | null;
  result: unknown;
  error: string | null;
  finishedAt: Date | null;
  sharedAt: Date | null;
  sent: Array<{ to: string; at: string; by: string }> | null;
}
