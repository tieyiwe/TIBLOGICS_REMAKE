import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { canAccessTrack } from "@/lib/learn/session";
import { rubricRows } from "@/lib/i18n/sources/labs";
import { communityGuard, fail, limited, str } from "@/lib/learn/community/api";
import { markHelpful, optIn, submitReview, type FeedbackItem } from "@/lib/learn/community/peer";
import { LIMITS } from "@/lib/learn/community/shared";
import { ensureCommunityTables } from "@/lib/learn/community/db";
import { canPostInCommunity, getYouthProfile } from "@/lib/learn/youth-account";

// Capstone peer review (advisory; never changes the official grade).
// POST { action: "optin", capstoneId }
// POST { action: "submit", reviewId, feedback: [{ rating, text }] }  (one per rubric criterion, in order)
// POST { action: "helpful", reviewId }
export async function POST(req: NextRequest) {
  const g = await communityGuard();
  if (g.error) return g.error;
  const { t, student, access } = g;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  if (body.action === "optin") {
    const capstone = await prisma.capstone.findUnique({ where: { id: str(body.capstoneId, 64) }, select: { id: true, trackId: true } });
    if (!capstone) return fail(t, "community.err.notFound", 404);
    if (!canAccessTrack(access, capstone.trackId)) return fail(t, "community.err.trackLocked", 403);
    const ok = await optIn(student.id, capstone);
    if (!ok) return fail(t, "community.peer.err.noSubmission", 400);
    return NextResponse.json({ ok: true });
  }

  if (body.action === "submit") {
    // AI-Empowered Youth: under 16, no written reviews of others' work.
    if (!canPostInCommunity(await getYouthProfile(student.id))) return fail(t, "community.err.youthReadOnly", 403);
    const reviewId = str(body.reviewId, 64);
    await ensureCommunityTables();
    const [row] = await prisma.$queryRaw<Array<{ rubric: unknown; trackId: string }>>`
      SELECT c."rubric", c."trackId" FROM "PeerReview" r
      JOIN "CapstoneSubmission" s ON s."id" = r."submissionId"
      JOIN "Capstone" c ON c."id" = s."capstoneId"
      WHERE r."id" = ${reviewId} AND r."reviewerId" = ${student.id}`;
    if (!row) return fail(t, "community.err.notFound", 404);
    if (!canAccessTrack(access, row.trackId)) return fail(t, "community.err.trackLocked", 403);
    const rubric = rubricRows(row.rubric);
    const given = Array.isArray(body.feedback) ? (body.feedback as unknown[]) : [];
    const criteria = rubric.length > 0 ? rubric.map((r) => r.criterion) : ["Overall"];
    if (given.length !== criteria.length) return fail(t, "community.err.invalid");
    const feedback: FeedbackItem[] = [];
    for (let i = 0; i < criteria.length; i++) {
      const f = (given[i] ?? {}) as Record<string, unknown>;
      const text = str(f.text, 4000);
      if (text.length < LIMITS.peerFeedbackMin || text.length > LIMITS.peerFeedbackMax) {
        return fail(t, "community.peer.err.feedbackLength", 400, { min: LIMITS.peerFeedbackMin, max: LIMITS.peerFeedbackMax });
      }
      const rating = typeof f.rating === "number" && Number.isInteger(f.rating) && f.rating >= 1 && f.rating <= 5 ? f.rating : null;
      feedback.push({ criterion: criteria[i], rating, text });
    }
    if (await limited("peer", student.id, 20, 3_600_000)) return fail(t, "community.err.slowDown", 429);
    const r = await submitReview(student.id, reviewId, feedback);
    if (r === "missing") return fail(t, "community.err.notFound", 404);
    if (r === "done") return fail(t, "community.peer.err.alreadySent", 409);
    return NextResponse.json({ ok: true });
  }

  if (body.action === "helpful") {
    const ok = await markHelpful(student.id, str(body.reviewId, 64));
    if (!ok) return fail(t, "community.err.notFound", 404);
    return NextResponse.json({ ok: true });
  }

  return fail(t, "community.err.invalid");
}
