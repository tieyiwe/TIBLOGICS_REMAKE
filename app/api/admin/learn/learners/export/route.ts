import { NextRequest, NextResponse } from "next/server";
import { learnerStaff } from "@/lib/learn/account-status/admin-auth";
import { learnersCsv, parseFilters } from "@/lib/learn/admin/learners";
import { auditFromRequest } from "@/lib/admin/audit";

export const dynamic = "force-dynamic";

// CSV of the TIBLOGICS Learn learners list, with the same filters and sort as
// /admin_pro/learn/learners (all pages). The owner, an admin, or staff with
// the "learners" (or older Learn "events") permission, as for the page:
// every learner's name and email is in it. Never cached.
export async function GET(req: NextRequest) {
  const { error: authErr } = await learnerStaff("read");
  if (authErr) return authErr;
  try {
    const { csv } = await learnersCsv(parseFilters(req.nextUrl.searchParams));
    const date = new Date().toISOString().slice(0, 10);
    // A bulk export of personal data: always on the record.
    await auditFromRequest("learners.export", { type: "learner-list" }, { filters: Object.fromEntries(req.nextUrl.searchParams) });
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
