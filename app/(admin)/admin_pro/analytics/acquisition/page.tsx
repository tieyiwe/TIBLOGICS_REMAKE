import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdminPage } from "../../_lib/admin-page-auth";
import { can } from "@/lib/admin/permissions";
import { PageHeader } from "@/components/admin/ui";
import { filterQuery, fmtDay, param, parseFilters } from "@/lib/analytics/filters";
import { getAcquisition, knownSources } from "@/lib/analytics/acquisition";
import { getRevenue } from "@/lib/analytics/revenue";
import { splits } from "@/lib/analytics/usage";
import { countryName, flag } from "@/lib/geo";
import { Bar, FilterBar, Panel, Tile, Trend, tdc, theadRow, thc } from "../kit";
import { AnalyticsTabs } from "../tabs";

export const dynamic = "force-dynamic";

// Acquisition: where visitors come from and what each source brings. Visitor
// analytics permission; the purchase and revenue columns only for Business
// analytics holders (owner, admins).

const BASE = "/admin_pro/analytics/acquisition";
const int = (n: number) => n.toLocaleString("en-US");
const money = (c: number) => `$${(c / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
const pct = (n: number, d: number) => (d ? `${Math.round((n / d) * 100)}%` : "–");

export default async function AcquisitionPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const session = await requireAdminPage();
  if (!can(session.user, "analytics")) redirect("/admin_pro/no-access");
  const showMoney = can(session.user, "insights");
  const sp = await searchParams;
  const f = parseFilters(sp);
  const model = param(sp, "model") === "first" ? "first" : "last";
  const qs = filterQuery(f);
  const [a, rev, split, sources] = await Promise.all([
    getAcquisition(f, model),
    showMoney ? getRevenue(f, model) : Promise.resolve(null),
    splits(f),
    knownSources(),
  ]);
  const revBy = new Map((rev?.bySource ?? []).map((r) => [r.key, r]));
  const csv = (table: string) => `/api/admin/analytics/data/export${qs ? `${qs}&` : "?"}section=acquisition&table=${table}&model=${model}`;
  const maxS = a.sources[0]?.sessions ?? 0;
  const modelLink = (m: "first" | "last") => `${BASE}${filterQuery(f, { model: m === "first" ? "first" : null })}`;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Acquisition"
        subtitle={<>Where visitors came from, {fmtDay(f.from)} to {fmtDay(new Date(f.to.getTime() - 1))} (UTC), and what each source brought. Sources come from UTM tags, tracked /go links and the referring site.</>}
        className="mb-0"
      />
      <AnalyticsTabs active={BASE} viewer={session.user} qs={qs} />
      <FilterBar base={BASE} f={f} show={["custom", "area", "device", "country", "source"]} ranges={[7, 30, 90, 365]} countries={split.countries.map((c) => c.key).filter((c) => c !== "??")} sources={sources} />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <Tile label="Sessions" value={int(a.totalSessions)} />
        <Tile label="Sources" value={int(a.sources.filter((s) => s.sessions > 0).length)} />
        <Tile label="Conversions attributed" value={int(a.sources.reduce((n, s) => n + s.signups + s.bookings + s.leads, 0))} sub="Sign-ups, bookings and leads" />
        {rev ? <Tile label="Revenue attributed" value={money(rev.bySource.filter((s) => s.key !== "(not attributed)" && s.key !== "(unknown)").reduce((n, s) => n + s.cur, 0))} sub={`of ${money(rev.total.cur)} total`} /> : <Tile label="Landing pages" value={int(a.landings.length)} />}
      </div>

      <Panel
        title="Sources"
        subtitle={
          <>
            Conversions by {model === "first" ? "first" : "last"} touch:{" "}
            <Link href={modelLink("last")} className={model === "last" ? "font-semibold text-[var(--a-ink)]" : "text-[var(--a-blue)] hover:underline"}>last touch</Link> ·{" "}
            <Link href={modelLink("first")} className={model === "first" ? "font-semibold text-[var(--a-ink)]" : "text-[var(--a-blue)] hover:underline"}>first touch</Link>. Bounce: one page, under 10 seconds.
          </>
        }
        csvHref={csv("sources")}
      >
        {a.sources.length === 0 ? <p className="py-6 text-center font-dm text-sm text-[var(--a-ink-3)]">No visits in this period.</p> : (
          <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            <table className="w-full min-w-[820px] font-dm text-sm" data-testid="acq-sources">
              <thead>
                <tr className={theadRow}>
                  <th className={thc}>Source / medium</th><th className={`${thc} w-[14%]`}></th><th className={`${thc} text-right`}>Sessions</th><th className={`${thc} text-right`}>Trend</th>
                  <th className={`${thc} text-right`}>Bounce</th><th className={`${thc} text-right`}>Sign-ups</th><th className={`${thc} text-right`}>Bookings</th><th className={`${thc} text-right`}>Leads</th>
                  {rev && <><th className={`${thc} text-right`}>Sales</th><th className={`${thc} text-right`}>Revenue</th></>}
                </tr>
              </thead>
              <tbody className="text-[var(--a-ink-2)]">
                {a.sources.map((s) => (
                  <tr key={s.source} className="border-b border-[var(--a-border)] last:border-0">
                    <td className={tdc}>
                      <Link href={`${BASE}${filterQuery(f, { source: s.source })}`} className="font-medium text-[var(--a-ink)] hover:underline">{s.source}</Link>
                      {s.medium && <span className="block text-[11px] text-[var(--a-ink-3)]">{s.medium}</span>}
                    </td>
                    <td className={`${tdc} align-middle`}><Bar value={s.sessions} max={maxS} /></td>
                    <td className={`${tdc} text-right font-semibold tabular-nums text-[var(--a-ink)]`}>{int(s.sessions)}</td>
                    <td className={`${tdc} text-right text-xs`}><Trend cur={s.sessions} prev={s.prevSessions} /></td>
                    <td className={`${tdc} text-right tabular-nums`}>{pct(s.bounce, s.sessions)}</td>
                    <td className={`${tdc} text-right tabular-nums`}>{int(s.signups)}</td>
                    <td className={`${tdc} text-right tabular-nums`}>{int(s.bookings)}</td>
                    <td className={`${tdc} text-right tabular-nums`}>{int(s.leads)}</td>
                    {rev && <><td className={`${tdc} text-right tabular-nums`}>{int(revBy.get(s.source)?.n ?? 0)}</td><td className={`${tdc} text-right tabular-nums font-semibold text-[var(--a-ink)]`}>{money(revBy.get(s.source)?.cur ?? 0)}</td></>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
        <Panel title="Landing pages" subtitle="The first page of each session." csvHref={csv("landings")}>
          {a.landings.length === 0 ? <p className="font-dm text-sm text-[var(--a-ink-3)]">No data.</p> : (
            <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
              <table className="w-full min-w-[420px] font-dm text-sm" data-testid="acq-landings">
                <thead><tr className={theadRow}><th className={thc}>Page</th><th className={`${thc} text-right`}>Sessions</th><th className={`${thc} text-right`}>Bounce</th><th className={thc}>Top source</th></tr></thead>
                <tbody className="text-[var(--a-ink-2)]">
                  {a.landings.slice(0, 25).map((l) => (
                    <tr key={l.page} className="border-b border-[var(--a-border)] last:border-0">
                      <td className={`${tdc} break-all text-[var(--a-ink)]`}>{l.page}</td>
                      <td className={`${tdc} text-right tabular-nums font-semibold`}>{int(l.sessions)}</td>
                      <td className={`${tdc} text-right tabular-nums`}>{pct(l.bounce, l.sessions)}</td>
                      <td className={`${tdc} text-xs`}>{l.topSource ?? "–"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
        <Panel title="Campaigns" subtitle="utm_campaign on visits, and conversions carrying it." csvHref={csv("campaigns")}>
          {a.campaigns.length === 0 ? <p className="font-dm text-sm text-[var(--a-ink-3)]">No tagged campaigns in this period. Tag links with utm_campaign, or create them in Growth → Links.</p> : (
            <ul className="space-y-2 font-dm text-sm">
              {a.campaigns.slice(0, 20).map((c) => (
                <li key={c.campaign} className="flex items-baseline justify-between gap-3">
                  <span className="min-w-0 break-all text-[var(--a-ink-2)]">{c.campaign}{c.source ? <span className="text-[var(--a-ink-3)]"> · {c.source}</span> : null}</span>
                  <span className="shrink-0 tabular-nums"><span className="font-semibold text-[var(--a-ink)]">{int(c.sessions)}</span> <span className="text-[var(--a-ink-3)]">· {int(c.conversions)} conv.</span></span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel title="Channels" subtitle="Sessions by medium." csvHref={csv("mediums")}>
          <ul className="space-y-3 font-dm text-sm">
            {a.mediums.map((m) => (
              <li key={m.medium}>
                <div className="flex justify-between gap-2"><span className="text-[var(--a-ink-2)]">{m.medium}</span><span className="font-semibold tabular-nums text-[var(--a-ink)]">{pct(m.sessions, a.totalSessions)}</span></div>
                <Bar value={m.sessions} max={a.totalSessions} color="#F47C20" />
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Countries and devices" subtitle="Page views in the period.">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <ul className="space-y-2 font-dm text-sm">
              {split.countries.slice(0, 10).map((c) => (
                <li key={c.key} className="flex items-baseline justify-between gap-2">
                  <Link href={`${BASE}${filterQuery(f, { country: c.key === "??" ? null : c.key })}`} className="min-w-0 truncate text-[var(--a-ink-2)] hover:underline">{c.key === "??" ? "Unknown" : `${flag(c.key)} ${countryName(c.key) ?? c.key}`}</Link>
                  <span className="shrink-0 font-semibold tabular-nums text-[var(--a-ink)]">{int(c.sessions)}</span>
                </li>
              ))}
            </ul>
            <ul className="space-y-2 font-dm text-sm">
              {split.devices.map((d) => (
                <li key={d.key} className="flex items-baseline justify-between gap-2">
                  <Link href={`${BASE}${filterQuery(f, { device: d.key })}`} className="capitalize text-[var(--a-ink-2)] hover:underline">{d.key}</Link>
                  <span className="font-semibold tabular-nums text-[var(--a-ink)]">{int(d.sessions)}</span>
                </li>
              ))}
            </ul>
          </div>
        </Panel>
      </div>
    </div>
  );
}
