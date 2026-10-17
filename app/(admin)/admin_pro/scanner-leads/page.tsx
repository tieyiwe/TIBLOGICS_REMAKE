import Link from "next/link";
import { Globe, Mail, Phone, BarChart2, DollarSign } from "lucide-react";
import MetricCard from "@/components/admin/MetricCard";
import { requireAdminPage } from "../_lib/admin-page-auth";
import { getScannerLeads } from "@/lib/admin/metrics";
import { formatMoney } from "@/lib/blueprint/config";
import UnlockButton from "./UnlockButton";

// Per-request and session-scoped: never cached or prerendered.
export const dynamic = "force-dynamic";

// This page listed five hardcoded "leads" (with an invented email address)
// and computed its statistics from them. The scanner's real leads were in the
// ScannerLead table the whole time and were never shown. It now reads them.


function scoreColor(score: number): string {
  if (score >= 70) return "#16a34a";
  if (score >= 50) return "#F47C20";
  return "#ef4444";
}

function ScoreCircle({ score }: { score: number }) {
  const color = scoreColor(score);
  return (
    <div
      className="w-10 h-10 rounded-full flex items-center justify-center font-syne font-bold text-sm text-white"
      style={{ backgroundColor: color }}
    >
      {score}
    </div>
  );
}

function ScoreBar({ score, color }: { score: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-[var(--a-surface-2)] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${score}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-xs font-dm text-[var(--a-ink-3)] w-6 text-right">{score}</span>
    </div>
  );
}


