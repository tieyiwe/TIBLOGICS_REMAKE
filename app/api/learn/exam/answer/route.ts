import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireEntitledStudent } from "@/lib/learn/session";

// Autosave a single answer into the server-side session, so a refresh,
// disconnect, or device change never loses work.
const Body = z.object({
  sessionId: z.string().min(1),
  questionId: z.string().min(1),
  answer: z.number().int().min(0).max(10),
});

export async function POST(req: NextRequest) {
  const { error, student } = await requireEntitledStudent();
  if (error) return error;

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const { sessionId, questionId, answer } = parsed.data;

  try {
    const session = await prisma.finalExamSession.findUnique({ where: { id: sessionId } });
    if (!session || session.studentId !== student.id) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }
    if (session.status !== "in_progress") {
      return NextResponse.json({ error: "This exam is already closed" }, { status: 409 });
    }
    // Server clock is authoritative — refuse writes after expiry
    if (session.expiresAt.getTime() <= Date.now()) {
      return NextResponse.json({ error: "Time has expired", expired: true }, { status: 409 });
    }
    const ids = Array.isArray(session.questionIds) ? (session.questionIds as string[]) : [];
    if (!ids.includes(questionId)) {
      return NextResponse.json({ error: "Question not in this session" }, { status: 400 });
    }

    const answers = { ...((session.answers ?? {}) as Record<string, number>), [questionId]: answer };
    await prisma.finalExamSession.update({
      where: { id: sessionId },
      data: { answers: answers as unknown as Prisma.InputJsonValue },
    });

    return NextResponse.json({ ok: true, saved: Object.keys(answers).length });
  } catch (err) {
    console.error("[POST /api/learn/exam/answer]", err);
    return NextResponse.json({ error: "Could not save answer" }, { status: 500 });
  }
}
