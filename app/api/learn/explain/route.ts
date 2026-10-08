import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { denyTrack, getAccess, requireStudent } from "@/lib/learn/session";
import { checkRateLimit } from "@/lib/rate-limit";
import { withinDailyAiBudget } from "@/lib/learn/ai-budget";
import { isOwnerStudent } from "@/lib/learn/owner";
import { isAiBudgetError } from "@/lib/claude";
import { getLocale, getT } from "@/lib/i18n/server";
import { LESSON_SOURCE, localizedLesson } from "@/lib/i18n/sources/learn";
import { MIN_EXPLAIN_CHARS, lessonParagraphs, paraHash } from "@/lib/learn/explain/paragraphs";
import { cachedExplanation, writeExplanation } from "@/lib/learn/explain";

// "Explain simpler" on a lesson paragraph (components/learn/ExplainParagraph).
// The client names the paragraph by index only; the text comes from the
// lesson as stored, in the learner's language, so nothing the learner types
// reaches the model. Answers are shared through the ParagraphExplain cache;
// only a fresh model call counts toward the daily cap and the AI budget.
export const maxDuration = 60;

const DAILY_NEW = 20;
const DAY_MS = 86_400_000;

const Body = z.object({
  lessonId: z.string().min(1).max(64),
  index: z.number().int().min(0).max(500),
  hash: z.string().regex(/^[a-z0-9]{1,16}$/),
});

export async function POST(req: NextRequest) {
  const { error, student } = await requireStudent();
  if (error) return error;
  const [t, locale] = await Promise.all([getT(), getLocale()]);
  if (!(await checkRateLimit(`explain-h:${student.id}`, 60, 3_600_000))) {
    return NextResponse.json({ error: t("learn.api.tooManyLater") }, { status: 429 });
  }
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: t("learn.api.invalidRequest") }, { status: 400 });
  const { lessonId, index, hash } = parsed.data;

  const lesson = await prisma.lesson
    .findUnique({ where: { id: lessonId }, select: { ...LESSON_SOURCE, isPreview: true, module: { select: { trackId: true } } } })
    .catch(() => null);
  if (!lesson) return NextResponse.json({ error: t("learn.api.lessonNotFound") }, { status: 404 });
  // Free-preview lessons open for any member, as on the lesson page.
  const denied = lesson.isPreview ? null : await denyTrack(await getAccess(student.id), lesson.module.trackId);
  if (denied) return denied;

  // The same text the lesson page shows (English while a translation is pending).
  const { text } = await localizedLesson(lesson, locale);
  const paragraph = lessonParagraphs(text.bodyMd ?? "")[index];
  if (!paragraph || paragraph.length < MIN_EXPLAIN_CHARS) {
    return NextResponse.json({ error: t("learn.explain.changed") }, { status: 404 });
  }
  // The page was rendered from another version of the lesson.
  if (paraHash(paragraph) !== hash) return NextResponse.json({ error: t("learn.explain.changed"), code: "changed" }, { status: 409 });

  try {
    const hit = await cachedExplanation(lessonId, hash, locale);
    if (hit) return NextResponse.json({ text: hit, cached: true });

    if (!process.env.ANTHROPIC_API_KEY) return NextResponse.json({ error: t("learn.explain.off") }, { status: 503 });
    if (!(await isOwnerStudent(student.id)) && !(await checkRateLimit(`explain-d:${student.id}`, DAILY_NEW, DAY_MS))) {
      return NextResponse.json({ error: t("learn.explain.daily"), code: "daily" }, { status: 429 });
    }
    if (!(await withinDailyAiBudget(student.id))) {
      return NextResponse.json({ error: t("common.aiDailyLimit"), code: "daily" }, { status: 429 });
    }
    const out = await writeExplanation({ id: lesson.id, title: text.title }, paragraph, hash, locale, student.id);
    if (!out) return NextResponse.json({ error: t("learn.explain.error") }, { status: 502 });
    return NextResponse.json({ text: out, cached: false });
  } catch (err) {
    console.error("[POST /api/learn/explain]", err instanceof Error ? err.message : err);
    if (isAiBudgetError(err)) return NextResponse.json({ error: t("learn.explain.off"), code: "ai_budget" }, { status: 503 });
    return NextResponse.json({ error: t("learn.explain.error") }, { status: 502 });
  }
}
