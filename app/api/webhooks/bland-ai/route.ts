import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { streamChat } from "@/lib/claude";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Bland.ai sends different event types
    const { call_id, status, metadata, transcripts, analysis, duration, recording_url } = body;

    const leadId: string | undefined = metadata?.leadId;
    if (!leadId) return NextResponse.json({ ok: true }); // not one of our calls

    const lead = await prisma.agentLead.findUnique({ where: { id: leadId } });
    if (!lead) return NextResponse.json({ ok: true });

    // Build transcript text
    const transcriptText: string = Array.isArray(transcripts)
      ? transcripts
          .map((t: { user: string; text: string; created_at?: string }) => `${t.user === "assistant" ? "Alex (TIBLOGICS)" : "Prospect"}: ${t.text}`)
          .join("\n")
      : "";

    // Use Bland.ai analysis if available, otherwise use Claude to analyze
    let callSummary = "";
    let interestLevel: string = "COLD";
    let interestedIn: string[] = [];
    let newStatus: string = lead.status;

    if (analysis && typeof analysis === "object") {
      const a = analysis as Record<string, unknown>;
      callSummary = (a.call_summary as string) ?? "";
      interestLevel = ((a.interest_level as string) ?? "COLD").toUpperCase();
      interestedIn = (a.interested_in as string[]) ?? [];
    } else if (transcriptText.length > 100) {
      // Fallback: ask Claude to analyze the transcript
      const prompt = `Analyze this sales call transcript and return JSON only:

Transcript:
${transcriptText.slice(0, 3000)}

Return ONLY this JSON (no markdown):
{
  "interest_level": "HOT" | "WARM" | "COLD" | "UNINTERESTED",
  "interested_in": ["array of services they showed interest in"],
  "call_summary": "2-3 sentence summary of the call outcome",
  "wants_callback": true | false
}`;
      try {
        const text = await streamChat([{ role: "user", content: prompt }], "Return only valid JSON.", 500);
        const match = text.match(/\{[\s\S]*\}/);
        if (match) {
          const parsed = JSON.parse(match[0]);
          callSummary = parsed.call_summary ?? "";
          interestLevel = (parsed.interest_level ?? "COLD").toUpperCase();
          interestedIn = parsed.interested_in ?? [];
        }
      } catch { /* analysis failed — keep defaults */ }
    }

    // Map interest level to AgentLeadStatus
    const statusMap: Record<string, string> = {
      HOT: "HOT",
      WARM: "WARM",
      COLD: "COLD",
      UNINTERESTED: "UNINTERESTED",
    };
    newStatus = statusMap[interestLevel] ?? "COLD";

    await prisma.agentLead.update({
      where: { id: leadId },
      data: {
        callStatus: status ?? "completed",
        callTranscript: transcriptText || undefined,
        callSummary: callSummary || undefined,
        callNotes: recording_url ? `Recording: ${recording_url}` : undefined,
        interestedIn,
        status: newStatus as never,
        ...(duration ? {} : {}),
      },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[bland-ai webhook]", e);
    return NextResponse.json({ ok: true }); // always 200 to Bland.ai
  }
}
