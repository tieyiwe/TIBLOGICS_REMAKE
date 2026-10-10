import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requirePermission } from "@/lib/require-admin";
import { audit } from "@/lib/admin/audit";
import { badRequest, currentStaff, jsonBody, writeGuard, zodMessage } from "@/lib/admin/command-center/guard";
import { ensureFinanceTables } from "@/lib/admin/command-center/db";
import { budgetLines, monthlyTotals, raiseBudgetAlerts } from "@/lib/admin/command-center/finance";
import { monthKey } from "@/lib/admin/command-center/money";
import { budgetsSchema } from "@/lib/admin/command-center/schemas";
import { PERM_FINANCE } from "@/lib/admin/command-center/permissions";

export const dynamic = "force-dynamic";

/** Set monthly budgets per category (0 removes one). Alerts are checked right away. */
export async function PUT(req: NextRequest) {
  const denied = await requirePermission(PERM_FINANCE);
  if (denied) return denied;
  const staff = await currentStaff();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const blocked = await writeGuard(req, staff, "finance", { max: 30 });
  if (blocked) return blocked;
  const parsed = budgetsSchema.safeParse(await jsonBody(req));
  if (!parsed.success) return badRequest(zodMessage(parsed.error));
  await ensureFinanceTables();
  for (const b of parsed.data.budgets) {
    if (b.monthlyUsdCents === 0) await prisma.finBudget.deleteMany({ where: { category: b.category } });
    else {
      await prisma.finBudget.upsert({
        where: { category: b.category },
        create: { category: b.category, monthlyUsdCents: b.monthlyUsdCents },
        update: { monthlyUsdCents: b.monthlyUsdCents, updatedAt: new Date() },
      });
    }
  }
  await audit(staff.session, "finance.budget.update", { type: "finance_budget" }, {
    budgets: parsed.data.budgets.map((b) => ({ category: b.category, usd: b.monthlyUsdCents / 100 })),
  });
  const m = monthKey(new Date());
  const [totals] = await monthlyTotals(m, m);
  const lines = budgetLines(await prisma.finBudget.findMany(), totals.expensesByCategory);
  await raiseBudgetAlerts(m, lines);
  return NextResponse.json({ budgets: lines });
}
