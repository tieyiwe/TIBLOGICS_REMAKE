import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireEntitledStudent } from "@/lib/learn/session";
import { getT } from "@/lib/i18n/server";

// Opens a fresh attempt. Previous attempts are kept, so a learner can see
// how their work improved — and points already earned are never withdrawn.
const Body = z.object({ labId: z.string().min(1) });

export async function POST(req: NextRequest) {
  const { error, student } = await requireEntitledStudent();
  if (error) return error;
  const t = await getT();

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: t("labs.api.invalid") }, { status: 400 });

  try {
    const lab = await prisma.lab.findUnique({
      where: { id: parsed.data.labId },
      select: { id: true, isPublished: true },
    });
    if (!lab || !lab.isPublished) {
      return NextResponse.json({ error: t("labs.api.labNotFound") }, { status: 404 });
    }

    // Close any attempt still open so there's exactly one in_progress row
    await prisma.labAttempt.updateMany({
      where: { studentId: student.id, labId: lab.id, status: "in_progress" },
      data: { status: "submitted" },
    });

    const attempt = await prisma.labAttempt.create({
      data: { studentId: student.id, labId: lab.id, status: "in_progress" },
      select: { id: true },
    });

    return NextResponse.json({ ok: true, attemptId: attempt.id });
  } catch (err) {
    console.error("[POST /api/learn/lab/retry]", err);
    return NextResponse.json({ error: t("labs.api.retryFailed") }, { status: 500 });
  }
}
