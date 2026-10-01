import { NextRequest, NextResponse } from "next/server";
import { requireGrowth } from "@/lib/growth/outreach/auth";
import { enrollLeads } from "@/lib/growth/outreach/sequences";

export const maxDuration = 120;

/** Enrol up to 25 leads: drafts every email for owner review. Sends nothing. */
export async function POST(req: NextRequest) {
  const deny = await requireGrowth();
  if (deny) return deny;
  const b = (await req.json().catch(() => null)) as { sequenceId?: unknown; leadIds?: unknown } | null;
  const sequenceId = typeof b?.sequenceId === "string" ? b.sequenceId : "";
  const leadIds = Array.isArray(b?.leadIds) ? b!.leadIds.filter((x): x is string => typeof x === "string") : [];
  if (!sequenceId || leadIds.length === 0) return NextResponse.json({ error: "sequenceId and leadIds[] required" }, { status: 400 });
  if (leadIds.length > 25) return NextResponse.json({ error: "At most 25 leads per request" }, { status: 400 });
  try {
    return NextResponse.json(await enrollLeads(sequenceId, leadIds));
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 400 });
  }
}
