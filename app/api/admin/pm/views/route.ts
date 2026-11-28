import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { requirePermission } from "@/lib/require-admin";
import { badRequest, currentStaff, jsonBody, writeGuard, zodMessage } from "@/lib/admin/command-center/guard";
import { ensurePmTables } from "@/lib/admin/command-center/db";
import { savedViewSchema } from "@/lib/admin/command-center/schemas";
import { PERM_COMMAND_CENTER } from "@/lib/admin/command-center/permissions";

export const dynamic = "force-dynamic";

/** Saved portfolio views (filters), per person. */
export async function GET() {
  const denied = await requirePermission(PERM_COMMAND_CENTER);
  if (denied) return denied;
  const staff = await currentStaff();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await ensurePmTables();
  const views = await prisma.pmSavedView.findMany({ where: { ownerId: staff.id }, orderBy: { createdAt: "asc" } });
  return NextResponse.json({ views: views.map((v) => ({ id: v.id, name: v.name, filters: v.filters })) });
}

export async function POST(req: NextRequest) {
  const denied = await requirePermission(PERM_COMMAND_CENTER);
  if (denied) return denied;
  const staff = await currentStaff();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const blocked = await writeGuard(req, staff, "views", { max: 20 });
  if (blocked) return blocked;
  const parsed = savedViewSchema.safeParse(await jsonBody(req));
  if (!parsed.success) return badRequest(zodMessage(parsed.error));
  await ensurePmTables();
  if ((await prisma.pmSavedView.count({ where: { ownerId: staff.id } })) >= 20) return badRequest("You can keep up to 20 saved views");
  const v = await prisma.pmSavedView.create({
    data: { ownerId: staff.id, name: parsed.data.name, filters: parsed.data.filters as Prisma.InputJsonValue },
  });
  return NextResponse.json({ view: { id: v.id, name: v.name, filters: v.filters } }, { status: 201 });
}
