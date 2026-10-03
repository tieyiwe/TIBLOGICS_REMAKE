"use client";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";

/**
 * Paid revenue per month, in whole dollars.
 *
 * Used to render a hardcoded six-month curve that was not in the database, and
 * its axis divided by 100 as if the values were cents while the data was in
 * dollars. Callers now pass real figures (lib/admin/metrics.ts) in dollars.
 */
export default function RevenueChart({
  data,
  title = "Revenue Trend",
  subtitle = "Last 6 months",
}: {
  data: Array<{ month: string; revenue: number }>;
  title?: string;
  subtitle?: string;
}) {
  const empty = data.every((d) => d.revenue === 0);
  return (
    <div className="col-span-2 min-w-0 rounded-[var(--a-radius-card,14px)] border border-[var(--a-border,#E3E9F1)] bg-[var(--a-surface,#fff)] p-5 shadow-[0_1px_2px_rgba(13,27,42,.04)]">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-dm text-[14px] font-semibold text-[var(--a-ink,#0D1B2A)]">{title}</h3>
        <span className="font-dm text-xs text-[var(--a-ink-3,#5A6E84)]">{subtitle}</span>
      </div>
      {empty && (
        <p className="mb-2 font-dm text-xs text-[var(--a-ink-3,#5A6E84)]">
          No paid revenue recorded in this period. Store orders, paid event registrations and paid bookings appear here once they come in.
        </p>
      )}
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E8EFF8" />
          <XAxis
            dataKey="month"
            tick={{ fill: "#7A8FA6", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "#7A8FA6", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `$${Number(v).toLocaleString()}`}
          />
          <Tooltip
            formatter={(v: number) => [`$${Number(v).toLocaleString()}`, "Revenue"]}
          />
          <Line
            type="monotone"
            dataKey="revenue"
            stroke="#1B3A6B"
            strokeWidth={2}
            dot={{ fill: "#F47C20", strokeWidth: 0, r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
