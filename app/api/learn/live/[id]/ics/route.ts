import { NextRequest, NextResponse } from "next/server";
import { liveFail, liveGuard } from "@/lib/learn/live/api";
import { getSession } from "@/lib/learn/live/sessions";
import { sessionEnd } from "@/lib/learn/live/shared";
import { singleEventIcs } from "@/lib/learn/community/ics";

// The session as an .ics file, for any learner who may attend. It carries
// the session page, not the meeting link: learners join from the page,
// which opens 15 minutes before the start and records attendance.
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const g = await liveGuard();
  if (g.error) return g.error;
  const { t } = g;
  const id = (await params).id;
  const s = await getSession(id);
  if (!s) return liveFail(t, "live.err.notFound", 404);
  const pageUrl = `${req.nextUrl.origin}/learn/live/${s.id}`;
  const body = singleEventIcs({
    uid: `live-${s.id}`,
    calName: t("live.title"),
    summary: `${s.title} · ${s.expertName}`,
    description: [s.topic ?? "", t("live.ics.joinFrom"), pageUrl].filter(Boolean).join("\n"),
    pageUrl,
    start: s.startsAt,
    end: sessionEnd(s),
    cancelled: s.status === "cancelled",
  });
  const file = s.title.replace(/[^\w-]+/g, "-").replace(/^-+|-+$/g, "").toLowerCase().slice(0, 60) || "live-session";
  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${file}.ics"`,
      "Cache-Control": "private, no-store",
    },
  });
}
