import { NextRequest, NextResponse } from "next/server";
import { teamApi, teamError } from "@/lib/admin/team/guard";
import { parseTimelineFilters, timeline } from "@/lib/admin/team/footprint";

export const dynamic = "force-dynamic";

// Staff footprint timeline (sign-ins, page views, actions), filtered by
// ?person=<email>&type=&area=&from=&to=&page=. Team & Roles view.
export async function GET(req: NextRequest) {
  const { error } = await teamApi(req, "view");
  if (error) return error;
  try {
    const f = parseTimelineFilters(req.nextUrl.searchParams);
    const { rows, more } = await timeline(f, f.email ? [f.email] : null);
    return NextResponse.json({ rows, more, page: f.page }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    return teamError(err, "activity");
  }
}
