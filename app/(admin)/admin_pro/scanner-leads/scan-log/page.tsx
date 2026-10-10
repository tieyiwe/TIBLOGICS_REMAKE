import Link from "next/link";
import { redirect } from "next/navigation";
import { Monitor, Smartphone, Tablet, Bot } from "lucide-react";
import { requireAdminPage } from "../../_lib/admin-page-auth";
import { can } from "@/lib/admin/permissions";
import { Badge, PageHeader, type BadgeTone } from "@/components/admin/ui";
import LocalTime from "@/components/admin/LocalTime";
import { filterQuery, param, parseFilters } from "@/lib/analytics/filters";
import { SCAN_OUTCOMES } from "@/lib/analytics/scan-log";
import { scanLogRows, scanSummary } from "@/lib/analytics/scan-log-admin";
import { countryName, flag } from "@/lib/geo";
import { Bar, FilterBar, Panel, Tile, tdc, theadRow, thc } from "../../analytics/kit";

export const dynamic = "force-dynamic";

// Every website scan, whatever happened: the site, when, the outcome, where
// the visitor was (approximate, from the IP: country, region, city) and on
// what device. Rows come from app/api/scanner/audit (lib/analytics/scan-log.ts).
// Same audience as Scanner leads.

const BASE = "/admin_pro/scanner-leads/scan-log";
const int = (n: number) => n.toLocaleString("en-US");
const TONE: Record<string, BadgeTone> = { ok: "success", rescan: "info", held: "orange", limit: "warn", error: "danger", invalid: "neutral" };
const DEVICE_ICON = { mobile: Smartphone, tablet: Tablet, desktop: Monitor, bot: Bot } as const;

