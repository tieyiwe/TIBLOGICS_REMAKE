import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const lead = await prisma.scannerLead.update({
      where: { id },
      data: { email: body.email, name: body.name },
    });
    return NextResponse.json(lead);
  } catch (error) {
    console.error("[PATCH /api/scanner-leads/[id]/email]", error);
    return NextResponse.json({ error: "Failed to update scanner lead email" }, { status: 500 });
  }
}
