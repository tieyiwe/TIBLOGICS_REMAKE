import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { requirePermission } from "@/lib/require-admin";
import { audit } from "@/lib/admin/audit";
import { badRequest, currentStaff, deleteGuard, jsonBody, writeGuard, zodMessage } from "@/lib/admin/command-center/guard";
import { ensureFinanceTables } from "@/lib/admin/command-center/db";
import { dayToDate, keyOf } from "@/lib/admin/command-center/dates";
import { expenseRow } from "@/lib/admin/command-center/finance";
import { assertProject, assertReceipt, FinanceInputError, MONEY_KEYS, usdFields } from "@/lib/admin/command-center/finance-writes";
import { expensePatchSchema } from "@/lib/admin/command-center/schemas";
import { PERM_FINANCE } from "@/lib/admin/command-center/permissions";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const denied = await requirePermission(PERM_FINANCE);
  if (denied) return denied;
  const staff = await currentStaff();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const blocked = await writeGuard(req, staff, "finance", { max: 60 });
  if (blocked) return blocked;
  const parsed = expensePatchSchema.safeParse(await jsonBody(req));
  if (!parsed.success) return badRequest(zodMessage(parsed.error));
  const { id } = await params;
  const b = parsed.data;
  try {
    await ensureFinanceTables();
    const before = await prisma.finExpense.findUnique({ where: { id } });
    if (!before) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (b.projectId !== undefined) await assertProject(b.projectId);
    if (b.receiptId !== undefined) await assertReceipt(b.receiptId);
    const data: Prisma.FinExpenseUncheckedUpdateInput = { updatedAt: new Date() };
    if (b.dateKey) data.date = dayToDate(b.dateKey);
    if (b.vendor !== undefined) data.vendor = b.vendor;
    if (b.category !== undefined) data.category = b.category;
    if (b.description !== undefined) data.description = b.description || null;
    if (b.projectId !== undefined) data.projectId = b.projectId || null;
    if (b.paymentMethod !== undefined) data.paymentMethod = b.paymentMethod || null;
    if (b.receiptId !== undefined) data.receiptId = b.receiptId || null;
    if (b.receiptUrl !== undefined) data.receiptUrl = b.receiptUrl || null;
    if (b.notes !== undefined) data.notes = b.notes || null;
    if (b.taxLabel !== undefined) data.taxLabel = b.taxLabel || null;
    if (MONEY_KEYS.some((k) => b[k] !== undefined)) {
      const amountCents = b.amountCents ?? before.amountCents;
      const currency = b.currency ?? before.currency;
      const fx = b.fxRate ?? before.fxRate;
      const tax = b.taxCents ?? before.taxCents;
      Object.assign(data, { amountCents, currency, taxCents: tax, ...usdFields(amountCents, currency, fx, tax) });
    }
    const row = await prisma.finExpense.update({ where: { id }, data });
    await audit(staff.session, "finance.expense.update", { type: "finance_expense", id, label: row.vendor }, {
      fields: Object.keys(b),
      before: { usd: before.amountUsdCents / 100, category: before.category, date: keyOf(before.date) },
      after: { usd: row.amountUsdCents / 100, category: row.category, date: keyOf(row.date) },
    });
    return NextResponse.json({ row: expenseRow(row) });
  } catch (err) {
    if (err instanceof FinanceInputError) return badRequest(err.message);
    console.error("[finance/expenses] update", err);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const denied = await requirePermission(PERM_FINANCE);
  if (denied) return denied;
  const staff = await currentStaff();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const blocked = await deleteGuard(req, staff, "finance");
  if (blocked) return blocked;
  const { id } = await params;
  await ensureFinanceTables();
  const row = await prisma.finExpense.findUnique({ where: { id } });
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  // A generated period stays deleted: generation only fills periods from the
  // charge's next date onwards, which has already moved past this one.
  await prisma.finExpense.delete({ where: { id } });
  if (row.receiptId && !(await prisma.finExpense.count({ where: { receiptId: row.receiptId } }))) {
    await prisma.finReceipt.delete({ where: { id: row.receiptId } }).catch(() => undefined);
  }
  await audit(staff.session, "finance.expense.delete", { type: "finance_expense", id, label: row.vendor }, {
    amount: row.amountCents / 100, currency: row.currency, usd: row.amountUsdCents / 100, category: row.category, date: keyOf(row.date),
  });
  return NextResponse.json({ success: true });
}
