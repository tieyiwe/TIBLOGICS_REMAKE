import { NextRequest, NextResponse } from "next/server";
import { teamApi, teamError, readJson } from "@/lib/admin/team/guard";
import { deleteRole, updateRole } from "@/lib/admin/team/service";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await teamApi(req, "manage");
  if (error) return error;
  const { id } = await params;
  try {
    return NextResponse.json(await updateRole(session.user, id, await readJson(req)));
  } catch (err) {
    return teamError(err, "roles.update");
  }
}

// ?reassign=<roleId> moves the role's members before deleting it.
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await teamApi(req, "manage");
  if (error) return error;
  const { id } = await params;
  const reassign = req.nextUrl.searchParams.get("reassign");
  try {
    return NextResponse.json(await deleteRole(session.user, id, reassign && /^[a-z0-9_-]{2,60}$/.test(reassign) ? reassign : null));
  } catch (err) {
    return teamError(err, "roles.delete");
  }
}
