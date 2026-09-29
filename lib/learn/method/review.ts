// Daily Review: spaced retrieval practice with Leitner boxes, no AI.
//
// Every micro-check question of a lesson the learner has completed, and every
// module-quiz question of a quiz they have passed, can become a review card.
// Quiz banks only join once the quiz is passed, so Daily Review can never
// reveal the answers of an assessment still ahead of the learner.
//
// A card moves up one box when answered correctly and back to box 1 when
// answered wrongly; each box has a longer interval before the card is due
// again. New cards join a few a day, so the daily session stays short.
//
// Hard rule, as for quizzes (lib/learn/assessments.ts): the correct answer and
// the explanation leave the server only in the reply to an answer.
import prisma from "@/lib/prisma";
import type { Locale } from "@/lib/i18n/config";
import { localizeQuestions, type QuestionKind } from "@/lib/i18n/sources/labs";
import { loadTrackSources, localizedTracks } from "@/lib/i18n/sources/learn";
import { seededShuffle, toOptions } from "@/lib/learn/assessments";
import { ensureMethodTables } from "./db";

/** Days until a card in box N (index N-1) is due again. */
export const BOX_INTERVAL_DAYS = [1, 3, 7, 16, 35] as const;
export const TOP_BOX = BOX_INTERVAL_DAYS.length;
/** Questions in one session: about five minutes. */
export const SESSION_SIZE = 8;
/** New cards introduced per day, on top of the ones already due. */
export const NEW_PER_DAY = 6;
/** Cards to answer before the day's review counts as done (fewer if fewer exist). */
export const MIN_FOR_COMPLETE = 5;

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
// A card due "in 1 day" should be ready tomorrow morning, not at this exact
// minute tomorrow, so due times are pulled a few hours earlier.
const DUE_SLACK = 4 * HOUR;

type ReviewKind = Extract<QuestionKind, "micro" | "quiz">;

interface BankQuestion {
  id: string;
  question: string;
  options: unknown;
  correctIndex: number;
  explanation: string;
}

interface Bank {
  kind: ReviewKind;
  sourceId: string;
  trackId: string;
  questions: BankQuestion[];
}

export interface ServedReviewQuestion {
  id: string;
  question: string;
  options: string[];
  box: number;
  isNew: boolean;
  trackId: string;
}

export interface ReviewAnswerResult {
  isCorrect: boolean;
  /** Index of the right option in the order the learner saw. */
  correctIndex: number;
  explanation: string;
  box: number;
  previousBox: number;
  dueAt: string;
  /** False when the card was not due (a second try in the same session). */
  counted: boolean;
}

export interface TrackStrength {
  trackId: string;
  title: string;
  /** 0..1: average box height of the track's cards. */
  strength: number;
  cards: number;
  mastered: number;
}

export interface ReviewSummary {
  dueNow: number;
  dueTomorrow: number;
  dueThisWeek: number;
  totalCards: number;
  nextDueAt: string | null;
  tracks: TrackStrength[];
}

/** Next due date for a card that has just landed in `box`. */
export function nextDue(box: number, from: Date = new Date()): Date {
  const days = BOX_INTERVAL_DAYS[Math.max(1, Math.min(TOP_BOX, box)) - 1];
  return new Date(from.getTime() + days * DAY - DUE_SLACK);
}

/** Leitner move: up one box when right, back to box 1 when wrong. */
export function moveCard(box: number, correct: boolean): number {
  return correct ? Math.min(TOP_BOX, box + 1) : 1;
}

/**
 * Options in the order shown for this round. The round is a random token the
 * server hands out with a session and the client sends back with each
 * answer; the order changes every session (so the learner recalls the idea,
 * not the position) while grading recomputes it without storing anything.
 */
function presentForRound(q: BankQuestion, studentId: string, round: string) {
  const opts = toOptions(q.options);
  const order = seededShuffle(
    opts.map((_, i) => i),
    `${studentId}:${q.id}:review:${round}`,
  );
  return { options: order.map((i) => opts[i]), correctIndex: order.indexOf(q.correctIndex), order };
}

