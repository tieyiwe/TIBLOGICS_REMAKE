import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendProspectEmail } from "@/lib/resend";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {};
    if (status) {
      where.status = status;
    }

    const prospects = await prisma.prospect.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(prospects);
  } catch (error) {
    console.error("[GET /api/prospects]", error);
    return NextResponse.json(
      { error: "Failed to fetch prospects" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      name,
      business,
      industry,
      mainChallenge,
      budget,
      suggestedSolutions,
      email,
      phone,
      source,
      conversationLog,
    } = body;

    const prospect = await prisma.prospect.create({
      data: {
        name,
        business,
        industry,
        mainChallenge,
        budget,
        suggestedSolutions: suggestedSolutions ?? [],
        email: email ?? null,
        phone: phone ?? null,
        source: source ?? "TIBS_ADVISOR",
        conversationLog: conversationLog ?? undefined,
      },
    });

    // Fire-and-forget — don't block response on email failure
    sendProspectEmail({
      name: prospect.name,
      business: prospect.business,
      industry: prospect.industry,
      budget: prospect.budget,
      mainChallenge: prospect.mainChallenge,
      suggestedSolutions: prospect.suggestedSolutions,
    }).catch((err) => console.error("[sendProspectEmail]", err));

    return NextResponse.json(prospect, { status: 201 });
  } catch (error) {
    console.error("[POST /api/prospects]", error);
    return NextResponse.json(
      { error: "Failed to create prospect" },
      { status: 500 }
    );
  }
}
