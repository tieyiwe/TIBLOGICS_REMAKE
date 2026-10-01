// Weak spots: per-question correctness from module quizzes, micro-checks, the
// placement diagnostic and Daily Review, rolled up to a weakness score per
// module (the share of recent answers that were wrong, recent answers
// weighing more) and a count of the questions ("ideas") missed most recently.
//
// Nothing new is recorded for this: quiz and micro-check attempts already
// store the option chosen in the learner's presented order, which is
// deterministic (lib/learn/assessments.ts presentQuestion), so correctness is
// recomputed here on the server; diagnostic answers store it; Daily Review
// cards hold their last outcome (streak > 0 after a right answer, reset to 0
// by a wrong one).
import prisma from "@/lib/prisma";
import { presentQuestion } from "@/lib/learn/assessments";
import { ensureMasteryTables } from "./db";
import { signalWeight, WEAK_MIN_SIGNALS, WEAK_THRESHOLD } from "./rules";
import type { DiagAnswer } from "./diagnostic";

export interface ModuleWeakness {
  moduleId: string;
  trackId: string;
  /** 0..1, weighted share of wrong answers. */
  weakness: number;
  signals: number;
  /** Distinct questions whose latest answer was wrong. */
  missedIdeas: number;
  weak: boolean;
}

interface Signal {
  questionId: string;
  moduleId: string;
  trackId: string;
  correct: boolean;
  at: Date;
}

const LOOKBACK_DAYS = 120;
const MAX_ATTEMPTS = 200;

function answerMap(v: unknown): Record<string, number> {
  if (!v || typeof v !== "object" || Array.isArray(v)) return {};
  const out: Record<string, number> = {};
  for (const [k, n] of Object.entries(v as Record<string, unknown>)) if (typeof n === "number") out[k] = n;
  return out;
}

async function collectSignals(studentId: string, trackIds: string[] | null): Promise<Signal[]> {
  const since = new Date(Date.now() - LOOKBACK_DAYS * 86_400_000);
  const quizScope = trackIds ? { quiz: { module: { trackId: { in: trackIds } } } } : {};
  const microScope = trackIds ? { microCheck: { lesson: { module: { trackId: { in: trackIds } } } } } : {};
  const [quizAttempts, microAttempts, diags, cards] = await Promise.all([
    prisma.quizAttempt.findMany({
      where: { studentId, createdAt: { gte: since }, ...quizScope },
      orderBy: { createdAt: "desc" },
      take: MAX_ATTEMPTS,
      select: { answers: true, createdAt: true, quiz: { select: { moduleId: true, module: { select: { trackId: true } } } } },
    }),
    prisma.microCheckAttempt.findMany({
      where: { studentId, createdAt: { gte: since }, ...microScope },
      orderBy: { createdAt: "desc" },
      take: MAX_ATTEMPTS,
      select: {
        answers: true,
        createdAt: true,
        microCheck: { select: { lesson: { select: { moduleId: true, module: { select: { trackId: true } } } } } },
      },
    }),
    ensureMasteryTables()
      .then(() =>
        prisma.diagnosticSession.findMany({
          where: { studentId, createdAt: { gte: since }, ...(trackIds ? { trackId: { in: trackIds } } : {}) },
          select: { trackId: true, answers: true },
        }),
      )
      .catch(() => []),
    prisma.reviewCard
      .findMany({
        where: { studentId, lastSeenAt: { gte: since }, ...(trackIds ? { trackId: { in: trackIds } } : {}) },
        select: { questionId: true, kind: true, sourceId: true, trackId: true, streak: true, lastSeenAt: true },
      })
      .catch(() => []),
  ]);

  // Answer keys for every quiz / micro-check question answered.
  const quizQids = new Set<string>();
  for (const a of quizAttempts) for (const k of Object.keys(answerMap(a.answers))) quizQids.add(k);
  const microQids = new Set<string>();
  for (const a of microAttempts) for (const k of Object.keys(answerMap(a.answers))) microQids.add(k);
  const [quizQs, microQs] = await Promise.all([
    quizQids.size
      ? prisma.quizQuestion.findMany({ where: { id: { in: [...quizQids] } }, select: { id: true, options: true, correctIndex: true } })
      : [],
    microQids.size
      ? prisma.microCheckQuestion.findMany({ where: { id: { in: [...microQids] } }, select: { id: true, options: true, correctIndex: true } })
      : [],
  ]);
  const keyOf = new Map<string, number>();
  for (const q of [...quizQs, ...microQs]) keyOf.set(q.id, presentQuestion(q, studentId).correctIndex);

  const out: Signal[] = [];
  for (const a of quizAttempts) {
    for (const [qid, choice] of Object.entries(answerMap(a.answers))) {
      const key = keyOf.get(qid);
      if (key === undefined) continue;
      out.push({ questionId: qid, moduleId: a.quiz.moduleId, trackId: a.quiz.module.trackId, correct: key === choice, at: a.createdAt });
    }
  }
  for (const a of microAttempts) {
    const l = a.microCheck.lesson;
    for (const [qid, choice] of Object.entries(answerMap(a.answers))) {
      const key = keyOf.get(qid);
      if (key === undefined) continue;
      out.push({ questionId: qid, moduleId: l.moduleId, trackId: l.module.trackId, correct: key === choice, at: a.createdAt });
    }
  }
  for (const d of diags) {
    const answers = Array.isArray(d.answers) ? (d.answers as unknown as DiagAnswer[]) : [];
    for (const a of answers) out.push({ questionId: a.q, moduleId: a.moduleId, trackId: d.trackId, correct: !!a.correct, at: new Date(a.at) });
  }

  // Review cards: their module through the bank they came from.
  if (cards.length) {
    const quizIds = [...new Set(cards.filter((c) => c.kind === "quiz").map((c) => c.sourceId))];
    const microIds = [...new Set(cards.filter((c) => c.kind !== "quiz").map((c) => c.sourceId))];
    const [qm, mm] = await Promise.all([
      quizIds.length ? prisma.quiz.findMany({ where: { id: { in: quizIds } }, select: { id: true, moduleId: true } }) : [],
      microIds.length ? prisma.microCheck.findMany({ where: { id: { in: microIds } }, select: { id: true, lesson: { select: { moduleId: true } } } }) : [],
    ]);
    const moduleOf = new Map<string, string>([...qm.map((q) => [q.id, q.moduleId] as const), ...mm.map((m) => [m.id, m.lesson.moduleId] as const)]);
    for (const c of cards) {
      const moduleId = moduleOf.get(c.sourceId);
      if (!moduleId || !c.lastSeenAt) continue;
      out.push({ questionId: c.questionId, moduleId, trackId: c.trackId, correct: c.streak > 0, at: c.lastSeenAt });
    }
  }
  return out;
}

