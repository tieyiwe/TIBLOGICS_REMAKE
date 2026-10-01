import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { denyTrack, requireEntitledStudent } from "@/lib/learn/session";
import { trackOfExamSession } from "@/lib/learn/track-of";
import { finaliseExamSession } from "@/lib/learn/exam-scoring";
import { presentQuestion, type GradedQuestion } from "@/lib/learn/assessments";
import { getLocale, translatorFor } from "@/lib/i18n/server";
import { localizeQuestions } from "@/lib/i18n/sources/labs";
import { gameDelta, gameSnapshot } from "@/lib/learn/badges";
import { awardSkillBadgesSafe } from "@/lib/learn/skill-badges/engine";

// Re-validates against the SERVER clock. A submission after expiry is scored
// on the answers saved up to expiry and marked `expired` — a network failure
// is never punished with a zero.
const Body = z.object({
  sessionId: z.string().min(1),
  answers: z.record(z.string(), z.number().int().min(0).max(10)).optional(),
});

export async function POST(req: NextRequest) {
  const { error, student, access } = await requireEntitledStudent();
  if (error) return error;
  const locale = await getLocale();
  const t = translatorFor(locale);

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: t("labs.api.invalid") }, { status: 400 });
  const { sessionId, answers } = parsed.data;

  try {
    const session = await prisma.finalExamSession.findUnique({ where: { id: sessionId } });
    if (!session || session.studentId !== student.id) {
      return NextResponse.json({ error: t("labs.api.sessionNotFound") }, { status: 404 });
    }
    const denied = await denyTrack(access, await trackOfExamSession(sessionId));
    if (denied) return denied;
    if (session.status !== "in_progress") {
      return NextResponse.json({ error: t("labs.api.examSubmitted") }, { status: 409 });
    }

    const isLate = session.expiresAt.getTime() <= Date.now();

    // Merge any final in-flight answers, but only while still within time.
    if (answers && !isLate) {
      const ids = Array.isArray(session.questionIds) ? (session.questionIds as string[]) : [];
      const merged = { ...((session.answers ?? {}) as Record<string, number>) };
      for (const [qid, val] of Object.entries(answers)) {
        if (ids.includes(qid)) merged[qid] = val;
      }
      await prisma.finalExamSession.update({
        where: { id: sessionId },
        data: { answers: merged as unknown as Prisma.InputJsonValue },
      });
    }

    const before = await gameSnapshot(student.id);
    const result = await finaliseExamSession(sessionId, isLate);
    if (!result) return NextResponse.json({ error: t("labs.api.examScoreFailed") }, { status: 500 });
    const awarded = (result as { pointsAwarded?: number }).pointsAwarded ?? 0;
    const game = awarded > 0 ? gameDelta(before, await gameSnapshot(student.id)) : gameDelta(null, null);
    // Verified skill badges: a pass can complete a certificate. Idempotent.
    if (awarded > 0) await awardSkillBadgesSafe(student.id);

    // Scoring above is on indexes and knows nothing of language. The review
    // texts are swapped for the learner's language here: the same question,
    // shuffled the same way for this learner, with translated wording.
    let graded = ((result as { graded?: GradedQuestion[] }).graded ?? []) as GradedQuestion[];
    if (locale !== "en" && graded.length) {
      const bank = await prisma.finalExamQuestion.findMany({
        where: { finalExamId: session.finalExamId },
        select: { id: true, question: true, options: true, correctIndex: true, explanation: true },
      });
      const { questions } = await localizeQuestions("exam", session.finalExamId, bank, locale, graded.map((g) => g.id));
      const byId = new Map(questions.map((q) => [q.id, presentQuestion(q, session.studentId)]));
      graded = graded.map((g) => {
        const q = byId.get(g.id);
        // Only texts change; the index-based fields come from scoring.
        return q && q.correctIndex === g.correctIndex
          ? { ...g, question: q.question, explanation: q.explanation, options: q.options as string[] }
          : g;
      });
    }

    return NextResponse.json({
      score: result.score,
      passed: result.passed,
      distinction: (result as { distinction?: boolean }).distinction ?? false,
      passScore: (result as { passScore?: number }).passScore,
      distinctionScore: (result as { distinctionScore?: number }).distinctionScore,
      perModuleScores: (result as { perModuleScores?: Record<string, number> }).perModuleScores ?? {},
      graded,
      pointsAwarded: awarded,
      expired: isLate,
      newBadges: game.newBadges,
      levelUp: game.levelUp,
    });
  } catch (err) {
    console.error("[POST /api/learn/exam/submit]", err);
    return NextResponse.json({ error: t("labs.api.examSubmitFailed") }, { status: 500 });
  }
}
