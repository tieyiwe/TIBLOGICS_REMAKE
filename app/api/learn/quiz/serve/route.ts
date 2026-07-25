import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireEntitledStudent } from "@/lib/learn/session";
import { seededShuffle, serveQuestion } from "@/lib/learn/assessments";

// Serves a randomized subset of a micro-check or module quiz.
// Correct answers and explanations are stripped — the client cannot see them
// until /api/learn/quiz/submit scores the attempt.
export async function GET(req: NextRequest) {
  const { error, student } = await requireEntitledStudent();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("mode");
  const id = searchParams.get("id");
  if (!id || (mode !== "micro" && mode !== "quiz")) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    // Re-shuffle per attempt so retakes serve a different set
    const attemptSeed = `${student.id}:${id}:${Date.now()}`;

    if (mode === "micro") {
      const check = await prisma.microCheck.findUnique({ where: { id }, include: { questions: true } });
      if (!check) return NextResponse.json({ error: "Not found" }, { status: 404 });
      const picked = seededShuffle(check.questions, attemptSeed).slice(0, check.questionsServed);
      return NextResponse.json({
        id: check.id,
        passScore: check.passScore,
        questions: picked.map(serveQuestion),
      });
    }

    const quiz = await prisma.quiz.findUnique({ where: { id }, include: { questions: true } });
    if (!quiz) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const picked = seededShuffle(quiz.questions, attemptSeed).slice(0, quiz.questionsServed);
    return NextResponse.json({
      id: quiz.id,
      passScore: quiz.passScore,
      questions: picked.map(serveQuestion),
    });
  } catch (err) {
    console.error("[GET /api/learn/quiz/serve]", err);
    return NextResponse.json({ error: "Could not load questions" }, { status: 500 });
  }
}
