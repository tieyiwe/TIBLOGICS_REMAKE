import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requirePermission } from "@/lib/require-admin";
import { badRequest, currentStaff, jsonBody, writeGuard, zodMessage } from "@/lib/admin/command-center/guard";
import { ensurePmTables } from "@/lib/admin/command-center/db";
import { logActivity, noteDTO } from "@/lib/admin/command-center/pm";
import { noteCreateSchema } from "@/lib/admin/command-center/schemas";
import { MEETING_TEMPLATE, NOTE_KINDS } from "@/lib/admin/command-center/constants";
import { PERM_COMMAND_CENTER } from "@/lib/admin/command-center/permissions";

export const dynamic = "force-dynamic";

/** New note page. Meeting notes start from the meeting template; a quick
 * capture with no title takes its first line as the title. */
export async function POST(req: NextRequest) {
  const denied = await requirePermission(PERM_COMMAND_CENTER);
  if (denied) return denied;
  const staff = await currentStaff();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const blocked = await writeGuard(req, staff, "notes", { max: 60 });
  if (blocked) return blocked;
  const parsed = noteCreateSchema.safeParse(await jsonBody(req));
  if (!parsed.success) return badRequest(zodMessage(parsed.error));
  await ensurePmTables();
  const { projectId, kind, pinned } = parsed.data;
  if (!(await prisma.project.findUnique({ where: { id: projectId }, select: { id: true } }))) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }
  let body = parsed.data.bodyMd;
  if (!body && kind === "meeting") body = MEETING_TEMPLATE;
  const firstLine = body.split("\n").find((l) => l.trim())?.replace(/^#+\s*/, "").trim();
  const kindLabel = NOTE_KINDS.find((k) => k.value === kind)?.label ?? "Note";
  const title =
    parsed.data.title ||
    (kind === "meeting"
      ? `Meeting ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
      : firstLine?.slice(0, 120) || `Untitled ${kindLabel.toLowerCase()}`);
  const note = await prisma.pmNote.create({
    data: { projectId, title, bodyMd: body, kind, pinned: !!pinned, createdById: staff.id, createdByName: staff.name },
  });
  await logActivity(projectId, staff, "note.create", `added the ${kindLabel.toLowerCase()} "${title}"`);
  return NextResponse.json({ note: noteDTO(note) }, { status: 201 });
}
