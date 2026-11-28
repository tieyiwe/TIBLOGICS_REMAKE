import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/require-admin";
import { csvResponse } from "@/lib/analytics/csv";
import { param, parseFilters } from "@/lib/analytics/filters";
import { USAGE_TABLES, usageCsvRows, type UsageTable } from "@/lib/analytics/usage";

export const dynamic = "force-dynamic";

// CSV of one Feature usage table (/admin_pro/analytics/usage), with the same
// URL filters: ?table=pages|buttons|label|features|devices|countries.
// Visitor analytics permission plus the export capability (proxy.ts checks
// that too for every /export path).
export async function GET(req: NextRequest) {
  const denied = (await requirePermission("analytics")) ?? (await requirePermission("data.export"));
  if (denied) return denied;
  const sp = req.nextUrl.searchParams;
  const table = sp.get("table") as UsageTable;
  if (!USAGE_TABLES.includes(table)) return NextResponse.json({ error: "Unknown table" }, { status: 400 });
  const f = parseFilters(sp);
  try {
    const rows = await usageCsvRows(table, f, param(sp, "label")?.slice(0, 120));
    return csvResponse(rows, `tiblogics-usage-${table}-${f.from.toISOString().slice(0, 10)}`);
  } catch (err) {
    console.error("[GET /api/admin/analytics/usage/export]", err);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
