import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requirePermission } from "@/lib/require-admin";
import { badRequest, currentStaff, deleteGuard, jsonBody, todayOf, writeGuard, zodMessage } from "@/lib/admin/command-center/guard";
import { ensurePmTables } from "@/lib/admin/command-center/db";
import { keyOf } from "@/lib/admin/command-center/dates";
import { applyTaskChange, deleteTask, listStaff, TaskError } from "@/lib/admin/command-center/pm";
import { PERM_COMMAND_CENTER } from "@/lib/admin/command-center/permissions";

// Original task edit API, kept for existing callers. It used to write the
// request body straight into the row; now only these fields are accepted.
const schema = z
  .object({
    text: z.string().trim().min(1).max(500),
    done: z.boolean(),
    dueDate: z.string().max(40).nullable(),
    order: z.number().int().min(0).max(1_000_000),
  })
  .partial()
  .strict();

async function owned(projectId: string, taskId: string) {
  await ensurePmTables();
  return prisma.projectTask.findFirst({ where: { id: taskId, projectId }, select: { id: true } });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; tid: string }> }) {
  const unauth = await requirePermission(PERM_COMMAND_CENTER);
  if (unauth) return unauth;
  const staff = await currentStaff();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const blocked = await writeGuard(req, staff, "tasks", { max: 240 });
  if (blocked) return blocked;
  const parsed = schema.safeParse(await jsonBody(req));
  if (!parsed.success) return badRequest(zodMessage(parsed.error));

  const { id, tid } = await params;
  if (!(await owned(id, tid))) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const b = parsed.data;
  try {
    const { task } = await applyTaskChange(
      tid,
      {
        ...(b.text !== undefined ? { title: b.text } : {}),
        ...(b.done !== undefined ? { status: b.done ? "done" : "todo", force: true } : {}),
        ...(b.dueDate !== undefined ? { dueKey: b.dueDate ? keyOf(b.dueDate) : null } : {}),
        ...(b.order !== undefined ? { order: b.order } : {}),
      },
      staff,
      todayOf(req),
      await listStaff(),
    );
    return NextResponse.json({ id: task.id, projectId: task.projectId, text: task.title, done: task.done, dueDate: task.dueKey, order: task.order });
  } catch (err) {
    if (err instanceof TaskError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string; tid: string }> }) {
  const unauth = await requirePermission(PERM_COMMAND_CENTER);
  if (unauth) return unauth;
  const staff = await currentStaff();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const blocked = await deleteGuard(req, staff, "tasks");
  if (blocked) return blocked;

  const { id, tid } = await params;
  if (!(await owned(id, tid))) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await deleteTask(tid, staff);
  return NextResponse.json({ success: true });
}
