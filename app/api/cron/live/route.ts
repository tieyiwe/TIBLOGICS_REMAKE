import { NextRequest, NextResponse } from "next/server";
import { secretEquals } from "@/lib/require-admin";
import { runLiveJobs } from "@/lib/learn/live/cron";

// Live expert sessions: 24h and 1h reminders and the "recording available"
// email. Every send is claimed before it goes out, so run it every 15
// minutes:
//   node scripts/cron.mjs live
// The secret is accepted in the Authorization header only (Bearer), never in
// the query string, so it stays out of access logs.
export const maxDuration = 300;

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return NextResponse.json({ error: "Not configured" }, { status: 503 });
  const bearer = req.headers.get("authorization")?.replace(/^Bearer /, "") ?? null;
  if (!secretEquals(bearer, cronSecret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const report = await runLiveJobs();
    return NextResponse.json(report, { status: report.errors.length > 0 ? 207 : 200 });
  } catch (err) {
    console.error("[cron/live]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