/**
 * Weakness per module the learner has answered questions in. `trackIds`
 * limits it to tracks the learner can open (null = all).
 */
export async function moduleWeakness(studentId: string, trackIds: string[] | null = null): Promise<Map<string, ModuleWeakness>> {
  const signals = await collectSignals(studentId, trackIds);
  const now = Date.now();
  const acc = new Map<string, { trackId: string; wrong: number; total: number; n: number; latest: Map<string, { at: number; correct: boolean }> }>();
  for (const s of signals) {
    const w = signalWeight(s.at, now);
    const m = acc.get(s.moduleId) ?? { trackId: s.trackId, wrong: 0, total: 0, n: 0, latest: new Map() };
    m.total += w;
    if (!s.correct) m.wrong += w;
    m.n++;
    const prev = m.latest.get(s.questionId);
    if (!prev || prev.at < s.at.getTime()) m.latest.set(s.questionId, { at: s.at.getTime(), correct: s.correct });
    acc.set(s.moduleId, m);
  }
  const out = new Map<string, ModuleWeakness>();
  for (const [moduleId, m] of acc) {
    const weakness = m.total > 0 ? m.wrong / m.total : 0;
    const missedIdeas = [...m.latest.values()].filter((x) => !x.correct).length;
    out.set(moduleId, {
      moduleId,
      trackId: m.trackId,
      weakness,
      signals: m.n,
      missedIdeas,
      weak: m.n >= WEAK_MIN_SIGNALS && weakness >= WEAK_THRESHOLD && missedIdeas > 0,
    });
  }
  return out;
}

/** Same, never throws (an empty map when it cannot be worked out). */
export async function safeModuleWeakness(studentId: string, trackIds: string[] | null = null) {
  try {
    return await moduleWeakness(studentId, trackIds);
  } catch (err) {
    console.error("[mastery] weakness", err);
    return new Map<string, ModuleWeakness>();
  }
}
