import { redirect } from "next/navigation";
import { requireAdminPage } from "../../_lib/admin-page-auth";
import { can } from "@/lib/admin/permissions";
import { getAnalytics, type RangeDays } from "@/lib/admin/analytics";
import { PageHeader } from "@/components/admin/ui";
import { filterQuery, fmtDay, parseFilters } from "@/lib/analytics/filters";
import { dropOffLessons, featureLearners, siteEngagement } from "@/lib/analytics/engagement";
import { arfaFeatures } from "@/lib/analytics/usage";
import { knownSources } from "@/lib/analytics/acquisition";
import { Bar, FilterBar, Panel, Tile, Trend, tdc, theadRow, thc } from "../kit";
import { DayBars } from "../ui";
import { AnalyticsTabs } from "../tabs";

export const dynamic = "force-dynamic";

// Engagement and retention: the website (sessions, pages per session, engaged
// time, bounce, returning visitors, scroll depth) and ARFA (active learners,
// weekly cohorts, completion and where learners stop, feature adoption).
// Visitor analytics permission.

const BASE = "/admin_pro/analytics/engagement";
const int = (n: number) => n.toLocaleString("en-US");
const pc = (x: number) => `${Math.round(x * 100)}%`;
const dur = (ms: number) => (ms < 60_000 ? `${Math.round(ms / 1000)} s` : `${Math.floor(ms / 60_000)} min ${Math.round((ms % 60_000) / 1000)} s`);

