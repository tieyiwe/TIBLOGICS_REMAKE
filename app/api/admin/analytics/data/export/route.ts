import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/require-admin";
import { csvResponse } from "@/lib/analytics/csv";
import { parseFilters } from "@/lib/analytics/filters";
import { acquisitionCsvRows, getAcquisition } from "@/lib/analytics/acquisition";
import { funnelCsvRows, getFunnels } from "@/lib/analytics/funnels";
import { getRevenue, revenueCsvRows } from "@/lib/analytics/revenue";
import { dropOffLessons, featureLearners, siteEngagement } from "@/lib/analytics/engagement";
import { getKpis, whatChanged } from "@/lib/analytics/insights";

export const dynamic = "force-dynamic";

// CSV of any table on the Acquisition, Funnels, Revenue, Engagement and
// Insights pages, with the same URL filters:
//   ?section=acquisition&table=sources|campaigns|landings|mediums
//   ?section=funnels
//   ?section=revenue&table=summary|lines|sources|campaigns|countries|trend|products&model=first|last
//   ?section=engagement&table=daily|scroll|time|dropoff|features
//   ?section=insights&table=kpis|changes
// Visitor analytics for traffic sections; revenue and insights need Business
// analytics (they show money). All need the export capability.

const SECTIONS = ["acquisition", "funnels", "revenue", "engagement", "insights"] as const;
type Section = (typeof SECTIONS)[number];

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const section = sp.get("section") as Section;
  if (!SECTIONS.includes(section)) return NextResponse.json({ error: "Unknown section" }, { status: 400 });
  const denied =
    (await requirePermission(section === "revenue" || section === "insights" ? "insights" : "analytics")) ?? (await requirePermission("data.export"));
  if (denied) return denied;
  const f = parseFilters(sp);
  const table = (sp.get("table") ?? "").replace(/[^a-z]/g, "").slice(0, 20) || "summary";
  const model = sp.get("model") === "first" ? "first" : "last";
  try {
    let rows: unknown[][];
    switch (section) {
      case "acquisition":
        rows = acquisitionCsvRows(await getAcquisition(f, model), table);
        break;
      case "funnels":
        rows = funnelCsvRows(await getFunnels(f));
        break;
      case "revenue":
        rows = revenueCsvRows(await getRevenue(f, model), table);
        break;
      case "engagement": {
        if (table === "dropoff") rows = [["track", "lesson_where_learners_stop", "stalled_here", "stalled_in_track"], ...(await dropOffLessons()).map((d) => [d.track, d.lesson, d.stalled, d.total])];
        else if (table === "features") rows = [["feature", "learners_or_count"], ...(await featureLearners(f)).map((x) => [x.label, x.learners ?? "not tracked"])];
        else {
          const e = await siteEngagement(f);
          rows =
            table === "scroll" ? [["page", "views_measured", "reached_25", "reached_50", "reached_75", "reached_100"], ...e.scroll.map((s) => [s.page, s.views, s.d25, s.d50, s.d75, s.d100])]
            : table === "time" ? [["page", "views", "avg_engaged_seconds"], ...e.timeOnPage.map((t) => [t.page, t.views, Math.round(t.avgMs / 1000)])]
            : table === "daily" ? [["day", "sessions"], ...e.daily.map((d) => [d.day, d.value])]
            : [["metric", "this_period", "previous_period"], ...(["sessions", "views", "pagesPerSession", "avgEngagedMs", "bounceRate", "returningRate"] as const).map((k) => [k, e.cur[k], e.prev[k]])];
        }
        break;
      }
      case "insights":
        rows =
          table === "changes"
            ? [["kind", "what", "now", "before", "change_pct"], ...(await whatChanged(f)).map((m) => [m.kind, m.label, m.cur, m.prev, Math.round(m.change * 100)])]
            : [["metric", "this_period", "previous_period"], ...(await getKpis(f, true)).map((k) => [k.label, k.money ? (k.cur / 100).toFixed(2) : k.cur, k.money ? (k.prev / 100).toFixed(2) : k.prev])];
        break;
    }
    return csvResponse(rows, `tiblogics-${section}-${table}-${f.from.toISOString().slice(0, 10)}`);
  } catch (err) {
    console.error("[GET /api/admin/analytics/data/export]", err);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
