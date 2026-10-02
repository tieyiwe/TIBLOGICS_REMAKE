import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { requirePermission } from "@/lib/require-admin";
import { audit } from "@/lib/admin/audit";
import { ensurePmTables } from "@/lib/admin/command-center/db";
import { dayToDate } from "@/lib/admin/command-center/dates";
import { badRequest, currentStaff, deleteGuard, jsonBody, writeGuard, zodMessage } from "@/lib/admin/command-center/guard";
import { getProjectBundle, listStaff, logActivity, projectDTO, recomputeProgress } from "@/lib/admin/command-center/pm";
import { projectPatchSchema } from "@/lib/admin/command-center/schemas";
import { hasPermission, PERM_COMMAND_CENTER, PERM_FINANCE } from "@/lib/admin/command-center/permissions";
import { HEALTH } from "@/lib/admin/command-center/constants";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const denied = await requirePermission(PERM_COMMAND_CENTER);
  if (denied) return denied;
  const staff = await currentStaff();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const bundle = await getProjectBundle(id, { withFinance: hasPermission(staff.session.user, PERM_FINANCE) });
  if (!bundle) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(bundle);
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const denied = await requirePermission(PERM_COMMAND_CENTER);
  if (denied) return denied;
  const staff = await currentStaff();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const blocked = await writeGuard(req, staff, "projects");
  if (blocked) return blocked;
  const parsed = projectPatchSchema.safeParse(await jsonBody(req));
  if (!parsed.success) return badRequest(zodMessage(parsed.error));
  const { id } = await params;
  await ensurePmTables();
  const before = await prisma.project.findUnique({ where: { id } });
  if (!before) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { startKey, deadlineKey, links, ...rest } = parsed.data;
  // Hourly rate feeds project cost: a money field, so it needs the finance permission.
  if (rest.hourlyRateCents !== undefined && !hasPermission(staff.session.user, PERM_FINANCE)) {
    return NextResponse.json({ error: "Setting an hourly rate needs the Finance permission" }, { status: 403 });
  }
  if (rest.ownerId) {
    const team = await listStaff();
    if (!team.some((s) => s.id === rest.ownerId)) return badRequest("Owner must be a staff member with Command Center access");
  }
  const data: Prisma.ProjectUpdateInput = { ...rest };
  if (startKey !== undefined) data.startDate = startKey ? dayToDate(startKey) : null;
  if (deadlineKey !== undefined) data.deadline = deadlineKey ? dayToDate(deadlineKey) : null;
  if (links !== undefined) data.links = links as unknown as Prisma.InputJsonValue;
  if (rest.status === "COMPLETED" && before.status !== "COMPLETED") data.completedAt = new Date();

  try {
    const project = await prisma.project.update({ where: { id }, data });
    const changes: string[] = [];
    if (rest.status && rest.status !== before.status) changes.push(`set status to ${rest.status.toLowerCase()}`);
    if (rest.health && rest.health !== before.health) changes.push(`marked the project ${HEALTH.find((h) => h.value === rest.health)?.label.toLowerCase()}`);
    if (rest.name && rest.name !== before.name) changes.push(`renamed the project to "${rest.name}"`);
    if (deadlineKey !== undefined) changes.push(deadlineKey ? `set the deadline to ${deadlineKey}` : "cleared the deadline");
    if (rest.archived !== undefined && rest.archived !== before.archived) changes.push(rest.archived ? "archived the project" : "restored the project");
    if (changes.length) await logActivity(id, staff, "project.update", changes.join(", "));
    if (rest.archived !== undefined && rest.archived !== before.archived) {
      await audit(staff.session, rest.archived ? "project.archive" : "project.restore", { type: "project", id, label: project.name });
    }
    if (rest.progressMode === "auto") {
      const p = await recomputeProgress(id);
      if (p !== null) project.progress = p;
    }
    return NextResponse.json({ project: projectDTO(project) });
  } catch (err) {
    console.error("[pm/projects] update", err);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

/**
 * Archive (default) or, with ?mode=delete, delete permanently. Permanent
 * deletion takes the project's tasks, milestones, notes, updates and time
 * with it (finance entries stay, unlinked), so only the owner or an admin may.
 */
export async function DELETE(req: NextRequest, { params }: Ctx) {
  const denied = await requirePermission(PERM_COMMAND_CENTER);
  if (denied) return denied;
  const staff = await currentStaff();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const blocked = await deleteGuard(req, staff, "projects", 20);
  if (blocked) return blocked;
  const { id } = await params;
  await ensurePmTables();
  const project = await prisma.project.findUnique({ where: { id }, select: { id: true, name: true } });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const hard = req.nextUrl.searchParams.get("mode") === "delete";
  if (hard) {
    if (!(staff.isOwner || staff.isAdmin)) {
      return NextResponse.json({ error: "Only the owner or an admin can delete a project permanently. Archive it instead." }, { status: 403 });
    }
    await prisma.project.delete({ where: { id } });
    await audit(staff.session, "project.delete", { type: "project", id, label: project.name });
    return NextResponse.json({ success: true, deleted: true });
  }
  await prisma.project.update({ where: { id }, data: { archived: true } });
  await logActivity(id, staff, "project.update", "archived the project");
  await audit(staff.session, "project.archive", { type: "project", id, label: project.name });
  return NextResponse.json({ success: true, archived: true });
}
