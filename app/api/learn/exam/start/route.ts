import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireEntitledStudent } from "@/lib/learn/session";
import { allModuleQuizzesPassed, presentQuestion, seededShuffle, serveQuestion } from "@/lib/learn/assessments";
import { getLocale, translatorFor } from "@/lib/i18n/server";
import type { Locale } from "@/lib/i18n/config";
import { localizeQuestions } from "@/lib/i18n/sources/labs";

// Creates a server-clocked exam session (Part B rule 6).
// started_at / expires_at are computed here; the client only renders a
// countdown toward expires_at and can never extend it.
const Body = z.object({ trackSlug: z.string().min(1) });

export async function POST(req: NextRequest) {
  const { error, student } = await requireEntitledStudent();
  if (error) return error;
  const locale = await getLocale();
  const t = translatorFor(locale);

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: t("labs.api.invalid") }, { status: 400 });

  try {
    const track = await prisma.learnTrack.findUnique({
      where: { slug: parsed.data.trackSlug },
      select: { id: true, finalExam: { include: { questions: true } } },
    });
    const exam = track?.finalExam;
    if (!track || !exam) return NextResponse.json({ error: t("labs.api.examNotFound") }, { status: 404 });

    // Gate: all module quizzes must be passed first
    if (!(await allModuleQuizzesPassed(student.id, track.id))) {
      return NextResponse.json({ error: t("labs.api.passQuizzesFirst") }, { status: 403 });
    }

    // Resume an in-progress session rather than starting a new one
    const existing = await prisma.finalExamSession.findFirst({
      where: { studentId: student.id, finalExamId: exam.id, status: "in_progress" },
      orderBy: { startedAt: "desc" },
    });
    if (existing) {
      if (existing.expiresAt.getTime() > Date.now()) {
        return NextResponse.json(await hydrate(existing, exam.id, exam.questions, locale));
      }
      // Expired while away — close it out so a fresh attempt can start
      await prisma.finalExamSession.update({
        where: { id: existing.id },
        data: { status: "expired", submittedAt: new Date() },
      });
    }

    // Attempt limit + cooldown
    // Only the count, the pass flag and the latest submittedAt are read below.
    // Without a select this dragged back every past attempt's questionIds and
    // full answer map as JSON.
    const past = await prisma.finalExamSession.findMany({
      where: { studentId: student.id, finalExamId: exam.id, status: { in: ["submitted", "expired"] } },
      orderBy: { startedAt: "desc" },
      select: { passed: true, submittedAt: true },
    });
    if (past.some((s) => s.passed)) {
      return NextResponse.json({ error: t("labs.api.examAlreadyPassed") }, { status: 409 });
    }
    if (past.length >= exam.maxAttempts) {
      return NextResponse.json(
        { error: t("labs.api.attemptsUsed"), supportReset: true },
        { status: 403 },
      );
    }
    const last = past[0];
    if (last?.submittedAt) {
      const readyAt = last.submittedAt.getTime() + exam.cooldownHours * 3600_000;
      if (Date.now() < readyAt) {
        return NextResponse.json(
          { error: t("labs.api.cooldown"), retryAt: new Date(readyAt).toISOString() },
          { status: 429 },
        );
      }
    }

    if (exam.questions.length === 0) {
      return NextResponse.json({ error: t("labs.api.noExamQuestions") }, { status: 503 });
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
      ...(await hydrate(session, exam.id, exam.questions, locale)),
      extendedTime: multiplier > 1,
      limitMinutes,
    });
  } catch (err) {
    console.error("[POST /api/learn/exam/start]", err);
    return NextResponse.json({ error: t("labs.api.examStartFailed") }, { status: 500 });
  }
}

/**
 * Build the client payload — questions WITHOUT correct answers — in the
 * learner's language. Options are translated at their stored index before
 * the per-learner shuffle, so saved answers mean the same in any language.
 */
async function hydrate(
  session: { id: string; studentId: string; questionIds: unknown; expiresAt: Date; answers: unknown; attemptNumber: number },
  examId: string,
  rawBank: Array<{ id: string; question: string; options: unknown; correctIndex: number; explanation: string; moduleId: string | null }>,
  locale: Locale,
) {
  const ids = Array.isArray(session.questionIds) ? (session.questionIds as string[]) : [];
  const { questions: bank, pending } = await localizeQuestions("exam", examId, rawBank, locale, ids);
  const byId = new Map(bank.map((q) => [q.id, q]));
  const questions = ids.map((id) => byId.get(id)).filter(Boolean).map((q) => serveQuestion(presentQuestion(q!, session.studentId)));
  return {
    sessionId: session.id,
    questions,
    expiresAt: session.expiresAt.toISOString(),
    serverNow: new Date().toISOString(),
    answers: (session.answers ?? {}) as Record<string, number>,
    attemptNumber: session.attemptNumber,
    pending,
  };
}