export default async function ScanLogPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const session = await requireAdminPage();
  if (!can(session.user, "scanner_leads")) redirect("/admin_pro/no-access");
  const sp = await searchParams;
  const f = parseFilters(sp);
  const page = Math.min(500, Math.max(0, Number(param(sp, "page")) || 0));
  const [{ rows, total }, s] = await Promise.all([scanLogRows(f, page, 100), scanSummary(f)]);
  const qs = filterQuery(f);
  const devTotal = s.devices.reduce((n, d) => n + d.n, 0);
  const canExport = can(session.user, "data.export");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Scan log"
        breadcrumb={[{ label: "Scanner leads", href: "/admin_pro/scanner-leads" }, { label: "Scan log" }]}
        subtitle="Every website scan, including errors and free-limit hits: the site, the time (your time zone), the outcome, the visitor's approximate location from their IP, and their device. Addresses are stored anonymised."
        tabs={[{ label: "Leads", href: "/admin_pro/scanner-leads" }, { label: "Scan log", href: BASE }]}
        activeTab={BASE}
      />

      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <Tile label="Scans today" value={int(s.today)} sub="Since midnight, New York" />
        <Tile label="Last 7 days" value={int(s.week)} />
        <Tile label="Last 30 days" value={int(s.month)} />
      </div>

      <FilterBar base={BASE} f={f} show={["custom", "outcome", "device", "country", "q"]} outcomes={SCAN_OUTCOMES} countries={s.countries.map((c) => c.key).filter((c) => c !== "??")} />

      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3">
        <Panel title="Top sites" subtitle="In the filtered period.">
          {s.domains.length === 0 ? <p className="font-dm text-sm text-[var(--a-ink-3)]">No scans.</p> : (
            <ol className="space-y-2 font-dm text-sm" data-testid="scanlog-top-domains">
              {s.domains.map((d) => (
                <li key={d.key} className="flex items-baseline justify-between gap-2">
                  <Link href={`${BASE}${filterQuery(f, { q: d.key === "(none)" ? null : d.key })}`} className="min-w-0 truncate text-[var(--a-blue)] hover:underline">{d.key}</Link>
                  <span className="shrink-0 font-semibold tabular-nums text-[var(--a-ink)]">{int(d.n)}</span>
                </li>
              ))}
            </ol>
          )}
        </Panel>
        <Panel title="Top countries" subtitle="Approximate, from the visitor's IP.">
          {s.countries.length === 0 ? <p className="font-dm text-sm text-[var(--a-ink-3)]">No scans.</p> : (
            <ol className="space-y-2 font-dm text-sm">
              {s.countries.map((c) => (
                <li key={c.key} className="flex items-baseline justify-between gap-2">
                  <span className="min-w-0 truncate text-[var(--a-ink-2)]">{c.key === "??" ? "Unknown" : `${flag(c.key)} ${c.name ?? countryName(c.key) ?? c.key}`}</span>
                  <span className="shrink-0 font-semibold tabular-nums text-[var(--a-ink)]">{int(c.n)}</span>
                </li>
              ))}
            </ol>
          )}
        </Panel>
        <Panel title="Devices and outcomes">
          <ul className="space-y-3 font-dm text-sm">
            {s.devices.map((d) => (
              <li key={d.key}>
                <div className="flex justify-between gap-2"><span className="capitalize text-[var(--a-ink-2)]">{d.key}</span><span className="font-semibold tabular-nums text-[var(--a-ink)]">{devTotal ? Math.round((d.n / devTotal) * 100) : 0}%</span></div>
                <Bar value={d.n} max={devTotal} />
              </li>
            ))}
          </ul>
          <p className="mt-4 flex flex-wrap gap-1.5">
            {s.outcomes.map((o) => (
              <Badge key={o.key} tone={TONE[o.key] ?? "neutral"}>{o.key} {int(o.n)}</Badge>
            ))}
          </p>
        </Panel>
      </div>

      <Panel
        title={`Scans (${int(total)})`}
        subtitle={total > 100 ? `Newest first, 100 per page.` : "Newest first."}
        csvHref={canExport ? `/api/admin/scanner-leads/scan-log/export${qs}` : undefined}
      >
        {rows.length === 0 ? (
          <p className="py-8 text-center font-dm text-sm text-[var(--a-ink-3)]">No scans match these filters.</p>
        ) : (
          <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            <table className="w-full min-w-[860px] font-dm text-sm" data-testid="scanlog-table">
              <thead>
                <tr className={theadRow}>
                  <th className={thc}>Time</th><th className={thc}>Site</th><th className={thc}>Outcome</th><th className={thc}>Location</th>
                  <th className={thc}>Device</th><th className={thc}>Started from</th>
                </tr>
              </thead>
              <tbody className="text-[var(--a-ink-2)]">
                {rows.map((r) => {
                  const Icon = DEVICE_ICON[(r.device ?? "desktop") as keyof typeof DEVICE_ICON] ?? Monitor;
                  const place = [r.city, r.region].filter(Boolean).join(", ");
                  return (
                    <tr key={r.id} className="border-b border-[var(--a-border)] last:border-0" data-testid="scanlog-row">
                      <td className={tdc}><LocalTime iso={new Date(r.createdAt).toISOString()} /></td>
                      <td className={`${tdc} max-w-[280px]`}>
                        {r.leadId ? (
                          <Link href={`/admin_pro/scanner-leads/${r.leadId}`} className="font-medium text-[var(--a-blue)] hover:underline">{r.domain ?? r.url}</Link>
                        ) : (
                          <span className="font-medium text-[var(--a-ink)]">{r.domain ?? "—"}</span>
                        )}
                        <span className="block break-all text-[11px] text-[var(--a-ink-3)]">{r.url}</span>
                        {r.staff && <Badge tone="info" className="mt-1">staff</Badge>}
                      </td>
                      <td className={tdc}>
                        <Badge tone={TONE[r.outcome] ?? "neutral"}>{r.outcome}</Badge>
                        {r.errorCode && r.outcome !== "ok" && <span className="mt-1 block text-[11px] text-[var(--a-ink-3)]">{r.errorCode}</span>}
                      </td>
                      <td className={tdc}>
                        {r.country ? (
                          <>
                            <span className="text-[var(--a-ink)]">{flag(r.country)} {r.countryName ?? countryName(r.country) ?? r.country}</span>
                            {place && <span className="block text-[11px] text-[var(--a-ink-3)]">{place}</span>}
                          </>
                        ) : (
                          <span className="text-[var(--a-ink-3)]">Unknown</span>
                        )}
                      </td>
                      <td className={tdc}>
                        <span className="inline-flex items-center gap-1.5 capitalize text-[var(--a-ink)]"><Icon size={14} aria-hidden /> {r.device ?? "—"}</span>
                        <span className="block text-[11px] text-[var(--a-ink-3)]">{[r.browser, r.os].filter(Boolean).join(" · ")}</span>
                      </td>
                      <td className={`${tdc} text-xs`}>{r.fromPage === "/" ? "Home quick scan" : r.fromPage === "/tools/scanner" ? "Scanner page" : r.fromPage?.startsWith("/tools/scanner/report") ? "Report (re-scan)" : r.fromPage ?? "—"}{r.locale ? <span className="block text-[11px] text-[var(--a-ink-3)]">{r.locale.toUpperCase()}</span> : null}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {total > 100 && (
          <nav className="mt-4 flex items-center justify-between font-dm text-sm" aria-label="Pages">
            {page > 0 ? <Link href={`${BASE}${filterQuery(f, { page: String(page - 1) })}`} className="font-semibold text-[var(--a-blue)] hover:underline">← Newer</Link> : <span />}
            <span className="text-[var(--a-ink-3)]">Page {page + 1} of {Math.ceil(total / 100)}</span>
            {(page + 1) * 100 < total ? <Link href={`${BASE}${filterQuery(f, { page: String(page + 1) })}`} className="font-semibold text-[var(--a-blue)] hover:underline">Older →</Link> : <span />}
          </nav>
        )}
      </Panel>
    </div>
  );
}
