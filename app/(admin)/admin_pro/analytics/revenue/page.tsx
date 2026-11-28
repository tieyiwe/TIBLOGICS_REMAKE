import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdminPage } from "../../_lib/admin-page-auth";
import { canViewAnalytics, getAnalytics } from "@/lib/admin/analytics";
import { PageHeader } from "@/components/admin/ui";
import { filterQuery, fmtDay, param, parseFilters } from "@/lib/analytics/filters";
import { getRevenue, LINES } from "@/lib/analytics/revenue";
import { knownSources } from "@/lib/analytics/acquisition";
import { countryName, flag } from "@/lib/geo";
import { Bar, FilterBar, Panel, Tile, Trend, tdc, theadRow, thc } from "../kit";
import { DayBars } from "../ui";
import { AnalyticsTabs } from "../tabs";

export const dynamic = "force-dynamic";

// Revenue: by product line, source or campaign (attributed), country, new vs
// returning buyers, ARPU, MRR and refunds, with the trend and top products.
// Owner, admins and Business analytics holders only.

const BASE = "/admin_pro/analytics/revenue";
const int = (n: number) => n.toLocaleString("en-US");
const money = (c: number) => `$${(c / 100).toLocaleString("en-US", { maximumFractionDigits: c >= 100_000 ? 0 : 2 })}`;

