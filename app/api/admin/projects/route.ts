import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requirePermission } from "@/lib/require-admin";
import { ensurePmTables } from "@/lib/admin/command-center/db";
import { badRequest, currentStaff, jsonBody, writeGuard, zodMessage } from "@/lib/admin/command-center/guard";
import { logActivity } from "@/lib/admin/command-center/pm";
import { PERM_COMMAND_CENTER } from "@/lib/admin/command-center/permissions";
import { PROJECT_CATEGORY_VALUES, PROJECT_PRIORITY_VALUES, PROJECT_STATUS_VALUES } from "@/lib/admin/command-center/constants";

// The original projects API, kept for existing callers. The Command Center
// itself uses /api/admin/pm/*. Same shapes as before, now behind the
// command_center permission and with validated bodies.

const createSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    description: z.string().max(4000).optional(),
    category: z.enum(PROJECT_CATEGORY_VALUES),
    status: z.enum(PROJECT_STATUS_VALUES).optional(),
    priority: z.enum(PROJECT_PRIORITY_VALUES).optional(),
    progress: z.number().int().min(0).max(100).optional(),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
    revenueEarned: z.number().int().min(0).max(100_000_000).optional(),
    revenuePotential: z.number().int().min(0).max(100_000_000).optional(),
    monthlyRecurring: z.number().int().min(0).max(10_000_000).optional(),
    deadline: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).nullable().optional(),
    starred: z.boolean().optional(),
    notes: z.string().max(20000).optional(),
    tasks: z.array(z.string().trim().min(1).max(500)).max(100).optional(),
  })
  .strict();

export async function GET(req: NextRequest) {
  const unauth = await requirePermission(PERM_COMMAND_CENTER);
  if (unauth) return unauth;

  try {
    await ensurePmTables();
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const status = searchParams.get("status");
    const archived = searchParams.get("archived") === "true";

    const projects = await prisma.project.findMany({
      where: {
        ...(category && (PROJECT_CATEGORY_VALUES as readonly string[]).includes(category) && { category: category as (typeof PROJECT_CATEGORY_VALUES)[number] }),
        ...(status && (PROJECT_STATUS_VALUES as readonly string[]).includes(status) && { status: status as (typeof PROJECT_STATUS_VALUES)[number] }),
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
  const unauth = await requirePermission(PERM_COMMAND_CENTER);
  if (unauth) return unauth;
  const staff = await currentStaff();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const blocked = await writeGuard(req, staff, "projects", { max: 30 });
  if (blocked) return blocked;
  const parsed = createSchema.safeParse(await jsonBody(req));
  if (!parsed.success) return badRequest(zodMessage(parsed.error));

  try {
    await ensurePmTables();
    const { tasks, deadline, ...data } = parsed.data;
    const project = await prisma.project.create({
      data: {
        ...data,
        deadline: deadline ? new Date(deadline) : null,
        ownerId: staff.id,
        ...(tasks?.length ? { tasks: { create: tasks.map((t, i) => ({ text: t, order: i, createdById: staff.id })) } } : {}),
      },
      include: { tasks: { orderBy: { order: "asc" } } },
    });
    await logActivity(project.id, staff, "project.create", "created the project");
    return NextResponse.json(project, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
  }
}
