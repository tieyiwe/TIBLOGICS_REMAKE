import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requirePermission } from "@/lib/require-admin";
import { badRequest, currentStaff, jsonBody, writeGuard, zodMessage } from "@/lib/admin/command-center/guard";
import { ensurePmTables } from "@/lib/admin/command-center/db";
import { PERM_COMMAND_CENTER } from "@/lib/admin/command-center/permissions";

export const dynamic = "force-dynamic";

const schema = z.object({ emailDigest: z.boolean() }).strict();

/** My Command Center preferences: the daily email digest (on unless turned off). */
export async function GET() {
  const denied = await requirePermission(PERM_COMMAND_CENTER);
  if (denied) return denied;
  const staff = await currentStaff();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await ensurePmTables();
  const p = await prisma.pmPrefs.findUnique({ where: { staffId: staff.id } });
  return NextResponse.json({ emailDigest: p?.emailDigest ?? true });
}

export async function PATCH(req: NextRequest) {
  const denied = await requirePermission(PERM_COMMAND_CENTER);
  if (denied) return denied;
  const staff = await currentStaff();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const blocked = await writeGuard(req, staff, "prefs", { max: 20 });
  if (blocked) return blocked;
  const parsed = schema.safeParse(await jsonBody(req));
  if (!parsed.success) return badRequest(zodMessage(parsed.error));
  await ensurePmTables();
  const p = await prisma.pmPrefs.upsert({
    where: { staffId: staff.id },
    create: { staffId: staff.id, emailDigest: parsed.data.emailDigest },
    update: { emailDigest: parsed.data.emailDigest, updatedAt: new Date() },
  });
  return NextResponse.json({ emailDigest: p.emailDigest });
}
