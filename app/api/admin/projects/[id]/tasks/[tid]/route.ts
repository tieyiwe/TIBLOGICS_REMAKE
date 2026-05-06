import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; tid: string }> }) {
  const unauth = await requireAdmin();
  if (unauth) return unauth;

  const { tid } = await params;
  const body = await req.json();
  const task = await prisma.projectTask.update({ where: { id: tid }, data: body });
  return NextResponse.json(task);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; tid: string }> }) {
  const unauth = await requireAdmin();
  if (unauth) return unauth;

  const { tid } = await params;
  await prisma.projectTask.delete({ where: { id: tid } });
  return NextResponse.json({ success: true });
}
