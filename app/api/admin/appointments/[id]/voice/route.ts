import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const unauth = await requireAdmin();
  if (unauth) return unauth;

  const record = await prisma.adminSettings.findUnique({ where: { key: `voice:${params.id}` } });
  return NextResponse.json({ analysis: record ? JSON.parse(record.value) : null });
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const unauth = await requireAdmin();
  if (unauth) return unauth;

  try {
    const { transcript, source = "session" } = await req.json();
    if (!transcript || typeof transcript !== "string" || transcript.trim().length < 10) {
      return NextResponse.json({ error: "Transcript too short" }, { status: 400 });
    }

    const appt = await prisma.appointment.findUnique({
      where: { id: params.id },
      select: { firstName: true, lastName: true, serviceType: true, goalNotes: true },
    });

    const clientName = appt ? `${appt.firstName} ${appt.lastName}` : "the client";
    const service = appt ? appt.serviceType.replace(/_/g, " ") : "consulting session";

    const prompt = `You are an expert session analyst helping a consultant understand their client better. Analyze the following transcript from a ${service} session with ${clientName}.

TRANSCRIPT:
${transcript.trim()}

${appt?.goalNotes ? `CLIENT'S STATED GOALS BEFORE SESSION: ${appt.goalNotes}` : ""}

Provide a structured voice and session analysis:

**OVERALL MOOD** (rate 1-10: 1=very distressed, 10=very confident)
Score and a 1-2 sentence explanation based on language, tone signals, and word choice.

**KEY ISSUES DETECTED**
Main problems, pain points, or concerns mentioned — explicitly or implicitly. Bullet list.

**URGENCY LEVEL** (Low / Medium / High / Critical)
What deadlines, pressures, or urgency signals are present?

**COMMUNICATION PATTERNS**
How does this client communicate? (e.g., analytical, emotional, direct, avoidant, technical) What does this reveal about working with them?

**TRUST & OPENNESS SIGNALS**
Did they hold back? Were they candid? Any hesitations or deflections?

**DECISION READINESS** (Not Ready / Exploring / Leaning / Ready)
How close are they to making a decision or taking action?

**RECOMMENDED FOLLOW-UPS**
Specific next actions to take within 48 hours.

**MISSED OPPORTUNITIES**
Topics that came up but weren't fully explored — worth revisiting next time.

Be precise and clinical. Flag anything that needs immediate attention.`;

    const anthropic = (await import("@/lib/claude")).default;
    const { CLAUDE_MODEL } = await import("@/lib/claude");

    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
    });

    const analysisText = response.content[0].type === "text" ? response.content[0].text : "";

    const result = {
      text: analysisText,
      transcript: transcript.trim(),
      source,
      analyzedAt: new Date().toISOString(),
      wordCount: transcript.trim().split(/\s+/).length,
    };

    await prisma.adminSettings.upsert({
      where: { key: `voice:${params.id}` },
      update: { value: JSON.stringify(result) },
      create: { key: `voice:${params.id}`, value: JSON.stringify(result) },
    });

    return NextResponse.json({ analysis: result });
  } catch (err) {
    console.error("[POST /api/admin/appointments/[id]/voice]", err);
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  }
}
