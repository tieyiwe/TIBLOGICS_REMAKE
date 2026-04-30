export const maxDuration = 30;
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const BLAND_API_KEY = process.env.BLAND_AI_API_KEY ?? "";
const BLAND_BASE = "https://api.bland.ai/v1";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://tiblogics.com";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!BLAND_API_KEY) {
    return NextResponse.json({ error: "BLAND_AI_API_KEY not configured" }, { status: 503 });
  }

  const { leadId } = await req.json();
  if (!leadId) return NextResponse.json({ error: "leadId required" }, { status: 400 });

  const lead = await prisma.agentLead.findUnique({ where: { id: leadId } });
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

  if (!lead.phone) {
    return NextResponse.json({ error: "Lead has no phone number" }, { status: 400 });
  }

  // Build dynamic briefing from scraped business info
  const info = (lead.businessInfo ?? {}) as Record<string, unknown>;
  const briefing = (info.briefing as string) ?? "";
  const opportunities = (info.keyOpportunities as string[]) ?? [];
  const recommendedServices = (info.recommendedServices as string[]) ?? ["AI implementation", "workflow automation"];
  const hasWebsite = lead.hasWebsite;

  const noWebsiteNote = hasWebsite === false
    ? `Important: This business does not have a website. You should mention that TIBLOGICS can build them a professional website with AI features.`
    : "";

  const task = `You are a professional business development representative calling on behalf of TIBLOGICS, an AI implementation and digital solutions agency. Your name is Alex.

Call objective: Introduce TIBLOGICS, assess whether this business is open to AI or digital transformation services, and if interested, schedule a free 30-minute discovery meeting.

Business you are calling: ${lead.companyName}
Industry: ${lead.industry ?? "small business"}
Location: ${lead.location ?? ""}
${briefing ? `Context: ${briefing}` : ""}
${noWebsiteNote}
${opportunities.length ? `Key opportunities to mention: ${opportunities.slice(0, 3).join("; ")}` : ""}
Services to offer if interested: ${recommendedServices.slice(0, 3).join(", ")}

CALL SCRIPT:
1. Introduce yourself warmly: "Hi, I'm Alex calling from TIBLOGICS. Is this a good time for a quick 60-second call?"
2. If yes: "We work with ${lead.industry ?? "local businesses"} in ${lead.location ?? "your area"} to implement AI tools that save time and increase revenue. We've helped businesses like yours reduce manual work by 40-60%. I'm calling to see if this is something you'd be open to exploring."
3. If interested: "We offer a completely free 30-minute discovery meeting — no commitment, no sales pressure. We just listen to your challenges and tell you exactly what we'd recommend. Would that be valuable to you?"
4. If they say yes to the meeting: "Excellent! I'll have someone from our team send you a booking link at the email or number you prefer. What's the best way to reach you?"
5. Be natural, conversational, and professional. Do NOT be pushy. If they say no or not interested, thank them politely and end the call.

Keep the entire call under 3 minutes.`;

  const analysisSchema = {
    is_interested: "boolean - did the person show any interest in AI or digital services?",
    interest_level: "string - one of: HOT, WARM, COLD, UNINTERESTED",
    interested_in: "array of strings - which specific services they mentioned interest in",
    has_website: "boolean - did they confirm having a website?",
    wants_callback: "boolean - did they agree to receive a booking link or callback?",
    best_contact: "string - preferred contact method or number they provided",
    key_pain_points: "array of strings - business challenges or pain points they mentioned",
    call_summary: "string - 2-3 sentence summary of the call outcome",
  };

  try {
    const res = await fetch(`${BLAND_BASE}/calls`, {
      method: "POST",
      headers: {
        authorization: BLAND_API_KEY,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        phone_number: lead.phone,
        task,
        voice: "nat",
        model: "enhanced",
        reduce_latency: true,
        record: true,
        wait_for_greeting: true,
        max_duration: 4,
        webhook: `${APP_URL}/api/webhooks/bland-ai`,
        metadata: { leadId: lead.id },
        analysis_schema: analysisSchema,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json({ error: data.message ?? "Bland.ai call failed" }, { status: 502 });
    }

    await prisma.agentLead.update({
      where: { id: leadId },
      data: {
        blandCallId: data.call_id,
        callStatus: "dialing",
        contactedAt: new Date(),
        status: "CONTACTED",
      },
    });

    return NextResponse.json({ success: true, callId: data.call_id });
  } catch (e) {
    console.error("[rex/call]", e);
    return NextResponse.json({ error: "Failed to initiate call" }, { status: 500 });
  }
}
