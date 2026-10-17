import { NextRequest, NextResponse } from "next/server";
import { secretEquals } from "@/lib/require-admin";
import { runComms } from "@/lib/learn/inbox/campaigns";
import { flushSupportAlerts } from "@/lib/learn/support/tickets";

// Communications center: starts scheduled messages and sends what is pending,
// within COMMS_HOURLY_CAP emails per hour (default 300). Every recipient is
// claimed before sending, so overlapping runs never double-send. Run it every
// 15 minutes:
//   node scripts/cron.mjs comms
// The secret is accepted in the Authorization header only (Bearer), never in
// the query string, so it stays out of access logs.
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return NextResponse.json({ error: "Not configured" }, { status: 503 });
  const bearer = req.headers.get("authorization")?.replace(/^Bearer /, "") ?? null;
  if (!secretEquals(bearer, cronSecret)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const report = await runComms({ deadlineMs: 240_000 });
    // Learner support: batched follow-up alerts to the owner whose 10-minute
    // window is over (lib/learn/support/tickets.ts).
    const supportAlerts = await flushSupportAlerts().catch((err) => {
      console.error("[cron/comms] support alerts", err);
      return 0;
    });
    return NextResponse.json({ ...report, supportAlerts }, { status: report.errors.length > 0 ? 207 : 200 });
  } catch (err) {
    console.error("[cron/comms]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
