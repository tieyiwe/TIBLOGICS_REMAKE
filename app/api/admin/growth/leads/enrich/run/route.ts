import { NextResponse } from "next/server";
import { requireGrowth } from "@/lib/growth/outreach/auth";
import { processEnrichQueue } from "@/lib/growth/outreach/enrich";

export const maxDuration = 120;

/**
 * Process a few queued leads (one at a time, rate-limited). The workspace
 * calls this repeatedly while the queue is non-empty; the cron drains it too.
 */
export async function POST() {
  const deny = await requireGrowth();
  if (deny) return deny;
  return NextResponse.json(await processEnrichQueue(3));
}