export default async function RevenuePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const session = await requireAdminPage();
  if (!canViewAnalytics(session.user)) redirect("/admin_pro/no-access");
  const sp = await searchParams;
  const f = parseFilters(sp, { range: 30 });
  const model = param(sp, "model") === "first" ? "first" : "last";
  const qs = filterQuery(f);
  const [r, a, sources] = await Promise.all([getRevenue(f, model), getAnalytics(30), knownSources()]);
  const csv = (table: string) => `/api/admin/analytics/data/export${qs ? `${qs}&` : "?"}section=revenue&table=${table}&model=${model}`;
  const arpu = r.total.buyers ? r.total.cur / r.total.buyers : 0;
  const prevArpu = r.total.prevBuyers ? r.total.prev / r.total.prevBuyers : 0;
  const maxLine = Math.max(1, ...r.lines.map((l) => l.cur));
  const maxSrc = Math.max(1, ...r.bySource.map((l) => l.cur));
  const modelLink = (m: "first" | "last") => `${BASE}${filterQuery(f, { model: m === "first" ? "first" : null })}`;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Revenue"
        subtitle={<>Paid records stored on the platform, {fmtDay(f.from)} to {fmtDay(new Date(f.to.getTime() - 1))} (UTC), against the period before. Monthly plans count their first month at list price (renewals are not stored); MRR covers what is in force now.</>}
        className="mb-0"
      />
      <AnalyticsTabs active={BASE} viewer={session.user} qs={qs} />
      <FilterBar base={BASE} f={f} show={["custom", "device", "country", "source"]} ranges={[30, 90, 365]} sources={sources} countries={r.byCountry.map((c) => c.key).filter((c) => c !== "??")} />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-5">
        <Tile label="Revenue" value={money(r.total.cur)} sub={<><Trend cur={r.total.cur} prev={r.total.prev} /> vs {money(r.total.prev)}</>} />
        <Tile label="Payments" value={int(r.total.orders)} sub={<><Trend cur={r.total.orders} prev={r.total.prevOrders} /> vs {int(r.total.prevOrders)}</>} />
        <Tile label="ARPU (per paying buyer)" value={money(Math.round(arpu))} sub={<><Trend cur={arpu} prev={prevArpu} /> · {int(r.total.buyers)} buyers</>} />
        <Tile label="MRR now (est.)" value={money(a.revenue.mrr.totalCents)} sub="ARFA plans, team seats, Toolkit" />
        <Tile label="Refunds recorded" value={money(r.refunds.cents)} sub={`${int(r.refunds.n)} orders marked refunded; Stripe refunds are not synced`} />
      </div>

      <Panel title={`Revenue per ${r.bucket}`} subtitle="All product lines." csvHref={csv("trend")}>
        <DayBars data={r.trend} format={(c) => money(c)} label="Revenue" />
      </Panel>

      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
        <Panel title="By product line" subtitle="This period, with the period before." csvHref={csv("lines")}>
          <ul className="space-y-4 font-dm text-sm" data-testid="rev-lines">
            {r.lines.map((l) => (
              <li key={l.key}>
                <div className="flex justify-between gap-2"><span className="min-w-0 text-[var(--a-ink-2)]">{l.label}</span><span className="shrink-0 font-semibold tabular-nums text-[var(--a-ink)]">{money(l.cur)}</span></div>
                <Bar value={l.cur} max={maxLine} />
                <p className="mt-1 text-[11px] text-[var(--a-ink-3)]">{int(l.n)} payments · <Trend cur={l.cur} prev={l.prev} /> vs {money(l.prev)}</p>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel
          title="By source"
          subtitle={
            <>
              Attributed by{" "}
              <Link href={modelLink("last")} className={model === "last" ? "font-semibold text-[var(--a-ink)]" : "text-[var(--a-blue)] hover:underline"}>last touch</Link> ·{" "}
              <Link href={modelLink("first")} className={model === "first" ? "font-semibold text-[var(--a-ink)]" : "text-[var(--a-blue)] hover:underline"}>first touch</Link>. {int(r.attributed)} of {int(r.total.orders)} payments have a known source.
            </>
          }
          csvHref={csv("sources")}
        >
          <ul className="space-y-3 font-dm text-sm" data-testid="rev-sources">
            {r.bySource.map((s) => (
              <li key={s.key}>
                <div className="flex justify-between gap-2"><span className="min-w-0 text-[var(--a-ink-2)]">{s.key}{s.medium ? <span className="text-[var(--a-ink-3)]"> / {s.medium}</span> : null}</span><span className="shrink-0 font-semibold tabular-nums text-[var(--a-ink)]">{money(s.cur)}</span></div>
                <Bar value={s.cur} max={maxSrc} color="#F47C20" />
              </li>
            ))}
            {r.bySource.length === 0 && <li className="text-[var(--a-ink-3)]">No revenue in this period.</li>}
          </ul>
        </Panel>
        <Panel title="New and returning buyers" subtitle="Returning: paid for something before this purchase.">
          <dl className="grid grid-cols-2 gap-4 font-dm text-sm">
            <div><dt className="text-[var(--a-ink-3)]">New buyers</dt><dd className="mt-1 text-[20px] font-bold text-[var(--a-ink)] tabular-nums">{money(r.newVsReturning.newCents)}</dd><dd className="text-xs text-[var(--a-ink-3)]">{int(r.newVsReturning.newBuyers)} people</dd></div>
            <div><dt className="text-[var(--a-ink-3)]">Returning buyers</dt><dd className="mt-1 text-[20px] font-bold text-[var(--a-ink)] tabular-nums">{money(r.newVsReturning.retCents)}</dd><dd className="text-xs text-[var(--a-ink-3)]">{int(r.newVsReturning.retBuyers)} people</dd></div>
          </dl>
        </Panel>
        <Panel title="By country" subtitle="Country of the buyer's visit when they converted." csvHref={csv("countries")}>
          <ul className="space-y-2 font-dm text-sm">
            {r.byCountry.slice(0, 12).map((c) => (
              <li key={c.key} className="flex items-baseline justify-between gap-2">
                <span className="min-w-0 truncate text-[var(--a-ink-2)]">{c.key === "??" ? "Unknown" : `${flag(c.key)} ${countryName(c.key) ?? c.key}`}</span>
                <span className="shrink-0 tabular-nums"><span className="font-semibold text-[var(--a-ink)]">{money(c.cur)}</span> <span className="text-[var(--a-ink-3)]">· {int(c.n)}</span></span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3">
        <Panel title="Top products" subtitle="Revenue in the period." csvHref={csv("products")} className="lg:col-span-2">
          {r.products.length === 0 ? <p className="font-dm text-sm text-[var(--a-ink-3)]">No sales in this period.</p> : (
            <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
              <table className="w-full min-w-[480px] font-dm text-sm" data-testid="rev-products">
                <thead><tr className={theadRow}><th className={thc}>Product</th><th className={thc}>Line</th><th className={`${thc} text-right`}>Units</th><th className={`${thc} text-right`}>Revenue</th></tr></thead>
                <tbody className="text-[var(--a-ink-2)]">
                  {r.products.map((p) => (
                    <tr key={`${p.line}-${p.name}`} className="border-b border-[var(--a-border)] last:border-0">
                      <td className={`${tdc} text-[var(--a-ink)]`}>{p.name}</td><td className={`${tdc} text-xs`}>{LINES[p.line] ?? p.line}</td>
                      <td className={`${tdc} text-right tabular-nums`}>{int(p.n)}</td><td className={`${tdc} text-right font-semibold tabular-nums text-[var(--a-ink)]`}>{money(p.cents)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
        <Panel title="Campaigns" subtitle="utm_campaign on paying visits." csvHref={csv("campaigns")}>
          {r.byCampaign.length === 0 ? <p className="font-dm text-sm text-[var(--a-ink-3)]">No campaign revenue yet.</p> : (
            <ul className="space-y-2 font-dm text-sm">
              {r.byCampaign.slice(0, 12).map((c) => (
                <li key={c.key} className="flex items-baseline justify-between gap-2"><span className="min-w-0 break-all text-[var(--a-ink-2)]">{c.key}</span><span className="shrink-0 font-semibold tabular-nums text-[var(--a-ink)]">{money(c.cur)}</span></li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
      <p className="font-dm text-xs text-[var(--a-ink-3)]">
        Summary CSV: <a className="text-[var(--a-blue)] hover:underline" href={csv("summary")}>download</a>.
      </p>
    </div>
  );
}
