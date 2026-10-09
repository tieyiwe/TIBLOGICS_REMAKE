import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/require-admin";
import { csvResponse } from "@/lib/analytics/csv";
import { parseFilters } from "@/lib/analytics/filters";
import { scanLogCsvRows, scanLogRows } from "@/lib/analytics/scan-log-admin";

export const dynamic = "force-dynamic";

// CSV of the scan log with the page's filters (at most 5,000 rows). Staff with
// Scanner leads access and the export capability (proxy.ts checks that too).
export async function GET(req: NextRequest) {
  const denied = (await requirePermission("scanner_leads")) ?? (await requirePermission("data.export"));
  if (denied) return denied;
  const f = parseFilters(req.nextUrl.searchParams);
  try {
    const { rows } = await scanLogRows(f, 0, 5000);
    return csvResponse(scanLogCsvRows(rows), `tiblogics-scan-log-${f.from.toISOString().slice(0, 10)}`);
  } catch (err) {
    console.error("[GET /api/admin/scanner-leads/scan-log/export]", err);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
