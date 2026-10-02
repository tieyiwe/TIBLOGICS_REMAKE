import { staffAiLimit } from "@/lib/rate-limit";
export const maxDuration = 30;
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { streamChat } from "@/lib/claude";
import { requirePermission } from "@/lib/require-admin";
import { checkTargetUrl, safeFetch } from "@/lib/ssrf";

/**
 * The lead's website as a URL we are willing to fetch, or null.
 *
 * agentLead.website is whatever a Rex search wrote — usually an AI-invented
 * domain, never an operator-reviewed value. Fetched unchecked it was an SSRF
 * primitive: the page body is summarised straight back to the caller, so
 * `http://169.254.169.254/...` or a localhost port would have exfiltrated
 * cloud metadata and internal responses through the analysis field.
 */
async function safeTargetUrl(website: string | null): Promise<URL | null> {
  if (!website) return null;
  const checked = await checkTargetUrl(website);
  return checked.ok ? checked.url : null;
}

export async function POST(req: NextRequest) {
  // Staff only. A bare session check passed here for TIBLOGICS Learn students
  // too, since learners share this NextAuth instance — requireAdmin rejects them.
  const unauth = await requirePermission("agents");
  if (unauth) return unauth;
  const slow = await staffAiLimit("rex-scrape");
  if (slow) return slow;

  const { leadId } = await req.json();
  if (!leadId) return NextResponse.json({ error: "leadId required" }, { status: 400 });

  const lead = await prisma.agentLead.findUnique({ where: { id: leadId } });
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

  let pageText = "";
  const target = await safeTargetUrl(lead.website);
  const websiteUrl = target?.toString() ?? null;

  // Try to fetch the website
  if (target) {
    try {
      // safeFetch follows redirects but re-checks every hop, so a lead's site
      // that 302s somewhere internal is refused rather than followed. Plain
      // redirect: "manual" simply gave up on sites that redirect, which is
      // most of them.
      const res = await safeFetch(target, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; TIBLOGICSBot/1.0)" },
        signal: AbortSignal.timeout(8000),
      });
      if (res.ok) {
        const html = await res.text();
        // Strip HTML tags and collapse whitespace
        pageText = html
          .replace(/<script[\s\S]*?<\/script>/gi, "")
          .replace(/<style[\s\S]*?<\/style>/gi, "")
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 4000);
      }
    } catch {
      // Website unreachable — will note in analysis
    }
  }

  const hasWebsite = !!websiteUrl && pageText.length > 100;

  const prompt = `Analyze this local business and assess their AI/digital readiness:

Business: ${lead.companyName}
Industry: ${lead.industry ?? "Unknown"}
Location: ${lead.location ?? "Unknown"}
Website: ${websiteUrl ?? "No website found"}
Description: ${lead.description ?? "No description available"}
${pageText ? `\nWebsite content (excerpt):\n${pageText}` : "\n[No website content available — business has no website or site is unreachable]"}

Provide a JSON analysis with ONLY these fields (no markdown, just raw JSON):
{
  "hasWebsite": boolean,
  "technologyLevel": "none" | "basic" | "moderate" | "advanced",
  "estimatedAiReadiness": 1-10,
  "currentDigitalPresence": "brief description of their digital presence",
  "keyOpportunities": ["list", "of", "3-5", "specific", "AI/digital", "opportunities"],
  "recommendedServices": ["list from: AI Implementation, Workflow Automation, Website Building, AI Chatbot, AI Phone Agent, CRM Setup, Social Media Automation, Data Analytics"],
  "talkingPoints": ["2-3 specific talking points for a sales call based on their situation"],
  "proposedValue": "one sentence on the main value TIBLOGICS can deliver to this business",
  "urgencySignals": ["any signs of urgency or pain points visible"],
  "briefing": "2-3 sentence call briefing summarizing what to say when calling"
}`;

  const messages = [{ role: "user" as const, content: prompt }];
  const text = await streamChat(messages, "You are a business analyst. Return only valid JSON.", 1500, "classify");

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  let info: Record<string, unknown> = {};
  if (jsonMatch) {
    try { info = JSON.parse(jsonMatch[0]); } catch { /**/ }
  }

  // Patch lead with scraped info
  const updated = await prisma.agentLead.update({
    where: { id: leadId },
    data: {
      hasWebsite,
      businessInfo: info as Record<string, string | number | boolean | null>,
      scrapedAt: new Date(),
    },
  });

  return NextResponse.json({ success: true, lead: updated, analysis: info });
}