// ── Question banks the learner may review ─────────────────────────────────

const QUESTION_SELECT = { id: true, question: true, options: true, correctIndex: true, explanation: true } as const;

/** Two queries whatever the learner's history. */
async function eligibleBanks(studentId: string, withText: boolean): Promise<Bank[]> {
  const questions = withText ? { select: QUESTION_SELECT } : { select: { id: true } };
  const [micro, quiz] = await Promise.all([
    prisma.microCheck.findMany({
      where: { lesson: { progress: { some: { studentId } } } },
      select: { id: true, lesson: { select: { module: { select: { trackId: true } } } }, questions },
    }),
    prisma.quiz.findMany({
      where: { attempts: { some: { studentId, passed: true } } },
      select: { id: true, module: { select: { trackId: true } }, questions },
    }),
  ]);
  return [
    ...micro.map((m) => ({
      kind: "micro" as const,
      sourceId: m.id,
      trackId: m.lesson.module.trackId,
      questions: m.questions as BankQuestion[],
    })),
    ...quiz.map((q) => ({
      kind: "quiz" as const,
      sourceId: q.id,
      trackId: q.module.trackId,
      questions: q.questions as BankQuestion[],
    })),
  ];
}

interface CardRow {
  id: string;
  questionId: string;
  box: number;
  dueAt: Date;
  createdAt: Date;
  trackId: string;
}

async function loadCards(studentId: string): Promise<CardRow[]> {
  return prisma.reviewCard.findMany({
    where: { studentId },
    select: { id: true, questionId: true, box: true, dueAt: true, createdAt: true, trackId: true },
  });
}

function plan(cards: CardRow[], banks: Bank[], now: Date) {
  const live = new Set(banks.flatMap((b) => b.questions.map((q) => q.id)));
  // Cards whose question was deleted from the bank are ignored.
  const current = cards.filter((c) => live.has(c.questionId));
  const due = current
    .filter((c) => c.dueAt.getTime() <= now.getTime())
    .sort((a, b) => a.box - b.box || a.dueAt.getTime() - b.dueAt.getTime());
  const carded = new Set(cards.map((c) => c.questionId));
  const addedRecently = cards.filter((c) => now.getTime() - c.createdAt.getTime() < 20 * HOUR).length;
  const allowance = Math.max(0, NEW_PER_DAY - addedRecently);
  const fresh: Array<{ bank: Bank; q: BankQuestion }> = [];
  for (const b of banks) for (const q of b.questions) if (!carded.has(q.id)) fresh.push({ bank: b, q });
  return { current, due, fresh, allowance };
}

// ── Status (dashboard card) ───────────────────────────────────────────────

export interface ReviewStatus {
  /** Cards to review today: due cards plus today's new ones. */
  due: number;
  totalCards: number;
  /** Anything to review at all (a completed lesson with a quick check). */
  available: boolean;
  doneToday: boolean;
}

export async function reviewStatus(studentId: string): Promise<ReviewStatus> {
  await ensureMethodTables();
  const now = new Date();
  const [cards, banks, done] = await Promise.all([
    loadCards(studentId),
    eligibleBanks(studentId, false),
    // The award is keyed on the learner's local date, which the server does
    // not know here; one in the last 20 hours is "today" for display.
    prisma.pointsLedger.findFirst({
      where: { studentId, source: "daily_review", createdAt: { gte: new Date(now.getTime() - 20 * HOUR) } },
      select: { id: true },
    }),
  ]);
  const { current, due, fresh, allowance } = plan(cards, banks, now);
  return {
    due: due.length + Math.min(fresh.length, allowance),
    totalCards: current.length,
    available: current.length + fresh.length > 0,
    doneToday: !!done,
  };
}

// ── A session ─────────────────────────────────────────────────────────────

