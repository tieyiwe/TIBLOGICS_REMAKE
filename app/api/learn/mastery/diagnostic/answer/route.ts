import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { denyTrack, requireEntitledStudent } from "@/lib/learn/session";
import { checkRateLimit } from "@/lib/require-admin";
import { answerDiagnostic } from "@/lib/learn/mastery/diagnostic";
import { getLocale, translatorFor } from "@/lib/i18n/server";

// Records one diagnostic answer (the option index in the order served) and
// returns the next question, or the per-module results at the end. The reply
// never says whether the answer was right: the diagnostic draws on the same
// banks as the module quizzes.
const Body = z.object({
  sessionId: z.string().min(1).max(64),
  questionId: z.string().min(1).max(64),
  /** -1: "not sure" (counted as not known, better than a guess). */
  choice: z.number().int().min(-1).max(10),
});

export async function POST(req: NextRequest) {
  const { error, student, access } = await requireEntitledStudent();
  if (error) return error;
  const locale = await getLocale();
  const t = translatorFor(locale);
  if (!(await checkRateLimit(`diag-answer:${student.id}`, 300, 3_600_000))) {
    return NextResponse.json({ error: t("learn.api.tooManyLater") }, { status: 429 });
  }
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: t("learn.api.invalidRequest") }, { status: 400 });
  const { sessionId, questionId, choice } = parsed.data;
  try {
    const res = await answerDiagnostic(student.id, sessionId, questionId, choice, locale);
    if (!res) return NextResponse.json({ error: t("mastery.api.notFound") }, { status: 404 });
    if ("error" in res) return NextResponse.json({ error: t("mastery.api.stale"), stale: true }, { status: 409 });
    const denied = await denyTrack(access, res.trackId);
    if (denied) return denied;
    return NextResponse.json(res.state, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("[POST /api/learn/mastery/diagnostic/answer]", err);
    return NextResponse.json({ error: t("mastery.api.failed") }, { status: 500 });
  }
}
