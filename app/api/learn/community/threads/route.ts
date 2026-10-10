import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { canAccessTrack } from "@/lib/learn/session";
import { communityGuard, fail, limited, str } from "@/lib/learn/community/api";
import { createThread, listThreads, postingBlock, type ThreadFilter } from "@/lib/learn/community/discussion";
import { getCohort, isMember } from "@/lib/learn/community/cohorts";
import { LIMITS } from "@/lib/learn/community/shared";

// GET  ?trackId= | ?lessonId= | ?cohortId=  [&filter=recent|unanswered|top&offset=]
// POST { trackId?, lessonId?, cohortId?, title, bodyMd }
export async function GET(req: NextRequest) {
  const g = await communityGuard();
  if (g.error) return g.error;
  const q = req.nextUrl.searchParams;
  const filter = (["recent", "unanswered", "top"] as const).find((f) => f === q.get("filter")) ?? "recent";
  const threads = await listThreads(g.student.id, g.tracks, {
    trackId: q.get("trackId") ?? undefined,
    lessonId: q.get("lessonId") ?? undefined,
    cohortId: q.get("cohortId") ?? undefined,
    filter: filter as ThreadFilter,
    offset: Number(q.get("offset")) || 0,
    limit: 20,
  });
  return NextResponse.json({ threads });
}

export async function POST(req: NextRequest) {
  const g = await communityGuard();
  if (g.error) return g.error;
  const { t, student, access } = g;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const title = str(body.title, 400);
  const bodyMd = str(body.bodyMd, 20000);
  if (title.length < LIMITS.titleMin || title.length > LIMITS.titleMax) {
    return fail(t, "community.err.titleLength", 400, { min: LIMITS.titleMin, max: LIMITS.titleMax });
  }
  if (bodyMd.length < LIMITS.threadBodyMin || bodyMd.length > LIMITS.bodyMax) {
    return fail(t, "community.err.bodyLength", 400, { min: LIMITS.threadBodyMin, max: LIMITS.bodyMax });
  }

  // Where the thread lives. The track always comes from the lesson or cohort
  // on the server, never from the client alone.
  let trackId = str(body.trackId, 64) || null;
  const lessonId = str(body.lessonId, 64) || null;
  const cohortId = str(body.cohortId, 64) || null;
  if (lessonId) {
    const lesson = await prisma.lesson.findUnique({ where: { id: lessonId }, select: { module: { select: { trackId: true } } } });
    if (!lesson) return fail(t, "community.err.notFound", 404);
    trackId = lesson.module.trackId;
  }
  if (cohortId) {
    const cohort = await getCohort(cohortId);
    if (!cohort || !(await isMember(cohortId, student.id))) return fail(t, "community.err.notMember", 403);
    if (trackId && trackId !== cohort.trackId) return fail(t, "community.err.notFound", 404);
    trackId = cohort.trackId;
  }
  if (!trackId) return fail(t, "community.err.notFound", 404);
  if (!canAccessTrack(access, trackId)) return fail(t, "community.err.trackLocked", 403);
  const exists = await prisma.learnTrack.findUnique({ where: { id: trackId }, select: { id: true } });
  if (!exists) return fail(t, "community.err.notFound", 404);

  const block = await postingBlock(student.id, `${title}\n${bodyMd}`);
  if (block) return fail(t, block, 403, { days: LIMITS.newAccountDays });
  if (await limited("thread", student.id, LIMITS.threadsPerHour, 3_600_000)) return fail(t, "community.err.slowDown", 429);

  const id = await createThread({ trackId, lessonId, cohortId, authorId: student.id, title, bodyMd });
  return NextResponse.json({ ok: true, id });
}
