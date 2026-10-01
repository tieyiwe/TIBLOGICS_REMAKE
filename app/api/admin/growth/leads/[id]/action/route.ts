import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { limitGrowthAi, requireGrowth } from "@/lib/growth/outreach/auth";
import { leadDetail } from "@/lib/growth/outreach/detail";
import { enrichLead } from "@/lib/growth/outreach/enrich";
import { addEvent, convertLead, handoverToProspect, handoverToRex, setStage } from "@/lib/growth/outreach/leads";
import { suppress } from "@/lib/growth/outreach/suppression";

export const maxDuration = 60;

/**
 * Reply handling and handover. Replies arrive in the OUTREACH_REPLY_TO inbox
 * (no tracking pixels, no inbox scraping): the owner marks the outcome here,
 * which stops the lead's sequences immediately.
 */
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const deny = await requireGrowth();
  if (deny) return deny;
  const { id } = await ctx.params;
  const lead = await prisma.growthLead.findUnique({ where: { id } });
  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const { action } = ((await req.json().catch(() => ({}))) ?? {}) as { action?: string };

  switch (action) {
    case "replied":
      await setStage(lead, "replied");
      await addEvent(id, "replied", "Marked as replied; sequences stopped");
      break;
    case "interested":
      await setStage(lead, "interested");
      await addEvent(id, "interested", "Marked interested");
      break;
    case "not_interested":
      await setStage(lead, "lost");
      await addEvent(id, "not_interested", "Marked not interested");
      break;
    case "hot":
      await setStage(lead, "hot");
      break;
    case "bounced":
      if (!lead.email) return NextResponse.json({ error: "No email on this lead" }, { status: 400 });
      await suppress(lead.email, "bounce", "admin", "Marked bounced by owner");
      await prisma.growthLead.update({ where: { id }, data: { emailStatus: "bounced" } });
      break;
    case "unsubscribe":
      if (!lead.email) return NextResponse.json({ error: "No email on this lead" }, { status: 400 });
      await suppress(lead.email, "unsubscribe", "admin", "Asked to stop (recorded by owner)");
      break;
    case "handover_rex":
      await handoverToRex(lead);
      break;
    case "handover_prospect":
      await handoverToProspect(lead);
      break;
    case "convert":
      await convertLead(lead);
      break;
    case "enrich_now": {
      // Bypasses the queue's global limiter, so it gets its own per-user cap.
      const limited = await limitGrowthAi("enrich-now", 60);
      if (limited) return limited;
      await prisma.growthLead.update({ where: { id }, data: { enrichStatus: "running" } });
      try {
        await enrichLead(lead);
      } catch (err) {
        const msg = err instanceof Error ? err.message.slice(0, 300) : "Enrichment failed";
        await prisma.growthLead.update({ where: { id }, data: { enrichStatus: "failed", enrichError: msg } });
        return NextResponse.json({ error: msg }, { status: 502 });
      }
      break;
    }
    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
  return NextResponse.json(await leadDetail(id));
}
