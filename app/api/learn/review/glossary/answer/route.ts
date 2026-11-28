import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireStudent } from "@/lib/learn/session";
import { checkRateLimit } from "@/lib/rate-limit";
import { getLocale, translatorFor } from "@/lib/i18n/server";
import { answerGlossaryCard } from "@/lib/learn/glossary/review";

// "I knew it" / "Not yet" on a glossary card: up one Leitner box, or back to
// box 1 (due tomorrow). Only a due card of this learner moves.
const Body = z.object({
  termId: z.string().regex(/^[a-z0-9-]{1,64}$/),
  knew: z.boolean(),
});

export async function POST(req: NextRequest) {
  const { error, student } = await requireStudent();
  if (error) return error;
  const locale = await getLocale();
  const t = translatorFor(locale);
  if (!(await checkRateLimit(`glossary-answer:${student.id}`, 300, 3_600_000))) {
    return NextResponse.json({ error: t("learn.api.tooManyLater") }, { status: 429 });
  }
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: t("learn.api.invalidRequest") }, { status: 400 });
  try {
    const result = await answerGlossaryCard(student.id, parsed.data.termId, parsed.data.knew);
    if (!result) return NextResponse.json({ error: t("method.api.noCard") }, { status: 404 });
    return NextResponse.json(result);
  } catch (err) {
    console.error("[POST /api/learn/review/glossary/answer]", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: t("method.api.failed") }, { status: 500 });
  }
}
