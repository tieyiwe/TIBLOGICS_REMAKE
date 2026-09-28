import prisma from "@/lib/prisma";
import { requireAdminPage } from "../_lib/admin-page-auth";
import { COMP_STATUS } from "@/lib/admin/test-access";
import { ensureToolkitTables } from "@/lib/toolkit/db";
import { ensureMonitorTables } from "@/lib/monitor/db";
import TestAccessClient from "./TestAccessClient";

// Free access to every paid tool, so the owner can test them without paying.
export const dynamic = "force-dynamic";

export default async function TestAccessPage() {
  const session = await requireAdminPage();
  await Promise.all([ensureToolkitTables(), ensureMonitorTables()]);

  const [comps, monitors] = await Promise.all([
    prisma.toolkitSubscription.findMany({ where: { status: COMP_STATUS }, orderBy: { updatedAt: "desc" } }),
    prisma.monitorSubscription.findMany({
      where: { status: "active", stripeSubscriptionId: null },
      orderBy: { createdAt: "desc" },
      select: { id: true, email: true, siteUrl: true, createdAt: true },
    }),
  ]);
  const students = await prisma.student.findMany({
    where: { id: { in: comps.map((c) => c.studentId) } },
    select: { id: true, email: true },
  });
  const emailOf = new Map(students.map((s) => [s.id, s.email]));

  return (
    <TestAccessClient
      canGrant={!!(session.user.isOwner || session.user.isAdmin)}
      toolkit={comps.map((c) => ({ email: emailOf.get(c.studentId) ?? "(deleted account)", plan: c.plan }))}
      monitors={monitors.map((m) => ({ id: m.id, email: m.email, siteUrl: m.siteUrl, createdAt: m.createdAt.toISOString() }))}
    />
  );
}
