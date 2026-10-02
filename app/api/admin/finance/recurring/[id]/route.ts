import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { requirePermission } from "@/lib/require-admin";
import { audit } from "@/lib/admin/audit";
import { badRequest, currentStaff, deleteGuard, jsonBody, writeGuard, zodMessage } from "@/lib/admin/command-center/guard";
import { ensureFinanceTables } from "@/lib/admin/command-center/db";
import { dayToDate, keyOf } from "@/lib/admin/command-center/dates";
import { generateRecurringExpenses } from "@/lib/admin/command-center/finance";
import { assertProject, FinanceInputError, MONEY_KEYS, usdFields } from "@/lib/admin/command-center/finance-writes";
import { recurringPatchSchema } from "@/lib/admin/command-center/schemas";
import { PERM_FINANCE } from "@/lib/admin/command-center/permissions";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

/**
 * Edit a recurring charge. Changes apply to periods not generated yet;
 * expenses already in the books keep their amounts (edit those directly).
 */
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const denied = await requirePermission(PERM_FINANCE);
  if (denied) return denied;
  const staff = await currentStaff();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const blocked = await writeGuard(req, staff, "finance", { max: 60 });
  if (blocked) return blocked;
  const parsed = recurringPatchSchema.safeParse(await jsonBody(req));
  if (!parsed.success) return badRequest(zodMessage(parsed.error));
  const { id } = await params;
  const b = parsed.data;
  try {
    await ensureFinanceTables();
    const before = await prisma.finRecurring.findUnique({ where: { id } });
    if (!before) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (b.projectId !== undefined) await assertProject(b.projectId);
    const data: Prisma.FinRecurringUncheckedUpdateInput = { updatedAt: new Date() };
    for (const k of ["vendor", "category", "interval", "active"] as const) if (b[k] !== undefined) (data as Record<string, unknown>)[k] = b[k];
    if (b.description !== undefined) data.description = b.description || null;
    if (b.projectId !== undefined) data.projectId = b.projectId || null;
    if (b.paymentMethod !== undefined) data.paymentMethod = b.paymentMethod || null;
    if (b.taxLabel !== undefined) data.taxLabel = b.taxLabel || null;
    if (b.startKey && b.startKey !== keyOf(before.startDate)) {
      // A new start date restarts the schedule from there (periods already
      // generated are kept and not generated twice).
      data.startDate = dayToDate(b.startKey);
      data.nextDate = dayToDate(b.startKey);
    }
    if (MONEY_KEYS.some((k) => b[k] !== undefined)) {
      const amountCents = b.amountCents ?? before.amountCents;
      const currency = b.currency ?? before.currency;
      const fx = b.fxRate ?? before.fxRate;
      const tax = b.taxCents ?? before.taxCents;
      Object.assign(data, { amountCents, currency, taxCents: tax, ...usdFields(amountCents, currency, fx, tax) });
    }
    const row = await prisma.finRecurring.update({ where: { id }, data });
    const generated = row.active ? await generateRecurringExpenses() : 0;
    await audit(staff.session, "finance.recurring.update", { type: "finance_recurring", id, label: row.vendor }, { fields: Object.keys(b), generated });
    return NextResponse.json({ success: true, generated });
  } catch (err) {
    if (err instanceof FinanceInputError) return badRequest(err.message);
    console.error("[finance/recurring] update", err);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

/** Stops the charge. Expenses it already generated stay in the books. */
export async function DELETE(req: NextRequest, { params }: Ctx) {
  const denied = await requirePermission(PERM_FINANCE);
  if (denied) return denied;
  const staff = await currentStaff();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const blocked = await deleteGuard(req, staff, "finance");
  if (blocked) return blocked;
  const { id } = await params;
  await ensureFinanceTables();
  const row = await prisma.finRecurring.findUnique({ where: { id } });
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.finRecurring.delete({ where: { id } });
  await audit(staff.session, "finance.recurring.delete", { type: "finance_recurring", id, label: row.vendor }, {
    amount: row.amountCents / 100, currency: row.currency, interval: row.interval,
  });
  return NextResponse.json({ success: true });
}
