import { NextRequest, NextResponse } from "next/server";
import { learnerStaff } from "@/lib/learn/account-status/admin-auth";
import { audit, auditCsv, parseAuditFilters } from "@/lib/admin/audit";

export const dynamic = "force-dynamic";

// CSV of the admin audit log with the page's filters. Owner or admin only.
export async function GET(req: NextRequest) {
  const { session, error } = await learnerStaff("manage");
  if (error) return error;
  const f = parseAuditFilters(req.nextUrl.searchParams);
  const csv = await auditCsv(f);
  await audit(session, "audit.export", { type: "audit" }, { filters: { ...f, page: undefined } });
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="tiblogics-audit-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store, private",
    },
  });
}
