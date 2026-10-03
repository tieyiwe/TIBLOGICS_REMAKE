import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { canAccessTrack } from "@/lib/learn/session";
import { communityGuard, fail, limited } from "@/lib/learn/community/api";
import { getCohort, joinCohort, leaveCohort } from "@/lib/learn/community/cohorts";
import { sendCohortWelcome } from "@/lib/learn/community/emails";
import { nextSession } from "@/lib/learn/community/shared";

// POST { action: "join" | "leave" }
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const g = await communityGuard();
  if (g.error) return g.error;
  const { t, student, access } = g;
  const id = (await params).id;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const cohort = await getCohort(id);
  if (!cohort) return fail(t, "community.err.notFound", 404);

  if (body.action === "leave") {
    await leaveCohort(id, student.id);
    return NextResponse.json({ ok: true });
  }
  if (body.action !== "join") return fail(t, "community.err.invalid");
  if (!canAccessTrack(access, cohort.trackId)) return fail(t, "community.err.trackLocked", 403);
  if (await limited("join", student.id, 20, 3_600_000)) return fail(t, "community.err.slowDown", 429);

  const r = await joinCohort(id, student.id);
  if (r === "full") return fail(t, "community.err.cohortFull", 409);
  if (r === "closed") return fail(t, "community.err.cohortClosed", 409);
  if (r === "ended") return fail(t, "community.err.cohortEnded", 409);
  if (r === "missing") return fail(t, "community.err.notFound", 404);

  if (r === "joined") {
    const [s, track] = await Promise.all([
      prisma.student.findUnique({ where: { id: student.id }, select: { email: true, name: true, locale: true } }),
      prisma.learnTrack.findUnique({ where: { id: cohort.trackId }, select: { title: true } }),
    ]);
    if (s) {
      // The join stands even if the mail server is down.
      await sendCohortWelcome(s, {
        id: cohort.id,
        name: cohort.name,
        trackTitle: track?.title ?? "",
        nextSession: nextSession(cohort)?.start ?? null,
        timezone: cohort.timezone,
        meetingUrl: cohort.meetingUrl,
      }).catch((err) => console.error("[community] welcome email", err));
    }
  }
  return NextResponse.json({ ok: true, joined: true });
}
