import { NextRequest, NextResponse } from "next/server";
import { secretEquals } from "@/lib/require-admin";
import { runGrowthCron } from "@/lib/growth/content/scheduler";

// Growth content cron: publishes due scheduled posts (claimed before
// publishing, so overlapping runs never double-post), turns due posts on
// platforms without tokens into "ready to post", and drafts posts for new
// articles, tracks, lessons, products, events and live sessions.
// Every 15 minutes: npm run cron growth. Bearer CRON_SECRET only.
export const maxDuration = 300;

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return NextResponse.json({ error: "Not configured" }, { status: 503 });
  const auth = req.headers.get("authorization");
  const bearer = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!secretEquals(bearer, cronSecret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const report = await runGrowthCron({ repurpose: req.nextUrl.searchParams.get("repurpose") !== "0" });
    return NextResponse.json(report, { status: report.errors.length > 0 ? 207 : 200 });
  } catch (err) {
    console.error("[cron/growth]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
