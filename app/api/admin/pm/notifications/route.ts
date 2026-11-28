import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requirePermission } from "@/lib/require-admin";
import { currentStaff, jsonBody, writeGuard } from "@/lib/admin/command-center/guard";
import { ensurePmTables } from "@/lib/admin/command-center/db";
import { notificationsFor } from "@/lib/admin/command-center/pm";
import { PERM_COMMAND_CENTER } from "@/lib/admin/command-center/permissions";

export const dynamic = "force-dynamic";

/** My Command Center inbox (assignments, mentions, comments, due dates, budgets). */
export async function GET() {
  const denied = await requirePermission(PERM_COMMAND_CENTER);
  if (denied) return denied;
  const staff = await currentStaff();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const items = await notificationsFor(staff.id, 50);
  return NextResponse.json({
    items: items.map((n) => ({ id: n.id, kind: n.kind, title: n.title, body: n.body, href: n.href, readAt: n.readAt?.toISOString() ?? null, createdAt: n.createdAt.toISOString() })),
  });
}

/** Mark all as read. */
export async function POST(req: NextRequest) {
  const denied = await requirePermission(PERM_COMMAND_CENTER);
  if (denied) return denied;
  const staff = await currentStaff();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const blocked = await writeGuard(req, staff, "notifications", { max: 30 });
  if (blocked) return blocked;
  await jsonBody(req);
  await ensurePmTables();
  const res = await prisma.pmNotification.updateMany({ where: { recipientId: staff.id, readAt: null }, data: { readAt: new Date() } });
  return NextResponse.json({ marked: res.count });
}
