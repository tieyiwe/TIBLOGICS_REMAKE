// Small server-rendered building blocks for /admin_pro/analytics: no client JS,
// no chart library. Bars are CSS with native hover titles; every chart has a
// CSV of the same numbers (the "table view").
import type { ReactNode } from "react";
import { Download } from "lucide-react";
import type { DayPoint, Pair, RangeDays } from "@/lib/admin/analytics";

export const money = (cents: number) =>
  `$${(cents / 100).toLocaleString("en-US", { maximumFractionDigits: cents % 100 === 0 || cents >= 100_000 ? 0 : 2 })}`;
export const int = (n: number) => n.toLocaleString("en-US");
export const pct = (n: number, d: number) => (d ? `${Math.round((n / d) * 100)}%` : "–");

/** Change vs the previous period. No percentage "up from nothing". */
export function Delta({ v, invert = false }: { v: Pair; invert?: boolean }) {
  if (v.cur === v.prev) return <span className="text-[#7A8FA6]">no change</span>;
  if (v.prev === 0) return <span className="text-[#7A8FA6]">from 0</span>;
  const p = Math.round(((v.cur - v.prev) / v.prev) * 100);
  const good = invert ? p < 0 : p > 0;
  return (
    <span className={good ? "text-[#0F6E56]" : "text-[#B42318]"}>
      {p > 0 ? "▲" : "▼"} {Math.abs(p)}%
    </span>
  );
}

export function Kpi({
  label, value, pair, note, invert, prevLabel,
}: { label: string; value: string; pair?: Pair; note?: ReactNode; invert?: boolean; prevLabel?: string }) {
  return (
    <div className="bg-white border border-[#D2DCE8] rounded-2xl p-4 min-w-0">
      <p className="font-dm text-xs text-[#7A8FA6] leading-snug">{label}</p>
      <p className="mt-1 font-syne font-bold text-2xl text-[#0D1B2A] tabular-nums">{value}</p>
      {pair && (
        <p className="mt-1 font-dm text-xs">
          <Delta v={pair} invert={invert} />{" "}
          <span className="text-[#7A8FA6]">vs {prevLabel ?? int(pair.prev)} before</span>
        </p>
      )}
      {note && <p className="mt-1 font-dm text-[11px] text-[#7A8FA6] leading-snug">{note}</p>}
    </div>
  );
}

export function Card({
  title, subtitle, csv, range, children, className = "",
}: { title: string; subtitle?: ReactNode; csv?: string; range: RangeDays; children: ReactNode; className?: string }) {
  return (
    <section className={`bg-white border border-[#D2DCE8] rounded-2xl p-4 sm:p-6 min-w-0 ${className}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-syne font-bold text-base text-[#0D1B2A]">{title}</h3>
          {subtitle && <p className="font-dm text-xs text-[#7A8FA6] mt-0.5">{subtitle}</p>}
        </div>
        {csv && (
          <a
            href={`/api/admin/analytics/export?table=${csv}&range=${range}`}
            className="inline-flex items-center gap-1 rounded-lg border border-[#D2DCE8] px-2.5 py-1 font-dm text-xs text-[#2251A3] hover:bg-[#F4F7FB]"
          >
            <Download size={12} /> CSV
          </a>
        )}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function SectionTitle({ children, id }: { children: ReactNode; id: string }) {
  return (
    <h2 id={id} className="font-syne font-bold text-lg text-[#0D1B2A] pt-2 scroll-mt-4">
      {children}
    </h2>
  );
}

const shortDay = (d: string) =>
  new Date(`${d}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

/** Daily single-series column chart. Hover a column for its exact value. */
export function DayBars({ data, format = int, label }: { data: DayPoint[]; format?: (n: number) => string; label: string }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const total = data.reduce((n, d) => n + d.value, 0);
  if (total === 0) return <p className="py-8 text-center font-dm text-sm text-[#7A8FA6]">Nothing in this period.</p>;
  const gap = data.length > 45 ? "gap-px" : "gap-0.5";
  return (
    <figure>
      <div className="flex items-stretch gap-2">
        <div className="flex flex-col justify-between font-dm text-[10px] text-[#7A8FA6] tabular-nums text-right w-12 shrink-0">
          <span>{format(max)}</span>
          <span>0</span>
        </div>
        <div className={`relative flex-1 h-36 flex items-end ${gap} border-b border-[#D2DCE8]`} role="img" aria-label={`${label}, daily`}>
          <div className="pointer-events-none absolute inset-x-0 top-0 border-t border-dashed border-[#E8EFF8]" />
          {data.map((d) => (
            <div key={d.day} className="group relative flex-1 h-full flex items-end" title={`${shortDay(d.day)}: ${format(d.value)}`}>
              <div
                className="w-full rounded-t-[3px] bg-[#2251A3] group-hover:bg-[#F47C20] transition-colors"
                style={{ height: d.value ? `max(2px, ${(d.value / max) * 100}%)` : 0 }}
              />
            </div>
          ))}
        </div>
      </div>
      <div className="ml-14 mt-1 flex justify-between font-dm text-[10px] text-[#7A8FA6]">
        <span>{shortDay(data[0].day)}</span>
        {data.length > 2 && <span>{shortDay(data[Math.floor(data.length / 2)].day)}</span>}
        <span>{shortDay(data[data.length - 1].day)}</span>
      </div>
    </figure>
  );
}

/** Horizontal bar used in lists (funnel, sources). */
export function Meter({ value, max, color = "#2251A3" }: { value: number; max: number; color?: string }) {
  return (
    <div className="h-2 rounded-full bg-[#F4F7FB] overflow-hidden">
      <div className="h-full rounded-full" style={{ width: `${max ? Math.min(100, (value / max) * 100) : 0}%`, background: color }} />
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="py-6 text-center font-dm text-sm text-[#7A8FA6]">{children}</p>;
}

export const th = "py-2 pr-4 font-semibold whitespace-nowrap";
export const td = "py-2.5 pr-4 align-top";
