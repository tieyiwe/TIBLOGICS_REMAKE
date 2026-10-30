import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { requirePermission } from "@/lib/require-admin";
import { badRequest, currentStaff, deleteGuard, jsonBody, writeGuard, zodMessage } from "@/lib/admin/command-center/guard";
import { ensurePmTables } from "@/lib/admin/command-center/db";
import { dayToDate } from "@/lib/admin/command-center/dates";
import { logActivity, milestoneDTO, recomputeProgress } from "@/lib/admin/command-center/pm";
import { milestonePatchSchema } from "@/lib/admin/command-center/schemas";
import { PERM_COMMAND_CENTER } from "@/lib/admin/command-center/permissions";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const denied = await requirePermission(PERM_COMMAND_CENTER);
  if (denied) return denied;
  const staff = await currentStaff();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const blocked = await writeGuard(req, staff, "milestones");
  if (blocked) return blocked;
  const parsed = milestonePatchSchema.safeParse(await jsonBody(req));
  if (!parsed.success) return badRequest(zodMessage(parsed.error));
  const { id } = await params;
  await ensurePmTables();
  const before = await prisma.pmMilestone.findUnique({ where: { id } });
  if (!before) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const { dueKey, done, ...rest } = parsed.data;
  const data: Prisma.PmMilestoneUpdateInput = { ...rest };
  if (dueKey) data.dueDate = dayToDate(dueKey);
  if (done !== undefined) {
    data.done = done;
    data.completedAt = done ? new Date() : null;
  }
  const m = await prisma.pmMilestone.update({ where: { id }, data });
  const notes: string[] = [];
  if (dueKey && dueKey !== before.dueDate.toISOString().slice(0, 10)) notes.push(`moved "${m.title}" to ${dueKey}`);
  if (done !== undefined && done !== before.done) notes.push(done ? `reached the milestone "${m.title}"` : `reopened the milestone "${m.title}"`);
  if (notes.length) await logActivity(m.projectId, staff, "milestone.update", notes.join(", "));
  if (done !== undefined) await recomputeProgress(m.projectId);
  return NextResponse.json({ milestone: milestoneDTO(m) });
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const denied = await requirePermission(PERM_COMMAND_CENTER);
  if (denied) return denied;
  const staff = await currentStaff();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const blocked = await deleteGuard(req, staff, "milestones");
  if (blocked) return blocked;
  const { id } = await params;
  await ensurePmTables();
  const m = await prisma.pmMilestone.findUnique({ where: { id } });
  if (!m) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.$transaction([
    prisma.projectTask.updateMany({ where: { milestoneId: id }, data: { milestoneId: null } }),
    prisma.pmMilestone.delete({ where: { id } }),
  ]);
  await logActivity(m.projectId, staff, "milestone.delete", `deleted the milestone "${m.title}"`);
  await recomputeProgress(m.projectId);
  return NextResponse.json({ success: true });
}
