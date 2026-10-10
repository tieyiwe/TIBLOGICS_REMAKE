import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/require-admin";
import { badRequest, currentStaff, jsonBody, writeGuard, zodMessage } from "@/lib/admin/command-center/guard";
import { createTask, listStaff, milestonesBetween, myWork, tasksDueBetween, TaskError } from "@/lib/admin/command-center/pm";
import { taskCreateSchema } from "@/lib/admin/command-center/schemas";
import { isDayKey } from "@/lib/admin/command-center/dates";
import { PERM_COMMAND_CENTER } from "@/lib/admin/command-center/permissions";

export const dynamic = "force-dynamic";

/**
 * ?view=mine            tasks assigned to me (open, and done in the last 7 days)
 * ?from=&to=[&mine=1]   tasks due and milestones in a date range (calendar)
 */
export async function GET(req: NextRequest) {
  const denied = await requirePermission(PERM_COMMAND_CENTER);
  if (denied) return denied;
  const staff = await currentStaff();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sp = req.nextUrl.searchParams;
  if (sp.get("view") === "mine") return NextResponse.json(await myWork(staff.id));
  const from = sp.get("from");
  const to = sp.get("to");
  if (!isDayKey(from) || !isDayKey(to) || to! < from!) return badRequest("from and to must be dates");
  if (Date.parse(to!) - Date.parse(from!) > 120 * 86_400_000) return badRequest("Ask for at most 120 days at a time");
  const [tasks, milestones] = await Promise.all([
    tasksDueBetween(from!, to!, sp.get("mine") === "1" ? staff.id : null),
    milestonesBetween(from!, to!),
  ]);
  return NextResponse.json({ tasks, milestones });
}

export async function POST(req: NextRequest) {
  const denied = await requirePermission(PERM_COMMAND_CENTER);
  if (denied) return denied;
  const staff = await currentStaff();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const blocked = await writeGuard(req, staff, "tasks", { max: 180 });
  if (blocked) return blocked;
  const parsed = taskCreateSchema.safeParse(await jsonBody(req));
  if (!parsed.success) return badRequest(zodMessage(parsed.error));
  try {
    const task = await createTask(parsed.data, staff, await listStaff());
    return NextResponse.json({ task }, { status: 201 });
  } catch (err) {
    if (err instanceof TaskError) return NextResponse.json({ error: err.message, ...err.extra }, { status: err.status });
    console.error("[pm/tasks] create", err);
    return NextResponse.json({ error: "Could not create the task" }, { status: 500 });
  }
}
