import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requirePermission } from "@/lib/require-admin";
import { audit } from "@/lib/admin/audit";
import { badRequest, currentStaff, jsonBody, todayOf, writeGuard, zodMessage } from "@/lib/admin/command-center/guard";
import { ensureFinanceTables } from "@/lib/admin/command-center/db";
import { dayToDate, isDayKey } from "@/lib/admin/command-center/dates";
import { incomeList, incomeRow } from "@/lib/admin/command-center/finance";
import { assertProject, dateOrNull, FinanceInputError, usdFields } from "@/lib/admin/command-center/finance-writes";
import { incomeSchema } from "@/lib/admin/command-center/schemas";
import { PERM_FINANCE } from "@/lib/admin/command-center/permissions";

export const dynamic = "force-dynamic";

/** Income rows (manual + platform) between ?from and ?to. */
export async function GET(req: NextRequest) {
  const denied = await requirePermission(PERM_FINANCE);
  if (denied) return denied;
  const sp = req.nextUrl.searchParams;
  const from = sp.get("from");
  const to = sp.get("to");
  if (!isDayKey(from) || !isDayKey(to)) return badRequest("from and to must be dates");
  return NextResponse.json({ rows: await incomeList({ fromKey: from!, toKey: to!, today: todayOf(req), includePlatform: sp.get("platform") !== "0" }) });
}

/** Manual income: a client invoice or payment. */
export async function POST(req: NextRequest) {
  const denied = await requirePermission(PERM_FINANCE);
  if (denied) return denied;
  const staff = await currentStaff();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const blocked = await writeGuard(req, staff, "finance", { max: 60 });
  if (blocked) return blocked;
  const parsed = incomeSchema.safeParse(await jsonBody(req));
  if (!parsed.success) return badRequest(zodMessage(parsed.error));
  const b = parsed.data;
  try {
    await ensureFinanceTables();
    await assertProject(b.projectId);
    const usd = usdFields(b.amountCents, b.currency, b.fxRate, b.taxCents);
    const row = await prisma.finIncome.create({
      data: {
        date: dayToDate(b.dateKey),
        client: b.client,
        description: b.description || null,
        projectId: b.projectId || null,
        amountCents: b.amountCents,
        currency: b.currency,
        taxCents: b.taxCents,
        taxLabel: b.taxCents ? b.taxLabel || "Tax" : b.taxLabel || null,
        status: b.status,
        invoiceNumber: b.invoiceNumber || null,
        dueDate: dateOrNull(b.dueKey),
        paidAt: b.status === "paid" ? dateOrNull(b.paidKey) ?? dayToDate(b.dateKey) : null,
        notes: b.notes || null,
        createdById: staff.id,
        ...usd,
      },
    });
    await audit(staff.session, "finance.income.create", { type: "finance_income", id: row.id, label: row.client }, {
      amount: row.amountCents / 100, currency: row.currency, usd: row.amountUsdCents / 100, status: row.status,
    });
    return NextResponse.json({ row: incomeRow(row, todayOf(req)) }, { status: 201 });
  } catch (err) {
    if (err instanceof FinanceInputError) return badRequest(err.message);
    console.error("[finance/income] create", err);
    return NextResponse.json({ error: "Could not save the income" }, { status: 500 });
  }
}
