import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { denyTrack, requireEntitledStudent } from "@/lib/learn/session";
import { trackOfExamSession } from "@/lib/learn/track-of";
import { getT } from "@/lib/i18n/server";

// Autosave a single answer into the server-side session, so a refresh,
// disconnect, or device change never loses work.
const Body = z.object({
  sessionId: z.string().min(1),
  questionId: z.string().min(1),
  answer: z.number().int().min(0).max(10),
});

export async function POST(req: NextRequest) {
  const { error, student, access } = await requireEntitledStudent();
  if (error) return error;
  const t = await getT();

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: t("labs.api.invalid") }, { status: 400 });
  const { sessionId, questionId, answer } = parsed.data;

  try {
    const session = await prisma.finalExamSession.findUnique({ where: { id: sessionId } });
    if (!session || session.studentId !== student.id) {
      return NextResponse.json({ error: t("labs.api.sessionNotFound") }, { status: 404 });
    }
    const denied = await denyTrack(access, await trackOfExamSession(sessionId));
    if (denied) return denied;
    if (session.status !== "in_progress") {
      return NextResponse.json({ error: t("labs.api.examClosed") }, { status: 409 });
    }
    // Server clock is authoritative — refuse writes after expiry
    if (session.expiresAt.getTime() <= Date.now()) {
      return NextResponse.json({ error: t("labs.api.timeExpired"), expired: true }, { status: 409 });
    }
    const ids = Array.isArray(session.questionIds) ? (session.questionIds as string[]) : [];
    if (!ids.includes(questionId)) {
      return NextResponse.json({ error: t("labs.api.questionNotInSession") }, { status: 400 });
    }

    // Merged in the database, in one statement: two answers saved at the
    // same moment used to overwrite each other (read, merge, write back).
    const rows = await prisma.$queryRaw<Array<{ n: number }>>`
      UPDATE "FinalExamSession"
      SET "answers" = COALESCE("answers", '{}'::jsonb) || jsonb_build_object(${questionId}::text, ${answer}::int)
      WHERE "id" = ${sessionId} AND "status" = 'in_progress' AND "expiresAt" > NOW()
      RETURNING (SELECT count(*) FROM jsonb_object_keys("answers"))::int AS n`;
    if (rows.length === 0) return NextResponse.json({ error: t("labs.api.examClosed") }, { status: 409 });

    return NextResponse.json({ ok: true, saved: rows[0].n });
  } catch (err) {
    console.error("[POST /api/learn/exam/answer]", err);
    return NextResponse.json({ error: t("labs.api.saveAnswerFailed") }, { status: 500 });
  }
}
