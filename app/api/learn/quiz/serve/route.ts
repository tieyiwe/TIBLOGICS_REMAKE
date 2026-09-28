import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireEntitledStudent } from "@/lib/learn/session";
import { presentQuestion, seededShuffle, serveQuestion } from "@/lib/learn/assessments";
import { getLocale, translatorFor } from "@/lib/i18n/server";
import { localizeQuestions } from "@/lib/i18n/sources/labs";

// Serves a randomized subset of a micro-check or module quiz.
// Correct answers and explanations are stripped — the client cannot see them
// until /api/learn/quiz/submit scores the attempt.
//
// Questions are translated BEFORE the per-learner option shuffle, with every
// option kept at its stored index, so the shuffle and the answer key work on
// the same indexes in every language.
export async function GET(req: NextRequest) {
  const { error, student } = await requireEntitledStudent();
  if (error) return error;
  const locale = await getLocale();
  const t = translatorFor(locale);

  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("mode");
  const id = searchParams.get("id");
  if (!id || (mode !== "micro" && mode !== "quiz")) {
    return NextResponse.json({ error: t("labs.api.invalid") }, { status: 400 });
  }

  try {
    // Re-shuffle per attempt so retakes serve a different set
    const attemptSeed = `${student.id}:${id}:${Date.now()}`;

    if (mode === "micro") {
      const check = await prisma.microCheck.findUnique({ where: { id }, include: { questions: true } });
      if (!check) return NextResponse.json({ error: t("labs.api.notFound") }, { status: 404 });
      const picked = seededShuffle(check.questions, attemptSeed).slice(0, check.questionsServed);
      // Chunks are keyed on the whole bank, so pass it and name the ones needed.
      const { questions: bank, pending } = await localizeQuestions("micro", check.id, check.questions, locale, picked.map((q) => q.id));
      const byId = new Map(bank.map((q) => [q.id, q]));
      return NextResponse.json({
        id: check.id,
        passScore: check.passScore,
        questions: picked.map((q) => serveQuestion(presentQuestion(byId.get(q.id) ?? q, student.id))),
        pending,
      });
    }

    const quiz = await prisma.quiz.findUnique({ where: { id }, include: { questions: true } });
    if (!quiz) return NextResponse.json({ error: t("labs.api.notFound") }, { status: 404 });
    const picked = seededShuffle(quiz.questions, attemptSeed).slice(0, quiz.questionsServed);
    // Chunks are keyed on the whole bank, so pass it and name the ones needed.
    const { questions: bank, pending } = await localizeQuestions("quiz", quiz.id, quiz.questions, locale, picked.map((q) => q.id));
    const byId = new Map(bank.map((q) => [q.id, q]));
    return NextResponse.json({
      id: quiz.id,
      passScore: quiz.passScore,
      questions: picked.map((q) => serveQuestion(presentQuestion(byId.get(q.id) ?? q, student.id))),
      pending,
    });
  } catch (err) {
    console.error("[GET /api/learn/quiz/serve]", err);
    return NextResponse.json({ error: t("labs.api.loadQuestionsFailed") }, { status: 500 });
  }
}
