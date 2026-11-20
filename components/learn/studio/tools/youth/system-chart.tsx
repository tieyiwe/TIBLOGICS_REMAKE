"use client";

import { useEffect, useRef, useState } from "react";
import { niceStep } from "./system-model";

// Line chart for the System Mapper: every shown part's value per step, drawn
// up to the current step of the playback. A table of the same numbers is one
// click away for screen readers and anyone who prefers numbers.

export const SERIES = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300", "#4a3aa7", "#e34948"];
const PAD = { l: 44, r: 14, t: 12, b: 26 };

export default function SystemChart({
  series,
  names,
  colors,
  upTo,
  title,
  stepLabel,
  tableLabel,
}: {
  series: number[][];
  names: string[];
  colors: string[];
  /** Draw lines up to this step. */
  upTo: number;
  title: string;
  stepLabel: string;
  tableLabel: string;
}) {
  const wrap = useRef<HTMLDivElement>(null);
  const [CW, setCW] = useState(560);
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setCW(Math.max(260, Math.round(el.clientWidth))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const CH = 200;
  const steps = series[0]?.length ?? 0;
  const maxV = Math.max(10, ...series.flat());
  const st = niceStep(maxV);
  const yMax = Math.ceil(maxV / st) * st;
  const ticks = Array.from({ length: Math.round(yMax / st) + 1 }, (_, i) => i * st);
  const x = (i: number) => PAD.l + (i / Math.max(1, steps - 1)) * (CW - PAD.l - PAD.r);
  const y = (v: number) => PAD.t + (1 - v / yMax) * (CH - PAD.t - PAD.b);
  const last = Math.min(upTo, steps - 1);

  return (
    <figure className="m-0" data-testid="sm-chart">
      <figcaption className="text-sm font-bold text-[var(--ink)]">{title}</figcaption>
      <ul className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
        {names.map((n, i) => (
          <li key={i} className="flex items-center gap-1.5 text-xs text-[var(--ink2)]">
            <span className="h-0.5 w-4 rounded" style={{ background: colors[i] }} aria-hidden="true" />
            {n}: <strong className="tabular-nums text-[var(--ink)]">{Math.round(series[i]?.[last] ?? 0)}</strong>
          </li>
        ))}
      </ul>
      <div ref={wrap} className="mt-2">
        <svg viewBox={`0 0 ${CW} ${CH}`} width={CW} height={CH} className="block" aria-hidden="true">
          {ticks.map((tk) => (
            <g key={tk}>
              <line x1={PAD.l} x2={CW - PAD.r} y1={y(tk)} y2={y(tk)} stroke="#E8EFF8" />
              <text x={PAD.l - 6} y={y(tk) + 4} textAnchor="end" fontSize="10" fill="#7A8FA6">
                {tk >= 1000 ? `${Math.round(tk / 100) / 10}k` : tk}
              </text>
            </g>
          ))}
          {[0, 5, 10, 15, 20].filter((s) => s < steps).map((s) => (
            <text key={s} x={x(s)} y={CH - 8} textAnchor="middle" fontSize="10" fill="#7A8FA6">
              {s}
            </text>
          ))}
          <line x1={x(last)} x2={x(last)} y1={PAD.t} y2={CH - PAD.b} stroke="#0D1B2A" strokeOpacity="0.25" strokeDasharray="3 3" />
          {series.map((s, i) => (
            <g key={i}>
              <polyline
                points={s
                  .slice(0, last + 1)
                  .map((v, k) => `${x(k).toFixed(1)},${y(v).toFixed(1)}`)
                  .join(" ")}
                fill="none"
                stroke={colors[i]}
                strokeWidth="2.25"
                strokeLinejoin="round"
                strokeLinecap="round"
                strokeDasharray={i % 2 ? "6 3" : undefined}
              />
              <circle cx={x(last)} cy={y(s[last] ?? 0)} r="3.5" fill={colors[i]} stroke="white" strokeWidth="1.5" />
            </g>
          ))}
        </svg>
      </div>
      <details className="mt-1 text-xs">
        <summary className="cursor-pointer font-semibold text-[var(--ink2)]">{tableLabel}</summary>
        <div className="mt-1 overflow-x-auto">
          <table className="min-w-full text-left">
            <thead>
              <tr>
                <th className="pr-2 font-semibold">{stepLabel}</th>
                {names.map((n, i) => (
                  <th key={i} className="pr-2 font-semibold">
                    {n}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: last + 1 }, (_, k) => k).map((k) => (
                <tr key={k}>
                  <td className="pr-2">{k}</td>
                  {series.map((s, i) => (
                    <td key={i} className="pr-2 tabular-nums">
                      {Math.round(s[k])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}
