import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requirePermission } from "@/lib/require-admin";
import { badRequest, currentStaff, jsonBody, writeGuard, zodMessage } from "@/lib/admin/command-center/guard";
import { ensurePmTables } from "@/lib/admin/command-center/db";
import { dayToDate } from "@/lib/admin/command-center/dates";
import { logActivity, milestoneDTO, recomputeProgress } from "@/lib/admin/command-center/pm";
import { milestoneCreateSchema } from "@/lib/admin/command-center/schemas";
import { PERM_COMMAND_CENTER } from "@/lib/admin/command-center/permissions";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const denied = await requirePermission(PERM_COMMAND_CENTER);
  if (denied) return denied;
  const staff = await currentStaff();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const blocked = await writeGuard(req, staff, "milestones", { max: 60 });
  if (blocked) return blocked;
  const parsed = milestoneCreateSchema.safeParse(await jsonBody(req));
  if (!parsed.success) return badRequest(zodMessage(parsed.error));
  await ensurePmTables();
  const { projectId, title, dueKey, description } = parsed.data;
  if (!(await prisma.project.findUnique({ where: { id: projectId }, select: { id: true } }))) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }
  const order = await prisma.pmMilestone.count({ where: { projectId } });
  const m = await prisma.pmMilestone.create({ data: { projectId, title, dueDate: dayToDate(dueKey), description: description || null, order } });
  await logActivity(projectId, staff, "milestone.create", `added the milestone "${title}" (${dueKey})`);
  await recomputeProgress(projectId);
  return NextResponse.json({ milestone: milestoneDTO(m) }, { status: 201 });
}
