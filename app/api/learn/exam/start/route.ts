import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireEntitledStudent } from "@/lib/learn/session";
import { allModuleQuizzesPassed, seededShuffle, serveQuestion } from "@/lib/learn/assessments";

// Creates a server-clocked exam session (Part B rule 6).
// started_at / expires_at are computed here; the client only renders a
// countdown toward expires_at and can never extend it.
const Body = z.object({ trackSlug: z.string().min(1) });

export async function POST(req: NextRequest) {
  const { error, student } = await requireEntitledStudent();
  if (error) return error;

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  try {
    const track = await prisma.learnTrack.findUnique({
      where: { slug: parsed.data.trackSlug },
      select: { id: true, finalExam: { include: { questions: true } } },
    });
    const exam = track?.finalExam;
    if (!track || !exam) return NextResponse.json({ error: "Exam not found" }, { status: 404 });

    // Gate: all module quizzes must be passed first
    if (!(await allModuleQuizzesPassed(student.id, track.id))) {
      return NextResponse.json(
        { error: "Pass every module quiz before starting the final exam." },
        { status: 403 },
      );
    }

    // Resume an in-progress session rather than starting a new one
    const existing = await prisma.finalExamSession.findFirst({
      where: { studentId: student.id, finalExamId: exam.id, status: "in_progress" },
      orderBy: { startedAt: "desc" },
    });
    if (existing) {
      if (existing.expiresAt.getTime() > Date.now()) {
        return NextResponse.json(await hydrate(existing, exam.questions));
      }
      // Expired while away — close it out so a fresh attempt can start
      await prisma.finalExamSession.update({
        where: { id: existing.id },
        data: { status: "expired", submittedAt: new Date() },
      });
    }

    // Attempt limit + cooldown
    const past = await prisma.finalExamSession.findMany({
      where: { studentId: student.id, finalExamId: exam.id, status: { in: ["submitted", "expired"] } },
      orderBy: { startedAt: "desc" },
    });
    if (past.some((s) => s.passed)) {
      return NextResponse.json({ error: "You have already passed this exam." }, { status: 409 });
    }
    if (past.length >= exam.maxAttempts) {
      return NextResponse.json(
        { error: "You've used all attempts. Contact support to request a reset.", supportReset: true },
        { status: 403 },
      );
    }
    const last = past[0];
    if (last?.submittedAt) {
      const readyAt = last.submittedAt.getTime() + exam.cooldownHours * 3600_000;
      if (Date.now() < readyAt) {
        return NextResponse.json(
          { error: "Cooldown active before your next attempt.", retryAt: new Date(readyAt).toISOString() },
          { status: 429 },
        );
      }
    }

    if (exam.questions.length === 0) {
      return NextResponse.json({ error: "This exam has no questions yet." }, { status: 503 });
    }

    // Fresh randomized set per attempt
    const attemptNumber = past.length + 1;
    const seed = `${student.id}:${exam.id}:${attemptNumber}:${Date.now()}`;
    const picked = seededShuffle(exam.questions, seed).slice(0, exam.questionsServed);

    // Accessibility mode grants 1.5x time — applied server-side at creation
    const profile = await prisma.student.findUnique({
      where: { id: student.id },
      select: { accessibilityMode: true },
    });
    const multiplier = profile?.accessibilityMode ? 1.5 : 1;
    const limitMinutes = Math.round(exam.timeLimitMinutes * multiplier);

    const session = await prisma.finalExamSession.create({
      data: {
        studentId: student.id,
        finalExamId: exam.id,
        status: "in_progress",
        questionIds: picked.map((q) => q.id) as unknown as Prisma.InputJsonValue,
        expiresAt: new Date(Date.now() + limitMinutes * 60_000),
        attemptNumber,
        answers: {} as unknown as Prisma.InputJsonValue,
      },
    });

    return NextResponse.json({
      ...(await hydrate(session, exam.questions)),
      extendedTime: multiplier > 1,
      limitMinutes,
    });
  } catch (err) {
    console.error("[POST /api/learn/exam/start]", err);
    return NextResponse.json({ error: "Could not start the exam" }, { status: 500 });
  }
}

/** Build the client payload — questions WITHOUT correct answers. */
async function hydrate(
  session: { id: string; questionIds: unknown; expiresAt: Date; answers: unknown; attemptNumber: number },
  bank: Array<{ id: string; question: string; options: unknown; moduleId: string | null }>,
) {
  const ids = Array.isArray(session.questionIds) ? (session.questionIds as string[]) : [];
  const byId = new Map(bank.map((q) => [q.id, q]));
  const questions = ids.map((id) => byId.get(id)).filter(Boolean).map((q) => serveQuestion(q!));
  return {
    sessionId: session.id,
    questions,
    expiresAt: session.expiresAt.toISOString(),
    serverNow: new Date().toISOString(),
    answers: (session.answers ?? {}) as Record<string, number>,
    attemptNumber: session.attemptNumber,
  };
}
