export const maxDuration = 120;
import { NextRequest, NextResponse } from "next/server";
import { streamChat } from "@/lib/claude";

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

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 3600000 });
    return true;
  }
  if (entry.count >= 30) return false;
  entry.count++;
  return true;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  try {
    const { context } = await req.json();
    if (!context) {
      return NextResponse.json({ error: "Context required" }, { status: 400 });
    }

    const userMessage = `Visitor context:
- Pages visited: ${context.pagesVisited?.join(", ") || "homepage only"}
- Tools used: ${context.toolsUsed?.join(", ") || "none yet"}
- Current page: ${context.currentPage || "unknown"}
- Session duration: ${context.sessionDuration || 0} seconds
- Industry hint: ${context.industryHint || "unknown"}
- Search query: ${context.searchQuery || "none"}
- Referrer: ${context.referrer || "direct"}

Generate 3 highly personalized recommendations for this visitor.`;

    const text = await streamChat(
      [{ role: "user", content: userMessage }],
      RECOMMENDATION_SYSTEM_PROMPT,
      512
    );

    // Parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "Failed to generate recommendations" }, { status: 500 });
    }

    const recommendations = JSON.parse(jsonMatch[0]);
    return NextResponse.json(recommendations);
  } catch (err) {
    console.error("Recommendation engine error:", err);
    // Return sensible fallback recommendations
    return NextResponse.json({
      headline: "Start with a free AI assessment",
      reason: "Most visitors find our free tools and discovery call the perfect starting point.",
      recommendations: [
        { type: "tool", name: "Website AI Scanner", tagline: "See your AI readiness score in 30 seconds — free.", href: "/tools/scanner", priority: 1 },
        { type: "tool", name: "AI Project Advisor", tagline: "Chat with Echelon to get a custom AI roadmap for your business.", href: "/tools/advisor", priority: 2 },
        { type: "session", name: "Project Discovery Meeting", tagline: "30-minute free meeting to explore what AI can do for you.", href: "/book", priority: 3 },
      ],
    });
  }
}
