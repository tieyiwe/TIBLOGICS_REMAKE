import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requirePermission } from "@/lib/require-admin";
import { badRequest, currentStaff, jsonBody, writeGuard, zodMessage, type Staff } from "@/lib/admin/command-center/guard";
import { ensurePmTables } from "@/lib/admin/command-center/db";
import { dayToDate, fmtMinutes } from "@/lib/admin/command-center/dates";
import { logActivity, timeDTO } from "@/lib/admin/command-center/pm";
import { timeSchema } from "@/lib/admin/command-center/schemas";
import { PERM_COMMAND_CENTER } from "@/lib/admin/command-center/permissions";

export const dynamic = "force-dynamic";

const MAX_TIMER_MIN = 12 * 60;

/** Stops this person's running timer, if any. A timer left on for more than 12 hours counts 12. */
async function stopRunning(staff: Staff) {
  const running = await prisma.pmTimeEntry.findFirst({ where: { staffId: staff.id, endedAt: null } });
  if (!running) return null;
  const now = new Date();
  const minutes = Math.min(MAX_TIMER_MIN, Math.max(1, Math.round((now.getTime() - running.startedAt.getTime()) / 60_000)));
  const stopped = await prisma.pmTimeEntry.update({ where: { id: running.id }, data: { endedAt: now, minutes } });
  await logActivity(stopped.projectId, staff, "time", `logged ${fmtMinutes(minutes)}`, stopped.taskId);
  return stopped;
}

/** My running timer (for the header chip on every Command Center page). */
export async function GET() {
  const denied = await requirePermission(PERM_COMMAND_CENTER);
  if (denied) return denied;
  const staff = await currentStaff();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await ensurePmTables();
  const running = await prisma.pmTimeEntry.findFirst({ where: { staffId: staff.id, endedAt: null } });
  if (!running) return NextResponse.json({ running: null });
  const [project, task] = await Promise.all([
    prisma.project.findUnique({ where: { id: running.projectId }, select: { name: true } }),
    running.taskId ? prisma.projectTask.findUnique({ where: { id: running.taskId }, select: { text: true } }) : null,
  ]);
  return NextResponse.json({ running: { ...timeDTO(running), projectName: project?.name ?? "", taskTitle: task?.text ?? null } });
}

/** start | stop | log (manual minutes on a day). One timer runs at a time per person. */
export async function POST(req: NextRequest) {
  const denied = await requirePermission(PERM_COMMAND_CENTER);
  if (denied) return denied;
  const staff = await currentStaff();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const blocked = await writeGuard(req, staff, "time", { max: 60 });
  if (blocked) return blocked;
  const parsed = timeSchema.safeParse(await jsonBody(req));
  if (!parsed.success) return badRequest(zodMessage(parsed.error));
  await ensurePmTables();
  const b = parsed.data;
  if (b.action === "stop") {
    const stopped = await stopRunning(staff);
    return NextResponse.json({ stopped: stopped ? timeDTO(stopped) : null });
  }
  const project = await prisma.project.findUnique({ where: { id: b.projectId }, select: { id: true } });
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
  if (b.taskId && !(await prisma.projectTask.findFirst({ where: { id: b.taskId, projectId: b.projectId }, select: { id: true } }))) {
    return badRequest("That task is not in this project");
  }
  if (b.action === "start") {
    const stopped = await stopRunning(staff);
    const entry = await prisma.pmTimeEntry.create({
      data: { projectId: b.projectId, taskId: b.taskId ?? null, staffId: staff.id, staffName: staff.name, startedAt: new Date(), note: b.note || null },
    });
    return NextResponse.json({ running: timeDTO(entry), stopped: stopped ? timeDTO(stopped) : null }, { status: 201 });
  }
  const start = dayToDate(b.dayKey);
  const entry = await prisma.pmTimeEntry.create({
    data: {
      projectId: b.projectId,
      taskId: b.taskId ?? null,
      staffId: staff.id,
      staffName: staff.name,
      startedAt: start,
      endedAt: new Date(start.getTime() + b.minutes * 60_000),
      minutes: b.minutes,
      note: b.note || null,
    },
  });
  await logActivity(b.projectId, staff, "time", `logged ${fmtMinutes(b.minutes)}`, b.taskId ?? null);
  return NextResponse.json({ entry: timeDTO(entry) }, { status: 201 });
}
