import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const unauth = await requireAdmin();
  if (unauth) return unauth;

  const { id } = await params;
  const body = await req.json();

  try {
    const updated = await prisma.prospect.update({
      where: { id },
      data: body,
    });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Prospect not found" }, { status: 404 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const unauth = await requireAdmin();
  if (unauth) return unauth;

  const { id } = await params;
  try {
    await prisma.prospect.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Prospect not found" }, { status: 404 });
  }
}