export default async function EngagementPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const session = await requireAdminPage();
  if (!can(session.user, "analytics")) redirect("/admin_pro/no-access");
  const f = parseFilters(await searchParams);
  const qs = filterQuery(f);
  const range: RangeDays = f.days <= 7 ? 7 : f.days <= 30 ? 30 : 90;
  const [e, a, drops, learners, features, sources] = await Promise.all([siteEngagement(f), getAnalytics(range), dropOffLessons(), featureLearners(f), arfaFeatures(f), knownSources()]);
  const L = a.learning;
  const csv = (table: string) => `/api/admin/analytics/data/export${qs ? `${qs}&` : "?"}section=engagement&table=${table}`;
  const learnerMap = new Map(learners.map((l) => [l.key, l.learners]));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Engagement"
        subtitle={<>How people use the website and ARFA, {fmtDay(f.from)} to {fmtDay(new Date(f.to.getTime() - 1))} (UTC). Engaged time counts only while the tab is visible.</>}
        className="mb-0"
      />
      <AnalyticsTabs active={BASE} viewer={session.user} qs={qs} />
      <FilterBar base={BASE} f={f} show={["custom", "area", "device", "country", "source"]} sources={sources} />

      <h2 className="font-syne text-[18px] font-bold text-[var(--a-ink)]">Website</h2>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-6" data-testid="eng-site">
        <Tile label="Sessions" value={int(e.cur.sessions)} sub={<><Trend cur={e.cur.sessions} prev={e.prev.sessions} /> vs {int(e.prev.sessions)}</>} />
        <Tile label="Pages per session" value={e.cur.pagesPerSession.toFixed(1)} sub={<Trend cur={e.cur.pagesPerSession} prev={e.prev.pagesPerSession} />} />
        <Tile label="Avg engaged time" value={dur(e.cur.avgEngagedMs)} sub={<Trend cur={e.cur.avgEngagedMs} prev={e.prev.avgEngagedMs} />} />
        <Tile label="Bounce rate" value={pc(e.cur.bounceRate)} sub={<Trend cur={e.cur.bounceRate} prev={e.prev.bounceRate} invert />} />
        <Tile label="Returning visitors" value={pc(e.cur.returningRate)} sub={<Trend cur={e.cur.returningRate} prev={e.prev.returningRate} />} />
        <Tile label="Page views" value={int(e.cur.views)} sub={<Trend cur={e.cur.views} prev={e.prev.views} />} />
      </div>
      <Panel title="Sessions per day" csvHref={csv("daily")}>
        <DayBars data={e.daily} label="Sessions" />
      </Panel>
      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
        <Panel title="Scroll depth on key pages" subtitle="Share of measured views that reached each depth (not measured with Do Not Track or GPC)." csvHref={csv("scroll")}>
          {e.scroll.length === 0 ? <p className="font-dm text-sm text-[var(--a-ink-3)]">No scroll data yet.</p> : (
            <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
              <table className="w-full min-w-[420px] font-dm text-sm" data-testid="eng-scroll">
                <thead><tr className={theadRow}><th className={thc}>Page</th><th className={`${thc} text-right`}>Views</th><th className={`${thc} text-right`}>25%</th><th className={`${thc} text-right`}>50%</th><th className={`${thc} text-right`}>75%</th><th className={`${thc} text-right`}>100%</th></tr></thead>
                <tbody className="text-[var(--a-ink-2)]">
                  {e.scroll.map((s) => (
                    <tr key={s.page} className="border-b border-[var(--a-border)] last:border-0">
                      <td className={`${tdc} text-[var(--a-ink)]`}>{s.page}</td><td className={`${tdc} text-right tabular-nums`}>{int(s.views)}</td>
                      {[s.d25, s.d50, s.d75, s.d100].map((d, i) => <td key={i} className={`${tdc} text-right tabular-nums`}>{pc(s.views ? d / s.views : 0)}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
        <Panel title="Engaged time by page" subtitle="Average visible time per view, pages with 3 or more measured views." csvHref={csv("time")}>
          {e.timeOnPage.length === 0 ? <p className="font-dm text-sm text-[var(--a-ink-3)]">No engaged time measured yet.</p> : (
            <ul className="space-y-2 font-dm text-sm">
              {e.timeOnPage.slice(0, 15).map((t) => (
                <li key={t.page} className="flex items-baseline justify-between gap-3"><span className="min-w-0 break-all text-[var(--a-ink-2)]">{t.page}</span><span className="shrink-0 tabular-nums"><span className="font-semibold text-[var(--a-ink)]">{dur(t.avgMs)}</span> <span className="text-[var(--a-ink-3)]">· {int(t.views)}</span></span></li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <h2 className="pt-2 font-syne text-[18px] font-bold text-[var(--a-ink)]">ARFA</h2>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <Tile label="Daily active learners" value={int(L.dau.cur)} sub={<Trend cur={L.dau.cur} prev={L.dau.prev} />} />
        <Tile label="Weekly active" value={int(L.wau.cur)} sub={<Trend cur={L.wau.cur} prev={L.wau.prev} />} />
        <Tile label="Monthly active" value={int(L.mau.cur)} sub={<>Stickiness {L.mau.cur ? pc(L.dau.cur / L.mau.cur) : "–"}</>} />
        <Tile label={`Lessons completed (${range} days)`} value={int(L.lessons.cur)} sub={<Trend cur={L.lessons.cur} prev={L.lessons.prev} />} />
      </div>

      <Panel title="Weekly cohort retention" subtitle="Share of each week's sign-ups active (signed in, finished a lesson or earned XP) in each week after. Weeks start Monday, UTC.">
        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-0.5 font-dm text-xs" data-testid="eng-cohorts">
            <thead><tr className="text-left text-[var(--a-ink-3)]"><th className="py-1 pr-3 font-semibold">Week of</th><th className="py-1 pr-3 text-right font-semibold">Sign-ups</th>{Array.from({ length: a.retention.weeks }, (_, k) => <th key={k} className="px-1 py-1 text-center font-semibold">W{k}</th>)}</tr></thead>
            <tbody>
              {a.retention.cohorts.map((c) => (
                <tr key={c.week}>
                  <td className="whitespace-nowrap py-1 pr-3 text-[var(--a-ink-2)]">{c.week}</td>
                  <td className="py-1 pr-3 text-right font-semibold tabular-nums text-[var(--a-ink)]">{c.size}</td>
                  {Array.from({ length: a.retention.weeks }, (_, k) => {
                    if (k >= c.retained.length) return <td key={k} />;
                    const share = c.size ? c.retained[k] / c.size : 0;
                    return <td key={k} title={`${c.retained[k]} of ${c.size}`} className="h-8 min-w-[40px] rounded text-center tabular-nums" style={{ background: share ? `rgba(34,81,163,${0.08 + share * 0.82})` : "#F4F7FB", color: share > 0.5 ? "#fff" : "#0D1B2A" }}>{c.size ? `${Math.round(share * 100)}%` : "·"}</td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
        <Panel title="Completion and drop-off by track" subtitle="Completed: certificate or every lesson done. Drop-off lesson: the next lesson of learners with no activity for 14 days." csvHref={csv("dropoff")}>
          <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            <table className="w-full min-w-[520px] font-dm text-sm" data-testid="eng-tracks">
              <thead><tr className={theadRow}><th className={thc}>Track</th><th className={`${thc} text-right`}>Enrolled</th><th className={`${thc} text-right`}>Completed</th><th className={thc}>Where learners stop</th></tr></thead>
              <tbody className="text-[var(--a-ink-2)]">
                {L.tracks.filter((t) => t.enrolled > 0).map((t) => {
                  const d = drops.find((x) => x.track === t.title);
                  return (
                    <tr key={t.id} className="border-b border-[var(--a-border)] last:border-0">
                      <td className={`${tdc} text-[var(--a-ink)]`}>{t.title}</td>
                      <td className={`${tdc} text-right tabular-nums`}>{int(t.enrolled)}</td>
                      <td className={`${tdc} text-right tabular-nums`}>{t.completionPct}%</td>
                      <td className={`${tdc} text-xs`}>{d ? <>{d.lesson} <span className="text-[var(--a-ink-3)]">({d.stalled} of {d.total} stalled)</span></> : t.dropModule ?? "–"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>
        <Panel title="Feature adoption" subtitle="Sessions that opened or clicked each feature (page views and clicks), and learners from the feature's own records where they exist." csvHref={csv("features")}>
          <ul className="space-y-3 font-dm text-sm" data-testid="eng-features">
            {[...features].sort((x, y) => y.views + y.clicks - (x.views + x.clicks)).map((x) => {
              const max = Math.max(1, ...features.map((z) => z.sessions));
              const lr = learnerMap.get(x.key);
              return (
                <li key={x.key}>
                  <div className="flex justify-between gap-2"><span className="text-[var(--a-ink-2)]">{x.label}</span><span className="font-semibold tabular-nums text-[var(--a-ink)]">{int(x.sessions)} sessions</span></div>
                  <Bar value={x.sessions} max={max} />
                  <p className="mt-1 text-[11px] text-[var(--a-ink-3)]">{int(x.views)} views · {int(x.clicks)} clicks{lr != null ? ` · ${int(lr)} learners` : ""}</p>
                </li>
              );
            })}
            {learnerMap.get("peer_helpful") != null && <li className="text-xs text-[var(--a-ink-3)]">Satisfaction signal: {int(learnerMap.get("peer_helpful") ?? 0)} peer reviews marked helpful in the period.</li>}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
