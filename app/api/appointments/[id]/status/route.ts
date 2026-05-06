import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Public — only exposes status and zoom link, no sensitive data
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!id || typeof id !== "string" || id.length > 100) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }
    const appt = await prisma.appointment.findUnique({
      where: { id },
      select: { status: true, zoomLink: true, confirmedAt: true },
    });
    if (!appt) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(appt);
  } catch {
    return NextResponse.json({ error: "Failed to fetch status" }, { status: 500 });
  }
}
