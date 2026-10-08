import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireEntitledStudent } from "@/lib/learn/session";
import { checkRateLimit } from "@/lib/require-admin";
import { withinDailyAiBudget } from "@/lib/learn/ai-budget";
import { isOwnerStudent } from "@/lib/learn/owner";
import { getTotalPoints } from "@/lib/learn/points";
import { checkLevelUp } from "@/lib/learn/milestones";
import { isAiBudgetError, ClaudeRefusal } from "@/lib/claude";
import { getLocale, getT } from "@/lib/i18n/server";
import { ANSWER_MAX, ANSWER_MIN } from "@/lib/learn/challenge/content";
import { currentWeek } from "@/lib/learn/challenge/week";
import { gradeChallenge } from "@/lib/learn/challenge/grade";
import { MAX_EDITS, awardChallengePoints, createEntry, editEntry, getEntry } from "@/lib/learn/challenge/server";

// Weekly 10-minute challenge: submit (or edit once) this week's answer.
// Signed-in learners with an open track; always keyed on the session's
// student. Bounded three ways before any model call: one submission plus
// one edit per week, an hourly limit, and the shared daily AI allowance.
// The owner's account skips the limits and the edit cap (to test), but still
// goes through the platform AI budget inside runClaude.
export const maxDuration = 60;

const HOURLY = 6;

const Body = z.object({
  /** The week the learner was shown (refused once the week has turned). */
  week: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  answer: z.string().trim().min(ANSWER_MIN).max(ANSWER_MAX),
});

export async function POST(req: NextRequest) {
  const { error, student } = await requireEntitledStudent();
  if (error) return error;
  const [t, locale] = await Promise.all([getT(), getLocale()]);

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const key =
      issue?.path[0] === "answer"
        ? issue.code === "too_big"
          ? "learn.challenge.api.tooLong"
          : "learn.challenge.api.tooShort"
        : "learn.api.invalidRequest";
    return NextResponse.json({ error: t(key, { min: ANSWER_MIN, max: ANSWER_MAX }) }, { status: 400 });
  }
  const { answer } = parsed.data;
  const week = currentWeek();
  if (parsed.data.week !== week.key) {
    return NextResponse.json({ error: t("learn.challenge.api.weekChanged"), code: "week_changed" }, { status: 409 });
  }

  const owner = await isOwnerStudent(student.id);
  try {
    const existing = await getEntry(student.id, week.key);
    if (existing && !owner && existing.edits >= MAX_EDITS) {
      return NextResponse.json({ error: t("learn.challenge.api.noEditsLeft"), code: "no_edits" }, { status: 409 });
    }
    if (existing && existing.answer === answer) {
      return NextResponse.json({ error: t("learn.challenge.api.unchanged") }, { status: 400 });
    }
  } catch (err) {
    console.error("[POST /api/learn/challenge] read", err);
    return NextResponse.json({ error: t("learn.challenge.api.failed") }, { status: 500 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: t("learn.challenge.api.gradingOff") }, { status: 503 });
  }
  if (!owner && !(await checkRateLimit(`challenge-h:${student.id}`, HOURLY, 3_600_000))) {
    return NextResponse.json({ error: t("learn.api.tooManyLater") }, { status: 429 });
  }
  if (!(await withinDailyAiBudget(student.id))) {
    return NextResponse.json({ error: t("common.aiDailyLimit") }, { status: 429 });
  }

  let grade;
  try {
    grade = await gradeChallenge(week.challenge, answer, locale, { studentId: student.id, week: week.key });
  } catch (err) {
    if (isAiBudgetError(err)) {
      return NextResponse.json({ error: t("learn.challenge.api.gradingOff"), code: "ai_budget" }, { status: 503 });
    }
    if (err instanceof ClaudeRefusal) {
      return NextResponse.json({ error: t("learn.challenge.api.refused") }, { status: 422 });
    }
    console.error("[POST /api/learn/challenge] grade", err);
    return NextResponse.json({ error: t("learn.challenge.api.gradeFailed") }, { status: 502 });
  }

  try {
    const base = {
      studentId: student.id,
      week: week.key,
      answer,
      score: grade.score,
      feedback: grade.feedback,
      breakdown: grade.breakdown,
      locale,
    };
    // Read again: an entry may have been saved while the answer was graded.
    const current = await getEntry(student.id, week.key);
    const saved = current
      ? await editEntry({ ...base, expectedEdits: current.edits, unlimited: owner })
      : (await createEntry({ ...base, challengeId: week.challenge.id })) ?? null;
    if (!saved) {
      return NextResponse.json({ error: t("learn.challenge.api.noEditsLeft"), code: "no_edits" }, { status: 409 });
    }

    const totalBefore = await getTotalPoints(student.id);
    const pointsAwarded = await awardChallengePoints(student.id, week.key, saved.score);
    if (pointsAwarded > 0) checkLevelUp(student.id, totalBefore, totalBefore + pointsAwarded);

    return NextResponse.json({
      ok: true,
      entry: {
        score: saved.score,
        feedback: saved.feedback,
        breakdown: saved.breakdown,
        edits: saved.edits,
        answer: saved.answer,
      },
      editsLeft: owner ? 1 : Math.max(0, MAX_EDITS - saved.edits),
      pointsAwarded,
    });
  } catch (err) {
    console.error("[POST /api/learn/challenge] save", err);
    return NextResponse.json({ error: t("learn.challenge.api.failed") }, { status: 500 });
  }
}
