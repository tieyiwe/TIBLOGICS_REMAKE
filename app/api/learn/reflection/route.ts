import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { denyTrack, requireEntitledStudent } from "@/lib/learn/session";
import { trackOfLesson } from "@/lib/learn/track-of";
import { checkRateLimit } from "@/lib/require-admin";
import { awardPoints, getTotalPoints } from "@/lib/learn/points";
import { checkLevelUp } from "@/lib/learn/milestones";
import { gameDelta, gameSnapshot } from "@/lib/learn/badges";
import { ensureMethodTables } from "@/lib/learn/method/db";
import { REFLECTION_MAX_CHARS, REFLECTION_MIN_WORDS, countWords } from "@/lib/learn/method/words";
import { getT } from "@/lib/i18n/server";

// The Learning Loop's Reflect step. A reflection is private to the learner:
// it is keyed on the signed-in student, never on anything the client sends.
// Saving an empty text deletes it. XP once per lesson, for 15 words or more.
const Body = z.object({
  lessonId: z.string().min(1).max(64),
  text: z.string().max(REFLECTION_MAX_CHARS),
});

export async function PUT(req: NextRequest) {
  const { error, student, access } = await requireEntitledStudent();
  if (error) return error;
  const t = await getT();
  if (!(await checkRateLimit(`reflection:${student.id}`, 60, 3_600_000))) {
    return NextResponse.json({ error: t("learn.api.tooManyLater") }, { status: 429 });
  }
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: t("method.reflect.tooLong") }, { status: 400 });
  const lessonId = parsed.data.lessonId;
  const text = parsed.data.text.trim();

  try {
    await ensureMethodTables();
    const lesson = await trackOfLesson(lessonId);
    if (!lesson) return NextResponse.json({ error: t("learn.api.lessonNotFound") }, { status: 404 });
    const denied = lesson.isPreview ? null : await denyTrack(access, lesson.trackId);
    if (denied) return denied;

    const key = { studentId_lessonId: { studentId: student.id, lessonId } };
    if (!text) {
      await prisma.lessonReflection.deleteMany({ where: { studentId: student.id, lessonId } });
      return NextResponse.json({ ok: true, deleted: true, pointsAwarded: 0, newBadges: [], levelUp: null });
    }
    const row = await prisma.lessonReflection.upsert({
      where: key,
      create: { studentId: student.id, lessonId, text },
      update: { text },
      select: { updatedAt: true },
    });

    const words = countWords(text);
    let pointsAwarded = 0;
    let game = gameDelta(null, null);
    if (words >= REFLECTION_MIN_WORDS) {
      const [totalBefore, before] = await Promise.all([getTotalPoints(student.id), gameSnapshot(student.id)]);
      pointsAwarded = await awardPoints(student.id, "reflection", lessonId);
      if (pointsAwarded > 0) {
        checkLevelUp(student.id, totalBefore, totalBefore + pointsAwarded);
        game = gameDelta(before, await gameSnapshot(student.id));
      }
    }
    return NextResponse.json({ ok: true, words, updatedAt: row.updatedAt.toISOString(), pointsAwarded, ...game });
  } catch (err) {
    console.error("[PUT /api/learn/reflection]", err);
    return NextResponse.json({ error: t("method.api.failed") }, { status: 500 });
  }
}
