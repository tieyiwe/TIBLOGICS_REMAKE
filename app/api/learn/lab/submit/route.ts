import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireEntitledStudent } from "@/lib/learn/session";
import { rateLimit } from "@/lib/require-admin";
import { awardPoints, getTotalPoints } from "@/lib/learn/points";
import { checkLevelUp } from "@/lib/learn/milestones";
import { parseConfig, parseObjectives, type LabEvaluation } from "@/lib/learn/labs/types";
import { evaluateBuild, evaluateCritique, evaluatePrompt } from "@/lib/learn/labs/evaluate";

export const maxDuration = 120;

const Body = z.object({
  labId: z.string().min(1),
  // prompt labs
  prompt: z.string().max(8000).optional(),
  // critique labs
  selections: z.array(z.string()).max(50).optional(),
  // build labs
  checked: z.array(z.string()).max(50).optional(),
  artifactUrl: z.string().max(500).nullable().optional(),
  reflection: z.string().max(10000).nullable().optional(),
});

export async function POST(req: NextRequest) {
  const { error, student } = await requireEntitledStudent();
  if (error) return error;

  if (!rateLimit(`lab-submit:${student.id}`, 30, 3_600_000)) {
    return NextResponse.json({ error: "Too many submissions. Try again shortly." }, { status: 429 });
  }

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request" }, { status: 400 });
  }
  const { labId, prompt, selections, checked, artifactUrl, reflection } = parsed.data;

  try {
    const lab = await prisma.lab.findUnique({ where: { id: labId } });
    if (!lab || !lab.isPublished) {
      return NextResponse.json({ error: "Lab not found" }, { status: 404 });
    }

    const objectives = parseObjectives(lab.objectives);
    const config = parseConfig(lab.labType, lab.config);

    const attempt = await prisma.labAttempt.findFirst({
      where: { studentId: student.id, labId, status: "in_progress" },
      orderBy: { createdAt: "desc" },
    });

    let evaluation: LabEvaluation;
    let submission: Record<string, unknown>;

    if (config.kind === "critique") {
      const picked = selections ?? [];
      submission = { selections: picked };
      evaluation = evaluateCritique(config, picked, objectives, lab.passScore);
    } else if (config.kind === "build") {
      const steps = checked ?? [];
      submission = { checked: steps, artifactUrl: artifactUrl ?? null, reflection: reflection ?? null };
      if (config.requireArtifact && !artifactUrl?.trim()) {
        return NextResponse.json({ error: "Add a link to your work before submitting." }, { status: 400 });
      }
      evaluation = evaluateBuild(
        config,
        steps,
        artifactUrl ?? null,
        reflection ?? null,
        objectives,
        lab.passScore,
      );
    } else {
      // Prompt lab — grade the latest prompt against the response it produced
      const text = (prompt ?? (attempt?.submission as { prompt?: string } | null)?.prompt ?? "").trim();
      if (!text) {
        return NextResponse.json({ error: "Write a prompt before submitting." }, { status: 400 });
      }
      const transcript = Array.isArray(attempt?.transcript)
        ? (attempt.transcript as Array<{ prompt: string; response: string }>)
        : [];
      // Prefer the response for this exact prompt; otherwise the most recent run
      const matching = [...transcript].reverse().find((t) => t.prompt.trim() === text);
      const lastResponse = matching?.response ?? transcript[transcript.length - 1]?.response ?? "";

      submission = { prompt: text };
      evaluation = await evaluatePrompt(
        lab.briefMd,
        config,
        text,
        lastResponse,
        objectives,
        lab.passScore,
      );
    }

    const data = {
      status: "submitted",
      submission: submission as unknown as Prisma.InputJsonValue,
      score: evaluation.score,
      passed: evaluation.passed,
      feedbackMd: evaluation.feedbackMd,
      breakdown: evaluation.breakdown as unknown as Prisma.InputJsonValue,
    };

    const saved = attempt
      ? await prisma.labAttempt.update({ where: { id: attempt.id }, data })
      : await prisma.labAttempt.create({
          data: { studentId: student.id, labId, ...data },
        });

    // Points on first pass only — the ledger keeps this idempotent, so a
    // retake for practice never double-awards.
    let pointsAwarded = 0;
    if (evaluation.passed) {
      const totalBefore = await getTotalPoints(student.id);
      pointsAwarded = await awardPoints(student.id, "lab_pass", lab.id, lab.points);
      if (pointsAwarded > 0) checkLevelUp(student.id, totalBefore, totalBefore + pointsAwarded);
    }

    return NextResponse.json({
      ok: true,
      attemptId: saved.id,
      score: evaluation.score,
      passed: evaluation.passed,
      passScore: lab.passScore,
      feedbackMd: evaluation.feedbackMd,
      breakdown: evaluation.breakdown,
      pointsAwarded,
      // Critique labs reveal the full answer key after submission
      flaws: config.kind === "critique" ? config.flaws : undefined,
    });
  } catch (err) {
    console.error("[POST /api/learn/lab/submit]", err);
    return NextResponse.json({ error: "Could not score your lab. Your work is saved." }, { status: 500 });
  }
}
