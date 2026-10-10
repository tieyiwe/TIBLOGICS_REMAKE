import { randomUUID } from "crypto";
import prisma from "@/lib/prisma";

// Instant feedback on module quizzes and micro-checks. Serving a question set
// opens a session; each answer is checked and LOCKED the first time it is
// picked, so the answer shown cannot be used to change it. Scoring takes the
// locked answers (app/api/learn/quiz/submit). Sessions last a few hours.
// Table created at runtime; also in prisma/schema.prisma and dbprep.

const MAX_AGE_HOURS = 6;

let ready: Promise<void> | null = null;
export function ensureQuizSessionTable(): Promise<void> {
  ready ??= (async () => {
    await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "QuizSession" (
      "id" TEXT PRIMARY KEY,
      "studentId" TEXT NOT NULL,
      "mode" TEXT NOT NULL,
      "refId" TEXT NOT NULL,
      "questionIds" TEXT[] NOT NULL,
      "locks" JSONB NOT NULL DEFAULT '{}',
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "QuizSession_studentId_idx" ON "QuizSession" ("studentId")`);
  })().catch((err) => {
    ready = null;
    throw err;
  });
  return ready;
}

export type QuizMode = "micro" | "quiz";

/** A new session for the questions just served. Old ones of this learner are cleared. */
export async function openQuizSession(studentId: string, mode: QuizMode, refId: string, questionIds: string[]): Promise<string | null> {
  try {
    await ensureQuizSessionTable();
    await prisma.$executeRawUnsafe(`DELETE FROM "QuizSession" WHERE "studentId" = $1 AND "createdAt" < now() - interval '1 day'`, studentId);
    const id = randomUUID();
    await prisma.$executeRawUnsafe(
      `INSERT INTO "QuizSession" ("id","studentId","mode","refId","questionIds") VALUES ($1,$2,$3,$4,$5)`,
      id, studentId, mode, refId, questionIds,
    );
    return id;
  } catch (err) {
    console.error("[quiz-session] open", err instanceof Error ? err.message : err);
    return null;
  }
}

/**
 * Locks this answer unless the question already has one, and returns the
 * locked answer. Null when the session is not this learner's, has expired,
 * or did not serve this question.
 */
export async function lockAnswer(sessionId: string, studentId: string, mode: QuizMode, refId: string, questionId: string, choice: number): Promise<number | null> {
  await ensureQuizSessionTable();
  await prisma.$executeRawUnsafe(
    `UPDATE "QuizSession" SET "locks" = "locks" || jsonb_build_object($5::text, $6::int)
     WHERE "id" = $1 AND "studentId" = $2 AND "mode" = $3 AND "refId" = $4
       AND $5 = ANY("questionIds") AND NOT ("locks" ? $5)
       AND "createdAt" > now() - make_interval(hours => ${MAX_AGE_HOURS})`,
    sessionId, studentId, mode, refId, questionId, choice,
  );
  const rows = await prisma.$queryRawUnsafe<Array<{ v: string | null }>>(
    `SELECT "locks"->>$5 AS v FROM "QuizSession"
     WHERE "id" = $1 AND "studentId" = $2 AND "mode" = $3 AND "refId" = $4 AND "createdAt" > now() - make_interval(hours => ${MAX_AGE_HOURS})`,
    sessionId, studentId, mode, refId, questionId,
  );
  const v = rows[0]?.v;
  return v == null ? null : Number(v);
}

/** The locked answers of a live session (empty when none or not this learner's). */
export async function sessionLocks(sessionId: string, studentId: string, mode: QuizMode, refId: string): Promise<Record<string, number>> {
  try {
    await ensureQuizSessionTable();
    const rows = await prisma.$queryRawUnsafe<Array<{ locks: Record<string, number> }>>(
      `SELECT "locks" FROM "QuizSession" WHERE "id" = $1 AND "studentId" = $2 AND "mode" = $3 AND "refId" = $4`,
      sessionId, studentId, mode, refId,
    );
    const out: Record<string, number> = {};
    for (const [k, v] of Object.entries(rows[0]?.locks ?? {})) if (Number.isInteger(Number(v))) out[k] = Number(v);
    return out;
  } catch {
    return {};
  }
}
