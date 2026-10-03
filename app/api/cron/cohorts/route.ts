import { NextRequest, NextResponse } from "next/server";
import { secretEquals } from "@/lib/require-admin";
import { runCommunityJobs } from "@/lib/learn/community/cron";

// Cohort live-session reminders (24h before), weekly "falling behind" nudges
// and discussion reply digests. Every step is idempotent, so run it hourly:
//   npm run cron cohorts
export const maxDuration = 300;

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return NextResponse.json({ error: "Not configured" }, { status: 503 });
  const bearer = req.headers.get("authorization")?.replace(/^Bearer /, "") ?? null;
  if (!secretEquals(bearer, cronSecret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const report = await runCommunityJobs();
    return NextResponse.json(report, { status: report.errors.length > 0 ? 207 : 200 });
  } catch (err) {
    console.error("[cron/cohorts]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
