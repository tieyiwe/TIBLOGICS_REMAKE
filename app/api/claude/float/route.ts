import { NextRequest, NextResponse } from "next/server";
import { streamChat } from "@/lib/claude";

const FLOAT_SYSTEM_PROMPT = `You are TIBS, the friendly AI site assistant for TIBLOGICS. You know the company well.

TIBLOGICS is an AI implementation and digital solutions agency founded by Tieyiwe Bassole (TIWE) in Wheaton, Maryland / Washington D.C. They serve North America and Francophone Africa.

Services: AI Implementation, Workflow Automation, AI Strategy, Web & App Development, Cybersecurity, Data Analytics, Mobile Development, AI Training & Academy, System Design & IoT.

Products: InStory (K-8 AI learning platform), CareFlow AI (social work automation), ShipFrica (diaspora shipping SaaS), AI Academy on Skool ($97/mo founding members).

Contact: ai@tiblogics.com | Site: tiblogics.com

Be helpful, warm, and concise — 1 to 3 sentences per response. If someone wants detailed consulting advice or a project quote, invite them to use the AI Project Advisor tool or book a free discovery call. Respond naturally in English or French depending on what the user writes.`;

// Simple in-memory rate limiter (per IP, resets per process restart)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
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
    const text = await streamChat(messages, FLOAT_SYSTEM_PROMPT, 512);
    return NextResponse.json({ text });
  } catch (err) {
    console.error("TIBS float error:", err);
    return NextResponse.json(
      { error: "AI service unavailable" },
      { status: 500 }
    );
  }
}
