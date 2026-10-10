import prisma from "@/lib/prisma";
import { ensurePmTables } from "./db";
import { listStaff } from "./pm";
import { hasPermission, PERM_FINANCE } from "./permissions";
import type { Staff } from "./guard";

/** What every Command Center page hands its client shell. */
export async function ccShellData(staff: Staff) {
  await ensurePmTables();
  const [team, projects] = await Promise.all([
    listStaff(),
    prisma.project.findMany({
      where: { archived: false },
      select: { id: true, name: true, color: true },
      orderBy: [{ starred: "desc" }, { updatedAt: "desc" }],
    }),
  ]);
  return {
    staff: team.map((s) => ({ id: s.id, name: s.name })),
    viewerId: staff.id,
    projects,
    canFinance: hasPermission(staff.session.user, PERM_FINANCE),
  };
}
