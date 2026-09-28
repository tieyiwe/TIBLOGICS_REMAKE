"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useT } from "@/lib/i18n/client";
import { COST_CATEGORIES } from "@/lib/calculator/types";
import { CATEGORY_COLORS } from "./colors";
import { useCalc, useFmt } from "./context";


const AXIS = { fontSize: 12, fill: "#5B6B7F", fontFamily: "inherit" };

export default function ScenarioCharts() {
  const t = useT();
  const f = useFmt();
  const { inputs, results } = useCalc();

  const data = results.scenarios.map((s) => ({
    name: t(`calculator.scenario.${s.key}`),
    ...s.m.categories,
    margin: s.m.grossMarginPct === null ? null : Math.round(s.m.grossMarginPct * 10) / 10,
  }));
  const margins = data.map((d) => d.margin).filter((x): x is number => x !== null);
  // Start the axis at 0 unless a scenario loses money.
  const lowest = margins.length ? Math.min(...margins) : 0;
  const floor = lowest < 0 ? Math.floor((lowest - 5) / 10) * 10 : 0;

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <figure className="min-w-0">
        <figcaption className="font-syne font-bold text-sm text-[#0D1B2A] mb-2">{t("calculator.charts.costTitle")}</figcaption>
        <div className="h-[300px]" role="img" aria-label={t("calculator.charts.costAria")}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: 8 }} barCategoryGap="28%">
              <CartesianGrid vertical={false} stroke="#E4EAF2" />
              <XAxis dataKey="name" tick={AXIS} tickLine={false} axisLine={{ stroke: "#C3CFDD" }} />
              <YAxis
                tick={AXIS}
                tickLine={false}
                axisLine={false}
                width={64}
                tickFormatter={(v: number) => f.compact(v)}
                label={{ value: t("calculator.charts.costAxis"), angle: -90, position: "insideLeft", offset: 0, style: { ...AXIS, textAnchor: "middle" } }}
              />
              <Tooltip
                cursor={{ fill: "rgba(34,81,163,0.06)" }}
                formatter={(v: number, key: string) => [f.money(v), t(`calculator.cat.${key}`)]}
                contentStyle={{ borderRadius: 12, borderColor: "#D2DCE8", fontSize: 12 }}
              />
              <Legend
                formatter={(key: string) => <span className="font-dm text-xs text-[#3A4A5C]">{t(`calculator.cat.${key}`)}</span>}
                wrapperStyle={{ paddingTop: 8 }}
              />
              {COST_CATEGORIES.map((c) => (
                <Bar key={c} dataKey={c} stackId="cost" fill={CATEGORY_COLORS[c]} stroke="#FFFFFF" strokeWidth={2} maxBarSize={72} isAnimationActive={false} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </figure>

      <figure className="min-w-0">
        <figcaption className="font-syne font-bold text-sm text-[#0D1B2A] mb-2">{t("calculator.charts.marginTitle")}</figcaption>
        <div className="h-[300px]" role="img" aria-label={t("calculator.charts.marginAria")}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 16, right: 24, bottom: 8, left: 8 }}>
              <CartesianGrid vertical={false} stroke="#E4EAF2" />
              <XAxis dataKey="name" tick={AXIS} tickLine={false} axisLine={{ stroke: "#C3CFDD" }} padding={{ left: 24, right: 24 }} />
              <YAxis
                tick={AXIS}
                tickLine={false}
                axisLine={false}
                width={64}
                domain={[floor, 100]}
                tickFormatter={(v: number) => `${v}%`}
                label={{ value: t("calculator.charts.marginAxis"), angle: -90, position: "insideLeft", offset: 0, style: { ...AXIS, textAnchor: "middle" } }}
              />
              <ReferenceLine
                y={inputs.targetMarginPct}
                stroke="#B8500A"
                strokeDasharray="5 4"
                label={{ value: t("calculator.charts.target", { pct: f.pct(inputs.targetMarginPct) }), position: "insideBottomRight", fill: "#9A4A00", fontSize: 11 }}
              />
              <ReferenceLine y={0} stroke="#9AA9BD" />
              <Tooltip
                formatter={(v: number) => [f.pct(v), t("calculator.pricing.grossMargin")]}
                contentStyle={{ borderRadius: 12, borderColor: "#D2DCE8", fontSize: 12 }}
              />
              <Line
                type="monotone"
                dataKey="margin"
                stroke="#1B3A6B"
                strokeWidth={2}
                dot={{ r: 5, fill: "#1B3A6B", stroke: "#FFFFFF", strokeWidth: 2 }}
                activeDot={{ r: 7 }}
                connectNulls
                isAnimationActive={false}
                label={{ position: "top", fontSize: 12, fill: "#0D1B2A", formatter: (v: number) => f.pct(v) }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </figure>
    </div>
  );
}
