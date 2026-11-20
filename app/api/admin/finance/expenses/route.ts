import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requirePermission } from "@/lib/require-admin";
import { audit } from "@/lib/admin/audit";
import { badRequest, currentStaff, jsonBody, writeGuard, zodMessage } from "@/lib/admin/command-center/guard";
import { ensureFinanceTables } from "@/lib/admin/command-center/db";
import { dayToDate, isDayKey } from "@/lib/admin/command-center/dates";
import { expenseList, expenseRow } from "@/lib/admin/command-center/finance";
import { assertProject, assertReceipt, FinanceInputError, usdFields } from "@/lib/admin/command-center/finance-writes";
import { expenseSchema } from "@/lib/admin/command-center/schemas";
import { PERM_FINANCE } from "@/lib/admin/command-center/permissions";

export const dynamic = "force-dynamic";

/** Expense rows (manual, recurring and automatic estimates) between ?from and ?to. */
export async function GET(req: NextRequest) {
  const denied = await requirePermission(PERM_FINANCE);
  if (denied) return denied;
  const sp = req.nextUrl.searchParams;
  const from = sp.get("from");
  const to = sp.get("to");
  if (!isDayKey(from) || !isDayKey(to)) return badRequest("from and to must be dates");
  return NextResponse.json({ rows: await expenseList({ fromKey: from!, toKey: to!, includeAuto: sp.get("auto") !== "0" }) });
}

export async function POST(req: NextRequest) {
  const denied = await requirePermission(PERM_FINANCE);
  if (denied) return denied;
  const staff = await currentStaff();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const blocked = await writeGuard(req, staff, "finance", { max: 60 });
  if (blocked) return blocked;
  const parsed = expenseSchema.safeParse(await jsonBody(req));
  if (!parsed.success) return badRequest(zodMessage(parsed.error));
  const b = parsed.data;
  try {
    await ensureFinanceTables();
    await assertProject(b.projectId);
    await assertReceipt(b.receiptId);
    const row = await prisma.finExpense.create({
      data: {
        date: dayToDate(b.dateKey),
        vendor: b.vendor,
        category: b.category,
        description: b.description || null,
        projectId: b.projectId || null,
        amountCents: b.amountCents,
        currency: b.currency,
        taxCents: b.taxCents,
        taxLabel: b.taxCents ? b.taxLabel || "Tax" : b.taxLabel || null,
        paymentMethod: b.paymentMethod || null,
        receiptId: b.receiptId || null,
        receiptUrl: b.receiptUrl || null,
        notes: b.notes || null,
        createdById: staff.id,
        ...usdFields(b.amountCents, b.currency, b.fxRate, b.taxCents),
      },
    });
    await audit(staff.session, "finance.expense.create", { type: "finance_expense", id: row.id, label: row.vendor }, {
      amount: row.amountCents / 100, currency: row.currency, usd: row.amountUsdCents / 100, category: row.category,
    });
    return NextResponse.json({ row: expenseRow(row) }, { status: 201 });
  } catch (err) {
    if (err instanceof FinanceInputError) return badRequest(err.message);
    console.error("[finance/expenses] create", err);
    return NextResponse.json({ error: "Could not save the expense" }, { status: 500 });
  }
}
