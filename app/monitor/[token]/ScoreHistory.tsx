// Overall score per site across runs, as a plain SVG line chart. Rendered on
// the server; there is nothing to interact with.

import { getT } from "@/lib/i18n/server";

const COLORS = ["#F47C20", "#2251A3", "#0F6E56", "#7c3aed"];

interface Point {
  at: string;
  sites: Array<{ host: string; isOwn: boolean; overall: number | null }>;
}

/** `at` is the run's date, already short and in the reader's locale. */
export default async function ScoreHistory({ history }: { history: Point[] }) {
  const t = await getT();
  const W = 640, H = 220, L = 32, R = 12, T = 12, B = 28;
  const hosts: Array<{ host: string; isOwn: boolean }> = [];
  for (const p of history) {
    for (const s of p.sites) if (!hosts.some((h) => h.host === s.host)) hosts.push({ host: s.host, isOwn: s.isOwn });
  }
  hosts.sort((a, b) => Number(b.isOwn) - Number(a.isOwn));

  const x = (i: number) => L + (history.length === 1 ? 0 : (i * (W - L - R)) / (history.length - 1));
  const y = (v: number) => T + ((100 - v) * (H - T - B)) / 100;

  const lines = hosts.map((h, hi) => {
    const pts = history
      .map((p, i) => ({ i, v: p.sites.find((s) => s.host === h.host)?.overall ?? null }))
      .filter((p): p is { i: number; v: number } => p.v != null);
    return { ...h, color: COLORS[hi % COLORS.length], pts };
  });

  // Label roughly six dates so they never overlap.
  const every = Math.max(1, Math.ceil(history.length / 6));

  return (
    <section className="bg-white border border-[#D2DCE8] rounded-2xl p-5 md:p-6">
      <h2 className="font-syne font-bold text-base text-[#0D1B2A]">{t("tools.dash.chartTitle")}</h2>
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
        {lines.map((l) => (
          <span key={l.host} className="inline-flex items-center gap-1.5 font-dm text-xs text-[#3A4A5C]">
            <span className="w-3 h-1 rounded-full" style={{ background: l.color }} />
            {l.host}
            {l.isOwn && ` ${t("tools.dash.chartYou")}`}
          </span>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto mt-3" role="img" aria-label={t("tools.dash.chartAria")}>
        {[0, 25, 50, 75, 100].map((v) => (
          <g key={v}>
            <line x1={L} x2={W - R} y1={y(v)} y2={y(v)} stroke="#EEF2F7" />
            <text x={L - 6} y={y(v) + 4} textAnchor="end" fontSize="10" fill="#7A8FA6">{v}</text>
          </g>
        ))}
        {history.map((p, i) =>
          i % every === 0 || i === history.length - 1 ? (
            <text
              key={i}
              x={x(i)}
              y={H - 8}
              // The end labels would be clipped by the chart edge if centred.
              textAnchor={history.length > 1 && i === history.length - 1 ? "end" : i === 0 ? "start" : "middle"}
              fontSize="10"
              fill="#7A8FA6"
            >
              {p.at}
            </text>
          ) : null,
        )}
        {lines.map((l) => (
          <g key={l.host}>
            <polyline
              fill="none"
              stroke={l.color}
              strokeWidth={l.isOwn ? 3 : 2}
              strokeOpacity={l.isOwn ? 1 : 0.7}
              points={l.pts.map((p) => `${x(p.i)},${y(p.v)}`).join(" ")}
            />
            {l.pts.map((p) => (
              <circle key={p.i} cx={x(p.i)} cy={y(p.v)} r={l.isOwn ? 3.5 : 2.5} fill={l.color} />
            ))}
          </g>
        ))}
      </svg>
    </section>
  );
}
