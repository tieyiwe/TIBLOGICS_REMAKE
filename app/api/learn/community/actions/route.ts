import { NextRequest, NextResponse } from "next/server";
import { communityGuard, fail, limited, str } from "@/lib/learn/community/api";
import { getPost, report, setAnswer, toggleVote, visibleThread } from "@/lib/learn/community/discussion";
import { LIMITS, REPORT_REASONS } from "@/lib/learn/community/shared";

// POST { action: "vote", targetType: "thread" | "post", targetId }
// POST { action: "report", targetType, targetId, reason, note? }
// POST { action: "answer", threadId, postId | null }   (the asker only)
export async function POST(req: NextRequest) {
  const g = await communityGuard();
  if (g.error) return g.error;
  const { t, student, tracks } = g;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const action = str(body.action, 20);

  if (action === "vote" || action === "report") {
    const targetType = body.targetType === "thread" ? "thread" : body.targetType === "post" ? "post" : null;
    const targetId = str(body.targetId, 64);
    if (!targetType || !targetId) return fail(t, "community.err.invalid");
    // The target must be in a thread this learner can see.
    let threadId = targetId;
    if (targetType === "post") {
      const post = await getPost(targetId);
      if (!post || post.deletedAt) return fail(t, "community.err.notFound", 404);
      threadId = post.threadId;
    }
    if (!(await visibleThread(student.id, tracks, threadId))) return fail(t, "community.err.notFound", 404);

    if (action === "vote") {
      if (await limited("vote", student.id, LIMITS.votesPerHour, 3_600_000)) return fail(t, "community.err.slowDown", 429);
      const r = await toggleVote(student.id, targetType, targetId);
      if (!r) return fail(t, "community.err.ownVote", 400);
      return NextResponse.json({ ok: true, ...r });
    }

    const reason = REPORT_REASONS.find((x) => x === body.reason);
    if (!reason) return fail(t, "community.err.invalid");
    const note = str(body.note, LIMITS.reportReasonMax);
    if (await limited("report", student.id, LIMITS.reportsPerDay, 86_400_000)) return fail(t, "community.err.slowDown", 429);
    const r = await report(student.id, targetType, targetId, note ? `${reason}: ${note}` : reason);
    return NextResponse.json({ ok: true, already: r === "already" });
  }

  if (action === "answer") {
    const threadId = str(body.threadId, 64);
    const postId = body.postId === null ? null : str(body.postId, 64) || null;
    const thread = await visibleThread(student.id, tracks, threadId);
    if (!thread) return fail(t, "community.err.notFound", 404);
    if (thread.authorId !== student.id) return fail(t, "community.err.askerOnly", 403);
    const ok = await setAnswer(threadId, postId);
    if (!ok) return fail(t, "community.err.notFound", 404);
    return NextResponse.json({ ok: true });
  }

  return fail(t, "community.err.invalid");
}
