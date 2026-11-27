import Link from "next/link";
import { Bot, DollarSign, Globe, ShieldCheck, ExternalLink } from "lucide-react";
import MetricCard from "@/components/admin/MetricCard";
import { requireAdminPage } from "../../_lib/admin-page-auth";
import prisma from "@/lib/prisma";
import { formatMoney } from "@/lib/blueprint/config";
import { ensureAgentReadyTables } from "@/lib/agent-ready/db";

// AI Agent Readiness scans: who checked, what they scored, what they bought.
// Staff open any report in full (no purchase needed) and can run a check from
// the public page without the free limit. Access: scanner leads permission
// (lib/admin/access-map.ts, by path).

export const dynamic = "force-dynamic";

const VERDICT: Record<string, { label: string; color: string }> = {
  ready: { label: "Ready", color: "#16a34a" },
  partial: { label: "Partly ready", color: "#F47C20" },
  notReady: { label: "Not ready", color: "#ef4444" },
};

export default async function AgentReadyAdminPage() {
  await requireAdminPage();
  await ensureAgentReadyTables();
  const since = new Date(Date.now() - 30 * 86_400_000);
  const [rows, scans30, paid, revenue] = await Promise.all([
    prisma.agentReadyScan.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      select: { id: true, token: true, createdAt: true, host: true, url: true, score: true, verdict: true, tier: true, email: true, amountPaid: true, paidAt: true, rescans: true, staff: true },
    }),
    prisma.agentReadyScan.count({ where: { createdAt: { gte: since }, staff: false } }),
    prisma.agentReadyScan.count({ where: { tier: { not: "free" } } }),
    prisma.agentReadyScan.aggregate({ _sum: { amountPaid: true }, where: { tier: { not: "free" } } }),
  ]);

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-syne text-2xl font-bold text-[var(--a-ink)]">AI Agent Readiness</h1>
          <p className="mt-1 font-dm text-sm text-[var(--a-ink-3)]">
            Free check, $25 report, $50 fix kit. Buyers who still need help are your best service leads.
          </p>
        </div>
        <Link href="/tools/ai-agent-ready" target="_blank" className="inline-flex items-center gap-2 rounded-xl bg-[var(--a-blue)] px-4 py-2.5 font-dm text-sm font-semibold text-white">
          <Bot size={16} aria-hidden /> Run a check
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard label="Customer checks (30 days)" value={scans30} icon={Globe} />
        <MetricCard label="Paid reports and kits" value={paid} icon={ShieldCheck} iconColor="#16a34a" />
        <MetricCard label="Revenue" value={formatMoney(revenue._sum.amountPaid ?? 0)} icon={DollarSign} iconColor="#F47C20" />
      </div>

      <div className="overflow-x-auto rounded-2xl border border-[var(--a-border)] bg-[var(--a-surface)]">
        <table className="w-full min-w-[760px]" data-testid="agent-admin-table">
          <thead className="border-b border-[var(--a-border)]">
            <tr>
              {["Site", "Date", "Score", "Bought", "Email", ""].map((h) => (
                <th key={h} className="px-5 py-3 text-left font-dm text-[11px] font-semibold uppercase tracking-[.08em] text-[var(--a-ink-3)]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--a-border)]">
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center font-dm text-sm text-[var(--a-ink-3)]">No checks yet.</td>
              </tr>
            )}
            {rows.map((r) => {
              const v = VERDICT[r.verdict] ?? VERDICT.notReady;
              return (
                <tr key={r.id} data-testid="agent-admin-row">
                  <td className="px-5 py-3">
                    <p className="break-all font-dm text-sm font-medium text-[var(--a-ink)]">{r.host}</p>
                    <p className="break-all font-dm text-[11px] text-[var(--a-ink-3)]">{r.url}{r.staff ? " · staff check" : ""}</p>
                  </td>
                  <td className="px-5 py-3 font-dm text-sm text-[var(--a-ink-3)]">{r.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</td>
                  <td className="px-5 py-3 font-dm text-sm">
                    <span className="font-bold" style={{ color: v.color }}>{r.score}</span> <span className="text-[var(--a-ink-3)]">{v.label}</span>
                  </td>
                  <td className="px-5 py-3 font-dm text-sm">
                    {r.tier === "free" ? (
                      <span className="text-[var(--a-ink-3)]">Free</span>
                    ) : (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                        {r.tier === "kit" ? "Fix kit" : "Report"} · {formatMoney(r.amountPaid)}
                      </span>
                    )}
                    {r.tier === "kit" && <p className="mt-0.5 text-[11px] text-[var(--a-ink-3)]">{r.rescans} re-scans used</p>}
                  </td>
                  <td className="break-all px-5 py-3 font-dm text-sm text-[var(--a-ink-3)]">
                    {r.email ? <a href={`mailto:${r.email}`} className="text-[var(--a-blue)] hover:underline">{r.email}</a> : "—"}
                  </td>
                  <td className="px-5 py-3">
                    <Link href={`/tools/ai-agent-ready/r/${r.token}`} target="_blank" className="inline-flex items-center gap-1 font-dm text-sm text-[var(--a-blue)] hover:underline">
                      Open <ExternalLink size={13} aria-hidden />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
