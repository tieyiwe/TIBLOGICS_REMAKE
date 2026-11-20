// Shared, server-rendered pieces for the analytics pages that take URL
// filters (Feature usage, Insights, Acquisition, Funnels, Revenue,
// Engagement) and the scanner's scan log: a panel with a CSV link, the filter
// bar (a plain GET form, so it works without JavaScript and the filters stay
// in the URL), and the section tabs.
import Link from "next/link";
import type { ReactNode } from "react";
import { Download } from "lucide-react";
import { filterQuery, type Filters } from "@/lib/analytics/filters";

export function Panel({
  title, subtitle, csvHref, children, className = "", id,
}: { title: string; subtitle?: ReactNode; csvHref?: string; children: ReactNode; className?: string; id?: string }) {
  return (
    <section id={id} className={`min-w-0 scroll-mt-16 rounded-[var(--a-radius-card)] border border-[var(--a-border)] bg-[var(--a-surface)] p-4 shadow-[var(--a-shadow-card)] sm:p-5 ${className}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-dm text-[14px] font-semibold text-[var(--a-ink)]">{title}</h3>
          {subtitle && <p className="mt-0.5 font-dm text-xs text-[var(--a-ink-3)]">{subtitle}</p>}
        </div>
        {csvHref && (
          <a
            href={csvHref}
            className="inline-flex h-8 items-center gap-1 rounded-[8px] border border-[var(--a-border-strong)] px-2.5 font-dm text-xs font-semibold text-[var(--a-ink-2)] hover:bg-[var(--a-surface-2)]"
          >
            <Download size={12} aria-hidden /> CSV
          </a>
        )}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

const pill = (on: boolean) =>
  `inline-flex h-8 items-center rounded-[8px] px-3 font-dm text-[13px] font-semibold ${
    on ? "bg-[var(--a-surface)] text-[var(--a-ink)] shadow-[0_1px_2px_rgba(13,27,42,.08)] ring-1 ring-[var(--a-border)]" : "text-[var(--a-ink-3)] hover:text-[var(--a-ink)]"
  }`;

const field =
  "h-9 rounded-[var(--a-radius-control)] border border-[var(--a-border-strong)] bg-[var(--a-surface)] px-2.5 font-dm text-[13px] text-[var(--a-ink)] focus:border-[var(--a-blue)] focus:outline-none focus:ring-2 focus:ring-[var(--a-blue)]/20";

/**
 * Range pills plus a GET form for the other filters. `show` picks the
 * controls a page supports; every page keeps the rest of the URL's filters.
 */
export function FilterBar({
  base, f, show, ranges = [7, 30, 90], countries = [], sources = [], outcomes,
}: {
  base: string;
  f: Filters;
  show: Array<"area" | "device" | "country" | "source" | "q" | "outcome" | "custom">;
  ranges?: number[];
  countries?: string[];
  sources?: string[];
  outcomes?: readonly string[];
}) {
  const fromVal = f.from.toISOString().slice(0, 10);
  const toVal = new Date(f.to.getTime() - 86_400_000).toISOString().slice(0, 10);
  return (
    <div className="space-y-3">
      <nav className="inline-flex max-w-full overflow-x-auto rounded-[var(--a-radius-control)] border border-[var(--a-border)] bg-[var(--a-surface-2)] p-0.5" aria-label="Date range">
        {ranges.map((d) => (
          <Link key={d} href={`${base}${filterQuery(f, { range: String(d), from: null, to: null })}`} aria-current={f.range === d ? "page" : undefined} className={pill(f.range === d)}>
            {d === 365 ? "12 months" : `${d} days`}
          </Link>
        ))}
        {f.range === "custom" && <span className={pill(true)}>Custom</span>}
      </nav>
      <form method="get" action={base} className="flex flex-wrap items-end gap-2" data-no-track>
        {f.range !== "custom" && <input type="hidden" name="range" value={String(f.range)} />}
        {show.includes("custom") && (
          <>
            <label className="flex flex-col gap-1 font-dm text-[11px] font-semibold uppercase tracking-[.06em] text-[var(--a-ink-3)]">
              From
              <input type="date" name="from" defaultValue={f.range === "custom" ? fromVal : ""} className={field} />
            </label>
            <label className="flex flex-col gap-1 font-dm text-[11px] font-semibold uppercase tracking-[.06em] text-[var(--a-ink-3)]">
              To
              <input type="date" name="to" defaultValue={f.range === "custom" ? toVal : ""} className={field} />
            </label>
          </>
        )}
        {show.includes("area") && (
          <label className="flex flex-col gap-1 font-dm text-[11px] font-semibold uppercase tracking-[.06em] text-[var(--a-ink-3)]">
            Area
            <select name="area" defaultValue={f.area} className={field}>
              <option value="all">All</option>
              <option value="website">Website</option>
              <option value="arfa">ARFA</option>
              <option value="other">Other tools</option>
            </select>
          </label>
        )}
        {show.includes("device") && (
          <label className="flex flex-col gap-1 font-dm text-[11px] font-semibold uppercase tracking-[.06em] text-[var(--a-ink-3)]">
            Device
            <select name="device" defaultValue={f.device ?? ""} className={field}>
              <option value="">All</option>
              <option value="desktop">Desktop</option>
              <option value="mobile">Mobile</option>
              <option value="tablet">Tablet</option>
            </select>
          </label>
        )}
        {show.includes("country") && (
          <label className="flex flex-col gap-1 font-dm text-[11px] font-semibold uppercase tracking-[.06em] text-[var(--a-ink-3)]">
            Country
            <select name="country" defaultValue={f.country ?? ""} className={field}>
              <option value="">All</option>
              {[...new Set([...(f.country ? [f.country] : []), ...countries])].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>
        )}
        {show.includes("source") && (
          <label className="flex flex-col gap-1 font-dm text-[11px] font-semibold uppercase tracking-[.06em] text-[var(--a-ink-3)]">
            Source
            <select name="source" defaultValue={f.source ?? ""} className={field}>
              <option value="">All</option>
              {[...new Set([...(f.source ? [f.source] : []), ...sources])].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>
        )}
        {show.includes("outcome") && outcomes && (
          <label className="flex flex-col gap-1 font-dm text-[11px] font-semibold uppercase tracking-[.06em] text-[var(--a-ink-3)]">
            Outcome
            <select name="outcome" defaultValue={f.outcome ?? ""} className={field}>
              <option value="">All</option>
              {outcomes.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </label>
        )}
        {show.includes("q") && (
          <label className="flex min-w-[160px] flex-1 flex-col gap-1 font-dm text-[11px] font-semibold uppercase tracking-[.06em] text-[var(--a-ink-3)] sm:max-w-xs">
            Domain
            <input type="search" name="q" defaultValue={f.q ?? ""} placeholder="example.com" className={field} />
          </label>
        )}
        <button type="submit" className="h-9 rounded-[var(--a-radius-control)] bg-[var(--a-blue)] px-4 font-dm text-[13px] font-semibold text-white hover:opacity-90">
          Apply
        </button>
        <Link href={base} className="inline-flex h-9 items-center px-2 font-dm text-[13px] font-semibold text-[var(--a-ink-3)] hover:text-[var(--a-ink)]">
          Reset
        </Link>
      </form>
    </div>
  );
}

/** "▲ 12%" against the previous period, or "new". */
export function Trend({ cur, prev, invert = false }: { cur: number; prev: number; invert?: boolean }) {
  if (cur === prev) return <span className="text-[var(--a-ink-3)]">=</span>;
  if (prev === 0) return <span className="text-[var(--a-ink-3)]">new</span>;
  const p = Math.round(((cur - prev) / prev) * 100);
  const good = invert ? p < 0 : p > 0;
  return <span className={good ? "text-[var(--a-success)]" : "text-[var(--a-danger)]"}>{p > 0 ? "▲" : "▼"} {Math.abs(p)}%</span>;
}

export function Bar({ value, max, color = "#2251A3" }: { value: number; max: number; color?: string }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-[var(--a-surface-2)]">
      <div className="h-full rounded-full" style={{ width: `${max ? Math.min(100, (value / max) * 100) : 0}%`, background: color }} />
    </div>
  );
}

export const thc = "py-2 pr-4 font-semibold whitespace-nowrap";
export const tdc = "py-2.5 pr-4 align-top";
export const theadRow = "border-b border-[var(--a-border)] text-left text-[11px] uppercase tracking-[.08em] text-[var(--a-ink-3)]";

export function Tile({ label, value, sub }: { label: string; value: ReactNode; sub?: ReactNode }) {
  return (
    <div className="min-w-0 rounded-[var(--a-radius-card)] border border-[var(--a-border)] bg-[var(--a-surface)] p-4 shadow-[var(--a-shadow-card)]">
      <p className="a-micro leading-snug">{label}</p>
      <p className="mt-2 font-dm text-[24px] font-bold leading-none tracking-tight text-[var(--a-ink)] tabular-nums">{value}</p>
      {sub && <p className="mt-1 font-dm text-xs text-[var(--a-ink-3)]">{sub}</p>}
    </div>
  );
}
