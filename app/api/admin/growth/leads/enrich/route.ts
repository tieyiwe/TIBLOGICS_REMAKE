import { NextRequest, NextResponse } from "next/server";
import { requireGrowth } from "@/lib/growth/outreach/auth";
import { enqueueEnrich } from "@/lib/growth/outreach/enrich";

/** Queue leads for enrichment. Work happens in /enrich/run and the outreach cron. */
export async function POST(req: NextRequest) {
  const deny = await requireGrowth();
  if (deny) return deny;
  const body = (await req.json().catch(() => null)) as { ids?: unknown } | null;
  const ids = Array.isArray(body?.ids) ? body!.ids.filter((x): x is string => typeof x === "string") : [];
  if (ids.length === 0) return NextResponse.json({ error: "ids[] required" }, { status: 400 });
  return NextResponse.json({ queued: await enqueueEnrich(ids) });
}
