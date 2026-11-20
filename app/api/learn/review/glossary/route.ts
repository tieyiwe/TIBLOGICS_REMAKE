import { NextResponse } from "next/server";
import { requireStudent } from "@/lib/learn/session";
import { checkRateLimit } from "@/lib/rate-limit";
import { getLocale, translatorFor } from "@/lib/i18n/server";
import { dueGlossaryCards } from "@/lib/learn/glossary/review";

// The glossary cards due today (lib/learn/glossary/review.ts): the term and
// its meaning in the learner's language. Self-graded, so the meaning travels
// with the card.
export async function GET() {
  const { error, student } = await requireStudent();
  if (error) return error;
  const locale = await getLocale();
  const t = translatorFor(locale);
  if (!(await checkRateLimit(`glossary-review:${student.id}`, 60, 3_600_000))) {
    return NextResponse.json({ error: t("learn.api.tooManyLater") }, { status: 429 });
  }
  try {
    const { cards, due } = await dueGlossaryCards(student.id, locale);
    return NextResponse.json({ cards, due }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("[GET /api/learn/review/glossary]", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: t("method.api.failed") }, { status: 500 });
  }
}
