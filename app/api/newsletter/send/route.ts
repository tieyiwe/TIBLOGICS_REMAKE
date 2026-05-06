import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendCampaign } from "../campaigns/route";
import { requireAdmin } from "@/lib/require-admin";

export async function POST(req: NextRequest) {
  const unauth = await requireAdmin();
  if (unauth) return unauth;

  try {
    const { campaignId } = await req.json();
    if (!campaignId) {
      const latest = await prisma.newsletterCampaign.findFirst({ where: { status: "DRAFT" }, orderBy: { createdAt: "desc" } });
      if (!latest) return NextResponse.json({ error: "No draft campaigns to send" }, { status: 400 });
      return sendCampaign(latest.id);
    }
    return sendCampaign(campaignId);
  } catch (err) {
    console.error("Send campaign error:", err);
    return NextResponse.json({ error: "Failed to send" }, { status: 500 });
  }
}
