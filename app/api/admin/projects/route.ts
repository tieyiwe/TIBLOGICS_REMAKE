import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

export async function GET(req: NextRequest) {
  const unauth = await requireAdmin();
  if (unauth) return unauth;

  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const status = searchParams.get("status");
    const archived = searchParams.get("archived") === "true";

    const projects = await prisma.project.findMany({
      where: {
        ...(category && { category: category as any }),
        ...(status && { status: status as any }),
        archived,
      },
      include: { tasks: { orderBy: { order: "asc" } } },
      orderBy: [{ starred: "desc" }, { updatedAt: "desc" }],
    });

    return NextResponse.json(projects);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const unauth = await requireAdmin();
  if (unauth) return unauth;

  try {
    const body = await req.json();
    const { tasks, ...data } = body;
    // Nested create + include: one statement instead of insert project, insert
    // tasks, then re-read the project back to return it with its tasks.
    const project = await prisma.project.create({
      data: {
        ...data,
        ...(tasks?.length
          ? { tasks: { create: tasks.map((t: string, i: number) => ({ text: t, order: i })) } }
          : {}),
      },
      include: { tasks: { orderBy: { order: "asc" } } },
    });
    return NextResponse.json(project, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
  }
}
