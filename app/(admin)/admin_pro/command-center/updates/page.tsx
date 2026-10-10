import { requireCcPage } from "@/lib/admin/command-center/guard";
import { getPortfolio, updatesDigest } from "@/lib/admin/command-center/pm";
import { ccShellData } from "@/lib/admin/command-center/page-data";
import { PERM_COMMAND_CENTER } from "@/lib/admin/command-center/permissions";
import UpdatesClient from "./UpdatesClient";

export const dynamic = "force-dynamic";

/** Portfolio digest of weekly status updates, and the projects that are quiet. */
export default async function UpdatesPage() {
  const staff = await requireCcPage(PERM_COMMAND_CENTER);
  const today = new Date().toISOString().slice(0, 10);
  const [shell, updates, portfolio] = await Promise.all([ccShellData(staff), updatesDigest(8), getPortfolio({ withFinance: false, today })]);
  const quiet = portfolio
    .filter((p) => p.status === "ACTIVE" && p.signals.some((s) => s.kind === "stale"))
    .map((p) => ({ id: p.id, name: p.name, color: p.color, lastUpdateAt: p.lastUpdateAt, text: p.signals.find((s) => s.kind === "stale")!.text }));
  return <UpdatesClient shell={shell} updates={updates} quiet={quiet} />;
}
