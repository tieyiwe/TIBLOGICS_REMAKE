import { NextRequest, NextResponse } from "next/server";
import { communityGuard, fail, limited, str } from "@/lib/learn/community/api";
import { createPost, deleteThread, editThread, getThread, postingBlock, visibleThread } from "@/lib/learn/community/discussion";
import { LIMITS } from "@/lib/learn/community/shared";

type Ctx = { params: Promise<{ id: string }> };

/** The thread and its replies. */
export async function GET(_req: NextRequest, { params }: Ctx) {
  const g = await communityGuard();
  if (g.error) return g.error;
  const data = await getThread(g.student.id, g.tracks, (await params).id);
  if (!data) return fail(g.t, "community.err.notFound", 404);
  return NextResponse.json(data);
}

/** Reply: { bodyMd }. */
export async function POST(req: NextRequest, { params }: Ctx) {
  const g = await communityGuard();
  if (g.error) return g.error;
  const { t, student } = g;
  const id = (await params).id;
  const thread = await visibleThread(student.id, g.tracks, id);
  if (!thread || thread.hidden) return fail(t, "community.err.notFound", 404);
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const bodyMd = str(body.bodyMd);
  if (bodyMd.length < LIMITS.replyMin || bodyMd.length > LIMITS.bodyMax) {
    return fail(t, "community.err.bodyLength", 400, { min: LIMITS.replyMin, max: LIMITS.bodyMax });
  }
  const block = await postingBlock(student.id, bodyMd);
  if (block) return fail(t, block, 403, { days: LIMITS.newAccountDays });
  if (await limited("reply", student.id, LIMITS.repliesPerHour, 3_600_000)) return fail(t, "community.err.slowDown", 429);
  const postId = await createPost(id, student.id, bodyMd);
  return NextResponse.json({ ok: true, id: postId });
}

/** Edit own thread: { title, bodyMd }. */
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const g = await communityGuard();
  if (g.error) return g.error;
  const { t, student } = g;
  const id = (await params).id;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const title = str(body.title, 400);
  const bodyMd = str(body.bodyMd);
  if (title.length < LIMITS.titleMin || title.length > LIMITS.titleMax) {
    return fail(t, "community.err.titleLength", 400, { min: LIMITS.titleMin, max: LIMITS.titleMax });
  }
  if (bodyMd.length < LIMITS.threadBodyMin || bodyMd.length > LIMITS.bodyMax) {
    return fail(t, "community.err.bodyLength", 400, { min: LIMITS.threadBodyMin, max: LIMITS.bodyMax });
  }
  const thread = await visibleThread(student.id, g.tracks, id);
  if (!thread || thread.authorId !== student.id) return fail(t, "community.err.notYours", 403);
  const block = await postingBlock(student.id, `${title}\n${bodyMd}`);
  if (block) return fail(t, block, 403, { days: LIMITS.newAccountDays });
  if (await limited("edit", student.id, 60, 3_600_000)) return fail(t, "community.err.slowDown", 429);
  await editThread(id, student.id, title, bodyMd);
  return NextResponse.json({ ok: true });
}

/** Delete own thread. */
export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const g = await communityGuard();
  if (g.error) return g.error;
  const ok = await deleteThread((await params).id, g.student.id);
  if (!ok) return fail(g.t, "community.err.notYours", 403);
  return NextResponse.json({ ok: true });
}
