import { staffAiLimit } from "@/lib/rate-limit";
export const maxDuration = 60;
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { streamChat } from "@/lib/claude";
import { requirePermission } from "@/lib/require-admin";

type Lead = Record<string, string | undefined>;

/**
 * Real businesses from Google Places Text Search (New). No model call: the
 * names, phones, websites and addresses come from Places, not from an AI.
 */
async function placesLeads(key: string, location: string, industry: string, instructions: string, count: number): Promise<Lead[]> {
  const textQuery = [industry || "small businesses", "in", location, instructions ? `(${instructions.slice(0, 120)})` : ""].join(" ").trim();
  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": key,
      "X-Goog-FieldMask":
        "places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.websiteUri,places.primaryTypeDisplayName,places.editorialSummary",
    },
    body: JSON.stringify({ textQuery, pageSize: count }),
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) throw new Error(`Places search failed (${res.status})`);
  const data = (await res.json()) as {
    places?: Array<{
      displayName?: { text?: string };
      formattedAddress?: string;
      nationalPhoneNumber?: string;
      websiteUri?: string;
      primaryTypeDisplayName?: { text?: string };
      editorialSummary?: { text?: string };
    }>;
  };
  return (data.places ?? []).slice(0, count).map((p) => ({
    companyName: p.displayName?.text,
    phone: p.nationalPhoneNumber,
    website: p.websiteUri,
    location: p.formattedAddress,
    industry: p.primaryTypeDisplayName?.text ?? industry,
    description: p.editorialSummary?.text,
  }));
}

export async function POST(req: NextRequest) {
  const unauth = await requirePermission("agents");
  if (unauth) return unauth;
  const slow = await staffAiLimit("agents-search");
  if (slow) return slow;

  try {
    const { instructions, location, industry, count = 8 } = await req.json();

    if (!location?.trim()) {
      return NextResponse.json({ error: "Location is required" }, { status: 400 });
    }

    // Cap count to prevent DB bloat from large batch requests
    const safeCount = Math.min(Math.max(1, Number(count) || 8), 20);

    const googleKey = process.env.GOOGLE_PLACES_API_KEY;
    let rawLeads: Lead[];
    let source: string;
    if (googleKey) {
      rawLeads = await placesLeads(googleKey, location.trim(), String(industry ?? ""), String(instructions ?? ""), safeCount);
      source = "google_places";
    } else {
      const prompt = `Generate ${safeCount} realistic local business leads based on these search criteria:

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

      const text = await streamChat(messages, systemPrompt, 2500, "lead-search");

      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error("Failed to parse lead data from AI response");
      }

      rawLeads = JSON.parse(jsonMatch[0]);
      source = "ai_generated";
    }

    const createdLeads = await prisma.$transaction(
      rawLeads.filter((lead) => lead.companyName).map((lead) =>
        prisma.agentLead.create({
          data: {
            source,
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
