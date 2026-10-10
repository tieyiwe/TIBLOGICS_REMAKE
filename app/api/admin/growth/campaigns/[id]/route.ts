import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { jsonBody, requireGrowthAdmin } from "@/lib/growth/content-auth";
import { campaignDTO, campaignProgress } from "@/lib/growth/campaigns";

type Ctx = { params: Promise<{ id: string }> };
const STATUSES = ["active", "paused", "done"];

export async function GET(_req: NextRequest, { params }: Ctx) {
  const denied = await requireGrowthAdmin();
  if (denied) return denied;
  const { id } = await params;
  const c = await prisma.growthCampaign.findUnique({ where: { id } });
  if (!c) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const p = await campaignProgress(c);
  return NextResponse.json({ campaign: campaignDTO(c), progress: { ...p, report: { totals: p.report.totals, byPlatform: p.report.byPlatform, byLink: p.report.byLink.slice(0, 20), daily: p.report.daily } } });
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const denied = await requireGrowthAdmin();
  if (denied) return denied;
  const { id } = await params;
  const b = await jsonBody(req);
  const data: { status?: string; name?: string } = {};
  if (typeof b?.status === "string" && STATUSES.includes(b.status)) data.status = b.status;
  if (typeof b?.name === "string" && b.name.trim()) data.name = b.name.trim().slice(0, 80);
  if (!Object.keys(data).length) return NextResponse.json({ error: "Nothing to change" }, { status: 400 });
  const r = await prisma.growthCampaign.updateMany({ where: { id }, data });
  if (!r.count) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ campaign: campaignDTO((await prisma.growthCampaign.findUnique({ where: { id } }))!) });
}

/** Removes the campaign record. Its kit, posts, links and sequence stay (manage them in place). */
export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const denied = await requireGrowthAdmin();
  if (denied) return denied;
  const { id } = await params;
  await prisma.growthCampaign.deleteMany({ where: { id } });
  return NextResponse.json({ ok: true });
}
