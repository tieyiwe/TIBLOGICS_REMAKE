import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requirePermission } from "@/lib/require-admin";
import { audit } from "@/lib/admin/audit";
import { badRequest, currentStaff, jsonBody, writeGuard, zodMessage } from "@/lib/admin/command-center/guard";
import { ensureFinanceTables } from "@/lib/admin/command-center/db";
import { dayToDate } from "@/lib/admin/command-center/dates";
import { generateRecurringExpenses } from "@/lib/admin/command-center/finance";
import { assertProject, FinanceInputError, usdFields } from "@/lib/admin/command-center/finance-writes";
import { recurringSchema } from "@/lib/admin/command-center/schemas";
import { PERM_FINANCE } from "@/lib/admin/command-center/permissions";

export const dynamic = "force-dynamic";

/**
 * New recurring charge (monthly or annual subscription). Its expenses are
 * generated for every period from the start date up to today straight away,
 * then each period as it comes due (on page loads and the "pm" cron job).
 */
export async function POST(req: NextRequest) {
  const denied = await requirePermission(PERM_FINANCE);
  if (denied) return denied;
  const staff = await currentStaff();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const blocked = await writeGuard(req, staff, "finance", { max: 60 });
  if (blocked) return blocked;
  const parsed = recurringSchema.safeParse(await jsonBody(req));
  if (!parsed.success) return badRequest(zodMessage(parsed.error));
  const b = parsed.data;
  try {
    await ensureFinanceTables();
    await assertProject(b.projectId);
    const start = dayToDate(b.startKey);
    const row = await prisma.finRecurring.create({
      data: {
        vendor: b.vendor,
        category: b.category,
        description: b.description || null,
        projectId: b.projectId || null,
        amountCents: b.amountCents,
        currency: b.currency,
        taxCents: b.taxCents,
        taxLabel: b.taxCents ? b.taxLabel || "Tax" : b.taxLabel || null,
        paymentMethod: b.paymentMethod || null,
        interval: b.interval,
        startDate: start,
        nextDate: start,
        active: b.active,
        createdById: staff.id,
        ...usdFields(b.amountCents, b.currency, b.fxRate, b.taxCents),
      },
    });
    const generated = await generateRecurringExpenses();
    await audit(staff.session, "finance.recurring.create", { type: "finance_recurring", id: row.id, label: row.vendor }, {
      amount: row.amountCents / 100, currency: row.currency, interval: row.interval, start: b.startKey, generated,
    });
    return NextResponse.json({ id: row.id, generated }, { status: 201 });
  } catch (err) {
    if (err instanceof FinanceInputError) return badRequest(err.message);
    console.error("[finance/recurring] create", err);
    return NextResponse.json({ error: "Could not save the recurring charge" }, { status: 500 });
  }
}
