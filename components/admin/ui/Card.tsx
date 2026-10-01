import Link from "next/link";
import type { ElementType, ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export function Card({
  title,
  subtitle,
  action,
  children,
  padded = true,
  className,
  bodyClassName,
  icon: Icon,
  id,
}: {
  title?: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  children?: ReactNode;
  padded?: boolean;
  className?: string;
  bodyClassName?: string;
  icon?: ElementType;
  id?: string;
}) {
  return (
    <section
      id={id}
      className={cn(
        "min-w-0 rounded-[var(--a-radius-card)] border border-[var(--a-border)] bg-[var(--a-surface)] shadow-[var(--a-shadow-card)]",
        className,
      )}
    >
      {title || action ? (
        <header className="flex items-start justify-between gap-3 border-b border-[var(--a-border)] px-5 py-3.5">
          <div className="min-w-0">
            {title ? (
              <h2 className="flex items-center gap-2 font-dm text-[14px] font-semibold text-[var(--a-ink)]">
                {Icon ? <Icon size={16} className="text-[var(--a-ink-3)]" aria-hidden /> : null}
                {title}
              </h2>
            ) : null}
            {subtitle ? <p className="mt-0.5 font-dm text-[12.5px] text-[var(--a-ink-3)]">{subtitle}</p> : null}
          </div>
          {action ? <div className="flex shrink-0 items-center gap-2">{action}</div> : null}
        </header>
      ) : null}
      <div className={cn(padded && "p-5", bodyClassName)}>{children}</div>
    </section>
  );
}

export type StatTone = "default" | "navy" | "orange" | "success" | "warn" | "danger";

function Sparkline({ data, tone }: { data: number[]; tone: StatTone }) {
  if (data.length < 2) return null;
  const w = 96;
  const h = 28;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const pts = data.map((v, i) => [(i / (data.length - 1)) * w, h - 2 - ((v - min) / span) * (h - 4)]);
  const d = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const stroke = tone === "orange" ? "var(--a-orange)" : tone === "success" ? "var(--a-success)" : "var(--a-blue)";
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden className="shrink-0 overflow-visible">
      <path d={`${d} L${w},${h} L0,${h} Z`} fill={stroke} opacity={0.08} />
      <path d={d} fill="none" stroke={stroke} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * KPI tile. `delta` is a percentage (e.g. 12.5 for +12.5%) or a preformatted
 * string. Positive numbers render green, negative red; set `invertDelta` when
 * down is good.
 */
export function StatCard({
  label,
  value,
  delta,
  deltaLabel,
  hint,
  href,
  tone = "default",
  spark,
  icon: Icon,
  invertDelta,
  className,
}: {
  label: string;
  value: ReactNode;
  delta?: number | string | null;
  deltaLabel?: string;
  hint?: ReactNode;
  href?: string;
  tone?: StatTone;
  spark?: number[];
  icon?: ElementType;
  invertDelta?: boolean;
  className?: string;
}) {
  let deltaEl: ReactNode = null;
  if (delta !== undefined && delta !== null && delta !== "") {
    const n = typeof delta === "number" ? delta : parseFloat(String(delta));
    const good = isNaN(n) || n === 0 ? null : invertDelta ? n < 0 : n > 0;
    const DIcon = isNaN(n) || n === 0 ? Minus : n > 0 ? ArrowUpRight : ArrowDownRight;
    const text = typeof delta === "number" ? `${delta > 0 ? "+" : ""}${Math.round(delta * 10) / 10}%` : delta;
    deltaEl = (
      <span
        className={cn(
          "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[12px] font-semibold tabular-nums",
          good === null
            ? "bg-[var(--a-surface-2)] text-[var(--a-ink-3)]"
            : good
              ? "bg-[var(--a-success-bg)] text-[var(--a-success)]"
              : "bg-[var(--a-danger-bg)] text-[var(--a-danger)]",
        )}
      >
        <DIcon size={12} aria-hidden />
        {text}
      </span>
    );
  }
  const accent =
    tone === "navy"
      ? "before:bg-[var(--a-navy)]"
      : tone === "orange"
        ? "before:bg-[var(--a-orange)]"
        : tone === "success"
          ? "before:bg-[var(--a-success)]"
          : tone === "warn"
            ? "before:bg-[var(--a-warn)]"
            : tone === "danger"
              ? "before:bg-[var(--a-danger)]"
              : "before:bg-transparent";
  const inner = (
    <>
      <div className="flex items-center justify-between gap-2">
        <p className="a-micro truncate">{label}</p>
        {Icon ? <Icon size={16} className="shrink-0 text-[var(--a-ink-3)]" aria-hidden /> : null}
      </div>
      <div className="mt-2 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-dm text-[26px] font-bold leading-none tracking-tight text-[var(--a-ink)] tabular-nums">{value}</p>
          {deltaEl || hint ? (
            <div className="mt-2 flex flex-wrap items-center gap-1.5 font-dm text-[12px] text-[var(--a-ink-3)]">
              {deltaEl}
              {deltaLabel ? <span>{deltaLabel}</span> : null}
              {hint && !deltaLabel ? <span className="truncate">{hint}</span> : null}
            </div>
          ) : null}
          {hint && deltaLabel ? <p className="mt-1 truncate font-dm text-[12px] text-[var(--a-ink-3)]">{hint}</p> : null}
        </div>
        {spark && spark.length > 1 ? <Sparkline data={spark} tone={tone} /> : null}
      </div>
    </>
  );
  const cls = cn(
    "relative block min-w-0 overflow-hidden rounded-[var(--a-radius-card)] border border-[var(--a-border)] bg-[var(--a-surface)] p-4 shadow-[var(--a-shadow-card)]",
    "before:absolute before:inset-y-0 before:left-0 before:w-[3px] before:content-['']",
    accent,
    href && "transition-colors duration-150 hover:border-[var(--a-border-strong)] hover:bg-[#fbfcfe]",
    className,
  );
  return href ? (
    <Link href={href} className={cls}>
      {inner}
    </Link>
  ) : (
    <div className={cls}>{inner}</div>
  );
}
