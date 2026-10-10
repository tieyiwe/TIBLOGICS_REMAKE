import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { quizUnlocked } from "@/lib/learn/progress";
import { denyTrack, requireEntitledStudent } from "@/lib/learn/session";
import { trackOfMicroCheck, trackOfQuiz } from "@/lib/learn/track-of";
import { presentQuestion } from "@/lib/learn/assessments";
import { getLocale, translatorFor } from "@/lib/i18n/server";
import { localizeQuestions } from "@/lib/i18n/sources/labs";
import { lockAnswer } from "@/lib/learn/quiz-session";

// Instant feedback for one answer of a module quiz or micro-check: locks the
// first answer picked (lib/learn/quiz-session.ts), then says whether it is
// right, which option is, and why. Final exams do not use this.
const Body = z.object({
  mode: z.enum(["micro", "quiz"]),
  id: z.string().min(1).max(64),
  session: z.string().uuid(),
  questionId: z.string().min(1).max(64),
  choice: z.number().int().min(0).max(10),
});

export async function POST(req: NextRequest) {
  const { error, student, access } = await requireEntitledStudent();
  if (error) return error;
  const t = translatorFor(await getLocale());
  if (!(await checkRateLimit(`quiz-check:${student.id}`, 240, 60_000))) {
    return NextResponse.json({ error: t("learn.api.tooMany") }, { status: 429 });
  }
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: t("labs.api.invalidSubmission") }, { status: 400 });
  const { mode, id, session, questionId, choice } = parsed.data;

  // Same access rules as serving and scoring.
  if (mode === "micro") {
    const lt = await trackOfMicroCheck(id);
    if (!lt) return NextResponse.json({ error: t("labs.api.notFound") }, { status: 404 });
    const denied = lt.isPreview ? null : await denyTrack(access, lt.trackId);
    if (denied) return denied;
  } else {
    const trackId = await trackOfQuiz(id);
    if (!trackId) return NextResponse.json({ error: t("labs.api.notFound") }, { status: 404 });
    const denied = await denyTrack(access, trackId);
    if (denied) return denied;
  }

  try {
    const locked = await lockAnswer(session, student.id, mode, id, questionId, choice);
    if (locked == null) return NextResponse.json({ error: t("labs.api.noMatching") }, { status: 409 });

    const locale = await getLocale();
    let questions: Array<{ id: string; options: unknown; correctIndex: number; explanation: string }>;
    if (mode === "micro") {
      const check = await prisma.microCheck.findUnique({ where: { id }, include: { questions: true } });
      if (!check) return NextResponse.json({ error: t("labs.api.notFound") }, { status: 404 });
      questions = (await localizeQuestions("micro", id, check.questions, locale, [questionId])).questions;
    } else {
      const quiz = await prisma.quiz.findUnique({ where: { id }, include: { questions: true } });
      if (!quiz || !(await quizUnlocked(student.id, quiz.id, quiz.moduleId))) return NextResponse.json({ error: t("labs.api.notFound") }, { status: 404 });
      questions = (await localizeQuestions("quiz", id, quiz.questions, locale, [questionId])).questions;
    }
    const q = questions.find((x) => x.id === questionId);
    if (!q) return NextResponse.json({ error: t("labs.api.notFound") }, { status: 404 });
    const shown = presentQuestion(q, student.id);
    return NextResponse.json({ choice: locked, correct: locked === shown.correctIndex, correctIndex: shown.correctIndex, explanation: shown.explanation });
  } catch (err) {
    console.error("[POST /api/learn/quiz/check]", err);
    return NextResponse.json({ error: t("labs.api.scoreSubmissionFailed") }, { status: 500 });
  }
}
