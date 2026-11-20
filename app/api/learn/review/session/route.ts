import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { requireEntitledStudent, scopedTrackIds } from "@/lib/learn/session";
import { checkRateLimit } from "@/lib/require-admin";
import { buildSession } from "@/lib/learn/method/review";
import { getLocale, translatorFor } from "@/lib/i18n/server";

// Serves today's Daily Review cards: question text and shuffled options only.
// The answer key and explanations stay on the server until each answer.
export async function GET(req: Request) {
  const { error, student, access } = await requireEntitledStudent();
  if (error) return error;
  const locale = await getLocale();
  const t = translatorFor(locale);
  // Serving can create cards, so it is limited like a write.
  if (!(await checkRateLimit(`review-serve:${student.id}`, 60, 3_600_000))) {
    return NextResponse.json({ error: t("learn.api.tooManyLater") }, { status: 429 });
  }
  try {
    const round = randomBytes(9).toString("base64url");
    // Mastery paths: ?module=<id> limits the session to one module (focused
    // review). The banks are still scoped to the learner's open tracks.
    const focus = new URL(req.url).searchParams.get("module");
    const focusModuleId = focus && /^[A-Za-z0-9_-]{1,64}$/.test(focus) ? focus : null;
    const { questions, pending, remaining } = await buildSession(student.id, locale, round, await scopedTrackIds(access), { focusModuleId });
    return NextResponse.json(
      { round, questions, pending, remaining },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (err) {
    console.error("[GET /api/learn/review/session]", err);
    return NextResponse.json({ error: t("method.api.failed") }, { status: 500 });
  }
}
