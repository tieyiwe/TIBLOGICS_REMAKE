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
  const quizzes = await prisma.quiz.findMany({
    where: { module: { trackId } },
    select: { id: true },
  });
  if (quizzes.length === 0) return false;

  const passed = await prisma.quizAttempt.findMany({
    where: { studentId, passed: true, quizId: { in: quizzes.map((q) => q.id) } },
    select: { quizId: true },
    distinct: ["quizId"],
  });
  return passed.length === quizzes.length;
}

/** Every micro-check in the track attempted at least once (certification gate). */
export async function allMicroChecksAttempted(studentId: string, trackId: string): Promise<boolean> {
  const checks = await prisma.microCheck.findMany({
    where: { lesson: { module: { trackId } } },
    select: { id: true },
  });
  if (checks.length === 0) return true; // nothing to attempt
  const attempted = await prisma.microCheckAttempt.findMany({
    where: { studentId, microCheckId: { in: checks.map((c) => c.id) } },
    select: { microCheckId: true },
    distinct: ["microCheckId"],
  });
  return attempted.length === checks.length;
}

/** Has the final exam been passed? */
export async function finalExamPassed(studentId: string, trackId: string): Promise<boolean> {
  const exam = await prisma.finalExam.findUnique({ where: { trackId }, select: { id: true } });
  if (!exam) return false;
  const pass = await prisma.finalExamSession.findFirst({
    where: { studentId, finalExamId: exam.id, passed: true },
    select: { id: true },
  });
  return !!pass;
}

/** Has the capstone been approved? */
export async function capstonePassed(studentId: string, trackId: string): Promise<boolean> {
  const capstone = await prisma.capstone.findUnique({ where: { trackId }, select: { id: true } });
  if (!capstone) return false;
  const sub = await prisma.capstoneSubmission.findFirst({
    where: { studentId, capstoneId: capstone.id, status: "passed" },
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
