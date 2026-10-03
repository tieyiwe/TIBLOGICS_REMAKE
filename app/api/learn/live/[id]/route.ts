import { NextRequest, NextResponse } from "next/server";
import { liveFail, liveGuard } from "@/lib/learn/live/api";
import { limited } from "@/lib/learn/community/api";
import { cancelRsvp, getSession, joinSession, rsvp } from "@/lib/learn/live/sessions";
import { mailPromoted, mailRsvp } from "@/lib/learn/live/notify";
import { LIVE_LIMITS } from "@/lib/learn/live/shared";

// POST { action: "rsvp" | "cancel" | "join" }
//   rsvp:   a seat when one is free, else the waitlist (confirmation email)
//   cancel: frees the seat; the next learner on the waitlist moves up
//   join:   inside the window only (15 minutes before until the end); records
//           attendance, awards the XP once and returns the meeting link
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const g = await liveGuard();
  if (g.error) return g.error;
  const { t, student } = g;
  const id = (await params).id;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const session = await getSession(id);
  if (!session) return liveFail(t, "live.err.notFound", 404);

  switch (body.action) {
    case "rsvp": {
      if (await limited("live-rsvp", student.id, LIVE_LIMITS.rsvpPerHour, 3_600_000)) return liveFail(t, "live.err.slowDown", 429);
      const r = await rsvp(id, student.id);
      if (r === "missing") return liveFail(t, "live.err.notFound", 404);
      if (r === "closed") return liveFail(t, "live.err.closed", 409);
      if (r === "already") return NextResponse.json({ ok: true, status: "already" });
      await mailRsvp(student.id, session, r);
      return NextResponse.json({ ok: true, status: r });
    }
    case "cancel": {
      const r = await cancelRsvp(id, student.id);
      if (r.promoted.length) await mailPromoted(r.promoted, session);
      return NextResponse.json({ ok: true, removed: r.removed });
    }
    case "join": {
      const r = await joinSession(id, student.id);
      if (!r.ok) {
        const key = { missing: "live.err.notFound", notGoing: "live.err.notGoing", closed: "live.err.joinClosed", noLink: "live.err.noLink" }[r.reason];
        return liveFail(t, key, r.reason === "missing" ? 404 : 409);
      }
      return NextResponse.json({ ok: true, url: r.url, points: r.points });
    }
    default:
      return liveFail(t, "live.err.invalid");
  }
}
