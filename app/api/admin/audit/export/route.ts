import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { can } from "@/lib/admin/permissions";
import { audit, auditCsv, parseAuditFilters } from "@/lib/admin/audit";

export const dynamic = "force-dynamic";

// CSV of the admin audit log with the page's filters. Owner or admin only.
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions).catch(() => null);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.studentId || !can(session.user, "__admin__")) return NextResponse.json({ error: "Only the owner or an admin can export the audit log." }, { status: 403 });
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
