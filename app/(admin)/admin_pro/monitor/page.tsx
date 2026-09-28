import { Radar, Repeat, Clock, Users } from "lucide-react";
import MetricCard from "@/components/admin/MetricCard";
import prisma from "@/lib/prisma";
import { requireAdminPage } from "../_lib/admin-page-auth";
import { ensureMonitorTables } from "@/lib/monitor/db";
import { monitorPricing, formatMonitorPrice, MONITOR_PRODUCT } from "@/lib/monitor/config";
import { hostOf } from "@/lib/monitor/report";

// Readiness Monitor subscribers. Dashboard links are not shown here: only
// their hashes are stored, and a subscriber who has lost theirs requests a new
// one from the public page.
export const dynamic = "force-dynamic";

const STATUS_STYLE: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  past_due: "bg-amber-100 text-amber-800",
  canceled: "bg-gray-100 text-gray-600",
  pending: "bg-[#EBF0FA] text-[#2251A3]",
};

function fmt(d: Date | null) {
  return d ? d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";
}

export default async function MonitorAdminPage() {
  await requireAdminPage();
  await ensureMonitorTables();
  const pricing = monitorPricing();

  const [subs, waitlist] = await Promise.all([
    prisma.monitorSubscription.findMany({
      // Abandoned checkouts are noise after a day; paid ones always show.
      where: { OR: [{ status: { not: "pending" } }, { createdAt: { gte: new Date(Date.now() - 86_400_000) } }] },
      orderBy: { createdAt: "desc" },
      take: 500,
      include: { scans: { where: { isOwn: true }, orderBy: { createdAt: "desc" }, take: 1, select: { overallScore: true, ok: true } } },
    }),
    prisma.waitlistEntry.count({ where: { product: MONITOR_PRODUCT } }),
  ]);

  const active = subs.filter((s) => s.status === "active").length;
  const pastDue = subs.filter((s) => s.status === "past_due").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-syne font-bold text-2xl text-[#0D1B2A]">Readiness Monitor</h1>
        <p className="font-dm text-sm text-[#7A8FA6] mt-0.5">Paid weekly scans of a customer&apos;s site against up to three competitors.</p>
      </div>

      {!pricing && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 font-dm text-sm text-amber-900">
          <strong>Not on sale.</strong> Set <code>MONITOR_PRICE_CENTS</code> in Replit Secrets (for example{" "}
          <code>9900</code> for $99 a month) and republish to open checkout. Until then the public page collects waitlist
          sign-ups ({waitlist} so far).
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Active subscribers" value={String(active)} icon={Radar} iconColor="#1B3A6B" />
        <MetricCard
          label="Est. monthly revenue"
          value={pricing ? `$${((active * pricing.amount) / 100).toLocaleString("en-US")}` : "—"}
          icon={Repeat}
          iconColor="#0F6E56"
        />
        <MetricCard label="Payment failing" value={String(pastDue)} icon={Clock} iconColor="#F47C20" />
        <MetricCard label="Waitlist" value={String(waitlist)} icon={Users} iconColor="#2251A3" />
      </div>
      {pricing && (
        <p className="-mt-3 font-dm text-xs text-[#7A8FA6]">
          Price: {formatMonitorPrice(pricing)}/month. Revenue is active subscribers at today&apos;s price; discounts
          and promotion codes are only in Stripe.
        </p>
      )}

      <div className="bg-white border border-[#D2DCE8] rounded-2xl overflow-hidden">
        {subs.length === 0 ? (
          <p className="p-10 text-center font-dm text-sm text-[#7A8FA6]">No subscribers yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-dm">
              <thead>
                <tr className="border-b border-[#F4F7FB] bg-[#F8FAFD] text-left text-xs uppercase tracking-wider text-[#7A8FA6]">
                  <th className="px-5 py-3 font-semibold">Customer</th>
                  <th className="px-4 py-3 font-semibold">Site</th>
                  <th className="px-4 py-3 font-semibold hidden md:table-cell">Competitors</th>
                  <th className="px-4 py-3 font-semibold">Score</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold hidden sm:table-cell">Last scan</th>
                </tr>
              </thead>
              <tbody>
                {subs.map((s) => (
                  <tr key={s.id} className="border-b border-[#F4F7FB] last:border-0">
                    <td className="px-5 py-3">
                      <p className="font-medium text-[#0D1B2A]">{s.name ?? s.email}</p>
                      {s.name && <p className="text-xs text-[#7A8FA6]">{s.email}</p>}
                      <p className="text-xs text-[#7A8FA6]">since {fmt(s.createdAt)}</p>
                    </td>
                    <td className="px-4 py-3 text-[#0D1B2A]">{hostOf(s.siteUrl)}</td>
                    <td className="px-4 py-3 hidden md:table-cell text-xs text-[#3A4A5C]">
                      {s.competitors.map(hostOf).join(", ") || "—"}
                    </td>
                    <td className="px-4 py-3 font-semibold text-[#0D1B2A]">
                      {s.scans[0]?.ok ? s.scans[0].overallScore : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_STYLE[s.status] ?? "bg-gray-100 text-gray-600"}`}>
                        {s.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell text-xs text-[#7A8FA6]">{fmt(s.lastRunAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
