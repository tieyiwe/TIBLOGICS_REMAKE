import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireEntitledStudent } from "@/lib/learn/session";
import { finalExamPassed } from "@/lib/learn/assessments";
import { generateCapstonePreReview } from "@/lib/learn/ai-review";
import { getT, type T } from "@/lib/i18n/server";

const bodyFor = (t: T) =>
  z.object({
    capstoneId: z.string().min(1),
    submissionUrl: z.string().url(t("labs.api.validUrl")).nullable().optional(),
    submissionMd: z.string().max(20000).nullable().optional(),
  });

export async function POST(req: NextRequest) {
  const { error, student } = await requireEntitledStudent();
  if (error) return error;
  const t = await getT();

  const parsed = bodyFor(t).safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? t("labs.api.invalidInput") }, { status: 400 });
  }
  const { capstoneId, submissionUrl, submissionMd } = parsed.data;

  if (!submissionUrl && !submissionMd) {
    return NextResponse.json({ error: t("labs.api.needLinkOrText") }, { status: 400 });
  }

  try {
    const capstone = await prisma.capstone.findUnique({
      where: { id: capstoneId },
      select: { id: true, trackId: true, briefMd: true, rubric: true },
    });
    if (!capstone) return NextResponse.json({ error: t("labs.api.capstoneNotFound") }, { status: 404 });

    // Gate: the final exam must be passed first
    if (!(await finalExamPassed(student.id, capstone.trackId))) {
      return NextResponse.json({ error: t("labs.api.passExamFirst") }, { status: 403 });
    }

    // An open submission can't be replaced — it's already with a reviewer
    const open = await prisma.capstoneSubmission.findFirst({
      where: { studentId: student.id, capstoneId, status: { in: ["submitted", "in_review", "passed"] } },
      select: { id: true, status: true },
    });
    if (open) {
      return NextResponse.json(
        {
          error: open.status === "passed" ? t("labs.api.capstonePassed") : t("labs.api.underReview"),
        },
        { status: 409 },
      );
    }

    const submission = await prisma.capstoneSubmission.create({
      data: { studentId: student.id, capstoneId, submissionUrl, submissionMd, status: "submitted" },
      select: { id: true, status: true, createdAt: true },
    });

    // Draft an AI pre-review for the reviewer. Non-blocking and never shown to
    // the learner — it's a starting point for a human, not a verdict.
    generateCapstonePreReview(submission.id).catch((err) =>
      console.error("[capstone] pre-review", err),
    );

    return NextResponse.json({ ok: true, submission });
  } catch (err) {
    console.error("[POST /api/learn/capstone]", err);
    return NextResponse.json({ error: t("labs.api.capstoneFailed") }, { status: 500 });
  }
}
