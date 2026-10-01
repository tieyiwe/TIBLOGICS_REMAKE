import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { labUnlocked } from "@/lib/learn/progress";
import { requireEntitledStudent } from "@/lib/learn/session";
import { checkRateLimit } from "@/lib/require-admin";
import { withinDailyAiBudget } from "@/lib/learn/ai-budget";
import { getT } from "@/lib/i18n/server";
import { streamChat } from "@/lib/claude";
import { parseConfig } from "@/lib/learn/labs/types";
import { assistSystem, parseAssist, MAX_CODE } from "@/lib/learn/labs/code";
import { getLocale, translatorFor } from "@/lib/i18n/server";

// Code Studio's AI pair programmer. Bounded like the prompt sandbox: an hourly
// limit per student, a per-attempt cap from the lab config, and max_tokens.
export const maxDuration = 120;

const bodyFor = (t: (k: string) => string) =>
  z.object({
    labId: z.string().min(1),
    code: z.string().max(MAX_CODE),
    request: z.string().trim().min(1, t("labs.api.askFirst")).max(4000),
  });

export async function POST(req: NextRequest) {
  const { error, student } = await requireEntitledStudent();
  if (error) return error;
  const locale = await getLocale();
  const t = translatorFor(locale);
  if (!(await checkRateLimit(`lab-assist:${student.id}`, 30, 3_600_000))) {
    return NextResponse.json({ error: t("labs.api.assistRate") }, { status: 429 });
  }
  if (!(await withinDailyAiBudget(student.id))) {
    return NextResponse.json({ error: (await getT())("common.aiDailyLimit") }, { status: 429 });
  }
  const parsed = bodyFor(t).safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? t("labs.api.invalid") }, { status: 400 });
  const { labId, code, request } = parsed.data;
  // A module's lab opens once the module's lessons are done.
  if (!(await labUnlocked(student.id, labId))) {
    return NextResponse.json({ error: (await getT())("labs.api.finishLessonsFirst"), locked: true }, { status: 403 });
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: t("labs.api.assistOff") }, { status: 503 });
  }

  const lab = await prisma.lab.findUnique({ where: { id: labId }, select: { labType: true, config: true, briefMd: true, isPublished: true } });
  if (!lab || !lab.isPublished || lab.labType !== "code") return NextResponse.json({ error: t("labs.api.labNotFound") }, { status: 404 });
  const config = parseConfig(lab.labType, lab.config);
  if (config.kind !== "code") return NextResponse.json({ error: t("labs.api.labNotFound") }, { status: 404 });

  const attempt = await prisma.labAttempt.findFirst({
    where: { studentId: student.id, labId, status: "in_progress" },
    orderBy: { createdAt: "desc" },
  });
  const maxRuns = config.maxRuns ?? 12;
  if ((attempt?.runCount ?? 0) >= maxRuns) {
    return NextResponse.json({ error: t("labs.api.assistUsed", { n: maxRuns }), runsLeft: 0 }, { status: 429 });
  }

  try {
    const raw = await streamChat(
      [{ role: "user", content: `CURRENT FILE:\n\`\`\`html\n${code}\n\`\`\`\n\nMY REQUEST:\n${request}` }],
      assistSystem(lab.briefMd, config, locale),
      6000,
    );
    const { reply, code: proposed } = parseAssist(raw, t("labs.eval.code.updatedFile"), code);
    const prior = Array.isArray(attempt?.transcript) ? (attempt!.transcript as unknown[]) : [];
    const transcript = [...prior, { prompt: request, response: reply, changed: !!proposed, at: new Date().toISOString() }];
    const data = {
      transcript: transcript as unknown as Prisma.InputJsonValue,
      submission: { code } as unknown as Prisma.InputJsonValue,
    };
    const saved = attempt
      ? await prisma.labAttempt.update({ where: { id: attempt.id }, data: { ...data, runCount: { increment: 1 } }, select: { runCount: true } })
      : await prisma.labAttempt.create({ data: { studentId: student.id, labId, status: "in_progress", runCount: 1, ...data }, select: { runCount: true } });
    return NextResponse.json({ ok: true, reply, code: proposed, runsLeft: Math.max(0, maxRuns - saved.runCount) });
  } catch (err) {
    console.error("[POST /api/learn/lab/assist]", err);
    return NextResponse.json({ error: t("labs.api.assistFailed") }, { status: 502 });
  }
}
