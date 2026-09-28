import { Wand2, ShieldCheck, Repeat, Cpu } from "lucide-react";
import MetricCard from "@/components/admin/MetricCard";
import prisma from "@/lib/prisma";
import { requireAdminPage } from "../_lib/admin-page-auth";
import { ensureToolkitTables } from "@/lib/toolkit/db";
import { toolkitPlans, formatPrice } from "@/lib/toolkit/config";

// Toolkit Live and Compliance Guard subscribers, and what their AI use costs.
export const dynamic = "force-dynamic";

// Claude Opus 5 list prices, USD per million tokens. Used only for the
// estimate on this page; the invoice from Anthropic is the real figure.
const INPUT_PER_M = 5;
const OUTPUT_PER_M = 25;

export default async function ToolkitAdminPage() {
  await requireAdminPage();
  await ensureToolkitTables();
  const plans = toolkitPlans();
  const now = new Date();
  const month = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

  const [subs, usage, waitlist] = await Promise.all([
    prisma.toolkitSubscription.findMany({ orderBy: { createdAt: "desc" }, take: 500 }),
    prisma.toolkitRun.groupBy({
      by: ["studentId"],
      where: { createdAt: { gte: month } },
      _count: { _all: true },
      _sum: { inputTokens: true, outputTokens: true },
    }),
    prisma.waitlistEntry.count({ where: { product: "toolkit-live" } }),
  ]);
  const students = await prisma.student.findMany({
    where: { id: { in: subs.map((s) => s.studentId) } },
    select: { id: true, email: true, name: true },
  });
  const who = new Map(students.map((s) => [s.id, s]));
  const use = new Map(usage.map((u) => [u.studentId, u]));

  const live = subs.filter((s) => ["active", "trialing", "past_due"].includes(s.status));
  const mrr = live.reduce((n, s) => n + (plans[s.plan as "toolkit" | "guard"]?.amount ?? 0), 0);
  const inTok = usage.reduce((n, u) => n + (u._sum.inputTokens ?? 0), 0);
  const outTok = usage.reduce((n, u) => n + (u._sum.outputTokens ?? 0), 0);
  const aiCost = (inTok / 1e6) * INPUT_PER_M + (outTok / 1e6) * OUTPUT_PER_M;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-syne font-bold text-2xl text-[#0D1B2A]">Toolkit Live</h1>
        <p className="font-dm text-sm text-[#7A8FA6] mt-0.5">Prompt library and Compliance Guard subscriptions.</p>
      </div>

      {(!plans.toolkit.amount || !plans.guard.amount) && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 font-dm text-sm text-amber-900">
          <strong>Not fully on sale.</strong> Set <code>TOOLKIT_PRICE_CENTS</code> and <code>GUARD_PRICE_CENTS</code> in Replit
          Secrets and republish. A plan without a price shows &ldquo;Opening soon&rdquo; and refuses checkout. Waitlist: {waitlist}.
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Toolkit Live subscribers" value={String(live.filter((s) => s.plan === "toolkit").length)} icon={Wand2} iconColor="#B8500A" />
        <MetricCard label="Guard-only subscribers" value={String(live.filter((s) => s.plan === "guard").length)} icon={ShieldCheck} iconColor="#2251A3" />
        <MetricCard label="Est. monthly revenue" value={`$${(mrr / 100).toLocaleString("en-US")}`} icon={Repeat} iconColor="#0F6E56" />
        <MetricCard label="Est. AI cost this month" value={`$${aiCost.toFixed(2)}`} icon={Cpu} iconColor="#7c3aed" />
      </div>
      <p className="-mt-3 font-dm text-xs text-[#7A8FA6]">
        {plans.toolkit.amount ? `Toolkit Live ${formatPrice(plans.toolkit.amount)}` : "Toolkit Live unpriced"} ·{" "}
        {plans.guard.amount ? `Guard ${formatPrice(plans.guard.amount)}` : "Guard unpriced"} · AI cost is estimated from token
        counts at list price.
      </p>

      <div className="bg-white border border-[#D2DCE8] rounded-2xl overflow-hidden">
        {subs.length === 0 ? (
          <p className="p-10 text-center font-dm text-sm text-[#7A8FA6]">No subscribers yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-dm">
              <thead>
                <tr className="border-b border-[#F4F7FB] bg-[#F8FAFD] text-left text-xs uppercase tracking-wider text-[#7A8FA6]">
                  <th className="px-5 py-3 font-semibold">Customer</th>
                  <th className="px-4 py-3 font-semibold">Plan</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Runs this month</th>
                  <th className="px-4 py-3 font-semibold hidden sm:table-cell">Since</th>
                </tr>
              </thead>
              <tbody>
                {subs.map((s) => {
                  const u = use.get(s.studentId);
                  const person = who.get(s.studentId);
                  return (
                    <tr key={s.id} className="border-b border-[#F4F7FB] last:border-0">
                      <td className="px-5 py-3">
                        <p className="font-medium text-[#0D1B2A]">{person?.name ?? "—"}</p>
                        <p className="text-xs text-[#7A8FA6]">{person?.email}</p>
                      </td>
                      <td className="px-4 py-3">{s.plan === "guard" ? "Compliance Guard" : "Toolkit Live"}</td>
                      <td className="px-4 py-3">{s.status.replace("_", " ")}{s.cancelAtPeriodEnd ? " (ending)" : ""}</td>
                      <td className="px-4 py-3">{u?._count._all ?? 0}</td>
                      <td className="px-4 py-3 hidden sm:table-cell text-xs text-[#7A8FA6]">{s.createdAt.toLocaleDateString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
