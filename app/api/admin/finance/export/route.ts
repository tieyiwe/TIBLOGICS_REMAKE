import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/require-admin";
import { audit } from "@/lib/admin/audit";
import { badRequest, currentStaff, readLimit, todayOf } from "@/lib/admin/command-center/guard";
import { isDayKey } from "@/lib/admin/command-center/dates";
import { expenseCsv, incomeCsv, pnlCsv } from "@/lib/admin/command-center/finance";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * CSV for the accountant.
 *   ?kind=income&from=YYYY-MM-DD&to=YYYY-MM-DD
 *   ?kind=expenses&from=...&to=...
 *   ?kind=pnl&year=2026
 */
export async function GET(req: NextRequest) {
  const denied = await requirePermission("finance");
  if (denied) return denied;
  const staff = await currentStaff();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const limited = await readLimit(staff, "finance-export", 20);
  if (limited) return limited;
  const sp = req.nextUrl.searchParams;
  const kind = sp.get("kind");
  let body: string;
  let name: string;
  if (kind === "pnl") {
    const year = Number(sp.get("year"));
    if (!Number.isInteger(year) || year < 2015 || year > 2100) return badRequest("year must be a 4-digit year");
    body = await pnlCsv(year);
    name = `tiblogics-pnl-${year}.csv`;
  } else if (kind === "income" || kind === "expenses") {
    const from = sp.get("from");
    const to = sp.get("to");
    if (!isDayKey(from) || !isDayKey(to) || to! < from!) return badRequest("from and to must be dates");
    if (Date.parse(to!) - Date.parse(from!) > 3 * 366 * 86_400_000) return badRequest("Export at most three years at a time");
    body = kind === "income" ? await incomeCsv(from!, to!, todayOf(req)) : await expenseCsv(from!, to!);
    name = `tiblogics-${kind}-${from}-to-${to}.csv`;
  } else {
    return badRequest("kind must be income, expenses or pnl");
  }
  await audit(staff.session, "finance.export", { type: "finance_export", label: name }, { kind });
  return new NextResponse("﻿" + body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${name}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
