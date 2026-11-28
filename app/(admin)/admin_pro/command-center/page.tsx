import { requireCcPage } from "@/lib/admin/command-center/guard";
import { getPortfolio } from "@/lib/admin/command-center/pm";
import { ccShellData } from "@/lib/admin/command-center/page-data";
import { PERM_COMMAND_CENTER } from "@/lib/admin/command-center/permissions";
import { PROJECT_TEMPLATES } from "@/lib/admin/command-center/templates";
import PortfolioClient from "./PortfolioClient";

// Per-request and session-scoped: never cached or prerendered.
export const dynamic = "force-dynamic";

/** Command Center home: the project portfolio. */
export default async function CommandCenterPage() {
  const staff = await requireCcPage(PERM_COMMAND_CENTER);
  const shell = await ccShellData(staff);
  const projects = await getPortfolio({ includeArchived: true, withFinance: shell.canFinance, today: new Date().toISOString().slice(0, 10) });
  return (
    <PortfolioClient
      shell={shell}
      initialProjects={projects}
      templates={PROJECT_TEMPLATES.map((t) => ({ key: t.key, name: t.name, description: t.description, category: t.category, color: t.color, tasks: t.tasks.length, milestones: t.milestones.length, days: t.days }))}
    />
  );
}
