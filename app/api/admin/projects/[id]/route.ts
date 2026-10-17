import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requirePermission } from "@/lib/require-admin";
import { audit } from "@/lib/admin/audit";
import { ensurePmTables } from "@/lib/admin/command-center/db";
import { badRequest, currentStaff, deleteGuard, jsonBody, writeGuard, zodMessage } from "@/lib/admin/command-center/guard";
import { PERM_COMMAND_CENTER } from "@/lib/admin/command-center/permissions";
import { PROJECT_PRIORITY_VALUES, PROJECT_STATUS_VALUES } from "@/lib/admin/command-center/constants";

// Original single-project API (kept for existing callers; the Command Center
// uses /api/admin/pm/projects/[id]).

const patchSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    description: z.string().max(8000).nullable(),
    status: z.enum(PROJECT_STATUS_VALUES),
    priority: z.enum(PROJECT_PRIORITY_VALUES),
    progress: z.number().int().min(0).max(100),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    deadline: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).nullable(),
    archived: z.boolean(),
  })
  .partial()
  .strict();

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const unauth = await requirePermission(PERM_COMMAND_CENTER);
  if (unauth) return unauth;

  await ensurePmTables();
  const { id } = await params;
  const project = await prisma.project.findUnique({
    where: { id },
    include: { tasks: { orderBy: { order: "asc" } } },
  });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(project);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const unauth = await requirePermission(PERM_COMMAND_CENTER);
  if (unauth) return unauth;
  const staff = await currentStaff();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const blocked = await writeGuard(req, staff, "projects");
  if (blocked) return blocked;
  const parsed = patchSchema.safeParse(await jsonBody(req));
  if (!parsed.success) return badRequest(zodMessage(parsed.error));

  try {
    await ensurePmTables();
    const { id } = await params;
    const { deadline, ...rest } = parsed.data;
    const project = await prisma.project.update({
      where: { id },
      data: { ...rest, ...(deadline !== undefined ? { deadline: deadline ? new Date(deadline) : null } : {}) },
      include: { tasks: { orderBy: { order: "asc" } } },
    });
    return NextResponse.json(project);
  } catch {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

/** Archives (never hard-deletes) the project. */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const unauth = await requirePermission(PERM_COMMAND_CENTER);
  if (unauth) return unauth;
  const staff = await currentStaff();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const blocked = await deleteGuard(req, staff, "projects", 20);
  if (blocked) return blocked;

  await ensurePmTables();
  const { id } = await params;
  const project = await prisma.project.update({ where: { id }, data: { archived: true } }).catch(() => null);
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await audit(staff.session, "project.archive", { type: "project", id, label: project.name });
  return NextResponse.json({ success: true });
}
