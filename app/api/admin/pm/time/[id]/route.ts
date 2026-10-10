import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requirePermission } from "@/lib/require-admin";
import { currentStaff, deleteGuard } from "@/lib/admin/command-center/guard";
import { ensurePmTables } from "@/lib/admin/command-center/db";
import { PERM_COMMAND_CENTER } from "@/lib/admin/command-center/permissions";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

/** Remove a time entry: your own, or anyone's for the owner and admins. */
export async function DELETE(req: NextRequest, { params }: Ctx) {
  const denied = await requirePermission(PERM_COMMAND_CENTER);
  if (denied) return denied;
  const staff = await currentStaff();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const blocked = await deleteGuard(req, staff, "time");
  if (blocked) return blocked;
  const { id } = await params;
  await ensurePmTables();
  const entry = await prisma.pmTimeEntry.findUnique({ where: { id } });
  if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (entry.staffId !== staff.id && !(staff.isOwner || staff.isAdmin)) {
    return NextResponse.json({ error: "You can only remove your own time" }, { status: 403 });
  }
  await prisma.pmTimeEntry.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
