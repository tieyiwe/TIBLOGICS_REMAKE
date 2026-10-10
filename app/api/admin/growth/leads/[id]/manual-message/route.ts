import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { runClaude } from "@/lib/claude";
import { limitGrowthAi, requireGrowth } from "@/lib/growth/outreach/auth";
import { offerName } from "@/lib/growth/outreach/offers";
import { outreachConfig } from "@/lib/growth/outreach/config";
import { utm } from "@/lib/growth/outreach/templates";

/**
 * AI draft for a MANUAL channel (WhatsApp click-to-chat or a LinkedIn
 * connection note). Never sent automatically: cold automated WhatsApp/SMS is
 * against Meta's policy and SMS rules; the owner copies and sends it.
 */
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const deny = await requireGrowth();
  if (deny) return deny;
  const limited = await limitGrowthAi("manual-message", 60);
  if (limited) return limited;
  const { id } = await ctx.params;
  const lead = await prisma.growthLead.findUnique({ where: { id } });
  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const { channel } = ((await req.json().catch(() => ({}))) ?? {}) as { channel?: string };
  if (channel !== "whatsapp" && channel !== "linkedin") return NextResponse.json({ error: "channel must be whatsapp or linkedin" }, { status: 400 });
  const cfg = outreachConfig();
  const bookingUrl = utm("/book", "manual-outreach", lead.id, channel);
  const limit = channel === "linkedin" ? "under 280 characters, no links" : "under 70 words, end with this exact link: " + bookingUrl;
  try {
    const { text } = await runClaude("outreach-personalise", {
      system: `Write one short, friendly, first-person ${channel === "linkedin" ? "LinkedIn connection note" : "WhatsApp message"} from ${cfg.fromName} at TIBLOGICS to a business owner. ${limit}. Use only the facts given; invent nothing. No emojis, no hype, no pressure. Return only the message text.`,
      messages: [{ role: "user", content: JSON.stringify({ company: lead.companyName, contact: lead.contactName, industry: lead.industry, area: lead.area, opener: lead.opener, offer: offerName(lead.bestOffer) }) }],
      maxTokens: 300,
      meta: { ref: `growth-lead:${lead.id}` },
    });
    let msg = text.trim().replace(/^"|"$/g, "");
    if (channel === "linkedin" && msg.length > 300) msg = `${msg.slice(0, 296).replace(/\s+\S*$/, "")}...`;
    if (channel === "whatsapp" && !msg.includes(bookingUrl)) msg = `${msg} ${bookingUrl}`;
    return NextResponse.json({ text: msg });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "AI unavailable" }, { status: 502 });
  }
}
