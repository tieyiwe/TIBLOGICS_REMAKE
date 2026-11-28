// Small, single-series charts for the team dashboard. One hue (magnitude),
// thin bars with rounded data ends, values printed beside each bar so the
// numbers never depend on colour, and a native tooltip on hover.

export function BarList({
  items,
  max,
  unit,
  empty,
}: {
  items: Array<{ key: string; label: string; sub?: string; value: number; note?: string }>;
  max: number;
  unit: string;
  empty: string;
}) {
  if (items.length === 0) return <p className="mt-4 text-sm text-[var(--ink3)]">{empty}</p>;
  return (
    <ul className="mt-4 space-y-3">
      {items.map((x) => (
        <li key={x.key} title={`${x.label}: ${x.value}${unit}${x.note ? ` (${x.note})` : ""}`}>
          <div className="flex items-baseline justify-between gap-3 text-xs">
            <span className="min-w-0 truncate font-semibold text-[var(--ink)]">
              {x.label}
              {x.sub && <span className="font-normal text-[var(--ink3)]"> · {x.sub}</span>}
            </span>
            <span className="shrink-0 font-bold tabular-nums text-[var(--ink)]">
              {x.value}
              {unit}
            </span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-[var(--s3)]">
            <div className="h-full rounded-full bg-[var(--blue2)]" style={{ width: `${Math.max(0, Math.min(100, (x.value / max) * 100))}%` }} />
          </div>
          {x.note && <p className="mt-0.5 text-[11px] text-[var(--ink3)]">{x.note}</p>}
        </li>
      ))}
    </ul>
  );
}

export function WeekBars({ weeks, unitLabel }: { weeks: Array<{ label: string; value: number }>; unitLabel: string }) {
  const max = Math.max(1, ...weeks.map((w) => w.value));
  return (
    <div className="mt-4">
      <div className="flex h-32 items-end gap-1" role="img" aria-label={weeks.map((w) => `${w.label}: ${w.value} ${unitLabel}`).join(", ")}>
        {weeks.map((w) => (
          <div key={w.label} className="group relative flex h-full flex-1 flex-col justify-end" title={`${w.label}: ${w.value} ${unitLabel}`}>
            {w.value > 0 && <span className="mb-0.5 text-center text-[10px] font-bold tabular-nums text-[var(--ink2)]">{w.value}</span>}
            <div className="rounded-t-[4px] bg-[var(--blue2)] group-hover:opacity-80" style={{ height: `${(w.value / max) * 85}%`, minHeight: w.value > 0 ? 3 : 1 }} />
          </div>
        ))}
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-[var(--ink3)]">
        <span>{weeks[0]?.label}</span>
        <span>{weeks[weeks.length - 1]?.label}</span>
      </div>
    </div>
  );
}
