import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { denyTrack, requireEntitledStudent } from "@/lib/learn/session";
import { trackOfLesson } from "@/lib/learn/track-of";
import { markLessonComplete } from "@/lib/learn/progress";
import { computeStreak, getTotalPoints, levelFor } from "@/lib/learn/points";
import { checkHalfway, checkLevelUp } from "@/lib/learn/milestones";
import { getT } from "@/lib/i18n/server";
import { gameDelta, gameSnapshot } from "@/lib/learn/badges";

const Body = z.object({ lessonId: z.string().min(1) });

export async function POST(req: NextRequest) {
  const { error, student, access } = await requireEntitledStudent();
  if (error) return error;
  const t = await getT();

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: t("learn.api.invalidRequest") }, { status: 400 });

  const lt = await trackOfLesson(parsed.data.lessonId);
  if (!lt) return NextResponse.json({ error: t("learn.api.lessonNotFound") }, { status: 404 });
  const denied = lt.isPreview ? null : await denyTrack(access, lt.trackId);
  if (denied) return denied;

  // Capture the total BEFORE the award so a level crossing can be detected
  // (and the earned badge set, so newly earned ones can be celebrated).
  const [totalBefore, snapBefore] = await Promise.all([getTotalPoints(student.id), gameSnapshot(student.id)]);

  const result = await markLessonComplete(student.id, parsed.data.lessonId);
  if (!result.ok) return NextResponse.json({ error: t("learn.api.lessonNotFound") }, { status: 404 });

  const streak = await computeStreak(student.id);
  const total = await getTotalPoints(student.id);

  checkLevelUp(student.id, totalBefore, total);
  // Only a first completion can change badges; a repeat skips the queries.
  const game = result.pointsAwarded > 0 ? gameDelta(snapBefore, await gameSnapshot(student.id)) : gameDelta(null, null);

  // Halfway milestone — only when this lesson was the crossing point
  const lesson = await prisma.lesson
    .findUnique({
      where: { id: parsed.data.lessonId },
      select: { module: { select: { trackId: true } } },
    })
    .catch(() => null);
  if (lesson) {
    void checkHalfway(student.id, lesson.module.trackId).catch(() => {});
  }

  return NextResponse.json({
    ok: true,
    pointsAwarded: result.pointsAwarded,
    nextLessonId: result.nextLessonId,
    totalPoints: total,
    level: levelFor(total),
    streak,
    newBadges: game.newBadges,
    levelUp: game.levelUp,
  });
}
