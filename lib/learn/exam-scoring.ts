// Shared exam finalisation used by both /api/learn/exam/submit and the
// expiry sweep cron, so a late submission and an auto-sweep score identically.
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { perModuleBreakdown, scoreAnswers } from "./assessments";
import { awardPoints } from "./points";

export async function finaliseExamSession(sessionId: string, lateSubmission = false) {
  const session = await prisma.finalExamSession.findUnique({
    where: { id: sessionId },
    include: { finalExam: { include: { questions: true } } },
  });
  if (!session) return null;
  if (session.status !== "in_progress") return session;

  const exam = session.finalExam;
  const ids = Array.isArray(session.questionIds) ? (session.questionIds as string[]) : [];
  const byId = new Map(exam.questions.map((q) => [q.id, q]));
  const served = ids.map((id) => byId.get(id)).filter(Boolean) as typeof exam.questions;

  const answers = (session.answers ?? {}) as Record<string, number>;
  const { score, graded } = scoreAnswers(served, answers);

  const passed = score >= exam.passScore;
  const distinction = score >= exam.distinctionScore;
  const perModule = perModuleBreakdown(graded);

  const updated = await prisma.finalExamSession.update({
    where: { id: sessionId },
    data: {
      // A submission that arrives after expiry is still scored on the answers
      // saved up to expiry — marked `expired`, never discarded.
      status: lateSubmission ? "expired" : "submitted",
      submittedAt: new Date(),
      score,
      passed,
      perModuleScores: perModule as unknown as Prisma.InputJsonValue,
    },
  });

  // Points on first pass only (ledger keeps this idempotent)
  let pointsAwarded = 0;
  if (passed) {
    pointsAwarded = distinction
      ? await awardPoints(session.studentId, "final_exam_distinction", exam.id)
      : await awardPoints(session.studentId, "final_exam_pass", exam.id);
  }

  return Object.assign(updated, {
    graded,
    distinction,
    pointsAwarded,
    passScore: exam.passScore,
    distinctionScore: exam.distinctionScore,
    perModuleScores: perModule,
  });
}
