import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

export async function GET() {
  try {
    const blocked = await prisma.blockedDate.findMany({
      orderBy: { date: "asc" },
    });
    return NextResponse.json({ blocked });
  } catch {
    return NextResponse.json({ blocked: [] });
  }
}

// Staff only — blocking dates removes them from the public calendar, so an
// open endpoint would let anyone shut booking down. GET stays public.
export async function POST(req: NextRequest) {
  const unauth = await requireAdmin();
  if (unauth) return unauth;

  try {
    const { date, reason } = await req.json();
    if (!date) return NextResponse.json({ error: "date required" }, { status: 400 });
    const blocked = await prisma.blockedDate.create({
      data: { date: new Date(date + "T12:00:00.000Z"), reason: reason || null },
    });
    return NextResponse.json({ blocked }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to block date" }, { status: 500 });
  }
}

// Staff only — see POST.
export async function DELETE(req: NextRequest) {
  const unauth = await requireAdmin();
  if (unauth) return unauth;

  try {
    const { id } = await req.json();
    await prisma.blockedDate.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
