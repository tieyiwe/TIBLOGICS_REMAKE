import { NextRequest, NextResponse } from "next/server";
import { teamApi, teamError } from "@/lib/admin/team/guard";
import { forceSignOut } from "@/lib/admin/team/service";

export const dynamic = "force-dynamic";

// Signs a member out everywhere: their session version moves on, so every
// open session is refused on its next request.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await teamApi(req, "manage");
  if (error) return error;
  const { id } = await params;
  try {
    await forceSignOut(session.user, id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return teamError(err, "members.signout");
  }
}
