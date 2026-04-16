"use client";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";

const data = [
  { month: "Nov", revenue: 0 },
  { month: "Dec", revenue: 2400 },
  { month: "Jan", revenue: 4900 },
  { month: "Feb", revenue: 3200 },
  { month: "Mar", revenue: 7900 },
  { month: "Apr", revenue: 5400 },
];

export default function RevenueChart() {
  return (
    <div className="bg-white border border-[#D2DCE8] rounded-2xl p-6 col-span-2">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-syne font-bold text-base text-[#0D1B2A]">Revenue Trend</h3>
        <span className="text-[#7A8FA6] text-xs font-dm">Last 6 months</span>
      </div>
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
            tickFormatter={(v) => `$${(v / 100).toFixed(0)}`}
          />
          <Tooltip
            formatter={(v: number) => [`$${(v / 100).toFixed(2)}`, "Revenue"]}
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
