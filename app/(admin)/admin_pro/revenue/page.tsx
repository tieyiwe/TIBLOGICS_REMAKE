"use client";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { DollarSign, TrendingUp, Calendar, Repeat } from "lucide-react";
import MetricCard from "@/components/admin/MetricCard";

const allTime = 24700;
const thisMonth = 5400;
const lastMonth = 7900;
const mrr = 549;

const revenueByService = [
  { service: "AI Strategy", revenue: 8910 },
  { service: "AI Readiness Audit", revenue: 4970 },
  { service: "Web Transformation", revenue: 5910 },
  { service: "AI Agents", revenue: 2970 },
  { service: "Discovery Call", revenue: 0 },
];

const monthlyTrend = [
  { month: "May", revenue: 0 },
  { month: "Jun", revenue: 0 },
  { month: "Jul", revenue: 2970 },
  { month: "Aug", revenue: 1970 },
  { month: "Sep", revenue: 4910 },
  { month: "Oct", revenue: 0 },
  { month: "Nov", revenue: 0 },
  { month: "Dec", revenue: 2400 },
  { month: "Jan", revenue: 4900 },
  { month: "Feb", revenue: 3200 },
  { month: "Mar", revenue: 7900 },
  { month: "Apr", revenue: 5400 },
];

const paidAppointments = [
  { id: "1", date: "Apr 10, 2026", name: "Michael Torres", service: "AI Strategy Session", amount: 29700, status: "COMPLETED" },
  { id: "2", date: "Apr 18, 2026", name: "Marcus Johnson", service: "AI Strategy Session", amount: 29700, status: "CONFIRMED" },
  { id: "3", date: "Mar 28, 2026", name: "Priya Nair", service: "Website AI Transformation", amount: 19700, status: "COMPLETED" },
  { id: "4", date: "Mar 15, 2026", name: "Fatou Balde", service: "AI Readiness Audit", amount: 49700, status: "COMPLETED" },
  { id: "5", date: "Feb 20, 2026", name: "Carlos Mendez", service: "AI Strategy Session", amount: 29700, status: "COMPLETED" },
];

const BAR_COLORS = ["#1B3A6B", "#2251A3", "#F47C20", "#0F6E56", "#7c3aed"];

export default function RevenuePage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-syne font-bold text-2xl text-[#0D1B2A]">Revenue</h1>
        <p className="font-dm text-sm text-[#7A8FA6] mt-0.5">Financial overview and earnings history</p>
      </div>

      {/* Top metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Total Revenue All Time"
          value={`$${(allTime / 100).toFixed(0)}`}
          icon={DollarSign}
          iconColor="#2251A3"
        />
        <MetricCard
          label="This Month"
          value={`$${(thisMonth / 100).toFixed(0)}`}
          change={-32}
          icon={TrendingUp}
          iconColor="#F47C20"
        />
        <MetricCard
          label="Last Month"
          value={`$${(lastMonth / 100).toFixed(0)}`}
          icon={Calendar}
          iconColor="#0F6E56"
        />
        <MetricCard
          label="MRR"
          value={`$${mrr}`}
          icon={Repeat}
          iconColor="#7c3aed"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by Service */}
        <div className="bg-white border border-[#D2DCE8] rounded-2xl p-6">
          <h3 className="font-syne font-bold text-base text-[#0D1B2A] mb-4">Revenue by Service</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={revenueByService} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8EFF8" vertical={false} />
              <XAxis
                dataKey="service"
                tick={{ fill: "#7A8FA6", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#7A8FA6", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `$${(v / 100).toFixed(0)}`}
              />
              <Tooltip
                formatter={(v: number) => [`$${(v / 100).toFixed(2)}`, "Revenue"]}
                cursor={{ fill: "#F4F7FB" }}
              />
              <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
                {revenueByService.map((_, i) => (
                  <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly Trend */}
        <div className="bg-white border border-[#D2DCE8] rounded-2xl p-6">
          <h3 className="font-syne font-bold text-base text-[#0D1B2A] mb-4">Monthly Trend</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8EFF8" />
              <XAxis
                dataKey="month"
                tick={{ fill: "#7A8FA6", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#7A8FA6", fontSize: 11 }}
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
      </div>

      {/* Paid Appointments Table */}
      <div className="bg-white border border-[#D2DCE8] rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#D2DCE8]">
          <h3 className="font-syne font-bold text-base text-[#0D1B2A]">Paid Appointments</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#D2DCE8] bg-[#F4F7FB]">
                <th className="text-left px-5 py-3 font-dm text-xs font-semibold text-[#7A8FA6] uppercase tracking-wide">Date</th>
                <th className="text-left px-5 py-3 font-dm text-xs font-semibold text-[#7A8FA6] uppercase tracking-wide">Client</th>
                <th className="text-left px-5 py-3 font-dm text-xs font-semibold text-[#7A8FA6] uppercase tracking-wide">Service</th>
                <th className="text-left px-5 py-3 font-dm text-xs font-semibold text-[#7A8FA6] uppercase tracking-wide">Amount</th>
                <th className="text-left px-5 py-3 font-dm text-xs font-semibold text-[#7A8FA6] uppercase tracking-wide">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F4F7FB]">
              {paidAppointments.map(a => (
                <tr key={a.id} className="hover:bg-[#F4F7FB]/60 transition-colors">
                  <td className="px-5 py-4 font-dm text-sm text-[#7A8FA6]">{a.date}</td>
                  <td className="px-5 py-4 font-dm text-sm font-medium text-[#0D1B2A]">{a.name}</td>
                  <td className="px-5 py-4 font-dm text-sm text-[#0D1B2A]">{a.service}</td>
                  <td className="px-5 py-4 font-dm text-sm font-bold text-[#0D1B2A]">
                    ${(a.amount / 100).toFixed(0)}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-xs font-dm font-medium px-2 py-0.5 rounded-full ${
                      a.status === "COMPLETED"
                        ? "bg-green-100 text-green-700"
                        : "bg-[#EBF0FA] text-[#2251A3]"
                    }`}>
                      {a.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-[#D2DCE8] bg-[#F4F7FB]">
                <td colSpan={3} className="px-5 py-3 font-syne font-bold text-sm text-[#0D1B2A]">Total</td>
                <td className="px-5 py-3 font-syne font-bold text-sm text-[#1B3A6B]">
                  ${(paidAppointments.reduce((s, a) => s + a.amount, 0) / 100).toFixed(0)}
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
