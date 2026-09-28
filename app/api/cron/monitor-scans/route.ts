import { NextRequest, NextResponse } from "next/server";
import { secretEquals } from "@/lib/require-admin";
import { dueMonitors, runMonitor } from "@/lib/monitor/run";

// Runs the Readiness Monitor scans that are due. Call hourly:
//   npm run cron monitor
// Each subscriber is rescanned every SCAN_INTERVAL_DAYS; a call with nothing
// due does nothing. Batches are capped so one call stays inside maxDuration;
// anything left over is picked up by the next call.

export const maxDuration = 300;

const BATCH = 8;

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.error("[cron/monitor-scans] CRON_SECRET is not set — refusing to run");
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }
  const authHeader = req.headers.get("authorization");
  const bearer = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const q = new URL(req.url).searchParams.get("secret");
  if (!secretEquals(bearer, cronSecret) && !secretEquals(q, cronSecret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ids = await dueMonitors(BATCH);
  let ran = 0, emailed = 0, failed = 0;
  // One subscriber at a time: each already scans its four sites in parallel,
  // and going wider would hit competitors' servers from one IP all at once.
  for (const id of ids) {
    try {
      const r = await runMonitor(id);
      if (r.ran) {
        ran++;
        if (r.emailed) emailed++;
      }
    } catch (err) {
      failed++;
      console.error("[cron/monitor-scans]", id, err instanceof Error ? err.message : err);
    }
  }
  return NextResponse.json({ due: ids.length, ran, emailed, failed }, { status: failed > 0 && ran === 0 ? 500 : 200 });
}
