import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireEntitledStudent } from "@/lib/learn/session";
import { checkRateLimit } from "@/lib/require-admin";
import { streamChat } from "@/lib/claude";
import { parseConfig } from "@/lib/learn/labs/types";
import { assistSystem, parseAssist, MAX_CODE } from "@/lib/learn/labs/code";

// Code Studio's AI pair programmer. Bounded like the prompt sandbox: an hourly
// limit per student, a per-attempt cap from the lab config, and max_tokens.
export const maxDuration = 120;

const Body = z.object({
  labId: z.string().min(1),
  code: z.string().max(MAX_CODE),
  request: z.string().trim().min(1, "Ask for something first").max(4000),
});

export async function POST(req: NextRequest) {
  const { error, student } = await requireEntitledStudent();
  if (error) return error;
  if (!(await checkRateLimit(`lab-assist:${student.id}`, 30, 3_600_000))) {
    return NextResponse.json({ error: "You've hit the hourly limit for the AI pair programmer. Try again shortly." }, { status: 429 });
  }
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request" }, { status: 400 });
  const { labId, code, request } = parsed.data;
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "The AI pair programmer isn't configured yet. You can still write the code yourself and run the checks." }, { status: 503 });
  }

  const lab = await prisma.lab.findUnique({ where: { id: labId }, select: { labType: true, config: true, briefMd: true, isPublished: true } });
  if (!lab || !lab.isPublished || lab.labType !== "code") return NextResponse.json({ error: "Lab not found" }, { status: 404 });
  const config = parseConfig(lab.labType, lab.config);
  if (config.kind !== "code") return NextResponse.json({ error: "Lab not found" }, { status: 404 });

  const attempt = await prisma.labAttempt.findFirst({
    where: { studentId: student.id, labId, status: "in_progress" },
    orderBy: { createdAt: "desc" },
  });
  const maxRuns = config.maxRuns ?? 12;
  if ((attempt?.runCount ?? 0) >= maxRuns) {
    return NextResponse.json({ error: `You've used all ${maxRuns} AI requests for this attempt. Finish by hand and submit.`, runsLeft: 0 }, { status: 429 });
  }

  try {
    const raw = await streamChat(
      [{ role: "user", content: `CURRENT FILE:\n\`\`\`html\n${code}\n\`\`\`\n\nMY REQUEST:\n${request}` }],
      assistSystem(lab.briefMd, config),
      6000,
    );
    const { reply, code: proposed } = parseAssist(raw);
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
    return NextResponse.json({ error: "The AI pair programmer didn't respond. Try again." }, { status: 502 });
  }
}
