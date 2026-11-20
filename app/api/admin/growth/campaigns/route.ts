import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { jsonBody, requireGrowthAdmin } from "@/lib/growth/content-auth";
import { campaignDTO, CampaignError, launchCampaign, normalizeInput } from "@/lib/growth/campaigns";

// Creating a campaign writes a kit (one Sonnet call) and queues its posts.
export const maxDuration = 240;

export async function GET() {
  const denied = await requireGrowthAdmin();
  if (denied) return denied;
  const rows = await prisma.growthCampaign.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
  return NextResponse.json({ campaigns: rows.map(campaignDTO) });
}

/** Campaign Copilot step 2: create everything as drafts. */
export async function POST(req: NextRequest) {
  const denied = await requireGrowthAdmin();
  if (denied) return denied;
  const b = await jsonBody(req);
  if (!b?.plan || JSON.stringify(b.plan).length > 60_000) return NextResponse.json({ error: "Draft a plan first." }, { status: 400 });
  try {
    const input = normalizeInput(b.input);
    const c = await launchCampaign(input, b.plan);
    return NextResponse.json({ campaign: campaignDTO(c) }, { status: 201 });
  } catch (err) {
    if (err instanceof CampaignError) return NextResponse.json({ error: err.message }, { status: 422 });
    console.error("[growth/campaigns] launch", err);
    return NextResponse.json({ error: "Could not create the campaign." }, { status: 500 });
  }
}
