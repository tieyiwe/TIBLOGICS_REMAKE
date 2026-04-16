import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      url,
      overallScore,
      seoScore,
      perfScore,
      uxScore,
      aiScore,
      findings,
      aiDescription,
    } = body;

    const lead = await prisma.scannerLead.create({
      data: {
        url,
        overallScore,
        seoScore,
        perfScore,
        uxScore,
        aiScore,
        findings,
        aiDescription,
      },
    });

    return NextResponse.json(lead, { status: 201 });
  } catch (error) {
    console.error("[POST /api/scanner-leads]", error);
    return NextResponse.json(
      { error: "Failed to create scanner lead" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const leads = await prisma.scannerLead.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(leads);
  } catch (error) {
    console.error("[GET /api/scanner-leads]", error);
    return NextResponse.json(
      { error: "Failed to fetch scanner leads" },
      { status: 500 }
    );
  }
}