export async function buildSession(
  studentId: string,
  locale: Locale,
  round: string,
): Promise<{ questions: ServedReviewQuestion[]; pending: boolean; remaining: number }> {
  await ensureMethodTables();
  const now = new Date();
  const [cards, banks] = await Promise.all([loadCards(studentId), eligibleBanks(studentId, true)]);
  const { due, fresh, allowance } = plan(cards, banks, now);

  const bankOf = new Map<string, Bank>();
  const questionOf = new Map<string, BankQuestion>();
  for (const b of banks) for (const q of b.questions) {
    bankOf.set(q.id, b);
    questionOf.set(q.id, q);
  }

  const pickedDue = due.slice(0, SESSION_SIZE);
  const room = Math.min(allowance, SESSION_SIZE - pickedDue.length);
  // New cards: a different mix each day, spread across banks.
  const pickedNew = room > 0 ? seededShuffle(fresh, `${studentId}:${round}:new`).slice(0, room) : [];

  if (pickedNew.length) {
    await prisma.reviewCard.createMany({
      data: pickedNew.map(({ bank, q }) => ({
        studentId,
        questionId: q.id,
        kind: bank.kind,
        sourceId: bank.sourceId,
        trackId: bank.trackId,
        box: 1,
        dueAt: now,
      })),
      skipDuplicates: true,
    });
  }

  const items = seededShuffle(
    [
      ...pickedDue.map((c) => ({ id: c.questionId, box: c.box, isNew: false })),
      ...pickedNew.map(({ q }) => ({ id: q.id, box: 1, isNew: true })),
    ],
    `${studentId}:${round}:order`,
  );

  // Translate per bank (the translation unit), only the chunks needed.
  const needByBank = new Map<string, { bank: Bank; ids: string[] }>();
  for (const it of items) {
    const b = bankOf.get(it.id)!;
    const e = needByBank.get(b.sourceId) ?? { bank: b, ids: [] };
    e.ids.push(it.id);
    needByBank.set(b.sourceId, e);
  }
  let pending = false;
  const localizedQ = new Map<string, BankQuestion>();
  await Promise.all(
    [...needByBank.values()].map(async ({ bank, ids }) => {
      const res = await localizeQuestions(bank.kind, bank.sourceId, bank.questions, locale, ids);
      if (res.pending) pending = true;
      for (const q of res.questions) if (ids.includes(q.id)) localizedQ.set(q.id, q);
    }),
  );

  const questions = items.map((it) => {
    const q = localizedQ.get(it.id) ?? questionOf.get(it.id)!;
    const shown = presentForRound(q, studentId, round);
    // Only the text and the shuffled options: no correct index, no explanation.
    return { id: q.id, question: q.question, options: shown.options, box: it.box, isNew: it.isNew, trackId: bankOf.get(it.id)!.trackId };
  });

  const remaining = Math.max(0, due.length - pickedDue.length);
  return { questions, pending, remaining };
}

// ── Answering one card ────────────────────────────────────────────────────

/**
 * Grade one answer. Only a card this learner already holds can be answered,
 * so the endpoint cannot be used to read the answer to any other question.
 * Returns null when there is no such card.
 */
export async function answerCard(
  studentId: string,
  questionId: string,
  choice: number,
  round: string,
  locale: Locale,
): Promise<ReviewAnswerResult | null> {
  await ensureMethodTables();
  const card = await prisma.reviewCard.findUnique({
    where: { studentId_questionId: { studentId, questionId } },
  });
  if (!card) return null;

  const kind = card.kind === "quiz" ? "quiz" : "micro";
  const bank: BankQuestion[] =
    kind === "quiz"
      ? await prisma.quizQuestion.findMany({ where: { quizId: card.sourceId }, select: QUESTION_SELECT })
      : await prisma.microCheckQuestion.findMany({ where: { microCheckId: card.sourceId }, select: QUESTION_SELECT });
  const raw = bank.find((q) => q.id === questionId);
  if (!raw) return null;

  // Same option order as served: translation keeps every option at its index.
  const { questions } = await localizeQuestions(kind, card.sourceId, bank, locale, [questionId]);
  const q = questions.find((x) => x.id === questionId) ?? raw;
  const shown = presentForRound(q, studentId, round);
  const isCorrect = choice === shown.correctIndex;

  const now = new Date();
  // A card answered again before it is due (a second try at the end of a
  // session, or a replayed request) gets feedback but does not move.
  const counted = card.dueAt.getTime() <= now.getTime();
  let box = card.box;
  let dueAt = card.dueAt;
  if (counted) {
    box = moveCard(card.box, isCorrect);
    dueAt = nextDue(box, now);
    // Conditional on the card still being due, so two simultaneous answers
    // cannot both move it.
    const res = await prisma.reviewCard.updateMany({
      where: { id: card.id, dueAt: { lte: now } },
      data: { box, dueAt, lastSeenAt: now, streak: isCorrect ? card.streak + 1 : 0 },
    });
    if (res.count === 0) {
      box = card.box;
      dueAt = card.dueAt;
    }
  }

  return {
    isCorrect,
    correctIndex: shown.correctIndex,
    explanation: q.explanation,
    box,
    previousBox: card.box,
    dueAt: dueAt.toISOString(),
    counted,
  };
}

