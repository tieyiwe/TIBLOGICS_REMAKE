import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/require-admin";
import { learnersCsv, parseFilters } from "@/lib/learn/admin/learners";

export const dynamic = "force-dynamic";

// CSV of the TIBLOGICS Learn learners list, with the same filters and sort as
// /admin_pro/learn/learners (all pages). Staff with the Learn ("events")
// permission only, the same key that shows the page in the sidebar: every
// learner's name and email is in it. Never cached.
export async function GET(req: NextRequest) {
  const authErr = await requirePermission("events");
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
