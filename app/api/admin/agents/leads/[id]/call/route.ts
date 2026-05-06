import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const lead = await prisma.agentLead.findUnique({ where: { id } });
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  if (!lead.phone) return NextResponse.json({ error: "No phone number on file" }, { status: 400 });

  const BLAND_API_KEY = process.env.BLAND_AI_API_KEY;

  if (!BLAND_API_KEY) {
    await prisma.agentLead.update({
      where: { id },
      data: {
        callStatus: "simulated",
        callSid: `sim_${Date.now()}`,
        contactedAt: new Date(),
        status: "CONTACTED",
      },
    });
    return NextResponse.json({
      success: true,
      simulated: true,
      message: "Call simulated. Set BLAND_AI_API_KEY to enable real calls.",
    });
  }

  const res = await fetch("https://api.bland.ai/v1/calls", {
    method: "POST",
    headers: {
      Authorization: BLAND_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      phone_number: lead.phone,
      task: `You are Rex, a sales agent for TIBLOGICS, an AI implementation company. You are calling ${lead.contactName || lead.companyName}.

Your goal is to have a warm, natural conversation to understand if they have challenges with automation, AI, or their digital presence. Be friendly and professional.

Keep the call under 5 minutes. At the end, ask if they'd be interested in a free 20-minute discovery call with the team.

Business context: ${lead.description ?? "Local business that may benefit from AI and automation services."}`,
      voice: "nat",
      first_sentence: `Hi, is this ${lead.contactName || "the owner"}? This is Rex from TIBLOGICS. We help local businesses like ${lead.companyName} with AI and automation. Do you have a moment?`,
      wait_for_greeting: true,
      record: true,
      from: process.env.BLAND_PHONE_NUMBER,
      metadata: { leadId: id, companyName: lead.companyName },
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    return NextResponse.json({ error: data.message ?? "Bland.ai call failed" }, { status: 500 });
  }

  await prisma.agentLead.update({
    where: { id },
    data: {
      callSid: data.call_id,
      callStatus: "initiated",
      contactedAt: new Date(),
      status: "CONTACTED",
    },
  });

  return NextResponse.json({ success: true, callId: data.call_id });
}
