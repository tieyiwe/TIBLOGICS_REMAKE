import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requirePermission } from "@/lib/require-admin";
import { badRequest, currentStaff, jsonBody, writeGuard, zodMessage } from "@/lib/admin/command-center/guard";
import { ensurePmTables } from "@/lib/admin/command-center/db";
import { parseQuickAdd } from "@/lib/admin/command-center/dates";
import { createTask, listStaff, noteDTO, TaskError } from "@/lib/admin/command-center/pm";
import { actionItemSchema } from "@/lib/admin/command-center/schemas";
import { PERM_COMMAND_CENTER } from "@/lib/admin/command-center/permissions";
import { TASK_MARK } from "@/lib/admin/command-center/constants";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

const ITEM = /^(\s*[-*] \[ \] )(.+)$/;

/**
 * Turns an unchecked checklist line of a note ("- [ ] Send deck @jane fri")
 * into a task in the note's project, then marks the line so it is not turned
 * into a task twice.
 */
export async function POST(req: NextRequest, { params }: Ctx) {
  const denied = await requirePermission(PERM_COMMAND_CENTER);
  if (denied) return denied;
  const staff = await currentStaff();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const blocked = await writeGuard(req, staff, "tasks", { max: 180 });
  if (blocked) return blocked;
  const parsed = actionItemSchema.safeParse(await jsonBody(req));
  if (!parsed.success) return badRequest(zodMessage(parsed.error));
  const { id } = await params;
  await ensurePmTables();
  const note = await prisma.pmNote.findUnique({ where: { id } });
  if (!note) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const lines = note.bodyMd.split("\n");
  const line = lines[parsed.data.line];
  const m = line?.match(ITEM);
  if (!m || line.includes(TASK_MARK)) return badRequest("That line is not an open action item");
  const team = await listStaff();
  const q = parseQuickAdd(m[2].trim(), parsed.data.today, team);
  if (!q.title) return badRequest("The action item is empty");
  try {
    const task = await createTask(
      {
        projectId: note.projectId,
        title: q.title,
        dueKey: q.dueKey,
        priority: q.priority ?? undefined,
        labels: q.labels,
        assigneeId: q.assigneeId ?? staff.id,
        description: `From the note "${note.title}".`,
      },
      staff,
      team,
    );
    lines[parsed.data.line] = `${line} ${TASK_MARK}`;
    const updated = await prisma.pmNote.update({ where: { id }, data: { bodyMd: lines.join("\n"), updatedAt: new Date() } });
    return NextResponse.json({ task, note: noteDTO(updated) }, { status: 201 });
  } catch (err) {
    if (err instanceof TaskError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
