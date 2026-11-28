import { NextRequest, NextResponse } from "next/server";
import { getServerSession, type Session } from "next-auth";
import { authOptions } from "@/lib/auth";
import { analyticsCsv, canViewAnalytics, CSV_TABLES, getAnalytics, parseRange, type CsvTable } from "@/lib/admin/analytics";

export const dynamic = "force-dynamic";

// CSV of one table from /admin_pro/analytics: ?table=<name>&range=7|30|90.
// Same audience as the page (owner, admins, "*" collaborators); never cached.
export async function GET(req: NextRequest) {
  let session: Session | null = null;
  try {
    session = await getServerSession(authOptions);
  } catch (err) {
    console.error("[GET /api/admin/analytics/export] session", err);
  }
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canViewAnalytics(session.user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const table = req.nextUrl.searchParams.get("table") as CsvTable;
  if (!CSV_TABLES.includes(table)) return NextResponse.json({ error: "Unknown table" }, { status: 400 });
  const range = parseRange(req.nextUrl.searchParams.get("range"));

  try {
    const csv = analyticsCsv(await getAnalytics(range), table);
    const date = new Date().toISOString().slice(0, 10);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="tiblogics-${table}-${range}d-${date}.csv"`,
        "Cache-Control": "no-store, private",
      },
    });
  } catch (err) {
    console.error("[GET /api/admin/analytics/export]", err);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
