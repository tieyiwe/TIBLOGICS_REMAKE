import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { denyTrack, requireEntitledStudent } from "@/lib/learn/session";
import { trackOfLesson } from "@/lib/learn/track-of";
import { saveDraft } from "@/lib/learn/drafts/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { getT } from "@/lib/i18n/server";

// The learner reached the end of a lesson's text (components/learn/LessonPlayer).
// Recorded so "Mark complete" can require reading as well as the video
// (app/api/learn/progress).
const Body = z.object({ lessonId: z.string().min(1).max(64) });

export async function POST(req: NextRequest) {
  const { error, student, access } = await requireEntitledStudent();
  if (error) return error;
  const t = await getT();
  if (!(await checkRateLimit(`lesson-read:${student.id}`, 120, 60_000))) {
    return NextResponse.json({ error: t("learn.api.tooMany") }, { status: 429 });
  }
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: t("learn.api.invalidRequest") }, { status: 400 });
  const lt = await trackOfLesson(parsed.data.lessonId);
  if (!lt) return NextResponse.json({ error: t("learn.api.lessonNotFound") }, { status: 404 });
  const denied = lt.isPreview ? null : await denyTrack(access, lt.trackId);
  if (denied) return denied;
  await saveDraft(student.id, `read:${parsed.data.lessonId}`, { at: new Date().toISOString() });
  return NextResponse.json({ ok: true });
}
