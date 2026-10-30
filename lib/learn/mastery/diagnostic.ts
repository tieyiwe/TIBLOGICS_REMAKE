// Placement diagnostic: "Find your starting point" for a track.
//
// An adaptive check of 2 to 3 questions per module, drawn from the module's
// quiz bank and its lessons' micro-check banks. One question is served at a
// time; the next one depends on the answers so far (lib/learn/mastery/rules.ts
// needsMore). Hard rule, as for quizzes (lib/learn/assessments.ts): the answer
// key and explanations never leave the server. The diagnostic does not even
// say whether an answer was right, because its questions come from the same
// banks as the module quizzes a learner may then test out with; the results
// are per module only.
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import type { Locale } from "@/lib/i18n/config";
import { localizeQuestions } from "@/lib/i18n/sources/labs";
import { presentQuestion, seededShuffle, serveQuestion, type ServedQuestion } from "@/lib/learn/assessments";
import { ensureMasteryTables } from "./db";
import {
  DIAG_MAX_PER_MODULE,
  DIAG_RETAKE_MS,
  DIAG_STALE_MS,
  levelFor,
  needsMore,
  plannedQuestions,
  scoreFor,
  type MasteryLevel,
} from "./rules";

type Kind = "quiz" | "micro";

interface PoolItem {
  id: string;
  kind: Kind;
  /** quizId or microCheckId: the bank (and translation unit) it belongs to. */
  src: string;
}

interface Plan {
  modules: Array<{ moduleId: string; pool: PoolItem[] }>;
}

export interface DiagAnswer {
  q: string;
  moduleId: string;
  kind: Kind;
  src: string;
  correct: boolean;
  at: string;
}

export interface ModuleResult {
  moduleId: string;
  level: MasteryLevel;
  correct: number;
  asked: number;
  score: number;
}

export interface DiagnosticState {
  sessionId: string;
  question: (ServedQuestion & { moduleId: string }) | null;
  answered: number;
  planned: number;
  pending: boolean;
  done: boolean;
  results: ModuleResult[] | null;
}

export type StartResult =
  | { ok: true; state: DiagnosticState }
  | { ok: false; reason: "empty" | "wait"; retakeAt?: string };

const QSEL = { id: true, question: true, options: true, correctIndex: true, explanation: true } as const;

function asPlan(v: unknown): Plan {
  const p = v as Plan;
  return { modules: Array.isArray(p?.modules) ? p.modules : [] };
}
function asAnswers(v: unknown): DiagAnswer[] {
  return Array.isArray(v) ? (v as DiagAnswer[]) : [];
}

/** Up to 3 questions per module, mixed from quiz and micro-check banks. */
async function buildPlan(studentId: string, trackId: string): Promise<Plan> {
  const modules = await prisma.learnModule.findMany({
    where: { trackId },
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      quiz: { select: { id: true, questions: { select: { id: true } } } },
      lessons: { select: { microCheck: { select: { id: true, questions: { select: { id: true } } } } } },
    },
  });
  const seed = `${studentId}:${trackId}:diag:${Date.now()}`;
  return {
    modules: modules
      .map((m) => {
        const quiz: PoolItem[] = (m.quiz?.questions ?? []).map((q) => ({ id: q.id, kind: "quiz" as const, src: m.quiz!.id }));
        const micro: PoolItem[] = m.lessons.flatMap((l) =>
          (l.microCheck?.questions ?? []).map((q) => ({ id: q.id, kind: "micro" as const, src: l.microCheck!.id })),
        );
        // Alternate quiz and micro-check questions so a module is probed
        // from both its end-of-module view and its lessons.
        const a = seededShuffle(quiz, `${seed}:${m.id}:q`);
        const b = seededShuffle(micro, `${seed}:${m.id}:m`);
        const pool: PoolItem[] = [];
        for (let i = 0; pool.length < DIAG_MAX_PER_MODULE && (i < a.length || i < b.length); i++) {
          if (i < a.length) pool.push(a[i]);
          if (pool.length < DIAG_MAX_PER_MODULE && i < b.length) pool.push(b[i]);
        }
        return { moduleId: m.id, pool };
      })
      .filter((m) => m.pool.length > 0),
  };
}

function progressOf(plan: Plan, answers: DiagAnswer[]) {
  let planned = 0;
  let next: { item: PoolItem; moduleId: string } | null = null;
  for (const m of plan.modules) {
    const mine = answers.filter((a) => a.moduleId === m.moduleId);
    const correct = mine.filter((a) => a.correct).length;
    planned += plannedQuestions(mine.length, correct, m.pool.length);
    if (!next && needsMore(mine.length, correct, m.pool.length)) {
      next = { item: m.pool[mine.length], moduleId: m.moduleId };
    }
  }
  return { planned, next, answered: answers.length };
}

