import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/require-admin";
import { badRequest, currentStaff, deleteGuard, jsonBody, todayOf, writeGuard, zodMessage } from "@/lib/admin/command-center/guard";
import { applyTaskChange, deleteTask, getTaskDetail, listStaff, TaskError } from "@/lib/admin/command-center/pm";
import { taskPatchSchema } from "@/lib/admin/command-center/schemas";
import { PERM_COMMAND_CENTER } from "@/lib/admin/command-center/permissions";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const denied = await requirePermission(PERM_COMMAND_CENTER);
  if (denied) return denied;
  const { id } = await params;
  const detail = await getTaskDetail(id);
  if (!detail) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(detail);
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const denied = await requirePermission(PERM_COMMAND_CENTER);
  if (denied) return denied;
  const staff = await currentStaff();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const blocked = await writeGuard(req, staff, "tasks", { max: 240 });
  if (blocked) return blocked;
  const parsed = taskPatchSchema.safeParse(await jsonBody(req));
  if (!parsed.success) return badRequest(zodMessage(parsed.error));
  const { id } = await params;
  try {
    const result = await applyTaskChange(id, parsed.data, staff, todayOf(req), await listStaff());
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof TaskError) return NextResponse.json({ error: err.message, ...err.extra }, { status: err.status });
    console.error("[pm/tasks] update", err);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const denied = await requirePermission(PERM_COMMAND_CENTER);
  if (denied) return denied;
  const staff = await currentStaff();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const blocked = await deleteGuard(req, staff, "tasks");
  if (blocked) return blocked;
  const { id } = await params;
  const ok = await deleteTask(id, staff);
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}
