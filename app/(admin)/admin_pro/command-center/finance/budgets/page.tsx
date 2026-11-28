import prisma from "@/lib/prisma";
import { requireCcPage } from "@/lib/admin/command-center/guard";
import { budgetLines, generateRecurringExpenses, monthlyTotals, raiseBudgetAlerts } from "@/lib/admin/command-center/finance";
import { ensureFinanceTables } from "@/lib/admin/command-center/db";
import { addMonthKey, monthKey } from "@/lib/admin/command-center/money";
import { PERM_FINANCE } from "@/lib/admin/command-center/permissions";
import BudgetsClient from "./BudgetsClient";

export const dynamic = "force-dynamic";

export default async function BudgetsPage() {
  await requireCcPage(PERM_FINANCE);
  await ensureFinanceTables();
  await generateRecurringExpenses();
  const m = monthKey(new Date());
  const [totals, budgets] = await Promise.all([monthlyTotals(addMonthKey(m, -2), m), prisma.finBudget.findMany()]);
  const lines = budgetLines(budgets, totals[totals.length - 1].expensesByCategory);
  await raiseBudgetAlerts(m, lines);
  return <BudgetsClient month={m} lines={lines} history={totals.map((t) => ({ month: t.month, byCat: t.expensesByCategory }))} dayOfMonth={new Date().getUTCDate()} daysInMonth={new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth() + 1, 0)).getUTCDate()} />;
}
