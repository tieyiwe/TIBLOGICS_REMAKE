import prisma from "@/lib/prisma";
import { requireCcPage } from "@/lib/admin/command-center/guard";
import { getFinanceSettings, incomeList } from "@/lib/admin/command-center/finance";
import { PERM_FINANCE } from "@/lib/admin/command-center/permissions";
import { resolveRange } from "../_components/range";
import IncomeClient from "./IncomeClient";

export const dynamic = "force-dynamic";

export default async function IncomePage({ searchParams }: { searchParams: Promise<{ from?: string; to?: string; range?: string }> }) {
  await requireCcPage(PERM_FINANCE);
  const today = new Date().toISOString().slice(0, 10);
  const range = resolveRange(await searchParams, today);
  const [rows, projects, settings] = await Promise.all([
    incomeList({ fromKey: range.from, toKey: range.to, today, includePlatform: true }),
    prisma.project.findMany({ where: { archived: false }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    getFinanceSettings(),
  ]);
  return <IncomeClient rows={rows} range={range} projects={projects} fx={settings.fx} />;
}
