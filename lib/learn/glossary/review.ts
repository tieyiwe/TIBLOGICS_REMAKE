import prisma from "@/lib/prisma";
import type { Locale } from "@/lib/i18n/config";
import { GLOSSARY } from "./terms";
import { termDef, termName } from "./match";
import { moveCard, nextDue } from "@/lib/learn/method/review";

// Glossary cards in the Daily Review. Opening a term's pop-up in a lesson
// (components/learn/glossary/GlossaryContext.tsx) records it here; the term
// then comes back as a flip card on /learn/review, spaced with the same
// Leitner boxes as the question cards (1, 3, 7, 16, 35 days). The learner
// grades themselves ("I knew it" / "Not yet"), so the definition can be sent
// with the card: there is nothing to give away.
// Table created at runtime; also in prisma/schema.prisma and dbprep.

/** Glossary cards in one sitting, on top of the question cards. */
export const GLOSSARY_SESSION_SIZE = 5;

let ready: Promise<void> | null = null;
export function ensureGlossarySeenTable(): Promise<void> {
  ready ??= (async () => {
    await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "GlossarySeen" (
      "studentId" TEXT NOT NULL,
      "termId" TEXT NOT NULL,
      "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "lastReviewedAt" TIMESTAMP(3),
      "box" INTEGER NOT NULL DEFAULT 1,
      "dueAt" TIMESTAMP(3) NOT NULL,
      CONSTRAINT "GlossarySeen_pkey" PRIMARY KEY ("studentId","termId")
    )`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "GlossarySeen_studentId_dueAt_idx" ON "GlossarySeen" ("studentId", "dueAt")`);
  })().catch((err) => {
    ready = null;
    throw err;
  });
  return ready;
}

const TERM_IDS = new Set(GLOSSARY.map((t) => t.id));
const termById = new Map(GLOSSARY.map((t) => [t.id, t]));

export function isGlossaryTerm(id: string): boolean {
  return TERM_IDS.has(id);
}

/** First time this learner opens the term: it joins the review, due tomorrow. Later opens change nothing. */
export async function recordSeen(studentId: string, termId: string): Promise<void> {
  await ensureGlossarySeenTable();
  await prisma.$executeRawUnsafe(
    `INSERT INTO "GlossarySeen" ("studentId","termId","box","dueAt") VALUES ($1,$2,1,$3) ON CONFLICT DO NOTHING`,
    studentId, termId, nextDue(1),
  );
}

export interface GlossaryStatus {
  due: number;
  total: number;
  /** When the next card is due, if none is due now. */
  nextDueAt: string | null;
}

export async function glossaryStatus(studentId: string): Promise<GlossaryStatus> {
  await ensureGlossarySeenTable();
  const rows = await prisma.$queryRawUnsafe<Array<{ termId: string; dueAt: Date }>>(
    `SELECT "termId", "dueAt" FROM "GlossarySeen" WHERE "studentId" = $1`,
    studentId,
  );
  const now = Date.now();
  // A term removed from the glossary is ignored.
  const live = rows.filter((r) => TERM_IDS.has(r.termId));
  const due = live.filter((r) => r.dueAt.getTime() <= now).length;
  const later = live.map((r) => r.dueAt.getTime()).filter((d) => d > now);
  return { due, total: live.length, nextDueAt: !due && later.length ? new Date(Math.min(...later)).toISOString() : null };
}

export interface GlossaryCard {
  id: string;
  term: string;
  def: string;
  box: number;
}

/** Up to GLOSSARY_SESSION_SIZE due terms, lowest box first, in the learner's language. */
export async function dueGlossaryCards(studentId: string, locale: Locale): Promise<{ cards: GlossaryCard[]; due: number }> {
  await ensureGlossarySeenTable();
  const rows = await prisma.$queryRawUnsafe<Array<{ termId: string; box: number }>>(
    `SELECT "termId", "box" FROM "GlossarySeen" WHERE "studentId" = $1 AND "dueAt" <= $2 ORDER BY "box" ASC, "dueAt" ASC LIMIT 200`,
    studentId, new Date(),
  );
  const live = rows.filter((r) => TERM_IDS.has(r.termId));
  const cards = live.slice(0, GLOSSARY_SESSION_SIZE).map((r) => {
    const t = termById.get(r.termId)!;
    return { id: t.id, term: termName(t, locale), def: termDef(t, locale), box: Number(r.box) };
  });
  return { cards, due: live.length };
}

/**
 * The learner's own grade for one due term. Null when the term is not in
 * their deck or not due (a replayed request does not move it twice).
 */
export async function answerGlossaryCard(studentId: string, termId: string, knew: boolean): Promise<{ box: number; dueAt: string } | null> {
  await ensureGlossarySeenTable();
  const now = new Date();
  const rows = await prisma.$queryRawUnsafe<Array<{ box: number }>>(
    `SELECT "box" FROM "GlossarySeen" WHERE "studentId" = $1 AND "termId" = $2 AND "dueAt" <= $3`,
    studentId, termId, now,
  );
  if (!rows[0]) return null;
  const box = moveCard(Number(rows[0].box), knew);
  const dueAt = nextDue(box, now);
  // Conditional on the card still being due, so two answers cannot both move it.
  const n = await prisma.$executeRawUnsafe(
    `UPDATE "GlossarySeen" SET "box" = $3, "dueAt" = $4, "lastReviewedAt" = $5
     WHERE "studentId" = $1 AND "termId" = $2 AND "dueAt" <= $5`,
    studentId, termId, box, dueAt, now,
  );
  return n ? { box, dueAt: dueAt.toISOString() } : null;
}
