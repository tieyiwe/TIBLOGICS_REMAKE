import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { communityGuard, fail } from "@/lib/learn/community/api";
import { getCohort, isMember } from "@/lib/learn/community/cohorts";
import { cohortIcs } from "@/lib/learn/community/ics";
import { cohortSessions } from "@/lib/learn/community/shared";

// The cohort's live sessions as an .ics file. Members only: it carries the
// meeting link.
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const g = await communityGuard();
  if (g.error) return g.error;
  const { t, student } = g;
  const id = (await params).id;
  const cohort = await getCohort(id);
  if (!cohort || !(await isMember(id, student.id))) return fail(t, "community.err.notMember", 403);
  const track = await prisma.learnTrack.findUnique({ where: { id: cohort.trackId }, select: { title: true } });
  const origin = req.nextUrl.origin;
  const body = cohortIcs({
    id: cohort.id,
    name: cohort.name,
    trackTitle: track?.title ?? "",
    meetingUrl: cohort.meetingUrl,
    pageUrl: `${origin}/learn/community/cohort/${cohort.id}`,
    sessions: cohortSessions(cohort),
    summary: (week) => t("community.cohort.liveSessionWeek", { n: week }),
  });
  const file = cohort.name.replace(/[^\w-]+/g, "-").replace(/^-+|-+$/g, "").toLowerCase() || "cohort";
  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${file}.ics"`,
      "Cache-Control": "private, no-store",
    },
  });
}
