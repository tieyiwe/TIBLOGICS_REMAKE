import { checkRateLimit } from "@/lib/rate-limit";
export const maxDuration = 120;
import { NextRequest, NextResponse } from "next/server";
import { getLocale, translatorFor } from "@/lib/i18n/server";
import { replyInLanguage } from "@/lib/i18n/config";
import { boundChatMessages } from "@/lib/chat-bounds";

const ADVISOR_SYSTEM_PROMPT = `You are Tibo, the AI Project Advisor for TIBLOGICS, an AI implementation and digital solutions agency.

TIBLOGICS services: AI Implementation & Agents, Workflow Automation, AI Strategy & Consulting, Web & App Development (React/Next.js), Cybersecurity, Data Analytics, Mobile Development (React Native), AI Training & ARFA, the TIBLOGICS AI Academy (certificate tracks, $297 one time per track or $89/month for all, team plans), System Design & IoT.

TIBLOGICS products: InStory (AI-personalized learning platform for K-8, school licensing $3,999–$13,999/yr, MCPS pipeline), CareFlow AI (automated wellness check-ins for social work agencies via Twilio + AI voice), ShipFrica (white-label shipping SaaS for African diaspora logistics, $199-$700/mo), ARFA, the TIBLOGICS AI Academy (tiblogics.com/learning-box, self-paced certificate tracks, $297+ per track or $89/month).

Target markets: Enterprise/airports (SSR Airport Mauritius active client), SMBs & restaurants (Caribbean Flavor active client), Schools & educators, African diaspora businesses, Startups & tech companies.

Pricing ranges: Website $2,500–$8,000 | AI implementation $4,000–$15,000+ | Full digital transformation $10,000–$50,000+ | Monthly retainer $500–$2,500/mo | Discovery meeting: Free | AI Strategy Session $297 | AI Readiness Audit $497 | Website AI Transformation $197 | AI Cost & Price Strategy for AI Product Builders $197.

Your role: Have a warm, professional conversation. Ask ONE question at a time. Explore their business type, main challenges, goals, current tech stack, budget range, and timeline. After 4-6 exchanges, summarize their needs and recommend 2-3 specific TIBLOGICS solutions with rationale. Be honest about pricing. Never oversell. Always offer the free discovery meeting as a next step.

When you have enough information to build a prospect profile, end your message with this EXACTLY (on a new line, no extra text after):
PROSPECT_PROFILE|name:[full name or "Unknown"]|biz:[business name]|industry:[industry]|challenge:[one sentence main challenge]|budget:[budget range or "Not specified"]|solutions:[solution 1,solution 2,solution 3]

Keep all responses to 2-4 sentences maximum. Ask ONE question at a time. Be warm and conversational, not salesy.`;

export async function POST(req: NextRequest) {
  const locale = await getLocale();
  const t = translatorFor(locale);
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  if (!(await checkRateLimit(`claude-advisor:${ip}`, 20, 3_600_000))) {
    return NextResponse.json({ error: t("tools.api.rateLimit") }, { status: 429 });
  }
  // Answers in the visitor's language. The profile line is parsed by the
  // page, so its markers stay as specified.
  const system =
    locale === "en"
      ? ADVISOR_SYSTEM_PROMPT
      : `${ADVISOR_SYSTEM_PROMPT}\n\n${replyInLanguage(locale)} Keep the PROSPECT_PROFILE line's markers and field names (PROSPECT_PROFILE, name:, biz:, industry:, challenge:, budget:, solutions:) exactly as specified; write the values in that language.`;
  try {
    const messages = boundChatMessages((await req.json().catch(() => ({})))?.messages);
    if (!messages) return NextResponse.json({ error: t("tools.api.invalidRequest") }, { status: 400 });

    const { streamClaude } = await import("@/lib/claude");

    const stream = streamClaude("chat-advisor", { system, messages, maxTokens: 1024, meta: { ref: "advisor" } });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`));
            }
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        } catch (err) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: t("tools.api.aiUnavailable") })}\n\n`));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (err) {
    console.error("Tibo advisor error:", err);
    return NextResponse.json({ error: t("tools.api.aiUnavailable") }, { status: 500 });
  }
}