/** Cards answered (and moved) in the last few hours: proof the review happened. */
export async function reviewedRecently(studentId: string): Promise<{ answered: number; total: number }> {
  await ensureMethodTables();
  const since = new Date(Date.now() - 6 * HOUR);
  const [answered, total] = await Promise.all([
    prisma.reviewCard.count({ where: { studentId, lastSeenAt: { gte: since } } }),
    prisma.reviewCard.count({ where: { studentId } }),
  ]);
  return { answered, total };
}

// ── Summary (finish screen, portfolio) ────────────────────────────────────

export async function reviewSummary(studentId: string, locale: Locale): Promise<ReviewSummary> {
  await ensureMethodTables();
  const now = Date.now();
  const cards = await prisma.reviewCard.findMany({
    where: { studentId },
    select: { box: true, dueAt: true, trackId: true },
  });
  const trackIds = [...new Set(cards.map((c) => c.trackId))];
  const sources = trackIds.length ? await loadTrackSources({ id: { in: trackIds } }) : [];
  const { texts } = await localizedTracks(sources, locale);
  const titleOf = new Map(sources.map((s) => [s.id, texts.get(s.slug)?.title ?? s.title]));

  const byTrack = new Map<string, { sum: number; n: number; top: number }>();
  let dueNow = 0;
  let dueTomorrow = 0;
  let dueThisWeek = 0;
  let next: number | null = null;
  for (const c of cards) {
    const t = byTrack.get(c.trackId) ?? { sum: 0, n: 0, top: 0 };
    t.sum += (c.box - 1) / (TOP_BOX - 1);
    t.n++;
    if (c.box === TOP_BOX) t.top++;
    byTrack.set(c.trackId, t);
    const d = c.dueAt.getTime();
    if (d <= now) dueNow++;
    else {
      if (d <= now + DAY) dueTomorrow++;
      if (d <= now + 7 * DAY) dueThisWeek++;
      next = next == null ? d : Math.min(next, d);
    }
  }
  const tracks = [...byTrack.entries()]
    .filter(([id]) => titleOf.has(id))
    .map(([trackId, v]) => ({
      trackId,
      title: titleOf.get(trackId)!,
      strength: v.n ? v.sum / v.n : 0,
      cards: v.n,
      mastered: v.top,
    }))
    .sort((a, b) => b.cards - a.cards);
  return {
    dueNow,
    dueTomorrow,
    dueThisWeek,
    totalCards: cards.length,
    nextDueAt: next == null ? null : new Date(next).toISOString(),
    tracks,
  };
}

/** YYYY-MM-DD from the client, accepted only within a day of the server's clock. */
export function validDay(day: unknown): string | null {
  if (typeof day !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(day)) return null;
  const t = Date.parse(`${day}T12:00:00Z`);
  if (Number.isNaN(t)) return null;
  return Math.abs(t - Date.now()) <= 38 * HOUR ? day : null;
}

export function serverDay(d: Date = new Date()): string {
  return d.toISOString().slice(0, 10);
}
