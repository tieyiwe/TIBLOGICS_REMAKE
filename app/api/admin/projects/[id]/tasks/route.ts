import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/require-admin";
import { badRequest, currentStaff, jsonBody, writeGuard, zodMessage } from "@/lib/admin/command-center/guard";
import { keyOf } from "@/lib/admin/command-center/dates";
import { createTask, listStaff, TaskError } from "@/lib/admin/command-center/pm";
import { PERM_COMMAND_CENTER } from "@/lib/admin/command-center/permissions";

// Original "add a task" API, kept for existing callers.
const schema = z.object({ text: z.string().trim().min(1).max(500), dueDate: z.string().max(40).nullable().optional() }).strict();

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const unauth = await requirePermission(PERM_COMMAND_CENTER);
  if (unauth) return unauth;
  const staff = await currentStaff();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const blocked = await writeGuard(req, staff, "tasks", { max: 180 });
  if (blocked) return blocked;
  const parsed = schema.safeParse(await jsonBody(req));
  if (!parsed.success) return badRequest(zodMessage(parsed.error));

  const { id } = await params;
  const due = parsed.data.dueDate ? keyOf(parsed.data.dueDate) : null;
  try {
    const task = await createTask({ projectId: id, title: parsed.data.text, dueKey: due }, staff, await listStaff());
    return NextResponse.json({ id: task.id, projectId: task.projectId, text: task.title, done: task.done, dueDate: task.dueKey, order: task.order }, { status: 201 });
  } catch (err) {
    if (err instanceof TaskError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
