import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireEntitledStudent } from "@/lib/learn/session";
import { scoreAnswers } from "@/lib/learn/assessments";
import { awardPoints, getTotalPoints } from "@/lib/learn/points";
import { checkLevelUp, notifyMilestone } from "@/lib/learn/milestones";

// Scores micro-checks (mode: "micro") and module quizzes (mode: "quiz").
// Correct answers are read here and NOWHERE else — the client never receives
// them before submitting.
const Body = z.object({
  mode: z.enum(["micro", "quiz"]),
  id: z.string().min(1),                       // microCheckId | quizId
  answers: z.record(z.string(), z.number().int().min(0).max(10)),
});

export async function POST(req: NextRequest) {
  const { error, student } = await requireEntitledStudent();
  if (error) return error;

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid submission" }, { status: 400 });
  const { mode, id, answers } = parsed.data;

  const answeredIds = Object.keys(answers);
  if (answeredIds.length === 0) {
    return NextResponse.json({ error: "No answers submitted" }, { status: 400 });
  }

  try {
    if (mode === "micro") {
      const check = await prisma.microCheck.findUnique({
        where: { id },
        include: { questions: true },
      });
      if (!check) return NextResponse.json({ error: "Not found" }, { status: 404 });

      // Only grade the questions that were actually served to this attempt
      const served = check.questions.filter((q) => answeredIds.includes(q.id));
      if (served.length === 0) return NextResponse.json({ error: "No matching questions" }, { status: 400 });

      const { score, graded } = scoreAnswers(served, answers);
      const passed = score >= check.passScore;

      const priorAttempts = await prisma.microCheckAttempt.count({
        where: { studentId: student.id, microCheckId: id },
      });

      await prisma.microCheckAttempt.create({
        data: {
          studentId: student.id,
          microCheckId: id,
          score,
          passed,
          answers: answers as unknown as Prisma.InputJsonValue,
        },
      });

      // +5 only for a first-attempt pass (idempotent via ledger constraint)
      let pointsAwarded = 0;
      if (passed && priorAttempts === 0) {
        pointsAwarded = await awardPoints(student.id, "micro_check_pass", id);
      }

      return NextResponse.json({ score, passed, passScore: check.passScore, graded, pointsAwarded });
    }

    // ── Module quiz ────────────────────────────────────────────────────────
    const quiz = await prisma.quiz.findUnique({ where: { id }, include: { questions: true } });
    if (!quiz) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const served = quiz.questions.filter((q) => answeredIds.includes(q.id));
    if (served.length === 0) return NextResponse.json({ error: "No matching questions" }, { status: 400 });

    const { score, graded } = scoreAnswers(served, answers);
    const passed = score >= quiz.passScore;

    const priorAttempts = await prisma.quizAttempt.count({
      where: { studentId: student.id, quizId: id },
    });
    const alreadyPassed = await prisma.quizAttempt.findFirst({
      where: { studentId: student.id, quizId: id, passed: true },
      select: { id: true },
    });

    await prisma.quizAttempt.create({
      data: {
        studentId: student.id,
        quizId: id,
        score,
        passed,
        answers: answers as unknown as Prisma.InputJsonValue,
      },
    });

    // Only the FIRST pass awards points. Perfect first attempt → +75 instead of +50.
    let pointsAwarded = 0;
    if (passed && !alreadyPassed) {
      const totalBefore = await getTotalPoints(student.id);
      const perfectFirstTry = score === 100 && priorAttempts === 0;
      pointsAwarded = perfectFirstTry
        ? await awardPoints(student.id, "quiz_perfect", id)
        : await awardPoints(student.id, "quiz_pass", id);

      // First pass on this module is a genuine milestone worth an email
      const mod = await prisma.quiz
        .findUnique({ where: { id }, select: { module: { select: { trackId: true } } } })
        .catch(() => null);
      notifyMilestone({
        studentId: student.id,
        kind: "module_quiz_passed",
        trackId: mod?.module.trackId,
        points: pointsAwarded,
      });
      checkLevelUp(student.id, totalBefore, totalBefore + pointsAwarded);
    }

    return NextResponse.json({ score, passed, passScore: quiz.passScore, graded, pointsAwarded });
  } catch (err) {
    console.error("[POST /api/learn/quiz/submit]", err);
    return NextResponse.json({ error: "Could not score submission" }, { status: 500 });
  }
}
