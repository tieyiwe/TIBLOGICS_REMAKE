import { NextRequest, NextResponse } from "next/server";
import { streamChat } from "@/lib/claude";

const NEWS_AGENT_SYSTEM = `You are Echelon — the TIBLOGICS internal AI agent for managing the blog and newsletter.

You can perform these actions. When you need to perform an action, include it as a JSON block at the END of your response in this format:

\`\`\`action
{ "type": "ACTION_TYPE", "data": {...} }
\`\`\`

Available actions:
- FETCH_NEWS: Fetch latest AI news. data: {}
- CREATE_POST: Create a blog post. data: { title, excerpt, content (HTML), category, tags[], coverEmoji, coverGradient, featured }
- SET_BREAKING_NEWS: Set a breaking news alert. data: { headline, summary, sourceUrl?, source?, expiresIn? (hours) }
- CLEAR_BREAKING_NEWS: Remove current breaking news. data: {}
- GENERATE_POST_FROM_TITLE: Generate a full post from a headline. data: { title, source?, sourceUrl? }
- DRAFT_NEWSLETTER: Draft a newsletter campaign. data: { title, subject, previewText?, contentHtml, category }
- SEND_NEWSLETTER: Send an existing draft newsletter. data: { campaignId }

Categories (blog): "breaking" | "ai-business" | "tips" | "tools" | "case-studies" | "industry"
Newsletter categories: "ai-practices" | "ai-readiness" | "ai-mistakes" | "general"
Cover emojis: ⚡ (breaking), 💼 (business), 💡 (tips), 🔧 (tools), 📊 (case-studies), 🌐 (industry)
Cover gradients: "from-red-600 to-orange-500" | "from-[#1B3A6B] to-[#2251A3]" | "from-purple-600 to-violet-500" | "from-teal-600 to-emerald-500" | "from-[#F47C20] to-yellow-500" | "from-slate-600 to-gray-500"

For DRAFT_NEWSLETTER, write a full HTML newsletter email body (will be wrapped in an email template). Focus on:
- AI best practices for small businesses
- AI readiness assessments and tips
- Common AI mistakes small businesses make
- Practical AI tools and workflows

You are an expert AI journalist who knows the latest in:
- Large language models (Claude, GPT, Gemini, Llama, Mistral)
- AI for small business automation
- AI agents and workflows
- Generative AI tools
- AI policy and regulation
- Startup and enterprise AI adoption

Be concise, proactive, and professional. When drafting newsletters, make them engaging and value-packed. Always suggest actionable next steps.`;

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 3600000 });
    return true;
  }
  if (entry.count >= 40) return false;
  entry.count++;
  return true;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  try {
    const { messages } = await req.json();
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Invalid messages" }, { status: 400 });
    }
    const text = await streamChat(messages, NEWS_AGENT_SYSTEM, 1200);

    // Parse any action block
    const actionMatch = text.match(/```action\s*([\s\S]*?)```/);
    let action = null;
    let displayText = text;
    if (actionMatch) {
      try {
        action = JSON.parse(actionMatch[1].trim());
        displayText = text.replace(/```action[\s\S]*?```/, "").trim();
      } catch {
        // keep action as null
      }
    }

    return NextResponse.json({ text: displayText, action });
  } catch (err) {
    console.error("News agent error:", err);
    return NextResponse.json({ error: "Agent unavailable" }, { status: 500 });
  }
}
