import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireGrowthAdmin } from "@/lib/growth/content-auth";
import { campaignDTO, matchLeads } from "@/lib/growth/campaigns";

type Ctx = { params: Promise<{ id: string }> };

/** Leads that match the campaign's outreach filter (for "enrol matching leads"). */
export async function GET(_req: NextRequest, { params }: Ctx) {
  const denied = await requireGrowthAdmin();
  if (denied) return denied;
  const { id } = await params;
  const c = await prisma.growthCampaign.findUnique({ where: { id } });
  if (!c) return NextResponse.json({ error: "Not found" }, { status: 404 });
  try {
    return NextResponse.json(await matchLeads(campaignDTO(c).leadFilter));
  } catch (err) {
    console.error("[growth/campaigns] leads", err);
    return NextResponse.json({ count: 0, leads: [] });
  }
}
