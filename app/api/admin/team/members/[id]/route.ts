import { NextRequest, NextResponse } from "next/server";
import { teamApi, teamError, readJson } from "@/lib/admin/team/guard";
import { deleteMember, updateMember } from "@/lib/admin/team/service";

export const dynamic = "force-dynamic";

// Change one member (name, role, overrides, active) or remove them.
// The owner row ("owner") is refused by the service whatever is sent.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await teamApi(req, "manage");
  if (error) return error;
  const { id } = await params;
  try {
    return NextResponse.json(await updateMember(session.user, id, await readJson(req)));
  } catch (err) {
    return teamError(err, "members.update");
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await teamApi(req, "manage");
  if (error) return error;
  const { id } = await params;
  try {
    await deleteMember(session.user, id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return teamError(err, "members.delete");
  }
}
