import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const unauth = await requireAdmin();
  if (unauth) return unauth;

  const { text, dueDate } = await req.json();
  if (!text || typeof text !== "string" || text.length > 500) {
    return NextResponse.json({ error: "Invalid task text" }, { status: 400 });
  }
  const count = await prisma.projectTask.count({ where: { projectId: params.id } });
  const task = await prisma.projectTask.create({
    data: { projectId: params.id, text, dueDate: dueDate ? new Date(dueDate) : undefined, order: count },
  });
  return NextResponse.json(task, { status: 201 });
}
