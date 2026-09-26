import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireEntitledStudent } from "@/lib/learn/session";
import { rateLimit } from "@/lib/require-admin";
import { streamChat } from "@/lib/claude";
import { parseConfig } from "@/lib/learn/labs/types";

// Runs the learner's prompt against a real model inside a prompt lab.
// Every run costs money, so it is bounded three ways: a per-student rate
// limit, a per-attempt run cap from the lab config, and a max_tokens ceiling.
export const maxDuration = 120;

const Body = z.object({
  labId: z.string().min(1),
  prompt: z.string().trim().min(1, "Write a prompt first").max(8000),
});

export async function POST(req: NextRequest) {
  const { error, student } = await requireEntitledStudent();
  if (error) return error;

  // 20 sandbox runs per student per hour
  if (!rateLimit(`lab-run:${student.id}`, 20, 3_600_000)) {
    return NextResponse.json(
      { error: "You've hit the hourly limit for sandbox runs. Try again shortly." },
      { status: 429 },
    );
  }

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request" }, { status: 400 });
  }
  const { labId, prompt } = parsed.data;

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "The sandbox isn't configured yet. You can still write and submit your prompt." },
      { status: 503 },
    );
  }

  try {
    const lab = await prisma.lab.findUnique({
      where: { id: labId },
      select: { id: true, labType: true, config: true, isPublished: true },
    });
    if (!lab || !lab.isPublished) {
      return NextResponse.json({ error: "Lab not found" }, { status: 404 });
    }
    if (lab.labType !== "prompt") {
      return NextResponse.json({ error: "This lab has no sandbox" }, { status: 400 });
    }

    const config = parseConfig(lab.labType, lab.config);
    if (config.kind !== "prompt") {
      return NextResponse.json({ error: "This lab has no sandbox" }, { status: 400 });
    }

    // Resume or open the attempt
    const attempt = await prisma.labAttempt.findFirst({
      where: { studentId: student.id, labId, status: "in_progress" },
      orderBy: { createdAt: "desc" },
    });

    const maxRuns = config.maxRuns ?? 8;
    const runCount = attempt?.runCount ?? 0;
    if (runCount >= maxRuns) {
      return NextResponse.json(
        { error: `You've used all ${maxRuns} sandbox runs for this attempt. Submit what you have.`, runsLeft: 0 },
        { status: 429 },
      );
    }

    const system =
      config.sandboxSystem ??
      "You are a helpful assistant. Respond to the user's prompt directly and concisely.";

    const userContent = config.contextMd
      ? `${config.contextMd}\n\n---\n\n${prompt}`
      : prompt;

    const response = await streamChat([{ role: "user", content: userContent }], system, 1200);

    // Append to the transcript so the learner keeps their iteration history
    const prior = Array.isArray(attempt?.transcript) ? (attempt.transcript as unknown[]) : [];
    const transcript = [...prior, { prompt, response, at: new Date().toISOString() }];

    const saved = attempt
      ? await prisma.labAttempt.update({
          where: { id: attempt.id },
          data: {
            runCount: { increment: 1 },
            transcript: transcript as unknown as Prisma.InputJsonValue,
            submission: { prompt } as unknown as Prisma.InputJsonValue,
          },
          select: { id: true, runCount: true },
        })
      : await prisma.labAttempt.create({
          data: {
            studentId: student.id,
            labId,
            status: "in_progress",
            runCount: 1,
            transcript: transcript as unknown as Prisma.InputJsonValue,
            submission: { prompt } as unknown as Prisma.InputJsonValue,
          },
          select: { id: true, runCount: true },
        });

    return NextResponse.json({
      ok: true,
      attemptId: saved.id,
      response,
      runsUsed: saved.runCount,
      runsLeft: Math.max(0, maxRuns - saved.runCount),
    });
  } catch (err) {
    console.error("[POST /api/learn/lab/run]", err);
    return NextResponse.json(
      { error: "The sandbox didn't respond. Your prompt is saved — try running it again." },
      { status: 500 },
    );
  }
}
