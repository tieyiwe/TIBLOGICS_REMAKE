import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdminPage } from "../_lib/admin-page-auth";
import { can } from "@/lib/admin/permissions";
import { canViewAnalytics } from "@/lib/admin/analytics";
import { PageHeader } from "@/components/admin/ui";
import { filterQuery, fmtDay, parseFilters } from "@/lib/analytics/filters";
import { getGoals, getKpis, monthKey, weeklyEmailEnabled, whatChanged } from "@/lib/analytics/insights";
import { getAcquisition } from "@/lib/analytics/acquisition";
import { biggestLeak, getFunnels } from "@/lib/analytics/funnels";
import { Panel, Trend } from "./kit";
import { AnalyticsTabs } from "./tabs";
import ExplainButton from "./ExplainButton";
import GoalsForm from "./GoalsForm";

export const dynamic = "force-dynamic";

// Insights: the first analytics page. Headline numbers against the period
// before, what changed (simple rules: at least 10 and a 25% move), the
// biggest funnel leaks and top sources, monthly goals, and an optional AI
// summary from aggregates. Owner, admins and Business analytics holders;
// others go to the visitor view.

const BASE = "/admin_pro/analytics";
const money = (c: number) => `$${(c / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
const int = (n: number) => n.toLocaleString("en-US");

export default async function InsightsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const session = await requireAdminPage();
  if (!canViewAnalytics(session.user)) redirect("/admin_pro/analytics/visitors");
  const f = parseFilters(await searchParams, { range: 7 });
  const qs = filterQuery(f);
  const isAdmin = can(session.user, "__admin__");
  const [kpis, movers, acq, funnels, goals, weekly] = await Promise.all([
    getKpis(f, true),
    whatChanged(f),
    getAcquisition(f),
    getFunnels(f),
    getGoals(monthKey()),
    weeklyEmailEnabled(),
  ]);
  const leaks = funnels.map((fn) => ({ fn, leak: biggestLeak(fn) })).filter((x) => x.leak);
  const csv = (table: string) => `/api/admin/analytics/data/export${qs ? `${qs}&` : "?"}section=insights&table=${table}`;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        subtitle={<>The last {f.days} days ({fmtDay(f.from)} to today, UTC) compared with the {f.days} days before.</>}
        className="mb-0"
        actions={<ExplainButton range={f.range === 30 || f.range === 90 ? String(f.range) : "7"} />}
      />
      <AnalyticsTabs active={BASE} viewer={session.user} qs={qs} />
      <nav className="inline-flex max-w-full overflow-x-auto rounded-[var(--a-radius-control)] border border-[var(--a-border)] bg-[var(--a-surface-2)] p-0.5" aria-label="Date range">
        {[7, 30, 90].map((d) => (
          <Link
            key={d}
            href={`${BASE}?range=${d}`}
            aria-current={f.range === d ? "page" : undefined}
            className={`inline-flex h-8 items-center rounded-[8px] px-3 font-dm text-[13px] font-semibold ${f.range === d ? "bg-[var(--a-surface)] text-[var(--a-ink)] shadow-[0_1px_2px_rgba(13,27,42,.08)] ring-1 ring-[var(--a-border)]" : "text-[var(--a-ink-3)] hover:text-[var(--a-ink)]"}`}
          >
            {d} days
          </Link>
        ))}
      </nav>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-7" data-testid="insights-kpis">
        {kpis.map((k) => (
          <div key={k.key} className="min-w-0 rounded-[var(--a-radius-card)] border border-[var(--a-border)] bg-[var(--a-surface)] p-4 shadow-[var(--a-shadow-card)]" data-kpi={k.key}>
            <p className="a-micro leading-snug">{k.label}</p>
            <p className="mt-2 font-dm text-[22px] font-bold leading-none tracking-tight text-[var(--a-ink)] tabular-nums">{k.money ? money(k.cur) : k.pct ? `${k.cur}%` : int(k.cur)}</p>
            <p className="mt-1 font-dm text-xs">
              <Trend cur={k.cur} prev={k.prev} /> <span className="text-[var(--a-ink-3)]">vs {k.money ? money(k.prev) : k.pct ? `${k.prev}%` : int(k.prev)}</span>
            </p>
          </div>
        ))}
      </div>
      <p className="-mt-3 font-dm text-xs text-[var(--a-ink-3)]">
        Leads: scanner emails, contact and service requests, lead magnets and scholarship applications. Conversion rate: sign-ups, bookings and sales per visitor session.{" "}
        <a href={csv("kpis")} className="text-[var(--a-blue)] hover:underline">CSV</a>
      </p>

      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3">
        <Panel title="What changed" subtitle="Biggest moves against the period before (at least 10, and 25% or more; funnel steps 10 points)." csvHref={csv("changes")} className="lg:col-span-2">
          {movers.length === 0 ? (
            <p className="py-4 font-dm text-sm text-[var(--a-ink-3)]">No big moves in this period.</p>
          ) : (
            <ul className="space-y-2.5 font-dm text-sm" data-testid="insights-changes">
              {movers.map((m, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${m.cur >= m.prev ? "bg-[var(--a-success-bg)] text-[var(--a-success)]" : "bg-[var(--a-danger-bg)] text-[var(--a-danger)]"}`}>{m.cur >= m.prev ? "▲" : "▼"}</span>
                  <span className="min-w-0 text-[var(--a-ink-2)]">
                    {m.text}
                    <span className="ml-1.5 rounded bg-[var(--a-surface-2)] px-1.5 py-0.5 text-[10px] uppercase tracking-[.06em] text-[var(--a-ink-3)]">{m.kind}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel title={`Goals for ${new Date(`${monthKey()}-01T00:00:00Z`).toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" })}`} subtitle="Month to date against the targets.">
          <ul className="space-y-4 font-dm text-sm" data-testid="insights-goals">
            {goals.map((g) => {
              const share = g.target ? g.actual / g.target : 0;
              const onPace = g.target ? share >= g.pace : null;
              return (
                <li key={g.metric}>
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-[var(--a-ink-2)]">{g.label}</span>
                    <span className="tabular-nums"><span className="font-semibold text-[var(--a-ink)]">{g.money ? money(g.actual) : int(g.actual)}</span>{g.target != null && <span className="text-[var(--a-ink-3)]"> / {g.money ? money(g.target) : int(g.target)}</span>}</span>
                  </div>
                  <div className="relative mt-1 h-2 overflow-hidden rounded-full bg-[var(--a-surface-2)]">
                    <div className="h-full rounded-full" style={{ width: `${Math.min(100, share * 100)}%`, background: onPace === false ? "#F47C20" : "#16a34a" }} />
                    {g.target != null && <div className="absolute top-0 h-full w-px bg-[var(--a-ink-3)]" style={{ left: `${g.pace * 100}%` }} title="Where you should be today" />}
                  </div>
                  <p className="mt-1 text-[11px] text-[var(--a-ink-3)]">{g.target == null ? "No target set." : `${Math.round(share * 100)}% of target · ${onPace ? "on pace" : "behind pace"}`}</p>
                </li>
              );
            })}
          </ul>
          {isAdmin && <GoalsForm month={monthKey()} initial={Object.fromEntries(goals.map((g) => [g.metric, g.target]))} />}
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
        <Panel title="Top sources" subtitle="Sessions and conversions (last touch).">
          <ul className="space-y-2 font-dm text-sm">
            {acq.sources.slice(0, 8).map((s) => (
              <li key={s.source} className="flex items-baseline justify-between gap-3">
                <span className="min-w-0 truncate text-[var(--a-ink-2)]">{s.source}{s.medium ? <span className="text-[var(--a-ink-3)]"> / {s.medium}</span> : null}</span>
                <span className="shrink-0 tabular-nums"><span className="font-semibold text-[var(--a-ink)]">{int(s.sessions)}</span> <span className="text-xs"><Trend cur={s.sessions} prev={s.prevSessions} /></span> <span className="text-[var(--a-ink-3)]">· {int(s.signups + s.bookings + s.leads)} conv.</span></span>
              </li>
            ))}
            {acq.sources.length === 0 && <li className="text-[var(--a-ink-3)]">No visits yet.</li>}
          </ul>
          <Link href={`${BASE}/acquisition${qs}`} className="mt-3 inline-block font-dm text-xs font-semibold text-[var(--a-blue)] hover:underline">All sources →</Link>
        </Panel>
        <Panel title="Funnel leaks" subtitle="The step where each funnel loses the most people.">
          <ul className="space-y-2.5 font-dm text-sm" data-testid="insights-leaks">
            {leaks.map(({ fn, leak }) => (
              <li key={fn.key} className="flex items-baseline justify-between gap-3">
                <span className="min-w-0 text-[var(--a-ink-2)]"><span className="font-semibold text-[var(--a-ink)]">{fn.label}:</span> {leak!.from.label} → {leak!.to.label}</span>
                <span className="shrink-0 font-semibold tabular-nums text-[var(--a-danger)]">{Math.round(leak!.rate * 100)}%</span>
              </li>
            ))}
            {leaks.length === 0 && <li className="text-[var(--a-ink-3)]">Not enough traffic yet to see where people drop off.</li>}
          </ul>
          <Link href={`${BASE}/funnels${qs}`} className="mt-3 inline-block font-dm text-xs font-semibold text-[var(--a-blue)] hover:underline">All funnels →</Link>
        </Panel>
      </div>

      <p className="font-dm text-xs text-[var(--a-ink-3)]">
        Weekly growth email: {weekly ? "on" : "off"} (Mondays, 8:00 owner time). Change it in <Link href="/admin_pro/settings" className="text-[var(--a-blue)] hover:underline">Settings</Link>.{" "}
        <a href="/api/admin/analytics/weekly-email?preview=1" target="_blank" rel="noopener" className="text-[var(--a-blue)] hover:underline">Preview this week&apos;s email</a>.
      </p>
    </div>
  );
}
