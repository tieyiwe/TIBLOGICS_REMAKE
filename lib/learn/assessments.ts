// Assessment engine shared logic (Part E3).
//
// Hard rule: correct answers and explanations NEVER leave the server before a
// submission is scored. Every "serve" function strips them; only the scoring
// functions read them.
import prisma from "@/lib/prisma";

export interface ServedQuestion {
  id: string;
  question: string;
  options: string[];
  /** Present on final exams so results can break down per module. */
  moduleId?: string | null;
}

export interface GradedQuestion extends ServedQuestion {
  yourAnswer: number | null;
  correctIndex: number;
  isCorrect: boolean;
  explanation: string;
}

/** Deterministic shuffle from a seed so a served set is reproducible. */
export function seededShuffle<T>(items: T[], seed: string): T[] {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const rand = () => {
    h ^= h << 13; h ^= h >>> 17; h ^= h << 5;
    return Math.abs(h) / 2147483647;
  };
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1)) % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function toOptions(raw: unknown): string[] {
  return Array.isArray(raw) ? raw.map((o) => String(o)) : [];
}

/**
 * A question with its options in this learner's order, and the correct index
 * remapped to match.
 *
 * Options used to be served in the order they were written, and they were
 * written with the right answer second: B was correct for 95-98% of questions,
 * so always picking B scored 98% on the AI Foundations final exam. Every
 * question is now shuffled per learner.
 *
 * Deterministic from (learner, question), so scoring recomputes the same order
 * without storing it — serve and score just both call this. The same learner
 * sees a question the same way each time, but the right answer's position
 * varies from question to question, which is what defeats pattern-guessing.
 * Both serving and scoring must work in this presented order; a raw
 * correctIndex never leaves the server.
 */
export function presentQuestion<T extends { id: string; options: unknown; correctIndex: number }>(
  q: T,
  learnerId: string,
): T {
  const opts = toOptions(q.options);
  const order = seededShuffle(
    opts.map((_, i) => i),
    `${learnerId}:${q.id}:options`,
  );
  return { ...q, options: order.map((i) => opts[i]), correctIndex: order.indexOf(q.correctIndex) };
}

/** Strip correct answers before sending to the client. */
export function serveQuestion(q: {
  id: string; question: string; options: unknown; moduleId?: string | null;
}): ServedQuestion {
  return {
    id: q.id,
    question: q.question,
    options: toOptions(q.options),
    ...(q.moduleId !== undefined ? { moduleId: q.moduleId } : {}),
  };
}

/**
 * Score a set of answers against the authoritative question rows.
 * `answers` maps questionId → chosen option index.
 */
export function scoreAnswers(
  questions: Array<{
    id: string; question: string; options: unknown; correctIndex: number;
    explanation: string; moduleId?: string | null;
  }>,
  answers: Record<string, number>,
): { score: number; correctCount: number; graded: GradedQuestion[] } {
  const graded: GradedQuestion[] = questions.map((q) => {
    const given = Object.prototype.hasOwnProperty.call(answers, q.id) ? Number(answers[q.id]) : null;
    const isCorrect = given === q.correctIndex;
    return {
      id: q.id,
      question: q.question,
      options: toOptions(q.options),
      moduleId: q.moduleId ?? null,
      yourAnswer: given,
      correctIndex: q.correctIndex,
      isCorrect,
      explanation: q.explanation,
    };
  });
  const correctCount = graded.filter((g) => g.isCorrect).length;
  const score = questions.length === 0 ? 0 : Math.round((correctCount / questions.length) * 100);
  return { score, correctCount, graded };
}

/** Per-module percentage breakdown for the final exam results screen. */
export function perModuleBreakdown(graded: GradedQuestion[]): Record<string, number> {
  const buckets: Record<string, { correct: number; total: number }> = {};
  for (const g of graded) {
    if (!g.moduleId) continue;
    buckets[g.moduleId] ??= { correct: 0, total: 0 };
    buckets[g.moduleId].total++;
    if (g.isCorrect) buckets[g.moduleId].correct++;
  }
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(buckets)) {
    out[k] = v.total === 0 ? 0 : Math.round((v.correct / v.total) * 100);
  }
  return out;
}

/**
 * Has this student passed every module quiz in the track?
 * This is what unlocks the final exam.
 */
export async function allModuleQuizzesPassed(studentId: string, trackId: string): Promise<boolean> {
  // Filtering the attempts through the quiz→module relation instead of an `in:`
  // list of quiz ids removes the dependency on the first query, so both run at
  // once. Same set of quizzes on both sides, so the counts still line up.
  const [quizCount, passed] = await Promise.all([
    prisma.quiz.count({ where: { module: { trackId } } }),
    prisma.quizAttempt.findMany({
      where: { studentId, passed: true, quiz: { module: { trackId } } },
      select: { quizId: true },
      distinct: ["quizId"],
    }),
  ]);
  if (quizCount === 0) return false;

  return passed.length === quizCount;
}

/** Every micro-check in the track attempted at least once (certification gate). */
export async function allMicroChecksAttempted(studentId: string, trackId: string): Promise<boolean> {
  // Relation filter rather than an `in:` list of ids, so the two run together.
  const [checkCount, attempted] = await Promise.all([
    prisma.microCheck.count({ where: { lesson: { module: { trackId } } } }),
    prisma.microCheckAttempt.findMany({
      where: { studentId, microCheck: { lesson: { module: { trackId } } } },
      select: { microCheckId: true },
      distinct: ["microCheckId"],
    }),
  ]);
  if (checkCount === 0) return true; // nothing to attempt
  return attempted.length === checkCount;
}

/** Has the final exam been passed? */
export async function finalExamPassed(studentId: string, trackId: string): Promise<boolean> {
  // The exam lookup existed only to get an id to filter sessions by; filtering
  // through the relation does it in one query. No exam for the track still means
  // no sessions, hence false.
  const pass = await prisma.finalExamSession.findFirst({
    where: { studentId, finalExam: { trackId }, passed: true },
    select: { id: true },
  });
  return !!pass;
}

/** Has the capstone been approved? */
export async function capstonePassed(studentId: string, trackId: string): Promise<boolean> {
  // Same as above: one relation-filtered query instead of id lookup then filter.
  const sub = await prisma.capstoneSubmission.findFirst({
    where: { studentId, capstone: { trackId }, status: "passed" },
    select: { id: true },
  });
  return !!sub;
}

/** All four certification gates (Part E3). */
export async function certificationStatus(studentId: string, trackId: string) {
  const [microChecks, quizzes, exam, capstone] = await Promise.all([
    allMicroChecksAttempted(studentId, trackId),
    allModuleQuizzesPassed(studentId, trackId),
    finalExamPassed(studentId, trackId),
    capstonePassed(studentId, trackId),
  ]);
  return {
    microChecks,
    quizzes,
    exam,
    capstone,
    eligible: microChecks && quizzes && exam && capstone,
  };
}
