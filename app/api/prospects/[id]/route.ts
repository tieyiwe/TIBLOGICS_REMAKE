import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const unauth = await requireAdmin();
  if (unauth) return unauth;

  try {
    const { id } = await params;
    const prospect = await prisma.prospect.findUnique({ where: { id } });
    if (!prospect) return NextResponse.json({ error: "Prospect not found" }, { status: 404 });
    return NextResponse.json(prospect);
  } catch {
    return NextResponse.json({ error: "Failed to fetch prospect" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const unauth = await requireAdmin();
  if (unauth) return unauth;

  try {
    const { id } = await params;
    const body = await req.json();
    const allowedFields = ["status", "notes", "priority", "estimatedValue", "followUpDate", "convertedAt"];
    const data: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (field in body) data[field] = body[field];
    }
    const prospect = await prisma.prospect.update({ where: { id }, data });
    return NextResponse.json(prospect);
  } catch {
    return NextResponse.json({ error: "Failed to update prospect" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const unauth = await requireAdmin();
  if (unauth) return unauth;

  try {
    const { id } = await params;
    await prisma.prospect.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete prospect" }, { status: 500 });
  }
}
