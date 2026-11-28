import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/require-admin";
import { badRequest, currentStaff, jsonBody, todayOf, writeGuard, zodMessage } from "@/lib/admin/command-center/guard";
import { createProject, getPortfolio, listStaff, projectDTO } from "@/lib/admin/command-center/pm";
import { projectCreateSchema } from "@/lib/admin/command-center/schemas";
import { hasPermission, PERM_COMMAND_CENTER, PERM_FINANCE } from "@/lib/admin/command-center/permissions";

export const dynamic = "force-dynamic";

/** Portfolio: every project with task, milestone and health rollups. */
export async function GET(req: NextRequest) {
  const denied = await requirePermission(PERM_COMMAND_CENTER);
  if (denied) return denied;
  const staff = await currentStaff();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const projects = await getPortfolio({
      includeArchived: req.nextUrl.searchParams.get("archived") === "1",
      withFinance: hasPermission(staff.session.user, PERM_FINANCE),
      today: todayOf(req),
    });
    return NextResponse.json({ projects });
  } catch (err) {
    console.error("[pm/projects] list", err);
    return NextResponse.json({ error: "Could not load projects" }, { status: 500 });
  }
}

/** New project, optionally from a template (tasks, subtasks and milestones). */
export async function POST(req: NextRequest) {
  const denied = await requirePermission(PERM_COMMAND_CENTER);
  if (denied) return denied;
  const staff = await currentStaff();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const blocked = await writeGuard(req, staff, "projects", { max: 30 });
  if (blocked) return blocked;
  const parsed = projectCreateSchema.safeParse(await jsonBody(req));
  if (!parsed.success) return badRequest(zodMessage(parsed.error));
  try {
    if (parsed.data.ownerId) {
      const team = await listStaff();
      if (!team.some((s) => s.id === parsed.data.ownerId)) return badRequest("Owner must be a staff member with Command Center access");
    }
    const project = await createProject(parsed.data, staff, todayOf(req));
    return NextResponse.json({ project: projectDTO(project) }, { status: 201 });
  } catch (err) {
    console.error("[pm/projects] create", err);
    return NextResponse.json({ error: "Could not create the project" }, { status: 500 });
  }
}
