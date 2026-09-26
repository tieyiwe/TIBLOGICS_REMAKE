import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const unauth = await requireAdmin();
  if (unauth) return unauth;

  const { id } = await params;
  const record = await prisma.adminSettings.findUnique({ where: { key: `brief:${id}` } });
  return NextResponse.json({ brief: record ? JSON.parse(record.value) : null });
}

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const unauth = await requireAdmin();
  if (unauth) return unauth;

  const { id } = await params;

  try {
    const appt = await prisma.appointment.findUnique({ where: { id } });
    if (!appt) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Fetch linked session chat history
    const sessionRecord = await prisma.adminSettings.findUnique({ where: { key: `appt:sid:${id}` } });
    let chatHistory: Array<{ role: string; content: string }> = [];
    if (sessionRecord?.value) {
      const chatRecord = await prisma.adminSettings.findUnique({ where: { key: `chat:${sessionRecord.value}` } });
      if (chatRecord?.value) chatHistory = JSON.parse(chatRecord.value);
    }

    // Fetch prospect profile by email
    const prospect = await prisma.prospect.findFirst({
      where: { email: appt.email },
      orderBy: { createdAt: "desc" },
    });

    const chatText =
      chatHistory.length > 0
        ? chatHistory.filter((m) => m.role !== "system").map((m) => `${m.role.toUpperCase()}: ${m.content}`).join("\n\n")
        : "No pre-session chat history available.";

    const prompt = `You are a senior consultant's AI assistant preparing a private pre-session intelligence brief.

CLIENT PROFILE:
- Name: ${appt.firstName} ${appt.lastName}
- Email: ${appt.email}
- Company: ${appt.company ?? "Not provided"}
- Service Booked: ${appt.serviceType.replace(/_/g, " ")} (${appt.serviceDuration})
- Session Value: ${appt.totalAmount === 0 ? "Free" : `$${(appt.totalAmount / 100).toFixed(0)}`}
- Client's Stated Goals: ${appt.goalNotes ?? "None provided"}
${prospect ? `\nLEAD INTELLIGENCE:
- Status: ${prospect.status}
- Business Type: ${prospect.business ?? "Unknown"}
- Industry: ${prospect.industry ?? "Unknown"}
- Budget Signal: ${prospect.budget ?? "Unknown"}
- Pain Points: ${prospect.mainChallenge ?? "Unknown"}` : ""}

PRE-BOOKING CHAT WITH AI ASSISTANT:
${chatText}

Generate a sharp, practical pre-session brief with these exact sections:

**CLIENT SNAPSHOT**
2-3 sentences: who they are, what they actually need, and what stage they're at.

**COMMUNICATION STYLE & MOOD**
How they write/speak. Are they direct or exploratory? Confident or uncertain? Any urgency signals?

**LIKELY TOP CONCERNS**
Bullet list of what they're probably most worried about (even if not explicitly stated).

**RECOMMENDED SESSION APPROACH**
How to open, what tone to use, what to lead with for this specific person.

**OPENING QUESTIONS**
3-4 sharp questions to ask in the first 5 minutes.

**WATCH FOR**
Red flags, potential objections, or topics that may need careful handling.

**SESSION WIN CONDITION**
What a successful outcome looks like for this client.

Be direct and specific. This is for the expert's eyes only — no fluff.`;

    const anthropic = (await import("@/lib/claude")).default;
    const { CLAUDE_MODEL } = await import("@/lib/claude");

    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1200,
      messages: [{ role: "user", content: prompt }],
    });

    const briefText = response.content[0].type === "text" ? response.content[0].text : "";

    const result = {
      text: briefText,
      generatedAt: new Date().toISOString(),
      hasChatHistory: chatHistory.length > 0,
      chatMessageCount: chatHistory.length,
      hasProspectData: !!prospect,
    };

    await prisma.adminSettings.upsert({
      where: { key: `brief:${id}` },
      update: { value: JSON.stringify(result) },
      create: { key: `brief:${id}`, value: JSON.stringify(result) },
    });

    return NextResponse.json({ brief: result });
  } catch (err) {
    console.error("[POST /api/admin/appointments/[id]/brief]", err);
    return NextResponse.json({ error: "Failed to generate brief" }, { status: 500 });
  }
}
