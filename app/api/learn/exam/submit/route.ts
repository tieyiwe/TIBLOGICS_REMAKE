import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireEntitledStudent } from "@/lib/learn/session";
import { finaliseExamSession } from "@/lib/learn/exam-scoring";

// Re-validates against the SERVER clock. A submission after expiry is scored
// on the answers saved up to expiry and marked `expired` — a network failure
// is never punished with a zero.
const Body = z.object({
  sessionId: z.string().min(1),
  answers: z.record(z.string(), z.number().int().min(0).max(10)).optional(),
});

export async function POST(req: NextRequest) {
  const { error, student } = await requireEntitledStudent();
  if (error) return error;

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const { sessionId, answers } = parsed.data;

  try {
    const session = await prisma.finalExamSession.findUnique({ where: { id: sessionId } });
    if (!session || session.studentId !== student.id) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }
    if (session.status !== "in_progress") {
      return NextResponse.json({ error: "This exam was already submitted" }, { status: 409 });
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

    const result = await finaliseExamSession(sessionId, isLate);
    if (!result) return NextResponse.json({ error: "Could not score exam" }, { status: 500 });

    return NextResponse.json({
      score: result.score,
      passed: result.passed,
      distinction: (result as { distinction?: boolean }).distinction ?? false,
      passScore: (result as { passScore?: number }).passScore,
      distinctionScore: (result as { distinctionScore?: number }).distinctionScore,
      perModuleScores: (result as { perModuleScores?: Record<string, number> }).perModuleScores ?? {},
      graded: (result as { graded?: unknown }).graded ?? [],
      pointsAwarded: (result as { pointsAwarded?: number }).pointsAwarded ?? 0,
      expired: isLate,
    });
  } catch (err) {
    console.error("[POST /api/learn/exam/submit]", err);
    return NextResponse.json({ error: "Could not submit exam" }, { status: 500 });
  }
}
