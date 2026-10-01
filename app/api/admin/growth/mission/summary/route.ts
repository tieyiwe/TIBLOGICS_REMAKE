import { NextResponse } from "next/server";
import { ClaudeRefusal } from "@/lib/claude";
import { requireGrowthAdmin } from "@/lib/growth/content-auth";
import { getNextActions, missionSummary } from "@/lib/growth/mission";

export const maxDuration = 30;

/** Optional two-sentence brief of the action feed (Haiku, cached per feed). */
export async function POST() {
  const denied = await requireGrowthAdmin();
  if (denied) return denied;
  try {
    return NextResponse.json(await missionSummary(await getNextActions()));
  } catch (err) {
    if (!(err instanceof ClaudeRefusal)) console.error("[growth/mission] summary", err);
    return NextResponse.json({ error: "Summary unavailable" }, { status: 502 });
  }
}
