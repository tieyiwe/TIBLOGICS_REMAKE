import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { denyTrack, requireEntitledStudent } from "@/lib/learn/session";
import { trackOfLesson } from "@/lib/learn/track-of";
import { checkRateLimit } from "@/lib/require-admin";
import { withinDailyAiBudget } from "@/lib/learn/ai-budget";
import { streamChat } from "@/lib/claude";
import { getLocale, getT } from "@/lib/i18n/server";
import { replyInLanguage } from "@/lib/i18n/config";

// The practice pad under every lesson: the learner runs a prompt against a
// real model without leaving the platform. Bounded per student by the hour
// and by the day, with a max_tokens ceiling, so it cannot run up the bill.
export const maxDuration = 120;

const HOURLY = 20;
const DAILY = 60;

const Body = z.object({
  lessonId: z.string().max(60).optional(),
  prompt: z.string().trim().min(1).max(8000),
});

export async function POST(req: NextRequest) {
  const { error, student, access } = await requireEntitledStudent();
  if (error) return error;
  const [t, locale] = await Promise.all([getT(), getLocale()]);

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    const tooLong = parsed.error.issues[0]?.code === "too_big";
    return NextResponse.json({ error: t(tooLong ? "learn.api.promptTooLong" : "learn.api.promptEmpty") }, { status: 400 });
  }
  // The pad under a lesson needs that lesson's track (or a free preview).
  if (parsed.data.lessonId) {
    const lt = await trackOfLesson(parsed.data.lessonId);
    if (!lt) return NextResponse.json({ error: t("learn.api.lessonNotFound") }, { status: 404 });
    const denied = lt.isPreview ? null : await denyTrack(access, lt.trackId);
    if (denied) return denied;
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: t("learn.api.padOff") }, { status: 503 });
  }
  if (!(await checkRateLimit(`practice-h:${student.id}`, HOURLY, 3_600_000))) {
    return NextResponse.json({ error: t("learn.api.padHourly") }, { status: 429 });
  }
  if (!(await checkRateLimit(`practice-d:${student.id}`, DAILY, 86_400_000))) {
    return NextResponse.json({ error: t("learn.api.padDaily") }, { status: 429 });
  }
  if (!(await withinDailyAiBudget(student.id))) {
    return NextResponse.json({ error: (await getT())("common.aiDailyLimit") }, { status: 429 });
  }

  const lesson = parsed.data.lessonId
    ? await prisma.lesson
        .findUnique({ where: { id: parsed.data.lessonId }, select: { title: true, module: { select: { track: { select: { title: true } } } } } })
        .catch(() => null)
    : null;

  const system = `You are the practice assistant inside TIBLOGICS Learning Box${
    lesson ? `, used during the lesson "${lesson.title}" in the course "${lesson.module.track.title}"` : ""
  }. The learner is practising prompting. Respond to their prompt exactly as a capable general AI assistant would, so they see what their prompt really produces. If the prompt still contains unfilled placeholders in [BRACKETS], make reasonable assumptions, say which ones you assumed in one short line at the end, and suggest they fill them in. Use plain punctuation and Markdown. Never ask for or encourage sharing personal or confidential data.`;
  // The learner reads the lesson in their language; reply in it too.
  const lang = replyInLanguage(locale);
  const systemPrompt = lang ? `${system}\n\n${lang}` : system;

  try {
    const response = await streamChat([{ role: "user", content: parsed.data.prompt }], systemPrompt, 1400);
    return NextResponse.json({ ok: true, response });
  } catch (err) {
    console.error("[POST /api/learn/practice]", err);
    return NextResponse.json({ error: t("learn.api.padFailed") }, { status: 502 });
  }
}
