import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireEntitledStudent } from "@/lib/learn/session";
import { markLessonComplete } from "@/lib/learn/progress";
import { computeStreak, getTotalPoints, levelFor } from "@/lib/learn/points";

const Body = z.object({ lessonId: z.string().min(1) });

export async function POST(req: NextRequest) {
  const { error, student } = await requireEntitledStudent();
  if (error) return error;

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const result = await markLessonComplete(student.id, parsed.data.lessonId);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 404 });

  const streak = await computeStreak(student.id);
  const total = await getTotalPoints(student.id);

  return NextResponse.json({
    ok: true,
    pointsAwarded: result.pointsAwarded,
    nextLessonId: result.nextLessonId,
    totalPoints: total,
    level: levelFor(total),
    streak,
  });
}
