import { requireCcPage } from "@/lib/admin/command-center/guard";
import { getFinanceSettings, profitAndLoss, taxSummary } from "@/lib/admin/command-center/finance";
import { PERM_FINANCE } from "@/lib/admin/command-center/permissions";
import ReportsClient from "./ReportsClient";

export const dynamic = "force-dynamic";

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ year?: string }> }) {
  await requireCcPage(PERM_FINANCE);
  const thisYear = new Date().getUTCFullYear();
  const y = Number((await searchParams).year);
  const year = Number.isInteger(y) && y >= 2015 && y <= thisYear ? y : thisYear;
  const [pnl, taxes, settings] = await Promise.all([profitAndLoss(year), taxSummary(year), getFinanceSettings()]);
  return <ReportsClient year={year} thisYear={thisYear} pnl={pnl} taxes={taxes} settings={settings} />;
}
