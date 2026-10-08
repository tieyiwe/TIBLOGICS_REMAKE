import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { denyTrack, requireEntitledStudent } from "@/lib/learn/session";
import { trackOfLesson } from "@/lib/learn/track-of";
import { markLessonComplete } from "@/lib/learn/progress";
import { computeStreak, getTotalPoints, levelFor } from "@/lib/learn/points";
import { checkHalfway, checkLevelUp } from "@/lib/learn/milestones";
import { getLocale, getT } from "@/lib/i18n/server";
import { lessonVideoFor } from "@/lib/learn/video/store";
import { readDraft } from "@/lib/learn/drafts/server";
import { isOwnerStudent } from "@/lib/learn/owner";
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

  // A lesson video must be watched before the lesson counts as done (the
  // owner's account is exempt: noSkip is false for it).
  // The text must be read to the end too. A lesson already completed (or the
  // owner's account) is never re-checked.
  const lessonRow = await prisma.lesson.findUnique({ where: { id: parsed.data.lessonId }, select: { id: true, videoUrl: true, bodyMd: true } });
  const alreadyDone = lessonRow
    ? !!(await prisma.lessonProgress.findFirst({ where: { studentId: student.id, lessonId: lessonRow.id }, select: { lessonId: true } }))
    : true;
  if (lessonRow && !alreadyDone && !(await isOwnerStudent(student.id))) {
    const video = await lessonVideoFor(student.id, lessonRow, await getLocale()).catch(() => null);
    const videoMissing = !!video && video.noSkip && !video.watched;
    const textMissing = !!lessonRow.bodyMd?.trim() && !(await readDraft(student.id, `read:${lessonRow.id}`));
    if (videoMissing || textMissing) {
      const code = videoMissing && textMissing ? "both" : videoMissing ? "video_unwatched" : "text_unread";
      const msg = code === "both" ? "learn.lesson.bothFirst" : code === "video_unwatched" ? "learn.lesson.videoFirst" : "learn.lesson.readFirst";
      return NextResponse.json({ error: t(msg), code }, { status: 409 });
    }
  }

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
