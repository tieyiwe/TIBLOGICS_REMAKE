import { checkRateLimit } from "@/lib/rate-limit";
export const maxDuration = 120;
import { NextRequest, NextResponse } from "next/server";
import { streamChat } from "@/lib/claude";
import { replyInLanguage } from "@/lib/i18n/config";
import { getLocale, translatorFor } from "@/lib/i18n/server";

const RECOMMENDATION_SYSTEM_PROMPT = `You are a personalization engine for TIBLOGICS, an AI implementation and digital solutions agency. Your job is to analyze a visitor's behavior on the site and return highly relevant, personalized service and tool recommendations.

TIBLOGICS services:
- AI Implementation & Agents: Custom AI agents, LLM integration, workflow automation
- Workflow Automation: n8n, Make, Zapier, custom pipelines
- AI Strategy & Consulting: AI readiness audits, roadmaps, strategy sessions
- Web & App Development: Next.js, React, full-stack
- Cybersecurity: Security audits, pen testing, hardened infrastructure
- Data Analytics: BI dashboards, data pipelines, AI insights
- Mobile Development: React Native cross-platform apps
- AI Training & Academy: 90+ lessons, team workshops
- System Design & IoT: Architecture, IoT integrations

TIBLOGICS free tools:
- Website AI Scanner: Scan any site for AI readiness
- AI Project Advisor (Echelon): Chat to get personalized AI recommendations
- AI Cost Calculator: Calculate monthly AI API costs

Consulting sessions (pricing on request):
- AI Strategy Session (60 min)
- AI Readiness Audit (90 min + Deliverable)
- Website AI Transformation (45 min)
- AI Cost & Price Strategy for AI Product Builders (60 min)
- Project Discovery Meeting (30 min, free)

Based on the user context provided, return a JSON object with exactly this structure (no extra text, just valid JSON):
{
  "headline": "short personalized headline (max 8 words)",
  "reason": "1 sentence explaining why these are relevant to them",
  "recommendations": [
    {
      "type": "service" | "tool" | "session",
      "name": "exact name of service/tool/session",
      "tagline": "compelling 1-line pitch tailored to their context",
      "href": "/services" | "/tools/scanner" | "/tools/advisor" | "/tools/calculator" | "/book",
      "priority": 1 | 2 | 3
    }
  ]
}

Return exactly 3 recommendations, ranked by relevance. Be specific and contextual — if they visited the scanner, recommend the audit. If they're in healthcare, mention CareFlow AI. If they're interested in cost, recommend the calculator. Never be generic.`;

export async function POST(req: NextRequest) {
  const locale = await getLocale();
  const t = translatorFor(locale);
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  if (!(await checkRateLimit(`recommendations:${ip}`, 30, 3_600_000))) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  try {
    const { context } = await req.json();
    if (!context) {
      return NextResponse.json({ error: "Context required" }, { status: 400 });
    }

    // Anonymous and paid per token: the context is capped so one request
    // cannot carry an arbitrarily large prompt.
    const userMessage = (`Visitor context:
- Pages visited: ${context.pagesVisited?.join(", ") || "homepage only"}
- Tools used: ${context.toolsUsed?.join(", ") || "none yet"}
- Current page: ${context.currentPage || "unknown"}
- Session duration: ${context.sessionDuration || 0} seconds
- Industry hint: ${context.industryHint || "unknown"}
- Search query: ${context.searchQuery || "none"}
- Referrer: ${context.referrer || "direct"}`).slice(0, 4000) + `

Generate 3 highly personalized recommendations for this visitor.`;

    // headline, reason, name and tagline are shown to the visitor, so they
    // come back in the visitor's language; keys, "type" and "href" stay as-is.
    const languageRule = locale === "en"
      ? ""
      : `\n\n${replyInLanguage(locale)} Translate only the values of "headline", "reason", "name" and "tagline"; keep every JSON key, "type" and "href" exactly as specified.`;
    const text = await streamChat(
      [{ role: "user", content: userMessage }],
      RECOMMENDATION_SYSTEM_PROMPT + languageRule,
      512
    );

    // Parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "Failed to generate recommendations" }, { status: 500 });
    }

    const recommendations = JSON.parse(jsonMatch[0]);
    // The links come from model output shaped partly by visitor context, and
    // the page renders them as hrefs: keep only same-site paths.
    if (Array.isArray(recommendations?.recommendations)) {
      recommendations.recommendations = recommendations.recommendations.filter(
        (r: { href?: unknown }) => typeof r?.href === "string" && r.href.startsWith("/") && !r.href.startsWith("//") && !r.href.startsWith("/\\"),
      );
    }
    return NextResponse.json(recommendations);
  } catch (err) {
    console.error("Recommendation engine error:", err);
    // Return sensible fallback recommendations
    return NextResponse.json({
      headline: t("pages.recs.fallback.headline"),
      reason: t("pages.recs.fallback.reason"),
      recommendations: [
        { type: "tool", name: t("pages.recs.fallback.scanner"), tagline: t("pages.recs.fallback.scannerTagline"), href: "/tools/scanner", priority: 1 },
        { type: "tool", name: t("pages.recs.fallback.advisor"), tagline: t("pages.recs.fallback.advisorTagline"), href: "/tools/advisor", priority: 2 },
        { type: "session", name: t("pages.recs.fallback.discovery"), tagline: t("pages.recs.fallback.discoveryTagline"), href: "/book", priority: 3 },
      ],
    });
  }
}
