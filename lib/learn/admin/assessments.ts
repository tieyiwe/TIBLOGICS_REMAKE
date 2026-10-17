import prisma from "@/lib/prisma";

// Exam and quiz results for the admin: every attempt, per learner (the
// learner's Progress tab) and across all learners (Admin > AI Academy >
// Exams). Scores, dates and outcomes only: answers stay private to the
// learner. The attempt limit and cooldown follow app/api/learn/exam/start.

export type ExamOutcome = "distinction" | "passed" | "failed" | "expired" | "in_progress";

export interface ExamAttemptRow {
  id: string;
  attempt: number;
  startedAt: Date;
  submittedAt: Date | null;
  minutes: number | null;
  score: number | null;
  outcome: ExamOutcome;
  modules: Array<{ title: string; score: number }>;
}

export interface LearnerExam {
  trackId: string;
  trackTitle: string;
  trackSlug: string;
  examTitle: string;
  passScore: number;
  distinctionScore: number;
  maxAttempts: number;
  used: number;
  best: number | null;
  passed: boolean;
  /** When the next attempt opens (cooldown), if it has not yet. */
  nextAttemptAt: Date | null;
  attemptsLeft: number;
  attempts: ExamAttemptRow[];
}

export interface QuizAttemptRow {
  id: string;
  at: Date;
  trackTitle: string;
  moduleTitle: string;
  score: number;
  passed: boolean;
  passScore: number;
}

function outcomeOf(
  s: { status: string; passed: boolean | null; score: number | null; expiresAt: Date },
  distinctionScore: number,
  now = Date.now(),
): ExamOutcome {
  if (s.status === "in_progress") return s.expiresAt.getTime() > now ? "in_progress" : "expired";
  if (s.status === "expired") return "expired";
  if (s.passed) return (s.score ?? 0) >= distinctionScore ? "distinction" : "passed";
  return "failed";
}

const minutesBetween = (a: Date, b: Date | null) => (b ? Math.max(0, Math.round((b.getTime() - a.getTime()) / 60_000)) : null);

async function moduleTitles(ids: string[]): Promise<Map<string, string>> {
  if (!ids.length) return new Map();
  const rows = await prisma.learnModule.findMany({ where: { id: { in: ids } }, select: { id: true, title: true } });
  return new Map(rows.map((r) => [r.id, r.title]));
}

function moduleScores(raw: unknown, titles: Map<string, string>): Array<{ title: string; score: number }> {
  if (!raw || typeof raw !== "object") return [];
  return Object.entries(raw as Record<string, unknown>)
    .filter(([, v]) => typeof v === "number")
    .map(([id, v]) => ({ title: titles.get(id) ?? "Module", score: v as number }));
}

/** Every final exam attempt and quiz attempt of one learner. */
export async function learnerAssessments(studentId: string): Promise<{ exams: LearnerExam[]; quizzes: QuizAttemptRow[] }> {
  const [sessions, quizAttempts] = await Promise.all([
    prisma.finalExamSession.findMany({
      where: { studentId },
      orderBy: { startedAt: "desc" },
      take: 300,
      select: {
        id: true, status: true, startedAt: true, submittedAt: true, expiresAt: true, score: true, passed: true,
        attemptNumber: true, perModuleScores: true, finalExamId: true,
        finalExam: {
          select: {
            title: true, passScore: true, distinctionScore: true, maxAttempts: true, cooldownHours: true,
            track: { select: { id: true, title: true, slug: true } },
          },
        },
      },
    }),
    prisma.quizAttempt.findMany({
      where: { studentId },
      orderBy: { createdAt: "desc" },
      take: 300,
      select: {
        id: true, score: true, passed: true, createdAt: true,
        quiz: { select: { passScore: true, module: { select: { title: true, track: { select: { title: true } } } } } },
      },
    }),
  ]);

  const titles = await moduleTitles([
    ...new Set(sessions.flatMap((s) => (s.perModuleScores && typeof s.perModuleScores === "object" ? Object.keys(s.perModuleScores as object) : []))),
  ]);
  const now = Date.now();
  const byExam = new Map<string, typeof sessions>();
  for (const s of sessions) byExam.set(s.finalExamId, [...(byExam.get(s.finalExamId) ?? []), s]);

  const exams: LearnerExam[] = [...byExam.values()].map((list) => {
    const e = list[0].finalExam;
    const closed = list.filter((s) => s.status === "submitted" || s.status === "expired");
    const scores = list.map((s) => s.score).filter((x): x is number => x != null);
    const passed = list.some((s) => s.passed);
    const lastSubmitted = closed.find((s) => s.submittedAt)?.submittedAt ?? null;
    const readyAt = lastSubmitted ? lastSubmitted.getTime() + e.cooldownHours * 3600_000 : 0;
    return {
      trackId: e.track.id,
      trackTitle: e.track.title,
      trackSlug: e.track.slug,
      examTitle: e.title,
      passScore: e.passScore,
      distinctionScore: e.distinctionScore,
      maxAttempts: e.maxAttempts,
      used: closed.length,
      best: scores.length ? Math.max(...scores) : null,
      passed,
      nextAttemptAt: !passed && readyAt > now && closed.length < e.maxAttempts ? new Date(readyAt) : null,
      attemptsLeft: passed ? 0 : Math.max(0, e.maxAttempts - closed.length),
      attempts: list.map((s) => ({
        id: s.id,
        attempt: s.attemptNumber,
        startedAt: s.startedAt,
        submittedAt: s.submittedAt,
        minutes: minutesBetween(s.startedAt, s.submittedAt),
        score: s.score,
        outcome: outcomeOf(s, e.distinctionScore, now),
        modules: moduleScores(s.perModuleScores, titles),
      })),
    };
  });

  const quizzes: QuizAttemptRow[] = quizAttempts.map((q) => ({
    id: q.id,
    at: q.createdAt,
    trackTitle: q.quiz.module.track.title,
    moduleTitle: q.quiz.module.title,
    score: q.score,
    passed: q.passed,
    passScore: q.quiz.passScore,
  }));
  return { exams, quizzes };
}

