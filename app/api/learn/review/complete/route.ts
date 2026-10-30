import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireEntitledStudent } from "@/lib/learn/session";
import { checkRateLimit } from "@/lib/require-admin";
import { awardPoints, getTotalPoints } from "@/lib/learn/points";
import { checkLevelUp } from "@/lib/learn/milestones";
import { gameDelta, gameSnapshot } from "@/lib/learn/badges";
import { MIN_FOR_COMPLETE, reviewSummary, reviewedRecently, serverDay, validDay } from "@/lib/learn/method/review";
import { getLocale, translatorFor } from "@/lib/i18n/server";

// Finishes the day's Daily Review: small XP once per day (ledger source
// "daily_review", refId the learner's local date), and the summary for the
// finish screen. The award needs proof on the server that cards were
// actually answered in the last few hours.
const Body = z.object({ day: z.string().max(10) });

export async function POST(req: NextRequest) {
  const { error, student } = await requireEntitledStudent();
  if (error) return error;
  const locale = await getLocale();
  const t = translatorFor(locale);
  if (!(await checkRateLimit(`review-complete:${student.id}`, 30, 3_600_000))) {
    return NextResponse.json({ error: t("learn.api.tooManyLater") }, { status: 429 });
  }
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: t("learn.api.invalidRequest") }, { status: 400 });
  const day = validDay(parsed.data.day) ?? serverDay();

  try {
    const { answered, total } = await reviewedRecently(student.id);
    const enough = answered > 0 && answered >= Math.min(MIN_FOR_COMPLETE, total);

    let pointsAwarded = 0;
    let game = gameDelta(null, null);
    if (enough) {
      const [totalBefore, before] = await Promise.all([getTotalPoints(student.id), gameSnapshot(student.id)]);
      pointsAwarded = await awardPoints(student.id, "daily_review", day);
      if (pointsAwarded > 0) {
        checkLevelUp(student.id, totalBefore, totalBefore + pointsAwarded);
        game = gameDelta(before, await gameSnapshot(student.id));
      }
    }
    const summary = await reviewSummary(student.id, locale);
    return NextResponse.json({ ok: true, counted: enough, pointsAwarded, ...game, summary });
  } catch (err) {
    console.error("[POST /api/learn/review/complete]", err);
    return NextResponse.json({ error: t("method.api.failed") }, { status: 500 });
  }
}
