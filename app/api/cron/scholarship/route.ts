import { NextRequest, NextResponse } from "next/server";
import { secretEquals } from "@/lib/require-admin";
import { runScholarshipNotices } from "@/lib/learn/scholarship/notices";
import { runSponsorReports } from "@/lib/learn/scholarship/sponsor-reports";

// Tilo Vision Scholarship, daily:
//   npm run cron scholarship
// Offer reminders, track-choice and completion reminders, monthly progress
// and the completion congratulations (lib/learn/scholarship/notices.ts), then
// from the 1st of each month the sponsors' monthly impact report
// (lib/learn/scholarship/sponsor-reports.ts: once per sponsor per month).
//   ?dry=1   only lists the sponsor reports that would go out now; sends nothing

export const maxDuration = 300;

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return NextResponse.json({ error: "Not configured" }, { status: 503 });
  const bearer = req.headers.get("authorization")?.replace(/^Bearer /, "") ?? null;
  if (!secretEquals(bearer, cronSecret)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (req.nextUrl.searchParams.get("dry") === "1") return NextResponse.json({ dry: true, sponsors: await runSponsorReports({ dry: true }) });
  const started = Date.now();
  const r = await runScholarshipNotices({ deadline: started + 200_000 });
  const sponsors = await runSponsorReports({ deadline: Math.max(Date.now() + 20_000, started + 260_000) }).catch((err) => ({
    error: err instanceof Error ? err.message : String(err),
  }));
  return NextResponse.json({ ok: true, ...r, sponsors });
}
