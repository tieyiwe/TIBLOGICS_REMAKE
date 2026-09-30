"use client";

import { useEffect, useRef, useState } from "react";

// Categorical palette in fixed order (validated reference palette).
export const SERIES = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300", "#4a3aa7", "#e34948"];

const CH = 220;
const PAD = { l: 38, r: 16, t: 12, b: 26 };

export default function Chart({
  series,
  names,
  title,
  stepLabel,
  tableLabel,
}: {
  series: number[][];
  names: string[];
  title: string;
  stepLabel: string;
  tableLabel: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  // Draw in real pixels so axis text stays readable on phones and desktops.
  const wrap = useRef<HTMLDivElement>(null);
  const [CW, setCW] = useState(600);
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setCW(Math.max(260, Math.round(el.clientWidth))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const steps = series[0]?.length ?? 0;
  const maxV = Math.max(200, ...series.flat());
  const yMax = Math.ceil(maxV / 50) * 50;
  const x = (i: number) => PAD.l + (i / Math.max(1, steps - 1)) * (CW - PAD.l - PAD.r);
  const y = (v: number) => PAD.t + (1 - v / yMax) * (CH - PAD.t - PAD.b);
  const ticks = [0, yMax / 4, yMax / 2, (3 * yMax) / 4, yMax];

  return (
    <figure className="m-0">
      <figcaption className="text-sm font-bold text-[var(--ink)]">{title}</figcaption>
      <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1" aria-hidden="true">
        {names.map((n, i) => (
          <li key={i} className="flex items-center gap-1.5 text-xs text-[var(--ink2)]">
            <span className="h-0.5 w-4 rounded" style={{ background: SERIES[i % SERIES.length] }} />
            {n}
          </li>
        ))}
      </ul>
      <div ref={wrap} className="relative mt-2">
        <svg
          viewBox={`0 0 ${CW} ${CH}`}
          className="block touch-none"
          width={CW}
          height={CH}
          aria-hidden="true"
          onPointerMove={(e) => {
            const r = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
            const px = ((e.clientX - r.left) / r.width) * CW;
            const i = Math.round(((px - PAD.l) / (CW - PAD.l - PAD.r)) * (steps - 1));
            setHover(i >= 0 && i < steps ? i : null);
          }}
          onPointerLeave={() => setHover(null)}
        >
          {ticks.map((tk) => (
            <g key={tk}>
              <line x1={PAD.l} x2={CW - PAD.r} y1={y(tk)} y2={y(tk)} stroke={tk === 100 ? "#B8C4D3" : "#E8EFF8"} strokeDasharray={tk === 100 ? "4 4" : undefined} />
              <text x={PAD.l - 6} y={y(tk) + 4} textAnchor="end" fontSize="10" fill="#7A8FA6">
                {Math.round(tk)}
              </text>
            </g>
          ))}
          {(CW < 400 ? [0, 10, 20] : [0, 5, 10, 15, 20]).filter((s) => s < steps).map((s) => (
            <text key={s} x={x(s)} y={CH - 8} textAnchor="middle" fontSize="10" fill="#7A8FA6">
              {s}
            </text>
          ))}
          {series.map((s, i) => (
            <polyline
              key={i}
              points={s.map((v, k) => `${x(k).toFixed(1)},${y(v).toFixed(1)}`).join(" ")}
              fill="none"
              stroke={SERIES[i % SERIES.length]}
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          ))}
          {hover !== null && (
            <g>
              <line x1={x(hover)} x2={x(hover)} y1={PAD.t} y2={CH - PAD.b} stroke="#0D1B2A" strokeOpacity="0.3" />
              {series.map((s, i) => (
                <circle key={i} cx={x(hover)} cy={y(s[hover])} r="4" fill={SERIES[i % SERIES.length]} stroke="white" strokeWidth="2" />
              ))}
            </g>
          )}
        </svg>
        {hover !== null && (
          <div
            className="pointer-events-none absolute top-1 rounded-lg border border-[#D2DCE8] bg-white px-2 py-1.5 text-[11px] shadow-md"
            style={{ left: `${Math.min(70, (x(hover) / CW) * 100)}%` }}
          >
            <p className="font-bold text-[var(--ink)]">
              {stepLabel} {hover}
            </p>
            {series.map((s, i) => (
              <p key={i} className="flex items-center gap-1.5 text-[var(--ink2)]">
                <span className="h-2 w-2 rounded-full" style={{ background: SERIES[i % SERIES.length] }} />
                {names[i]}: <strong className="text-[var(--ink)]">{Math.round(s[hover])}</strong>
              </p>
            ))}
          </div>
        )}
      </div>
      <details className="mt-2 text-xs">
        <summary className="cursor-pointer font-semibold text-[var(--ink2)]">{tableLabel}</summary>
        <div className="mt-1 overflow-x-auto">
          <table className="min-w-full text-left">
            <thead>
              <tr>
                <th className="pr-2 font-semibold">{stepLabel}</th>
                {names.map((n, i) => (
                  <th key={i} className="pr-2 font-semibold">{n}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: steps }, (_, k) => k)
                .filter((k) => k % 2 === 0)
                .map((k) => (
                  <tr key={k}>
                    <td className="pr-2">{k}</td>
                    {series.map((s, i) => (
                      <td key={i} className="pr-2 tabular-nums">{Math.round(s[k])}</td>
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