export interface ExamResultRow {
  id: string;
  studentId: string;
  name: string;
  email: string;
  trackTitle: string;
  trackId: string;
  attempt: number;
  startedAt: Date;
  minutes: number | null;
  score: number | null;
  outcome: ExamOutcome;
}

export interface ExamTrackStats {
  trackId: string;
  trackTitle: string;
  attempts: number;
  learners: number;
  passed: number;
  passRate: number | null;
  averageScore: number | null;
}

export const OUTCOMES: ExamOutcome[] = ["distinction", "passed", "failed", "expired", "in_progress"];

/** All learners' exam attempts (newest first), with filters, and per-track stats. */
export async function examResults(f: { trackId?: string | null; outcome?: string | null; q?: string | null; days?: number | null; take?: number }) {
  const since = f.days ? new Date(Date.now() - f.days * 86_400_000) : null;
  const q = f.q?.trim().slice(0, 100) || null;
  const sessions = await prisma.finalExamSession.findMany({
    where: {
      ...(f.trackId ? { finalExam: { trackId: f.trackId } } : {}),
      ...(since ? { startedAt: { gte: since } } : {}),
      ...(q ? { student: { OR: [{ name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }] } } : {}),
    },
    orderBy: { startedAt: "desc" },
    take: Math.min(5000, f.take ?? 500),
    select: {
      id: true, status: true, startedAt: true, submittedAt: true, expiresAt: true, score: true, passed: true, attemptNumber: true, studentId: true,
      student: { select: { name: true, email: true } },
      finalExam: { select: { distinctionScore: true, track: { select: { id: true, title: true } } } },
    },
  });
  const now = Date.now();
  let rows: ExamResultRow[] = sessions.map((s) => ({
    id: s.id,
    studentId: s.studentId,
    name: s.student.name,
    email: s.student.email,
    trackTitle: s.finalExam.track.title,
    trackId: s.finalExam.track.id,
    attempt: s.attemptNumber,
    startedAt: s.startedAt,
    minutes: minutesBetween(s.startedAt, s.submittedAt),
    score: s.score,
    outcome: outcomeOf(s, s.finalExam.distinctionScore, now),
  }));
  if (f.outcome && (OUTCOMES as string[]).includes(f.outcome)) {
    rows = rows.filter((r) => (f.outcome === "passed" ? r.outcome === "passed" || r.outcome === "distinction" : r.outcome === f.outcome));
  }

  const stats = new Map<string, ExamTrackStats & { learnerSet: Set<string>; passSet: Set<string>; scoreSum: number; scored: number }>();
  for (const r of rows) {
    const s = stats.get(r.trackId) ?? { trackId: r.trackId, trackTitle: r.trackTitle, attempts: 0, learners: 0, passed: 0, passRate: null, averageScore: null, learnerSet: new Set(), passSet: new Set(), scoreSum: 0, scored: 0 };
    s.attempts++;
    s.learnerSet.add(r.studentId);
    if (r.outcome === "passed" || r.outcome === "distinction") s.passSet.add(r.studentId);
    if (r.score != null && r.outcome !== "in_progress") {
      s.scoreSum += r.score;
      s.scored++;
    }
    stats.set(r.trackId, s);
  }
  const trackStats: ExamTrackStats[] = [...stats.values()]
    .map((s) => ({
      trackId: s.trackId,
      trackTitle: s.trackTitle,
      attempts: s.attempts,
      learners: s.learnerSet.size,
      passed: s.passSet.size,
      passRate: s.learnerSet.size ? Math.round((s.passSet.size / s.learnerSet.size) * 100) : null,
      averageScore: s.scored ? Math.round(s.scoreSum / s.scored) : null,
    }))
    .sort((a, b) => b.attempts - a.attempts);
  return { rows, trackStats };
}

export const OUTCOME_LABEL: Record<ExamOutcome, string> = {
  distinction: "Passed with distinction",
  passed: "Passed",
  failed: "Not passed",
  expired: "Expired (not submitted)",
  in_progress: "In progress",
};
