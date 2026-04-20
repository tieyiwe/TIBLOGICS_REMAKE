import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const unauth = await requireAdmin();
  if (unauth) return unauth;

  const { id } = await params;
  const project = await prisma.project.findUnique({
    where: { id },
    include: { tasks: { orderBy: { order: "asc" } } },
  });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(project);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const unauth = await requireAdmin();
  if (unauth) return unauth;

  try {
    const { id } = await params;
    const body = await req.json();
    const project = await prisma.project.update({
      where: { id },
      data: body,
      include: { tasks: { orderBy: { order: "asc" } } },
    });
    return NextResponse.json(project);
  } catch {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const unauth = await requireAdmin();
  if (unauth) return unauth;

  const { id } = await params;
  await prisma.project.update({ where: { id }, data: { archived: true } });
  return NextResponse.json({ success: true });
}
