import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { quizUnlocked } from "@/lib/learn/progress";
import { requireEntitledStudent } from "@/lib/learn/session";
import { presentQuestion, scoreAnswers } from "@/lib/learn/assessments";
import { awardPoints, getTotalPoints } from "@/lib/learn/points";
import { checkLevelUp, notifyMilestone } from "@/lib/learn/milestones";
import { getLocale, translatorFor } from "@/lib/i18n/server";
import { localizeQuestions } from "@/lib/i18n/sources/labs";
import { gameDelta, gameSnapshot } from "@/lib/learn/badges";

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
  const locale = await getLocale();
  const t = translatorFor(locale);

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: t("labs.api.invalidSubmission") }, { status: 400 });
  const { mode, id, answers } = parsed.data;

  const answeredIds = Object.keys(answers);
  if (answeredIds.length === 0) {
    return NextResponse.json({ error: t("labs.api.noAnswers") }, { status: 400 });
  }

  try {
    if (mode === "micro") {
      const check = await prisma.microCheck.findUnique({
        where: { id },
        include: { questions: true },
      });
      if (!check) return NextResponse.json({ error: t("labs.api.notFound") }, { status: 404 });

      // Only grade the questions that were actually served to this attempt.
      // Translation changes texts only: options stay at their stored index,
      // so the same choices score the same in every language.
      const bank = await localizeQuestions("micro", check.id, check.questions, locale, answeredIds);
      const served = bank.questions.filter((q) => answeredIds.includes(q.id));
      if (served.length === 0) return NextResponse.json({ error: t("labs.api.noMatching") }, { status: 400 });

      const { score, graded } = scoreAnswers(served.map((q) => presentQuestion(q, student.id)), answers);
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
      let game = gameDelta(null, null);
      if (passed && priorAttempts === 0) {
        const before = await gameSnapshot(student.id);
        pointsAwarded = await awardPoints(student.id, "micro_check_pass", id);
        if (pointsAwarded > 0) game = gameDelta(before, await gameSnapshot(student.id));
      }

      return NextResponse.json({ score, passed, passScore: check.passScore, graded, pointsAwarded, ...game });
    }

    // ── Module quiz ────────────────────────────────────────────────────────
    const quiz = await prisma.quiz.findUnique({ where: { id }, include: { questions: true } });
    if (!quiz) return NextResponse.json({ error: t("labs.api.notFound") }, { status: 404 });
    if (!(await quizUnlocked(student.id, quiz.id, quiz.moduleId))) {
      return NextResponse.json({ error: t("labs.api.finishLessonsFirst"), locked: true }, { status: 403 });
    }

    const bank = await localizeQuestions("quiz", quiz.id, quiz.questions, locale, answeredIds);
    const served = bank.questions.filter((q) => answeredIds.includes(q.id));
    if (served.length === 0) return NextResponse.json({ error: t("labs.api.noMatching") }, { status: 400 });

    const { score, graded } = scoreAnswers(served.map((q) => presentQuestion(q, student.id)), answers);
    const passed = score >= quiz.passScore;

    // Both look at attempts made BEFORE this one, so both must precede the
    // create below — but neither reads the other, so they go out together.
    const [priorAttempts, alreadyPassed] = await Promise.all([
      prisma.quizAttempt.count({
        where: { studentId: student.id, quizId: id },
      }),
      prisma.quizAttempt.findFirst({
        where: { studentId: student.id, quizId: id, passed: true },
        select: { id: true },
      }),
    ]);

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
    let game = gameDelta(null, null);
    if (passed && !alreadyPassed) {
      // The track lookup for the milestone email is independent of the points
      // total, so it rides along instead of waiting for the award to finish.
      const [totalBefore, mod, before] = await Promise.all([
        getTotalPoints(student.id),
        // First pass on this module is a genuine milestone worth an email
        prisma.quiz
          .findUnique({ where: { id }, select: { module: { select: { trackId: true } } } })
          .catch(() => null),
        gameSnapshot(student.id),
      ]);
      const perfectFirstTry = score === 100 && priorAttempts === 0;
      pointsAwarded = perfectFirstTry
        ? await awardPoints(student.id, "quiz_perfect", id)
        : await awardPoints(student.id, "quiz_pass", id);

      notifyMilestone({
        studentId: student.id,
        kind: "module_quiz_passed",
        trackId: mod?.module.trackId,
        points: pointsAwarded,
      });
      checkLevelUp(student.id, totalBefore, totalBefore + pointsAwarded);
      if (pointsAwarded > 0) game = gameDelta(before, await gameSnapshot(student.id));
    }

    return NextResponse.json({ score, passed, passScore: quiz.passScore, graded, pointsAwarded, ...game });
  } catch (err) {
    console.error("[POST /api/learn/quiz/submit]", err);
    return NextResponse.json({ error: t("labs.api.scoreSubmissionFailed") }, { status: 500 });
  }
}
