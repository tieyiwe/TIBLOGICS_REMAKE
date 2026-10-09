import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdminPage } from "../../_lib/admin-page-auth";
import { can } from "@/lib/admin/permissions";
import { PageHeader } from "@/components/admin/ui";
import { filterQuery, fmtDay, param, parseFilters } from "@/lib/analytics/filters";
import { arfaFeatures, labelPages, splits, topButtons, topPages } from "@/lib/analytics/usage";
import { countryName, flag } from "@/lib/geo";
import { Bar, FilterBar, Panel, Tile, Trend, tdc, theadRow, thc } from "../kit";

export const dynamic = "force-dynamic";

// Feature usage: which pages are viewed and which links and buttons are
// clicked the most across the platform (website, ARFA, the other tools), and
// which ARFA features are barely used. Sources: PageView and ClickEvent
// (components/public/AnalyticsTracker.tsx). Visitor analytics permission.

const int = (n: number) => n.toLocaleString("en-US");
const pct = (n: number, d: number) => (d ? `${Math.round((n / d) * 100)}%` : "–");
const BASE = "/admin_pro/analytics/usage";

export default async function UsagePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const session = await requireAdminPage();
  if (!can(session.user, "analytics")) redirect("/admin_pro/no-access");
  const sp = await searchParams;
  const f = parseFilters(sp);
  const label = param(sp, "label")?.slice(0, 120) ?? null;
  const qs = filterQuery(f);
  const csv = (table: string, extra = "") => `/api/admin/analytics/usage/export${qs ? `${qs}&` : "?"}table=${table}${extra}`;

  const [pages, buttons, features, split, where] = await Promise.all([
    topPages(f),
    topButtons(f),
    arfaFeatures(f),
    splits(f),
    label ? labelPages(f, label) : Promise.resolve(null),
  ]);
  const t = split.totals;
  const maxViews = pages[0]?.views ?? 0;
  const maxClicks = buttons[0]?.clicks ?? 0;
  const devTotal = split.devices.reduce((n, d) => n + d.views, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Feature usage"
        breadcrumb={[{ label: "Analytics", href: "/admin_pro/analytics" }, { label: "Feature usage" }]}
        subtitle={<>Most-used pages, links and buttons on the website and in ARFA, {fmtDay(f.from)} to {fmtDay(new Date(f.to.getTime() - 1))} (UTC), compared with the {f.days} days before. Paths are grouped (ids become :id) and no typed text is recorded.</>}
        className="mb-0"
      />
      <FilterBar base={BASE} f={f} show={["custom", "area", "device", "country"]} countries={split.countries.map((c) => c.key).filter((c) => c !== "??")} />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <Tile label="Page views" value={int(t.views)} sub={<><Trend cur={t.views} prev={t.prevViews} /> vs {int(t.prevViews)}</>} />
        <Tile label="Sessions" value={int(t.sessions)} sub={<><Trend cur={t.sessions} prev={t.prevSessions} /> vs {int(t.prevSessions)}</>} />
        <Tile label="Clicks" value={int(t.clicks)} sub={<><Trend cur={t.clicks} prev={t.prevClicks} /> vs {int(t.prevClicks)}</>} />
        <Tile label="Pages per session" value={t.sessions ? (t.views / t.sessions).toFixed(1) : "–"} sub={`${int(pages.length)} distinct pages`} />
      </div>

      <Panel title="Top pages" subtitle="Views, unique sessions, change against the previous period and the share of views on a phone." csvHref={csv("pages")}>
        {pages.length === 0 ? (
          <p className="py-6 text-center font-dm text-sm text-[var(--a-ink-3)]">No page views in this period.</p>
        ) : (
          <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            <table className="w-full min-w-[640px] font-dm text-sm" data-testid="usage-pages">
              <thead>
                <tr className={theadRow}>
                  <th className={thc}>Page</th><th className={`${thc} w-1/4`}></th><th className={`${thc} text-right`}>Views</th>
                  <th className={`${thc} text-right`}>Sessions</th><th className={`${thc} text-right`}>Trend</th><th className={`${thc} text-right`}>Mobile</th>
                </tr>
              </thead>
              <tbody className="text-[var(--a-ink-2)]">
                {pages.map((p) => (
                  <tr key={p.page} className="border-b border-[var(--a-border)] last:border-0">
                    <td className={`${tdc} break-all text-[var(--a-ink)]`}>{p.page}</td>
                    <td className={`${tdc} align-middle`}><Bar value={p.views} max={maxViews} /></td>
                    <td className={`${tdc} text-right font-semibold tabular-nums text-[var(--a-ink)]`}>{int(p.views)}</td>
                    <td className={`${tdc} text-right tabular-nums`}>{int(p.sessions)}</td>
                    <td className={`${tdc} text-right text-xs tabular-nums`}><Trend cur={p.views} prev={p.prevViews} /></td>
                    <td className={`${tdc} text-right tabular-nums`}>{pct(p.mobile, p.views)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Panel
        id="buttons"
        title="Top buttons and links"
        subtitle="Clicks, unique sessions and where they happen. Named buttons (data-track) keep one name in every language. Click a row to see the pages it is clicked on."
        csvHref={csv("buttons")}
      >
        {buttons.length === 0 ? (
          <p className="py-6 text-center font-dm text-sm text-[var(--a-ink-3)]">No clicks recorded in this period.</p>
        ) : (
          <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            <table className="w-full min-w-[680px] font-dm text-sm" data-testid="usage-buttons">
              <thead>
                <tr className={theadRow}>
                  <th className={thc}>Button or link</th><th className={thc}>Kind</th><th className={`${thc} w-1/5`}></th>
                  <th className={`${thc} text-right`}>Clicks</th><th className={`${thc} text-right`}>Sessions</th><th className={thc}>Page</th>
                </tr>
              </thead>
              <tbody className="text-[var(--a-ink-2)]">
                {buttons.map((b) => {
                  const on = label === b.label;
                  return (
                    <tr key={b.label} className={`border-b border-[var(--a-border)] last:border-0 ${on ? "bg-[var(--a-info-bg)]" : ""}`}>
                      <td className={tdc}>
                        <Link href={`${BASE}${filterQuery(f, { label: b.label })}#where`} className="font-medium text-[var(--a-blue)] hover:underline" scroll={false}>
                          {b.label}
                        </Link>
                        {b.href && <span className="block break-all text-[11px] text-[var(--a-ink-3)]">→ {b.href}</span>}
                      </td>
                      <td className={`${tdc} text-xs`}>{b.kind}</td>
                      <td className={`${tdc} align-middle`}><Bar value={b.clicks} max={maxClicks} color="#F47C20" /></td>
                      <td className={`${tdc} text-right font-semibold tabular-nums text-[var(--a-ink)]`}>{int(b.clicks)}</td>
                      <td className={`${tdc} text-right tabular-nums`}>{int(b.sessions)}</td>
                      <td className={`${tdc} break-all text-xs`}>{b.topPage}{b.pages > 1 ? <span className="text-[var(--a-ink-3)]"> +{b.pages - 1} more</span> : null}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {label && where && (
        <Panel id="where" title={`Where “${label}” is clicked`} subtitle="Pages, most clicks first." csvHref={csv("label", `&label=${encodeURIComponent(label)}`)}>
          {where.length === 0 ? (
            <p className="py-4 font-dm text-sm text-[var(--a-ink-3)]">No clicks on this in the period.</p>
          ) : (
            <ul className="space-y-2 font-dm text-sm" data-testid="usage-label-pages">
              {where.map((w) => (
                <li key={w.page} className="flex items-baseline justify-between gap-3">
                  <span className="min-w-0 break-all text-[var(--a-ink-2)]">{w.page}</span>
                  <span className="shrink-0 tabular-nums"><span className="font-semibold text-[var(--a-ink)]">{int(w.clicks)}</span> <span className="text-[var(--a-ink-3)]">· {int(w.sessions)} sessions</span></span>
                </li>
              ))}
            </ul>
          )}
          <Link href={`${BASE}${qs}#buttons`} className="mt-3 inline-block font-dm text-xs font-semibold text-[var(--a-blue)] hover:underline">Close</Link>
        </Panel>
      )}

      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3">
        <Panel
          title="Least used ARFA features"
          subtitle="Page views of the feature plus clicks on its controls, fewest first: what to improve or promote."
          csvHref={csv("features")}
          className="lg:col-span-1"
        >
          <ul className="space-y-3 font-dm text-sm" data-testid="usage-features">
            {features.map((x) => (
              <li key={x.key}>
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-[var(--a-ink-2)]">{x.label}</span>
                  <span className={`shrink-0 tabular-nums font-semibold ${x.views + x.clicks === 0 ? "text-[var(--a-danger)]" : "text-[var(--a-ink)]"}`}>
                    {int(x.views + x.clicks)}
                  </span>
                </div>
                <p className="text-[11px] text-[var(--a-ink-3)]">{int(x.views)} views · {int(x.clicks)} clicks · {int(x.sessions)} sessions</p>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Devices" subtitle="Page views by device type." csvHref={csv("devices")}>
          {split.devices.length === 0 ? <p className="font-dm text-sm text-[var(--a-ink-3)]">No data.</p> : (
            <ul className="space-y-4 font-dm text-sm">
              {split.devices.map((d) => (
                <li key={d.key}>
                  <div className="flex justify-between gap-2"><span className="capitalize text-[var(--a-ink-2)]">{d.key}</span><span className="font-semibold tabular-nums text-[var(--a-ink)]">{pct(d.views, devTotal)}</span></div>
                  <Bar value={d.views} max={devTotal} />
                  <p className="mt-1 text-[11px] text-[var(--a-ink-3)]">{int(d.views)} views · {int(d.sessions)} sessions</p>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel title="Countries" subtitle="Page views by country (edge headers or IP lookup)." csvHref={csv("countries")}>
          {split.countries.length === 0 ? <p className="font-dm text-sm text-[var(--a-ink-3)]">No data.</p> : (
            <ul className="space-y-2 font-dm text-sm">
              {split.countries.slice(0, 15).map((c) => (
                <li key={c.key} className="flex items-baseline justify-between gap-2">
                  <span className="min-w-0 truncate text-[var(--a-ink-2)]">{c.key === "??" ? "Unknown" : `${flag(c.key)} ${countryName(c.key) ?? c.key}`}</span>
                  <span className="shrink-0 tabular-nums"><span className="font-semibold text-[var(--a-ink)]">{int(c.views)}</span> <span className="text-[var(--a-ink-3)]">· {int(c.sessions)}</span></span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
