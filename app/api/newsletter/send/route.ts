import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendCampaign } from "../campaigns/route";

export async function POST(req: NextRequest) {
  try {
    const { campaignId } = await req.json();
    if (!campaignId) {
      // Send the latest draft
      const latest = await prisma.newsletterCampaign.findFirst({
        where: { status: "DRAFT" },
        orderBy: { createdAt: "desc" },
      });
      if (!latest) {
        return NextResponse.json({ error: "No draft campaigns to send" }, { status: 400 });
      }
      return sendCampaign(latest.id);
    }
    return sendCampaign(campaignId);
  } catch (err) {
    console.error("Send campaign error:", err);
    return NextResponse.json({ error: "Failed to send" }, { status: 500 });
  }
}
