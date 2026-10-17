import { NextRequest, NextResponse } from "next/server";
import { teamApi, teamError, readJson } from "@/lib/admin/team/guard";
import { inviteMembers, listMembers, rolesWithUsage } from "@/lib/admin/team/service";

export const dynamic = "force-dynamic";

// Team members (GET, Team & Roles view) and invitations (POST, team:manage).
export async function GET(req: NextRequest) {
  const { session, error } = await teamApi(req, "view");
  if (error) return error;
  try {
    const [members, roles] = await Promise.all([listMembers(session.user), rolesWithUsage()]);
    return NextResponse.json({ members, roles }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    return teamError(err, "members.list");
  }
}

export async function POST(req: NextRequest) {
  const { session, error } = await teamApi(req, "manage");
  if (error) return error;
  try {
    const results = await inviteMembers(session.user, await readJson(req));
    const ok = results.some((r) => r.ok);
    return NextResponse.json({ results }, { status: ok ? 201 : 409 });
  } catch (err) {
    return teamError(err, "members.invite");
  }
}
