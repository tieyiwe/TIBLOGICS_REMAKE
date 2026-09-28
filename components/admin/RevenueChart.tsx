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
    <div className="bg-white border border-[#D2DCE8] rounded-2xl p-6 col-span-2">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-syne font-bold text-base text-[#0D1B2A]">{title}</h3>
        <span className="text-[#7A8FA6] text-xs font-dm">{subtitle}</span>
      </div>
      {empty && (
        <p className="mb-2 text-xs font-dm text-[#7A8FA6]">
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
