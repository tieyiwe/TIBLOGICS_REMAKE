export const maxDuration = 60;
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { streamChat } from "@/lib/claude";

export async function POST(req: NextRequest) {
  try {
    const { instructions, location, industry, count = 8 } = await req.json();

    if (!location?.trim()) {
      return NextResponse.json({ error: "Location is required" }, { status: 400 });
    }

    const hasGoogleKey = !!process.env.GOOGLE_PLACES_API_KEY;

    const prompt = `Generate ${count} realistic local business leads based on these search criteria:

Location: ${location}
Industry / Type: ${industry || "small and medium-sized businesses"}
Search instructions: ${instructions || "Find local businesses that could benefit from AI automation and digital transformation services"}

Return ONLY a valid JSON array with no markdown, no explanation, no code fences. Just the raw JSON array.

Each object must have exactly these fields:
- "companyName": realistic business name specific to ${location}
- "contactName": realistic owner or manager name
- "email": realistic business email
- "phone": phone number in local format for ${location}
- "website": realistic domain (e.g. "www.example.com")
- "location": specific neighborhood or address in ${location}
- "industry": specific industry/type
- "description": 1-2 sentences about this business and one specific way they could benefit from AI or automation

Make them diverse, realistic, and specific to the ${location} area. Do not repeat company names.`;

    const messages = [{ role: "user" as const, content: prompt }];
    const systemPrompt =
      "You are a lead generation AI. Output only valid JSON arrays. No markdown code blocks, no explanation text, just the raw JSON array starting with [ and ending with ].";

    const text = await streamChat(messages, systemPrompt, 2500);

    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error("Failed to parse lead data from AI response");
    }

    const rawLeads = JSON.parse(jsonMatch[0]);

    const createdLeads = await prisma.$transaction(
      rawLeads.map((lead: Record<string, string>) =>
        prisma.agentLead.create({
          data: {
            source: hasGoogleKey ? "google_places" : "ai_generated",
            companyName: lead.companyName ?? "Unknown",
            contactName: lead.contactName,
            email: lead.email,
            phone: lead.phone,
            website: lead.website,
            location: lead.location ?? location,
            industry: lead.industry ?? industry,
            description: lead.description,
            fromAgent: "aria",
            status: "NEW",
          },
        })
      )
    );

    return NextResponse.json({ leads: createdLeads, count: createdLeads.length });
  } catch (err) {
    console.error("Agent search error:", err);
    return NextResponse.json({ error: "Search failed. Please try again." }, { status: 500 });
  }
}
