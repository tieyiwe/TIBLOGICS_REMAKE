import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requirePermission } from "@/lib/require-admin";
import { badRequest, currentStaff, jsonBody, writeGuard, zodMessage } from "@/lib/admin/command-center/guard";
import { ensurePmTables } from "@/lib/admin/command-center/db";
import { logActivity, notify, projectHref, updateDTO, updatesDigest } from "@/lib/admin/command-center/pm";
import { updateCreateSchema } from "@/lib/admin/command-center/schemas";
import { HEALTH } from "@/lib/admin/command-center/constants";
import { PERM_COMMAND_CENTER } from "@/lib/admin/command-center/permissions";

export const dynamic = "force-dynamic";

/** Portfolio digest: status updates from the last 8 weeks. */
export async function GET() {
  const denied = await requirePermission(PERM_COMMAND_CENTER);
  if (denied) return denied;
  return NextResponse.json({ updates: await updatesDigest() });
}

/**
 * Weekly status update: what is done, what is next, blockers, health. Sets
 * the project's health (and progress, when progress is manual) and resets the
 * "no update in 14 days" warning.
 */
export async function POST(req: NextRequest) {
  const denied = await requirePermission(PERM_COMMAND_CENTER);
  if (denied) return denied;
  const staff = await currentStaff();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const blocked = await writeGuard(req, staff, "updates", { max: 20 });
  if (blocked) return blocked;
  const parsed = updateCreateSchema.safeParse(await jsonBody(req));
  if (!parsed.success) return badRequest(zodMessage(parsed.error));
  const u = parsed.data;
  if (!u.doneMd.trim() && !u.nextMd.trim() && !u.blockersMd.trim()) return badRequest("Write at least one of done, next or blockers");
  await ensurePmTables();
  const project = await prisma.project.findUnique({ where: { id: u.projectId } });
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
  const progress = project.progressMode === "manual" && u.progress !== undefined ? u.progress : project.progress;
  const [update] = await prisma.$transaction([
    prisma.pmUpdate.create({
      data: {
        projectId: u.projectId,
        authorId: staff.id,
        authorName: staff.name,
        health: u.health,
        progress,
        doneMd: u.doneMd,
        nextMd: u.nextMd,
        blockersMd: u.blockersMd,
      },
    }),
    prisma.project.update({
      where: { id: u.projectId },
      data: {
        health: u.health,
        healthNote: u.blockersMd.trim() ? u.blockersMd.trim().slice(0, 1000) : null,
        lastUpdateAt: new Date(),
        progress,
      },
    }),
  ]);
  const label = HEALTH.find((h) => h.value === u.health)?.label ?? u.health;
  await logActivity(u.projectId, staff, "update", `posted a status update (${label.toLowerCase()}, ${progress}%)`);
  if (project.ownerId && project.ownerId !== staff.id) {
    await notify([project.ownerId], { kind: "update", title: `${staff.name} posted an update on ${project.name}`, body: label, href: `${projectHref(project.id)}?tab=updates` }, staff.id);
  }
  return NextResponse.json({ update: updateDTO(update) }, { status: 201 });
}
