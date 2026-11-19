// Shared exam finalisation used by both /api/learn/exam/submit and the
// expiry sweep cron, so a late submission and an auto-sweep score identically.
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { perModuleBreakdown, presentQuestion, scoreAnswers } from "./assessments";
import { awardPoints, getTotalPoints } from "./points";
import { checkLevelUp, notifyMilestone } from "./milestones";

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
  // Answers were saved against the learner's shuffled order (see
  // presentQuestion), so they are scored in that order too.
  const { score, graded } = scoreAnswers(
    served.map((q) => presentQuestion(q, session.studentId)),
    answers,
  );

  const passed = score >= exam.passScore;
  const distinction = score >= exam.distinctionScore;
  const perModule = perModuleBreakdown(graded);

  // Only an in-progress session is scored: the submit route, the start route
  // and the sweep can reach the same expired session at once.
  const claimed = await prisma.finalExamSession.updateMany({
    where: { id: sessionId, status: "in_progress" },
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
  const updated = await prisma.finalExamSession.findUniqueOrThrow({ where: { id: sessionId } });

  // Points on first pass only (ledger keeps this idempotent); none when
  // another request scored this session first.
  let pointsAwarded = 0;
  if (passed && claimed.count === 1) {
    const totalBefore = await getTotalPoints(session.studentId);
    pointsAwarded = distinction
      ? await awardPoints(session.studentId, "final_exam_distinction", exam.id)
      : await awardPoints(session.studentId, "final_exam_pass", exam.id);

    // awardPoints returns 0 when already granted, so a non-zero award is
    // exactly the first pass — the right moment to notify.
    if (pointsAwarded > 0) {
      notifyMilestone({
        studentId: session.studentId,
        kind: "exam_passed",
        trackId: exam.trackId,
        points: pointsAwarded,
      });
      checkLevelUp(session.studentId, totalBefore, totalBefore + pointsAwarded);
    }
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
