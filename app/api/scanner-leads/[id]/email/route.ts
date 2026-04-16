import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

interface RouteParams {
  params: { id: string };
}

export async function PATCH(req: Request, { params }: RouteParams) {
  try {
    const body = await req.json();

    const lead = await prisma.scannerLead.update({
      where: { id: params.id },
      data: { email: body.email, name: body.name },
    });

    return NextResponse.json(lead);
  } catch (error) {
    console.error("[PATCH /api/scanner-leads/[id]/email]", error);
    return NextResponse.json(
      { error: "Failed to update scanner lead email" },
      { status: 500 }
    );
  }
}
