import { NextRequest, NextResponse } from "next/server";
import { communityGuard, fail, limited, str } from "@/lib/learn/community/api";
import { deletePost, editPost, getPost, postingBlock, visibleThread } from "@/lib/learn/community/discussion";
import { LIMITS } from "@/lib/learn/community/shared";

type Ctx = { params: Promise<{ id: string }> };

/** Edit own reply: { bodyMd }. */
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const g = await communityGuard();
  if (g.error) return g.error;
  const { t, student } = g;
  const id = (await params).id;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const bodyMd = str(body.bodyMd);
  if (bodyMd.length < LIMITS.replyMin || bodyMd.length > LIMITS.bodyMax) {
    return fail(t, "community.err.bodyLength", 400, { min: LIMITS.replyMin, max: LIMITS.bodyMax });
  }
  const post = await getPost(id);
  if (!post || post.deletedAt || post.authorId !== student.id) return fail(t, "community.err.notYours", 403);
  if (!(await visibleThread(student.id, g.tracks, post.threadId))) return fail(t, "community.err.notFound", 404);
  const block = await postingBlock(student.id, bodyMd);
  if (block) return fail(t, block, 403, { days: LIMITS.newAccountDays });
  if (await limited("edit", student.id, 60, 3_600_000)) return fail(t, "community.err.slowDown", 429);
  await editPost(id, student.id, bodyMd);
  return NextResponse.json({ ok: true });
}

/** Delete own reply. */
export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const g = await communityGuard();
  if (g.error) return g.error;
  const ok = await deletePost((await params).id, g.student.id);
  if (!ok) return fail(g.t, "community.err.notYours", 403);
  return NextResponse.json({ ok: true });
}
