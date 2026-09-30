import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { labModuleId, moduleLessonsComplete } from "@/lib/learn/progress";
import { requireEntitledStudent } from "@/lib/learn/session";
import { checkRateLimit } from "@/lib/require-admin";
import { withinDailyAiBudget } from "@/lib/learn/ai-budget";
import { getT } from "@/lib/i18n/server";
import { streamChat } from "@/lib/claude";
import { parseConfig } from "@/lib/learn/labs/types";
import { getLocale, translatorFor } from "@/lib/i18n/server";
import { localizeLab } from "@/lib/i18n/sources/labs";

// Runs the learner's prompt against a real model inside a prompt lab.
// Every run costs money, so it is bounded three ways: a per-student rate
// limit, a per-attempt run cap from the lab config, and a max_tokens ceiling.
export const maxDuration = 120;

const bodyFor = (t: (k: string) => string) =>
  z.object({
    labId: z.string().min(1),
    prompt: z.string().trim().min(1, t("labs.api.writePromptFirst")).max(8000),
  });

// The sandbox answers in whatever language the learner writes their prompt
// in, like a real model would, rather than in the interface language.
const FOLLOW_LANGUAGE =
  "\n\nReply in the language the user's prompt is written in, unless the prompt asks for a specific language.";

export async function POST(req: NextRequest) {
  const { error, student } = await requireEntitledStudent();
  if (error) return error;
  const locale = await getLocale();
  const t = translatorFor(locale);

  // 20 sandbox runs per student per hour
  if (!(await checkRateLimit(`lab-run:${student.id}`, 20, 3_600_000))) {
    return NextResponse.json({ error: t("labs.api.sandboxRate") }, { status: 429 });
  }
  if (!(await withinDailyAiBudget(student.id))) {
    return NextResponse.json({ error: (await getT())("common.aiDailyLimit") }, { status: 429 });
  }

  const parsed = bodyFor(t).safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? t("labs.api.invalid") }, { status: 400 });
  }
  const { labId, prompt } = parsed.data;
  // A module's lab opens once the module's lessons are done.
  if (!(await moduleLessonsComplete(student.id, await labModuleId(labId)))) {
    return NextResponse.json({ error: (await getT())("labs.api.finishLessonsFirst"), locked: true }, { status: 403 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: t("labs.api.sandboxOff") }, { status: 503 });
  }

  try {
    const lab = await prisma.lab.findUnique({
      where: { id: labId },
      select: { id: true, slug: true, title: true, labType: true, briefMd: true, scenarioMd: true, objectives: true, config: true, isPublished: true },
    });
    if (!lab || !lab.isPublished) {
      return NextResponse.json({ error: t("labs.api.labNotFound") }, { status: 404 });
    }
    if (lab.labType !== "prompt") {
      return NextResponse.json({ error: t("labs.api.noSandbox") }, { status: 400 });
    }

    const config = parseConfig(lab.labType, lab.config);
    if (config.kind !== "prompt") {
      return NextResponse.json({ error: t("labs.api.noSandbox") }, { status: 400 });
    }
    // The material shown to the learner is what the model receives with their
    // prompt, so it is the translated version when there is one.
    const shown = await localizeLab(lab, locale);
    const contextMd = shown.config.kind === "prompt" ? shown.config.contextMd : config.contextMd;

    // Resume or open the attempt
    const attempt = await prisma.labAttempt.findFirst({
      where: { studentId: student.id, labId, status: "in_progress" },
      orderBy: { createdAt: "desc" },
    });

    const maxRuns = config.maxRuns ?? 8;
    const runCount = attempt?.runCount ?? 0;
    if (runCount >= maxRuns) {
      return NextResponse.json({ error: t("labs.api.runsUsed", { n: maxRuns }), runsLeft: 0 }, { status: 429 });
    }

    const system =
      (config.sandboxSystem ??
        "You are a helpful assistant. Respond to the user's prompt directly and concisely.") + FOLLOW_LANGUAGE;

    const userContent = contextMd ? `${contextMd}\n\n---\n\n${prompt}` : prompt;

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
    return NextResponse.json({ error: t("labs.api.sandboxFailed") }, { status: 500 });
  }
}