export default async function ScannerLeadsPage() {
  await requireAdminPage();
  const data = await getScannerLeads();
  const pct = (n: number) => (data.total === 0 ? 0 : Math.round((n / data.total) * 100));
  const leads = data.rows;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-syne font-bold text-[24px] leading-tight text-[var(--a-ink)] sm:text-[26px]">Scanner Leads</h1>
        <p className="font-dm text-sm text-[var(--a-ink-3)] mt-0.5">
          Websites scanned with the scanner. Two free scans per site every 30 days; the full report is unlocked by payment, a booked call (from the report link) or here.
          Visitors who leave their email also appear in Growth leads (source &quot;scanner&quot;) and get two follow-ups (day 3 and day 7).
        </p>
        <nav aria-label="Sections" className="mt-4 flex gap-1 border-b border-[var(--a-border)]">
          <span aria-current="page" className="-mb-px inline-flex h-10 items-center border-b-2 border-[var(--a-orange)] px-3 font-dm text-[13.5px] font-semibold text-[var(--a-ink)]">Leads</span>
          <Link href="/admin_pro/scanner-leads/scan-log" className="-mb-px inline-flex h-10 items-center border-b-2 border-transparent px-3 font-dm text-[13.5px] font-semibold text-[var(--a-ink-3)] hover:text-[var(--a-ink)]" data-testid="scan-log-tab">Scan log</Link>
        </nav>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard label="Total Scans" value={data.total} icon={Globe} iconColor="#2251A3" />
        <MetricCard label="Avg Overall Score" value={data.avgScore ?? "—"} suffix={data.avgScore == null ? "" : "/100"} icon={BarChart2} iconColor="#7c3aed" />
        <MetricCard label="Email Capture Rate" value={pct(data.withEmail)} suffix="%" icon={Mail} iconColor="#0F6E56" />
        <MetricCard label="Booking Conversion" value={pct(data.booked)} suffix="%" icon={Phone} iconColor="#F47C20" />
        <MetricCard label={`Reports sold (${formatMoney(data.revenueCents)})`} value={data.paid} icon={DollarSign} iconColor="#16a34a" />
      </div>

      {/* Table */}
      <div className="bg-[var(--a-surface)] border border-[var(--a-border)] rounded-[var(--a-radius-card)] shadow-[var(--a-shadow-card)] overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--a-border)]">
          <h3 className="font-syne font-bold text-base text-[var(--a-ink)]">Recent Scans</h3>
        </div>
        {leads.length === 0 && (
          <p className="px-5 py-10 text-center font-dm text-sm text-[var(--a-ink-3)]">
            No scans saved yet. Every scan from the website scanner (and the home page quick scan) is saved here.
          </p>
        )}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--a-border)] bg-[var(--a-surface-2)]">
                <th className="text-left px-5 py-3 font-dm text-[11px] font-semibold text-[var(--a-ink-3)] uppercase tracking-[.08em]">URL</th>
                <th className="text-left px-5 py-3 font-dm text-[11px] font-semibold text-[var(--a-ink-3)] uppercase tracking-[.08em]">Date</th>
                <th className="text-left px-5 py-3 font-dm text-[11px] font-semibold text-[var(--a-ink-3)] uppercase tracking-[.08em]">Overall</th>
                <th className="text-left px-5 py-3 font-dm text-[11px] font-semibold text-[var(--a-ink-3)] uppercase tracking-[.08em] min-w-[120px]">AI Readiness</th>
                <th className="text-left px-5 py-3 font-dm text-[11px] font-semibold text-[var(--a-ink-3)] uppercase tracking-[.08em] min-w-[160px]">SEO / Perf / UX</th>
                <th className="text-left px-5 py-3 font-dm text-[11px] font-semibold text-[var(--a-ink-3)] uppercase tracking-[.08em]">Email</th>
                <th className="text-left px-5 py-3 font-dm text-[11px] font-semibold text-[var(--a-ink-3)] uppercase tracking-[.08em]">Booked</th>
                <th className="text-left px-5 py-3 font-dm text-[11px] font-semibold text-[var(--a-ink-3)] uppercase tracking-[.08em]">Report</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--a-border)]">
              {leads.map(lead => (
                <tr key={lead.id} className="hover:bg-[var(--a-surface-2)]/60 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <Globe size={13} className="text-[var(--a-ink-3)] flex-shrink-0" />
                      <span className="font-dm text-sm font-medium text-[var(--a-ink)] break-all">{lead.domain ?? lead.url}</span>
                    </div>
                    <p className="mt-0.5 font-dm text-[11px] text-[var(--a-ink-3)] break-all">{lead.url}</p>
                    {(() => {
                      const ex = lead.extra as { growthScore?: number; securityScore?: number; tech?: { cms?: string | null; shop?: string | null }; held?: boolean } | null;
                      return ex ? (
                        <p className="mt-0.5 font-dm text-[11px] text-[var(--a-ink-3)]">
                          Leads {ex.growthScore ?? "—"} · Security {ex.securityScore ?? "—"}
                          {ex.tech?.cms ? ` · ${ex.tech.cms}` : ""}{ex.tech?.shop ? ` · ${ex.tech.shop}` : ""}
                          {ex.held && !lead.unlockedAt ? " · awaiting payment" : ""}
                        </p>
                      ) : null;
                    })()}
                  </td>
                  <td className="px-5 py-4 font-dm text-sm text-[var(--a-ink-3)]">
                    {lead.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </td>
                  <td className="px-5 py-4">
                    <ScoreCircle score={lead.overallScore} />
                  </td>
                  <td className="px-5 py-4 min-w-[120px]">
                    <ScoreBar score={lead.aiScore} color={scoreColor(lead.aiScore)} />
                  </td>
                  <td className="px-5 py-4 min-w-[160px] space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-dm text-[var(--a-ink-3)] w-8">SEO</span>
                      <ScoreBar score={lead.seoScore} color={scoreColor(lead.seoScore)} />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-dm text-[var(--a-ink-3)] w-8">Perf</span>
                      <ScoreBar score={lead.perfScore} color={scoreColor(lead.perfScore)} />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-dm text-[var(--a-ink-3)] w-8">UX</span>
                      <ScoreBar score={lead.uxScore} color={scoreColor(lead.uxScore)} />
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    {lead.email ? (
                      <div>
                        <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs font-dm px-2 py-0.5 rounded-full">
                          <Mail size={10} />
                          Captured
                        </span>
                        <p className="font-dm text-xs text-[var(--a-ink-3)] mt-1">{lead.email}</p>
                        <p className="font-dm text-[11px] text-[var(--a-ink-3)]">
                          {lead.emailedAt ? "Results sent" : "Not emailed"} · follow-ups {lead.followupStage}/2
                          {lead.growthLeadId ? (
                            <> · <Link href={`/admin_pro/growth/leads?open=${lead.growthLeadId}`} className="text-[var(--a-blue)] hover:underline">Growth lead</Link></>
                          ) : null}
                        </p>
                      </div>
                    ) : (
                      <span className="text-xs font-dm text-[var(--a-ink-3)]">—</span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    {lead.bookedCallAt ? (
                      <span className="inline-flex items-center gap-1 bg-[var(--a-info-bg)] text-[var(--a-blue)] text-xs font-dm px-2 py-0.5 rounded-full">
                        Yes
                      </span>
                    ) : (
                      <span className="text-xs font-dm text-[var(--a-ink-3)]">No</span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    {lead.unlockedAt ? (
                      <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs font-dm px-2 py-0.5 rounded-full whitespace-nowrap">
                        {lead.unlockSource === "paid" ? `Paid ${formatMoney(lead.amountPaid ?? 0)}` : lead.unlockSource === "call" ? "Unlocked by call" : lead.unlockSource === "rescan" ? "Re-scan" : "Unlocked by staff"}
                      </span>
                    ) : (
                      <span className="text-xs font-dm text-[var(--a-ink-3)]">Free view</span>
                    )}
                    {lead.unlockedAt && (
                      <p className="mt-1 font-dm text-[11px] text-[var(--a-ink-3)]">
                        {lead.reportStatus === "ready" ? "Report sent" : lead.reportStatus?.startsWith("failed") ? `Failed (${lead.reportStatus})` : "Finishing"}
                        {lead.report ? " · fix plan written" : ""}
                      </p>
                    )}
                  </td>
                  <td className="px-5 py-4 space-y-1.5">
                    <Link href={`/admin_pro/scanner-leads/${lead.id}`} className="block text-xs font-dm font-semibold text-[var(--a-blue)] hover:underline whitespace-nowrap" data-testid="scan-open">
                        Report and fix plan →
                      </Link>
                    {lead.token ? (
                      <Link href={`/tools/scanner/report/${lead.token}`} target="_blank" className="block text-xs font-dm text-[var(--a-blue)] hover:underline whitespace-nowrap">
                        Customer view ↗
                      </Link>
                    ) : (
                      <span className="block text-xs font-dm text-[var(--a-ink-3)] whitespace-nowrap">Saved before reports</span>
                    )}
                    {lead.token && !lead.unlockedAt && <UnlockButton id={lead.id} />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