export function resultsOf(plan: Plan, answers: DiagAnswer[]): ModuleResult[] {
  return plan.modules.map((m) => {
    const mine = answers.filter((a) => a.moduleId === m.moduleId);
    const correct = mine.filter((a) => a.correct).length;
    return { moduleId: m.moduleId, level: levelFor(mine.length, correct), correct, asked: mine.length, score: scoreFor(mine.length, correct) };
  });
}

async function loadQuestion(item: PoolItem, studentId: string, locale: Locale) {
  const bank =
    item.kind === "quiz"
      ? await prisma.quizQuestion.findMany({ where: { quizId: item.src }, select: QSEL })
      : await prisma.microCheckQuestion.findMany({ where: { microCheckId: item.src }, select: QSEL });
  const raw = bank.find((q) => q.id === item.id);
  if (!raw) return null;
  // Translation keeps every option at its stored index, so the per-learner
  // shuffle and the key line up in every language.
  const { questions, pending } = await localizeQuestions(item.kind, item.src, bank, locale, [item.id]);
  const q = questions.find((x) => x.id === item.id) ?? raw;
  return { presented: presentQuestion(q, studentId), pending };
}

async function stateOf(
  session: { id: string; plan: unknown; answers: unknown; status: string },
  studentId: string,
  locale: Locale,
): Promise<DiagnosticState> {
  const plan = asPlan(session.plan);
  const answers = asAnswers(session.answers);
  const { planned, next, answered } = progressOf(plan, answers);
  if (session.status === "completed" || !next) {
    return { sessionId: session.id, question: null, answered, planned: answered, pending: false, done: true, results: resultsOf(plan, answers) };
  }
  const loaded = await loadQuestion(next.item, studentId, locale);
  if (!loaded) {
    // The question left the bank since the plan was made: count it as not
    // asked by dropping it from the plan, and move on.
    const fixed: Plan = {
      modules: plan.modules.map((m) => (m.moduleId === next.moduleId ? { ...m, pool: m.pool.filter((p) => p.id !== next.item.id) } : m)),
    };
    await prisma.diagnosticSession.update({ where: { id: session.id }, data: { plan: fixed as unknown as Prisma.InputJsonValue } });
    return stateOf({ ...session, plan: fixed }, studentId, locale);
  }
  // Only the text and the shuffled options: no key, no explanation.
  const served = serveQuestion(loaded.presented);
  return {
    sessionId: session.id,
    question: { ...served, moduleId: next.moduleId },
    answered,
    planned,
    pending: loaded.pending,
    done: false,
    results: null,
  };
}

/** The latest diagnostic for the track page: finished, running or none. */
export async function diagnosticStatus(studentId: string, trackId: string) {
  await ensureMasteryTables();
  const [running, last] = await Promise.all([
    prisma.diagnosticSession.findFirst({
      where: { studentId, trackId, status: "in_progress", createdAt: { gte: new Date(Date.now() - DIAG_STALE_MS) } },
      orderBy: { createdAt: "desc" },
      select: { id: true, answers: true },
    }),
    prisma.diagnosticSession.findFirst({
      where: { studentId, trackId, status: "completed" },
      orderBy: { completedAt: "desc" },
      select: { completedAt: true },
    }),
  ]);
  const completedAt = last?.completedAt ?? null;
  const retakeAt = completedAt ? new Date(completedAt.getTime() + DIAG_RETAKE_MS) : null;
  return {
    inProgress: !!running,
    answeredSoFar: running ? asAnswers(running.answers).length : 0,
    completedAt,
    retakeAt,
    canStart: !!running || !retakeAt || retakeAt.getTime() <= Date.now(),
  };
}

