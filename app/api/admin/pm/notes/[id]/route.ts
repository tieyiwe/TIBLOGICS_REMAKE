import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requirePermission } from "@/lib/require-admin";
import { badRequest, currentStaff, deleteGuard, jsonBody, writeGuard, zodMessage } from "@/lib/admin/command-center/guard";
import { ensurePmTables } from "@/lib/admin/command-center/db";
import { logActivity, noteDTO } from "@/lib/admin/command-center/pm";
import { notePatchSchema } from "@/lib/admin/command-center/schemas";
import { PERM_COMMAND_CENTER } from "@/lib/admin/command-center/permissions";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const denied = await requirePermission(PERM_COMMAND_CENTER);
  if (denied) return denied;
  const staff = await currentStaff();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // Notes autosave while typing, so the limit is generous.
  const blocked = await writeGuard(req, staff, "notes-edit", { max: 240 });
  if (blocked) return blocked;
  const parsed = notePatchSchema.safeParse(await jsonBody(req));
  if (!parsed.success) return badRequest(zodMessage(parsed.error));
  const { id } = await params;
  await ensurePmTables();
  const exists = await prisma.pmNote.findUnique({ where: { id }, select: { id: true } });
  if (!exists) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const note = await prisma.pmNote.update({ where: { id }, data: { ...parsed.data, updatedAt: new Date() } });
  return NextResponse.json({ note: noteDTO(note) });
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const denied = await requirePermission(PERM_COMMAND_CENTER);
  if (denied) return denied;
  const staff = await currentStaff();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const blocked = await deleteGuard(req, staff, "notes");
  if (blocked) return blocked;
  const { id } = await params;
  await ensurePmTables();
  const note = await prisma.pmNote.findUnique({ where: { id } });
  if (!note) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.pmNote.delete({ where: { id } });
  await logActivity(note.projectId, staff, "note.delete", `deleted the note "${note.title}"`);
  return NextResponse.json({ success: true });
}
