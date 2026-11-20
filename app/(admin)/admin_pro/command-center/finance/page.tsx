import { requireCcPage } from "@/lib/admin/command-center/guard";
import { getDashboard } from "@/lib/admin/command-center/finance";
import { isMonthKey, monthKey } from "@/lib/admin/command-center/money";
import { PERM_FINANCE } from "@/lib/admin/command-center/permissions";
import FinanceDashboard from "./FinanceDashboard";

export const dynamic = "force-dynamic";

/** Finance dashboard: this month against last, cash flow, sources, categories, alerts. */
export default async function FinancePage({ searchParams }: { searchParams: Promise<{ m?: string }> }) {
  await requireCcPage(PERM_FINANCE);
  const sp = await searchParams;
  const now = monthKey(new Date());
  const month = isMonthKey(sp.m) && sp.m! <= now ? sp.m! : now;
  const data = await getDashboard(month, new Date().toISOString().slice(0, 10));
  return <FinanceDashboard data={JSON.parse(JSON.stringify(data))} currentMonth={now} />;
}