/** Resume the running diagnostic, or start one if allowed. */
export async function startDiagnostic(studentId: string, trackId: string, locale: Locale): Promise<StartResult> {
  await ensureMasteryTables();
  const now = Date.now();
  const running = await prisma.diagnosticSession.findFirst({
    where: { studentId, trackId, status: "in_progress" },
    orderBy: { createdAt: "desc" },
  });
  if (running && running.createdAt.getTime() >= now - DIAG_STALE_MS) {
    return { ok: true, state: await stateOf(running, studentId, locale) };
  }
  if (running) {
    await prisma.diagnosticSession.updateMany({ where: { studentId, trackId, status: "in_progress" }, data: { status: "abandoned" } });
  }
  const last = await prisma.diagnosticSession.findFirst({
    where: { studentId, trackId, status: "completed" },
    orderBy: { completedAt: "desc" },
    select: { completedAt: true },
  });
  if (last?.completedAt && last.completedAt.getTime() + DIAG_RETAKE_MS > now) {
    return { ok: false, reason: "wait", retakeAt: new Date(last.completedAt.getTime() + DIAG_RETAKE_MS).toISOString() };
  }
  const plan = await buildPlan(studentId, trackId);
  if (plan.modules.length === 0) return { ok: false, reason: "empty" };
  const session = await prisma.diagnosticSession.create({
    data: { studentId, trackId, plan: plan as unknown as Prisma.InputJsonValue, answers: [] },
  });
  return { ok: true, state: await stateOf(session, studentId, locale) };
}

/**
 * Grade one answer. Only the question the session is waiting for can be
 * answered (anything else is refused), and the reply never says whether it
 * was right. Returns null when there is no such running session.
 */
export async function answerDiagnostic(
  studentId: string,
  sessionId: string,
  questionId: string,
  choice: number,
  locale: Locale,
): Promise<{ state: DiagnosticState; trackId: string } | { error: "stale" } | null> {
  await ensureMasteryTables();
  const session = await prisma.diagnosticSession.findFirst({ where: { id: sessionId, studentId } });
  if (!session) return null;
  if (session.status !== "in_progress") {
    return { state: await stateOf(session, studentId, locale), trackId: session.trackId };
  }
  const plan = asPlan(session.plan);
  const answers = asAnswers(session.answers);
  const { next } = progressOf(plan, answers);
  if (!next || next.item.id !== questionId) return { error: "stale" };

  const bank =
    next.item.kind === "quiz"
      ? await prisma.quizQuestion.findMany({ where: { quizId: next.item.src }, select: QSEL })
      : await prisma.microCheckQuestion.findMany({ where: { microCheckId: next.item.src }, select: QSEL });
  const raw = bank.find((q) => q.id === questionId);
  if (!raw) return { error: "stale" };
  const correct = choice === presentQuestion(raw, studentId).correctIndex;

  const updated: DiagAnswer[] = [
    ...answers,
    { q: questionId, moduleId: next.moduleId, kind: next.item.kind, src: next.item.src, correct, at: new Date().toISOString() },
  ];
  const finished = !progressOf(plan, updated).next;
  // Conditional on the answer count, so a replayed request cannot add twice.
  const res = await prisma.diagnosticSession.updateMany({
    where: { id: session.id, status: "in_progress", answers: { equals: session.answers as Prisma.InputJsonValue } },
    data: {
      answers: updated as unknown as Prisma.InputJsonValue,
      ...(finished ? { status: "completed", completedAt: new Date() } : {}),
    },
  });
  if (res.count === 0) return { error: "stale" };

  if (finished) await saveEstimates(studentId, session.trackId, resultsOf(plan, updated));
  const fresh = { ...session, answers: updated, status: finished ? "completed" : "in_progress" };
  return { state: await stateOf(fresh, studentId, locale), trackId: session.trackId };
}

async function saveEstimates(studentId: string, trackId: string, results: ModuleResult[]) {
  await prisma.$transaction(
    results.map((r) =>
      prisma.masteryEstimate.upsert({
        where: { studentId_moduleId: { studentId, moduleId: r.moduleId } },
        create: { studentId, trackId, moduleId: r.moduleId, level: r.level, score: r.score, correct: r.correct, asked: r.asked, source: "diagnostic" },
        update: { level: r.level, score: r.score, correct: r.correct, asked: r.asked, source: "diagnostic" },
      }),
    ),
  );
}

/** Estimates for a track, keyed by module id. */
export async function trackEstimates(studentId: string, trackId: string) {
  try {
    await ensureMasteryTables();
    const rows = await prisma.masteryEstimate.findMany({
      where: { studentId, trackId },
      select: { moduleId: true, level: true, score: true, correct: true, asked: true, updatedAt: true },
    });
    return new Map(rows.map((r) => [r.moduleId, { ...r, level: r.level as MasteryLevel }]));
  } catch (err) {
    console.error("[mastery] estimates", err);
    return new Map<string, { moduleId: string; level: MasteryLevel; score: number; correct: number; asked: number; updatedAt: Date }>();
  }
}
