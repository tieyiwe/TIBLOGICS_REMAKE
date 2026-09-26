"use client";
import { Globe, Mail, Phone, BarChart2, TrendingUp } from "lucide-react";
import MetricCard from "@/components/admin/MetricCard";

const leads = [
  { id: "1", url: "caribbeanflavor.com", date: "Apr 16, 2026", overallScore: 48, aiScore: 22, seoScore: 45, perfScore: 58, uxScore: 41, email: "arnold@caribbeanflavor.com", bookedCall: true },
  { id: "2", url: "dentalsmile.com", date: "Apr 15, 2026", overallScore: 61, aiScore: 18, seoScore: 72, perfScore: 55, uxScore: 56, email: null, bookedCall: false },
  { id: "3", url: "techstartupdc.io", date: "Apr 14, 2026", overallScore: 74, aiScore: 45, seoScore: 80, perfScore: 70, uxScore: 72, email: "founder@techstartup.io", bookedCall: false },
  { id: "4", url: "localrestaurant.com", date: "Apr 13, 2026", overallScore: 39, aiScore: 12, seoScore: 38, perfScore: 42, uxScore: 37, email: null, bookedCall: false },
  { id: "5", url: "tiblogics.com", date: "Apr 12, 2026", overallScore: 91, aiScore: 95, seoScore: 91, perfScore: 82, uxScore: 88, email: null, bookedCall: false },
];

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

const totalScans = leads.length;
const avgAiScore = Math.round(leads.reduce((s, l) => s + l.aiScore, 0) / leads.length);
const emailCaptureRate = Math.round((leads.filter(l => l.email !== null).length / leads.length) * 100);
const bookingConversion = Math.round((leads.filter(l => l.bookedCall).length / leads.length) * 100);

export default function ScannerLeadsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-syne font-bold text-2xl text-[#0D1B2A]">Scanner Leads</h1>
        <p className="font-dm text-sm text-[#7A8FA6] mt-0.5">Websites scanned via the AI Readiness Scanner tool</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Total Scans" value={totalScans} icon={Globe} iconColor="#2251A3" />
        <MetricCard label="Avg AI Score" value={avgAiScore} suffix="/100" icon={BarChart2} iconColor="#7c3aed" />
        <MetricCard label="Email Capture Rate" value={emailCaptureRate} suffix="%" icon={Mail} iconColor="#0F6E56" />
        <MetricCard label="Booking Conversion" value={bookingConversion} suffix="%" icon={Phone} iconColor="#F47C20" />
      </div>

      {/* Table */}
      <div className="bg-white border border-[#D2DCE8] rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#D2DCE8]">
          <h3 className="font-syne font-bold text-base text-[#0D1B2A]">Recent Scans</h3>
        </div>
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
                  <td className="px-5 py-4 font-dm text-sm text-[#7A8FA6]">{lead.date}</td>
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
                    {lead.bookedCall ? (
                      <span className="inline-flex items-center gap-1 bg-[#EBF0FA] text-[#2251A3] text-xs font-dm px-2 py-0.5 rounded-full">
                        Yes
                      </span>
                    ) : (
                      <span className="text-xs font-dm text-[#7A8FA6]">No</span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <button className="text-xs font-dm text-[#2251A3] hover:underline">
                      View Report
                    </button>
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
