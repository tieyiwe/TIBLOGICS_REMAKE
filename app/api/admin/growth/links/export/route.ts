import { NextRequest, NextResponse } from "next/server";
import { requireGrowthAdmin } from "@/lib/growth/content-auth";
import { getLinkReport, linkReportCsv } from "@/lib/growth/reports";

const RANGES = [7, 30, 90, 365];

export async function GET(req: NextRequest) {
  const denied = await requireGrowthAdmin();
  if (denied) return denied;
  const q = req.nextUrl.searchParams;
  const n = Number(q.get("days"));
  const days = RANGES.includes(n) ? n : 30;
  const v = q.get("view");
  const view = v === "campaigns" || v === "platforms" ? v : "links";
  const csv = linkReportCsv(await getLinkReport(days), view);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="growth-${view}-${days}d-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
