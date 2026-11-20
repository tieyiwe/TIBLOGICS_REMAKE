import { NextRequest, NextResponse } from "next/server";
import { secretEquals } from "@/lib/require-admin";
import { resumeBatchIfNeeded, runVideoQueue, syncVideoJobs } from "@/lib/learn/video/queue";

// Narrated lesson videos: keeps the queue in step with the lessons (changed
// lessons are queued again, new ones planned), then makes up to
// VIDEO_MAX_PER_RUN videos (default 2). Each job is claimed before it runs,
// so overlapping runs never make the same video twice. Run it every 15
// minutes:
//   node scripts/cron.mjs videos
// Bearer CRON_SECRET only (never in the query string).
export const dynamic = "force-dynamic";
export const maxDuration = 800;

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return NextResponse.json({ error: "Not configured" }, { status: 503 });
  const bearer = req.headers.get("authorization")?.replace(/^Bearer /, "") ?? null;
  if (!secretEquals(bearer, cronSecret)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const started = Date.now();
  try {
    // No new job starts after 4 minutes; one already running finishes.
    const deadline = started + 240_000;
    const sync = await syncVideoJobs({ aiBudget: 20, deadline: started + 60_000 });
    const run = await runVideoQueue({ deadline });
    // A batch started from the admin that stopped with a restart carries on.
    await resumeBatchIfNeeded().catch(() => {});
    return NextResponse.json({ ok: true, sync, ...run, seconds: Math.round((Date.now() - started) / 1000) });
  } catch (err) {
    console.error("[cron/videos]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}

export const POST = GET;
