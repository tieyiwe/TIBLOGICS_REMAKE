import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requirePermission } from "@/lib/require-admin";
import { badRequest, currentStaff, jsonBody, todayOf, writeGuard, zodMessage } from "@/lib/admin/command-center/guard";
import { applyTaskChange, deleteTask, listStaff, TaskError, type TaskChange } from "@/lib/admin/command-center/pm";
import { bulkSchema } from "@/lib/admin/command-center/schemas";
import { PERM_COMMAND_CENTER } from "@/lib/admin/command-center/permissions";

export const dynamic = "force-dynamic";

/**
 * Bulk edit selected tasks: status, priority, assignee, due date, move to a
 * project, add a label, or delete. Each task goes through the same rules as a
 * single edit; tasks that refuse (e.g. still blocked) are reported, not fatal.
 */
export async function POST(req: NextRequest) {
  const denied = await requirePermission(PERM_COMMAND_CENTER);
  if (denied) return denied;
  const staff = await currentStaff();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const blocked = await writeGuard(req, staff, "tasks-bulk", { max: 30 });
  if (blocked) return blocked;
  const parsed = bulkSchema.safeParse(await jsonBody(req));
  if (!parsed.success) return badRequest(zodMessage(parsed.error));
  const b = parsed.data;
  const team = await listStaff();
  const today = todayOf(req);

  let change: TaskChange | null = null;
  switch (b.action) {
    case "status":
      if (!b.status) return badRequest("Pick a status");
      change = { status: b.status };
      break;
    case "priority":
      if (!b.priority) return badRequest("Pick a priority");
      change = { priority: b.priority };
      break;
    case "assign":
      if (b.assigneeId === undefined) return badRequest("Pick a person");
      change = { assigneeId: b.assigneeId };
      break;
    case "due":
      if (b.dueKey === undefined) return badRequest("Pick a date");
      change = { dueKey: b.dueKey };
      break;
    case "move":
      if (!b.projectId) return badRequest("Pick a project");
      change = { projectId: b.projectId };
      break;
    case "label":
    case "delete":
      break;
  }

  const done: string[] = [];
  const failed: Array<{ id: string; error: string }> = [];
  for (const id of b.ids) {
    try {
      if (b.action === "delete") {
        if (await deleteTask(id, staff)) done.push(id);
        continue;
      }
      let c = change!;
      if (b.action === "label") {
        if (!b.label) return badRequest("Name the label");
        const t = await prisma.projectTask.findUnique({ where: { id }, select: { labels: true } });
        if (!t) throw new TaskError("Task not found", 404);
        c = { labels: [...new Set([...(t.labels ?? []), b.label])].slice(0, 12) };
      }
      await applyTaskChange(id, c, staff, today, team);
      done.push(id);
    } catch (err) {
      failed.push({ id, error: err instanceof TaskError ? err.message : "Update failed" });
      if (!(err instanceof TaskError)) console.error("[pm/tasks/bulk]", err);
    }
  }
  return NextResponse.json({ done, failed });
}
