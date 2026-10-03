import { randomUUID } from "crypto";
import prisma from "@/lib/prisma";

// Claude API usage log: one row per model call (or per batch result), written
// by the central helper in lib/claude.ts. Read by /admin_pro/ai-usage.
//
// The table is created at runtime, once per process, the same way
// lib/learn/community/db.ts does it (this project has no migrations). The
// statements mirror the AiUsage model at the end of prisma/schema.prisma;
// keep the two in step.
//
// Logging is fire-and-forget: a failure here is printed and never reaches the
// request that made the call.

const STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS "AiUsage" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "task" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "batch" BOOLEAN NOT NULL DEFAULT false,
    "inputTokens" INTEGER NOT NULL DEFAULT 0,
    "outputTokens" INTEGER NOT NULL DEFAULT 0,
    "cacheReadTokens" INTEGER NOT NULL DEFAULT 0,
    "cacheWriteTokens" INTEGER NOT NULL DEFAULT 0,
    "costCents" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "stopReason" TEXT,
    "studentId" TEXT,
    "ref" TEXT,
    CONSTRAINT "AiUsage_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE INDEX IF NOT EXISTS "AiUsage_createdAt_idx" ON "AiUsage"("createdAt")`,
  `CREATE INDEX IF NOT EXISTS "AiUsage_task_createdAt_idx" ON "AiUsage"("task", "createdAt")`,
];

let ready: Promise<void> | null = null;
export function ensureAiUsageTable(): Promise<void> {
  ready ??= (async () => {
    for (const sql of STATEMENTS) await prisma.$executeRawUnsafe(sql);
  })().catch((err) => {
    ready = null;
    throw err;
  });
  return ready;
}

// ── Prices ──────────────────────────────────────────────────────────────────
// First-party list prices in USD per million tokens (input, output). Cache
// reads cost 0.1x input, 5-minute cache writes 1.25x input, and the Batch API
// halves everything. Unknown models are priced as Opus so the page errs high.

const PRICES: Array<[RegExp, number, number]> = [
  [/fable|mythos/, 10, 50],
  [/opus-5-5/, 4, 20],
  [/opus/, 5, 25],
  [/sonnet-5/, 2, 10],
  [/sonnet/, 3, 15],
  [/haiku-4/, 1, 5],
  [/haiku/, 0.8, 4],
];

export function pricePerMTok(model: string): { input: number; output: number } {
  for (const [re, input, output] of PRICES) if (re.test(model)) return { input, output };
  return { input: 5, output: 25 };
}

export interface UsageTokens {
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
}

/** Estimated cost in US cents. */
export function costCents(model: string, u: UsageTokens, batch = false): number {
  const p = pricePerMTok(model);
  const usd =
    (u.inputTokens * p.input +
      u.cacheReadTokens * p.input * 0.1 +
      u.cacheWriteTokens * p.input * 1.25 +
      u.outputTokens * p.output) /
    1_000_000;
  return usd * 100 * (batch ? 0.5 : 1);
}

export interface AiUsageEntry extends UsageTokens {
  task: string;
  model: string;
  batch?: boolean;
  stopReason?: string | null;
  studentId?: string | null;
  ref?: string | null;
}

/** Records one call. Never throws and never delays the caller. */
export function logAiUsage(e: AiUsageEntry): void {
  void (async () => {
    try {
      await ensureAiUsageTable();
      await prisma.$executeRawUnsafe(
        `INSERT INTO "AiUsage" ("id", "task", "model", "batch", "inputTokens", "outputTokens", "cacheReadTokens", "cacheWriteTokens", "costCents", "stopReason", "studentId", "ref")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        randomUUID(),
        e.task.slice(0, 60),
        e.model.slice(0, 80),
        !!e.batch,
        Math.max(0, Math.round(e.inputTokens || 0)),
        Math.max(0, Math.round(e.outputTokens || 0)),
        Math.max(0, Math.round(e.cacheReadTokens || 0)),
        Math.max(0, Math.round(e.cacheWriteTokens || 0)),
        costCents(e.model, e, e.batch),
        e.stopReason ?? null,
        e.studentId ?? null,
        e.ref ? e.ref.slice(0, 200) : null,
      );
    } catch (err) {
      console.error("[ai-usage] log failed", err instanceof Error ? err.message : err);
    }
  })();
}
