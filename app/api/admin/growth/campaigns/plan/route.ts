import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { ClaudeRefusal } from "@/lib/claude";
import { jsonBody, requireGrowthAdmin } from "@/lib/growth/content-auth";
import { CampaignError, normalizeInput, planCampaign } from "@/lib/growth/campaigns";

export const maxDuration = 120;

/** Campaign Copilot step 1: the plan (one Sonnet call). Nothing is created. */
export async function POST(req: NextRequest) {
  const denied = await requireGrowthAdmin();
  if (denied) return denied;
  const session = await getServerSession(authOptions).catch(() => null);
  if (!(await checkRateLimit(`growth-campaign:${session?.user?.id ?? "admin"}`, 30, 3_600_000))) {
    return NextResponse.json({ error: "Too many plans this hour. Try again later." }, { status: 429 });
  }
  const b = await jsonBody(req);
  try {
    const input = normalizeInput(b?.input ?? b);
    return NextResponse.json({ input, plan: await planCampaign(input) });
  } catch (err) {
    if (err instanceof CampaignError) return NextResponse.json({ error: err.message }, { status: 422 });
    if (err instanceof ClaudeRefusal) return NextResponse.json({ error: "The model declined to plan this campaign." }, { status: 422 });
    console.error("[growth/campaigns] plan", err);
    return NextResponse.json({ error: "Planning failed. Try again." }, { status: 502 });
  }
}
