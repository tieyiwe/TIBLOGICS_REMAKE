import { NextRequest, NextResponse } from "next/server";
import { jsonBody, requireGrowthAdmin } from "@/lib/growth/content-auth";
import { runRepurpose } from "@/lib/growth/content/repurpose";
import { publishDuePosts } from "@/lib/growth/content/scheduler";

// "Run now" from the hub: the same work as the cron, on demand.
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const denied = await requireGrowthAdmin();
  if (denied) return denied;
  const b = await jsonBody(req);
  try {
    if (b?.job === "publish") return NextResponse.json({ publish: await publishDuePosts() });
    return NextResponse.json({ repurpose: await runRepurpose() });
  } catch (err) {
    console.error("[growth/run]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Run failed" }, { status: 500 });
  }
}
