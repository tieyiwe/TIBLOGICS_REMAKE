import prisma from "@/lib/prisma";
import { requireCcPage } from "@/lib/admin/command-center/guard";
import { expenseList, getFinanceSettings } from "@/lib/admin/command-center/finance";
import { keyOf } from "@/lib/admin/command-center/dates";
import { PERM_FINANCE } from "@/lib/admin/command-center/permissions";
import { resolveRange } from "../_components/range";
import ExpensesClient from "./ExpensesClient";

export const dynamic = "force-dynamic";

export default async function ExpensesPage({ searchParams }: { searchParams: Promise<{ from?: string; to?: string; range?: string }> }) {
  await requireCcPage(PERM_FINANCE);
  const today = new Date().toISOString().slice(0, 10);
  const range = resolveRange(await searchParams, today);
  // expenseList generates any recurring periods that came due first.
  const rows = await expenseList({ fromKey: range.from, toKey: range.to, includeAuto: true });
  const [projects, settings, recurring] = await Promise.all([
    prisma.project.findMany({ where: { archived: false }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    getFinanceSettings(),
    prisma.finRecurring.findMany({ orderBy: [{ active: "desc" }, { nextDate: "asc" }] }),
  ]);
  return (
    <ExpensesClient
      rows={rows}
      range={range}
      projects={projects}
      fx={settings.fx}
      recurring={recurring.map((r) => ({
        id: r.id, vendor: r.vendor, category: r.category, description: r.description, projectId: r.projectId, amountCents: r.amountCents,
        currency: r.currency, fxRate: r.fxRate, amountUsdCents: r.amountUsdCents, taxCents: r.taxCents, taxLabel: r.taxLabel,
        paymentMethod: r.paymentMethod, interval: r.interval, startKey: keyOf(r.startDate)!, nextKey: keyOf(r.nextDate)!, active: r.active,
      }))}
    />
  );
}
