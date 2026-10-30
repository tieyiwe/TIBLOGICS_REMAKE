import { NextRequest, NextResponse } from "next/server";
import { teamApi, teamError, readJson } from "@/lib/admin/team/guard";
import { createRole, rolesWithUsage } from "@/lib/admin/team/service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { error } = await teamApi(req, "view");
  if (error) return error;
  try {
    return NextResponse.json({ roles: await rolesWithUsage() }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    return teamError(err, "roles.list");
  }
}

export async function POST(req: NextRequest) {
  const { session, error } = await teamApi(req, "manage");
  if (error) return error;
  try {
    return NextResponse.json(await createRole(session.user, await readJson(req)), { status: 201 });
  } catch (err) {
    return teamError(err, "roles.create");
  }
}
