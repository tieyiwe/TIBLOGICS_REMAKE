import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireEntitledStudent } from "@/lib/learn/session";
import { checkRateLimit } from "@/lib/require-admin";
import { streamChat } from "@/lib/claude";

// The practice pad under every lesson: the learner runs a prompt against a
// real model without leaving the platform. Bounded per student by the hour
// and by the day, with a max_tokens ceiling, so it cannot run up the bill.
export const maxDuration = 120;

const HOURLY = 20;
const DAILY = 60;

const Body = z.object({
  lessonId: z.string().max(60).optional(),
  prompt: z.string().trim().min(1, "Write a prompt first").max(8000),
});

export async function POST(req: NextRequest) {
  const { error, student } = await requireEntitledStudent();
  if (error) return error;

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request" }, { status: 400 });
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "The practice pad isn't configured yet. Try the prompt in any AI tool meanwhile." }, { status: 503 });
  }
  if (!(await checkRateLimit(`practice-h:${student.id}`, HOURLY, 3_600_000))) {
    return NextResponse.json({ error: "You've used this hour's practice runs. Try again shortly." }, { status: 429 });
  }
  if (!(await checkRateLimit(`practice-d:${student.id}`, DAILY, 86_400_000))) {
    return NextResponse.json({ error: "You've used today's practice runs. They reset tomorrow." }, { status: 429 });
  }

  const lesson = parsed.data.lessonId
    ? await prisma.lesson
        .findUnique({ where: { id: parsed.data.lessonId }, select: { title: true, module: { select: { track: { select: { title: true } } } } } })
        .catch(() => null)
    : null;

  const system = `You are the practice assistant inside TIBLOGICS Learning Box${
    lesson ? `, used during the lesson "${lesson.title}" in the course "${lesson.module.track.title}"` : ""
  }. The learner is practising prompting. Respond to their prompt exactly as a capable general AI assistant would, so they see what their prompt really produces. If the prompt still contains unfilled placeholders in [BRACKETS], make reasonable assumptions, say which ones you assumed in one short line at the end, and suggest they fill them in. Use plain punctuation and Markdown. Never ask for or encourage sharing personal or confidential data.`;

  try {
    const response = await streamChat([{ role: "user", content: parsed.data.prompt }], system, 1400);
    return NextResponse.json({ ok: true, response });
  } catch (err) {
    console.error("[POST /api/learn/practice]", err);
    return NextResponse.json({ error: "The practice pad didn't respond. Try again in a moment." }, { status: 502 });
  }
}
