import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireEntitledStudent } from "@/lib/learn/session";
import { checkRateLimit } from "@/lib/require-admin";
import { answerCard } from "@/lib/learn/method/review";
import { getLocale, translatorFor } from "@/lib/i18n/server";

// Grades one Daily Review card by the index of the option chosen (in the order
// served for this round) and moves the card between Leitner boxes. Only cards
// the learner already holds can be answered.
const Body = z.object({
  questionId: z.string().min(1).max(64),
  choice: z.number().int().min(0).max(10),
  round: z.string().regex(/^[A-Za-z0-9_-]{8,32}$/),
});

export async function POST(req: NextRequest) {
  const { error, student } = await requireEntitledStudent();
  if (error) return error;
  const locale = await getLocale();
  const t = translatorFor(locale);
  if (!(await checkRateLimit(`review-answer:${student.id}`, 300, 3_600_000))) {
    return NextResponse.json({ error: t("learn.api.tooManyLater") }, { status: 429 });
  }
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: t("learn.api.invalidRequest") }, { status: 400 });
  const { questionId, choice, round } = parsed.data;
  try {
    const result = await answerCard(student.id, questionId, choice, round, locale);
    if (!result) return NextResponse.json({ error: t("method.api.noCard") }, { status: 404 });
    return NextResponse.json(result);
  } catch (err) {
    console.error("[POST /api/learn/review/answer]", err);
    return NextResponse.json({ error: t("method.api.failed") }, { status: 500 });
  }
}
