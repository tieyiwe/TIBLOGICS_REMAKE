import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendProspectEmail } from "@/lib/resend";
import { requireAdmin } from "@/lib/require-admin";

// GET is admin-only — POST is public (AI advisor submits prospects)
export async function GET(req: Request) {
  const unauth = await requireAdmin();
  if (unauth) return unauth;

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    const prospects = await prisma.prospect.findMany({ where, orderBy: { createdAt: "desc" } });
    return NextResponse.json(prospects);
  } catch {
    return NextResponse.json({ error: "Failed to fetch prospects" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, business, industry, mainChallenge, budget, suggestedSolutions, email, phone, source, conversationLog } = body;

    // Basic validation
    if (!name || typeof name !== "string" || name.length > 200) {
      return NextResponse.json({ error: "Invalid name" }, { status: 400 });
    }
    if (!business || typeof business !== "string" || business.length > 200) {
      return NextResponse.json({ error: "Invalid business" }, { status: 400 });
    }
    if (!industry || typeof industry !== "string") {
      return NextResponse.json({ error: "Invalid industry" }, { status: 400 });
    }
    if (!mainChallenge || typeof mainChallenge !== "string" || mainChallenge.length > 2000) {
      return NextResponse.json({ error: "Invalid mainChallenge" }, { status: 400 });
    }

    const prospect = await prisma.prospect.create({
      data: {
        name,
        business,
        industry,
        mainChallenge,
        budget: budget ?? "",
        suggestedSolutions: Array.isArray(suggestedSolutions) ? suggestedSolutions.slice(0, 10) : [],
        email: typeof email === "string" && email.length <= 320 ? email : null,
        phone: typeof phone === "string" && phone.length <= 30 ? phone : null,
        source: source ?? "TIBS_ADVISOR",
        conversationLog: conversationLog ?? undefined,
      },
    });

    sendProspectEmail({
      name: prospect.name,
      business: prospect.business,
      industry: prospect.industry,
      budget: prospect.budget,
      mainChallenge: prospect.mainChallenge,
      suggestedSolutions: prospect.suggestedSolutions,
    }).catch((err) => console.error("[sendProspectEmail]", err));

    return NextResponse.json(prospect, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create prospect" }, { status: 500 });
  }
}
