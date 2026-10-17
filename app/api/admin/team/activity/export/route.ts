import { NextRequest, NextResponse } from "next/server";
import { teamApi, teamError } from "@/lib/admin/team/guard";
import { parseTimelineFilters, recordExport, timelineCsv } from "@/lib/admin/team/footprint";
import { audit } from "@/lib/admin/audit";

export const dynamic = "force-dynamic";

// CSV of the staff footprint with the page's filters. Owner or admin only.
export async function GET(req: NextRequest) {
  const { session, error } = await teamApi(req, "admin");
  if (error) return error;
  try {
    const f = parseTimelineFilters(req.nextUrl.searchParams);
    const csv = await timelineCsv(f, f.email ? [f.email] : null);
    await audit(session, "team.activity_export", { type: "team", label: f.email || "everyone" }, { filters: { ...f, page: undefined } });
    recordExport({
      staffId: session.user.collaboratorId ?? (session.user.isOwner ? "owner" : null),
      email: session.user.email,
      name: session.user.name,
      path: "/api/admin/team/activity/export",
      query: req.nextUrl.search.slice(1),
      area: "team",
      headers: req.headers,
      isOwner: !!session.user.isOwner,
    });
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="tiblogics-staff-activity-${new Date().toISOString().slice(0, 10)}.csv"`,
        "Cache-Control": "no-store, private",
      },
    });
  } catch (err) {
    return teamError(err, "activity.export");
  }
}
