import Link from "next/link";
import { Globe, Mail, Phone, BarChart2 } from "lucide-react";
import MetricCard from "@/components/admin/MetricCard";
import { requireAdminPage } from "../_lib/admin-page-auth";
import { getScannerLeads } from "@/lib/admin/metrics";

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
      <div className="flex-1 h-1.5 bg-[#F4F7FB] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${score}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-xs font-dm text-[#7A8FA6] w-6 text-right">{score}</span>
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
        <h1 className="font-syne font-bold text-2xl text-[#0D1B2A]">Scanner Leads</h1>
        <p className="font-dm text-sm text-[#7A8FA6] mt-0.5">Websites scanned via the AI Readiness Scanner tool</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Total Scans" value={data.total} icon={Globe} iconColor="#2251A3" />
        <MetricCard label="Avg Overall Score" value={data.avgScore ?? "—"} suffix={data.avgScore == null ? "" : "/100"} icon={BarChart2} iconColor="#7c3aed" />
        <MetricCard label="Email Capture Rate" value={pct(data.withEmail)} suffix="%" icon={Mail} iconColor="#0F6E56" />
        <MetricCard label="Booking Conversion" value={pct(data.booked)} suffix="%" icon={Phone} iconColor="#F47C20" />
      </div>

      {/* Table */}
      <div className="bg-white border border-[#D2DCE8] rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#D2DCE8]">
          <h3 className="font-syne font-bold text-base text-[#0D1B2A]">Recent Scans</h3>
        </div>
        {leads.length === 0 && (
          <p className="px-5 py-10 text-center font-dm text-sm text-[#7A8FA6]">
            No scans saved yet. Scans from the website scanner appear here once a visitor runs one and leaves their details.
          </p>
        )}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#D2DCE8] bg-[#F4F7FB]">
                <th className="text-left px-5 py-3 font-dm text-xs font-semibold text-[#7A8FA6] uppercase tracking-wide">URL</th>
                <th className="text-left px-5 py-3 font-dm text-xs font-semibold text-[#7A8FA6] uppercase tracking-wide">Date</th>
                <th className="text-left px-5 py-3 font-dm text-xs font-semibold text-[#7A8FA6] uppercase tracking-wide">Overall</th>
                <th className="text-left px-5 py-3 font-dm text-xs font-semibold text-[#7A8FA6] uppercase tracking-wide min-w-[120px]">AI Readiness</th>
                <th className="text-left px-5 py-3 font-dm text-xs font-semibold text-[#7A8FA6] uppercase tracking-wide min-w-[160px]">SEO / Perf / UX</th>
                <th className="text-left px-5 py-3 font-dm text-xs font-semibold text-[#7A8FA6] uppercase tracking-wide">Email</th>
                <th className="text-left px-5 py-3 font-dm text-xs font-semibold text-[#7A8FA6] uppercase tracking-wide">Booked</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F4F7FB]">
              {leads.map(lead => (
                <tr key={lead.id} className="hover:bg-[#F4F7FB]/60 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <Globe size={13} className="text-[#7A8FA6] flex-shrink-0" />
                      <span className="font-dm text-sm font-medium text-[#0D1B2A]">{lead.url}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 font-dm text-sm text-[#7A8FA6]">
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
                      <span className="text-xs font-dm text-[#7A8FA6] w-8">SEO</span>
                      <ScoreBar score={lead.seoScore} color={scoreColor(lead.seoScore)} />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-dm text-[#7A8FA6] w-8">Perf</span>
                      <ScoreBar score={lead.perfScore} color={scoreColor(lead.perfScore)} />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-dm text-[#7A8FA6] w-8">UX</span>
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
                        <p className="font-dm text-xs text-[#7A8FA6] mt-1">{lead.email}</p>
                      </div>
                    ) : (
                      <span className="text-xs font-dm text-[#7A8FA6]">—</span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    {lead.bookedCallAt ? (
                      <span className="inline-flex items-center gap-1 bg-[#EBF0FA] text-[#2251A3] text-xs font-dm px-2 py-0.5 rounded-full">
                        Yes
                      </span>
                    ) : (
                      <span className="text-xs font-dm text-[#7A8FA6]">No</span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    {/* Was a "View Report" button with no handler. There is no
                        stored-report page, so it re-runs the live scan. */}
                    <Link
                      href={`/tools/scanner?url=${encodeURIComponent(lead.url)}`}
                      target="_blank"
                      className="text-xs font-dm text-[#2251A3] hover:underline whitespace-nowrap"
                    >
                      Scan again ↗
                    </Link>
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
