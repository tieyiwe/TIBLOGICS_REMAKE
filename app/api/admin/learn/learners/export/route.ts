import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { learnersCsv, parseFilters } from "@/lib/learn/admin/learners";

export const dynamic = "force-dynamic";

// CSV of the TIBLOGICS Learn learners list, with the same filters and sort as
// /admin_pro/learn/learners (all pages). Staff only; never cached.
export async function GET(req: NextRequest) {
  const authErr = await requireAdmin();
  if (authErr) return authErr;
  try {
    const { csv } = await learnersCsv(parseFilters(req.nextUrl.searchParams));
    const date = new Date().toISOString().slice(0, 10);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="tiblogics-learners-${date}.csv"`,
        "Cache-Control": "no-store, private",
      },
    });
  } catch (err) {
    console.error("[GET /api/admin/learn/learners/export]", err);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
