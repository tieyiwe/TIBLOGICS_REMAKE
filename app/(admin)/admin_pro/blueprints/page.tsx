import { FileText, DollarSign, BadgeCheck, AlertTriangle } from "lucide-react";
import MetricCard from "@/components/admin/MetricCard";
import prisma from "@/lib/prisma";
import { requireAdminPage } from "../_lib/admin-page-auth";
import { ensureBlueprintTables } from "@/lib/blueprint/db";
import { blueprintPrice, formatMoney } from "@/lib/blueprint/config";
import BlueprintActions from "./BlueprintActions";

// Paid Automation Blueprints: who bought one, whether it was written, and
// whether its credit has been applied to a build. Private links are not shown
// (only their hashes are stored); the customer can request a new one.
export const dynamic = "force-dynamic";

const STATUS: Record<string, string> = {
  ready: "bg-green-100 text-green-700",
  paid: "bg-[#EBF0FA] text-[#2251A3]",
  generating: "bg-[#EBF0FA] text-[#2251A3]",
  failed: "bg-red-100 text-red-700",
};

export default async function BlueprintsAdminPage() {
  await requireAdminPage();
  await ensureBlueprintTables();
  const price = blueprintPrice();
  const [rows, waitlist] = await Promise.all([
    prisma.blueprint.findMany({
      where: { status: { not: "draft" } },
      orderBy: { paidAt: "desc" },
      take: 300,
      select: {
        id: true, company: true, name: true, email: true, status: true, error: true, attempts: true, amountPaid: true,
        paidAt: true, creditCode: true, creditExpiresAt: true, creditUsedAt: true, inputTokens: true, outputTokens: true,
      },
    }),
    prisma.waitlistEntry.count({ where: { product: "automation-blueprint" } }),
  ]);
  const revenue = rows.reduce((n, r) => n + r.amountPaid, 0);
  const now = new Date();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-syne font-bold text-2xl text-[#0D1B2A]">Automation Blueprints</h1>
        <p className="font-dm text-sm text-[#7A8FA6] mt-0.5">One-time written plans, credited against a build.</p>
      </div>
      {!price && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 font-dm text-sm text-amber-900">
          <strong>Not on sale.</strong> Set <code>BLUEPRINT_PRICE_CENTS</code> (for example <code>29900</code> for $299) in Replit
          Secrets and republish. Waitlist: {waitlist}.
        </div>
      )}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Blueprints sold" value={String(rows.length)} icon={FileText} iconColor="#1B3A6B" />
        <MetricCard label="Revenue" value={formatMoney(revenue)} icon={DollarSign} iconColor="#0F6E56" />
        <MetricCard label="Credits used on builds" value={String(rows.filter((r) => r.creditUsedAt).length)} icon={BadgeCheck} iconColor="#F47C20" />
        <MetricCard label="Need attention" value={String(rows.filter((r) => r.status === "failed").length)} icon={AlertTriangle} iconColor="#B91C1C" />
      </div>

      <div className="bg-white border border-[#D2DCE8] rounded-2xl overflow-hidden">
        {rows.length === 0 ? (
          <p className="p-10 text-center font-dm text-sm text-[#7A8FA6]">No blueprints sold yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-dm">
              <thead>
                <tr className="border-b border-[#F4F7FB] bg-[#F8FAFD] text-left text-xs uppercase tracking-wider text-[#7A8FA6]">
                  <th className="px-5 py-3 font-semibold">Customer</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Paid</th>
                  <th className="px-4 py-3 font-semibold">Credit</th>
                  <th className="px-4 py-3 font-semibold"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-[#F4F7FB] last:border-0 align-top">
                    <td className="px-5 py-3">
                      <p className="font-medium text-[#0D1B2A]">{r.company}</p>
                      <p className="text-xs text-[#7A8FA6]">{r.name} · <a href={`mailto:${r.email}`} className="underline">{r.email}</a></p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS[r.status] ?? "bg-gray-100 text-gray-600"}`}>{r.status}</span>
                      {r.status === "failed" && <p className="text-xs text-red-700 mt-1 max-w-[220px]">{r.error} (attempt {r.attempts})</p>}
                    </td>
                    <td className="px-4 py-3 text-xs text-[#3A4A5C]">
                      {formatMoney(r.amountPaid)}<br />{r.paidAt?.toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <p className="font-mono font-semibold text-[#0D1B2A]">{r.creditCode}</p>
                      <p className="text-[#7A8FA6]">
                        {r.creditUsedAt ? `used ${r.creditUsedAt.toLocaleDateString()}` : r.creditExpiresAt && r.creditExpiresAt > now ? `valid to ${r.creditExpiresAt.toLocaleDateString()}` : "expired"}
                      </p>
                    </td>
                    <td className="px-4 py-3"><BlueprintActions id={r.id} status={r.status} creditUsed={!!r.creditUsedAt} /></td>
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
