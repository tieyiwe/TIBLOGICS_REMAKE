import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { CAPSTONE_STATUSES } from "@/lib/learn/types";
import { awardPoints } from "@/lib/learn/points";
import { maybeIssueCertificate } from "@/lib/learn/certificates";
import { sendCapstoneStatusEmail } from "@/lib/learn/emails";
import { generateCapstonePreReview } from "@/lib/learn/ai-review";

const Body = z.object({
  status: z.enum(CAPSTONE_STATUSES),
  score: z.number().int().min(0).max(100).nullable().optional(),
  reviewerNotes: z.string().max(20000).nullable().optional(),
  regeneratePreReview: z.boolean().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authErr = await requireAdmin();
  if (authErr) return authErr;

  const { id } = await params;
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }
  const { status, score, reviewerNotes, regeneratePreReview } = parsed.data;

  try {
    const existing = await prisma.capstoneSubmission.findUnique({
      where: { id },
      select: {
        id: true, studentId: true, status: true,
        capstone: { select: { trackId: true, passThreshold: true, track: { select: { title: true } } } },
        student: { select: { email: true, name: true } },
      },
    });
    if (!existing) return NextResponse.json({ error: "Submission not found" }, { status: 404 });

    if (regeneratePreReview) {
      const text = await generateCapstonePreReview(id);
      return NextResponse.json({ ok: true, aiPrereviewMd: text });
    }

    const terminal = status === "passed" || status === "failed" || status === "revisions_requested";

    const updated = await prisma.capstoneSubmission.update({
      where: { id },
      data: {
        status,
        score: score ?? undefined,
        reviewerNotes: reviewerNotes ?? undefined,
        reviewedAt: terminal ? new Date() : undefined,
      },
    });

    // Award points + attempt certificate issuance on a first pass only
    let certificate: Awaited<ReturnType<typeof maybeIssueCertificate>> = null;
    if (status === "passed" && existing.status !== "passed") {
      await awardPoints(existing.studentId, "capstone_pass", existing.capstone.trackId);
      certificate = await maybeIssueCertificate(existing.studentId, existing.capstone.trackId);
    }

    // Notify the learner on any status the learner cares about
    if (status !== "submitted") {
      sendCapstoneStatusEmail({
        email: existing.student.email,
        name: existing.student.name,
        trackTitle: existing.capstone.track.title,
        status: status as "in_review" | "revisions_requested" | "passed" | "failed",
        notes: reviewerNotes ?? null,
        score: score ?? null,
      }).catch((err) => console.error("[capstone review] email", err));
    }

    return NextResponse.json({ ok: true, submission: updated, certificate });
  } catch (err) {
    console.error("[PATCH /api/admin/learn/capstone/[id]]", err);
    return NextResponse.json({ error: "Could not update the submission" }, { status: 500 });
  }
}
