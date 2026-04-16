import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { text, dueDate } = await req.json();
  const count = await prisma.projectTask.count({ where: { projectId: params.id } });
  const task = await prisma.projectTask.create({
    data: { projectId: params.id, text, dueDate: dueDate ? new Date(dueDate) : undefined, order: count },
  });
  return NextResponse.json(task, { status: 201 });
}
