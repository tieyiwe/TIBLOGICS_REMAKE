import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAccess, denyTrack, requireStudent } from "@/lib/learn/session";
import { trackOfLesson } from "@/lib/learn/track-of";
import { checkRateLimit } from "@/lib/require-admin";
import { saveVideoProgress } from "@/lib/learn/video/store";
import { COVERAGE_BUCKETS } from "@/lib/learn/video/shared";
import { getT } from "@/lib/i18n/server";

// A learner's place in a lesson video: where they are and which parts they
// have seen. Keyed on the signed-in student, never on anything the client
// sends. POST (not PUT) so the page can use navigator.sendBeacon on leave.
const Body = z.object({
  lessonId: z.string().min(1).max(64),
  position: z.number().min(0).max(86_400),
  duration: z.number().min(0).max(86_400),
  coverage: z.string().regex(/^[01]*$/).max(COVERAGE_BUCKETS),
});

export async function POST(req: NextRequest) {
  const { error, student } = await requireStudent();
  if (error) return error;
  const t = await getT();
  // Saves come every ~15 seconds of playback, plus pauses and seeks.
  if (!(await checkRateLimit(`video:${student.id}`, 600, 3_600_000))) {
    return NextResponse.json({ error: t("learn.api.tooManyLater") }, { status: 429 });
  }
  let raw: unknown = null;
  try {
    // sendBeacon posts text/plain; parse the body either way.
    raw = JSON.parse(await req.text());
  } catch {
    raw = null;
  }
  const parsed = Body.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: t("learn.api.invalidRequest") }, { status: 400 });
  const { lessonId, position, duration, coverage } = parsed.data;

  const lesson = await trackOfLesson(lessonId);
  if (!lesson) return NextResponse.json({ error: t("learn.api.lessonNotFound") }, { status: 404 });
  if (!lesson.isPreview) {
    const denied = await denyTrack(await getAccess(student.id), lesson.trackId);
    if (denied) return denied;
  }

  try {
    const r = await saveVideoProgress(student.id, lessonId, { position, duration, coverage });
    return NextResponse.json({ ok: true, ...r });
  } catch (err) {
    console.error("[POST /api/learn/video/progress]", err);
    return NextResponse.json({ error: t("video.api.failed") }, { status: 500 });
  }
}
