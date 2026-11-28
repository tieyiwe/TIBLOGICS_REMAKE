import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { requirePermission } from "@/lib/require-admin";
import { audit } from "@/lib/admin/audit";
import { badRequest, currentStaff, deleteGuard, jsonBody, todayOf, writeGuard, zodMessage } from "@/lib/admin/command-center/guard";
import { ensureFinanceTables } from "@/lib/admin/command-center/db";
import { dayToDate, keyOf } from "@/lib/admin/command-center/dates";
import { incomeRow } from "@/lib/admin/command-center/finance";
import { assertProject, dateOrNull, FinanceInputError, MONEY_KEYS, usdFields } from "@/lib/admin/command-center/finance-writes";
import { incomePatchSchema } from "@/lib/admin/command-center/schemas";
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
  const parsed = incomePatchSchema.safeParse(await jsonBody(req));
  if (!parsed.success) return badRequest(zodMessage(parsed.error));
  const { id } = await params;
  const b = parsed.data;
  try {
    await ensureFinanceTables();
    const before = await prisma.finIncome.findUnique({ where: { id } });
    if (!before) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (b.projectId !== undefined) await assertProject(b.projectId);
    const data: Prisma.FinIncomeUpdateInput = { updatedAt: new Date() };
    if (b.dateKey) data.date = dayToDate(b.dateKey);
    if (b.client !== undefined) data.client = b.client;
    if (b.description !== undefined) data.description = b.description || null;
    if (b.projectId !== undefined) data.projectId = b.projectId || null;
    if (b.invoiceNumber !== undefined) data.invoiceNumber = b.invoiceNumber || null;
    if (b.dueKey !== undefined) data.dueDate = dateOrNull(b.dueKey);
    if (b.notes !== undefined) data.notes = b.notes || null;
    if (b.taxLabel !== undefined) data.taxLabel = b.taxLabel || null;
    if (b.status !== undefined) {
      data.status = b.status;
      if (b.status === "paid") data.paidAt = dateOrNull(b.paidKey) ?? before.paidAt ?? new Date(`${todayOf(req)}T12:00:00.000Z`);
      else data.paidAt = null;
    } else if (b.paidKey !== undefined && before.status === "paid") {
      data.paidAt = dateOrNull(b.paidKey);
    }
    if (MONEY_KEYS.some((k) => b[k] !== undefined)) {
      const amountCents = b.amountCents ?? before.amountCents;
      const currency = b.currency ?? before.currency;
      const fx = b.fxRate ?? before.fxRate;
      const tax = b.taxCents ?? before.taxCents;
      Object.assign(data, { amountCents, currency, taxCents: tax, ...usdFields(amountCents, currency, fx, tax) });
    }
    const row = await prisma.finIncome.update({ where: { id }, data });
    const changed = Object.keys(b);
    await audit(staff.session, "finance.income.update", { type: "finance_income", id, label: row.client }, {
      fields: changed,
      before: { usd: before.amountUsdCents / 100, status: before.status, date: keyOf(before.date) },
      after: { usd: row.amountUsdCents / 100, status: row.status, date: keyOf(row.date) },
    });
    return NextResponse.json({ row: incomeRow(row, todayOf(req)) });
  } catch (err) {
    if (err instanceof FinanceInputError) return badRequest(err.message);
    console.error("[finance/income] update", err);
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
  const row = await prisma.finIncome.findUnique({ where: { id } });
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.finIncome.delete({ where: { id } });
  await audit(staff.session, "finance.income.delete", { type: "finance_income", id, label: row.client }, {
    amount: row.amountCents / 100, currency: row.currency, usd: row.amountUsdCents / 100, date: keyOf(row.date), status: row.status,
  });
  return NextResponse.json({ success: true });
}
