import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { requireCcPage } from "@/lib/admin/command-center/guard";
import { getProjectBundle } from "@/lib/admin/command-center/pm";
import { ccShellData } from "@/lib/admin/command-center/page-data";
import { hasPermission, PERM_COMMAND_CENTER } from "@/lib/admin/command-center/permissions";
import ProjectClient from "./ProjectClient";

export const dynamic = "force-dynamic";

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const staff = await requireCcPage(PERM_COMMAND_CENTER);
  const { id } = await params;
  const shell = await ccShellData(staff);
  const bundle = await getProjectBundle(id, { withFinance: shell.canFinance });
  if (!bundle) notFound();
  // Client link: prospects are offered only to people who can open Prospects.
  const prospects = hasPermission(staff.session.user, "prospects")
    ? await prisma.prospect
        .findMany({ where: { archived: false }, select: { id: true, name: true, business: true }, orderBy: { updatedAt: "desc" }, take: 200 })
        .catch(() => [])
    : null;
  return <ProjectClient shell={shell} initial={bundle} prospects={prospects} />;
}
