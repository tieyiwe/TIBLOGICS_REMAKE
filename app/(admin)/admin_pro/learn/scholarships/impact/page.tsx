import Link from "next/link";
import { notFound } from "next/navigation";
import { requireLearnerPage } from "@/lib/learn/account-status/admin-auth";
import { sponsorReport } from "@/lib/learn/scholarship/admin";
import ScholarSeal from "@/components/learn/scholarship/ScholarSeal";
import PrintButton from "./PrintButton";

export const dynamic = "force-dynamic";

// A sponsor's impact report, ready to print or save as PDF from the browser:
// totals and each scholar by first name and initial, with their tracks.

const usd = (c: number) => `$${(c / 100).toLocaleString("en-US", { minimumFractionDigits: c % 100 ? 2 : 0, maximumFractionDigits: 2 })}`;
const day = (d: Date | null) => (d ? d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" }) : "");

export default async function ImpactReportPage({ searchParams }: { searchParams: Promise<{ sponsor?: string }> }) {
  await requireLearnerPage("read");
  const sponsor = ((await searchParams).sponsor ?? "").slice(0, 200);
  if (!sponsor) notFound();
  const r = await sponsorReport(sponsor);
  if (!r.awarded) notFound();
  const pct = r.lessonsTotal ? Math.round((r.lessonsDone / r.lessonsTotal) * 100) : 0;
  const stat = (k: string, v: string) => (
    <div className="rounded-xl border border-[var(--a-border)] bg-white p-4 text-center">
      <p className="font-dm text-2xl font-black text-[#1B2A5E]">{v}</p>
      <p className="font-dm text-[11px] font-semibold uppercase tracking-wide text-[var(--a-ink-3)]">{k}</p>
    </div>
  );
  return (
    <div className="mx-auto max-w-3xl space-y-5 print:max-w-none" data-testid="impact-report">
      <div className="flex flex-wrap items-center justify-between gap-2 print:hidden">
        <Link href="/admin_pro/learn/scholarships" className="font-dm text-[13px] font-semibold text-[var(--a-blue)] hover:underline">← Scholarships</Link>
        <PrintButton />
      </div>
      <div className="overflow-hidden rounded-2xl border border-[var(--a-border)] bg-white">
        <div className="flex flex-wrap items-center gap-4 bg-gradient-to-br from-[#1B2A5E] to-[#27407F] px-6 py-6 text-white">
          <ScholarSeal size={64} />
          <div className="min-w-0">
            <p className="font-dm text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#F9A738]">Impact report · {day(new Date())}</p>
            <h1 className="font-dm text-2xl font-black">The Tilo Vision Scholarship</h1>
            <p className="break-words font-dm text-sm text-white/85">Made possible by {r.sponsor}</p>
          </div>
        </div>
        <div className="space-y-5 p-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {stat("Scholars", String(r.accepted))}
            {stat("Tracks", String(r.tracksUnlocked))}
            {stat("Progress", `${pct}%`)}
            {stat("Certificates", String(r.certificates))}
          </div>
          <p className="font-dm text-[14px] leading-relaxed text-[var(--a-ink-2)]">
            {r.awarded} scholarship{r.awarded === 1 ? "" : "s"} awarded, {r.accepted} accepted. Tuition covered: <strong>{usd(r.coveredCents)}</strong>. Final exams passed: {r.examsPassed}.
          </p>
          {r.scholars.map((sc, i) => (
            <div key={i} className="rounded-xl border border-[var(--a-border)] p-4">
              <p className="font-dm text-[15px] font-bold text-[var(--a-ink)]">{sc.who}</p>
              {sc.since && <p className="font-dm text-[12px] text-[var(--a-ink-3)]">Scholar since {day(sc.since)}</p>}
              {sc.tracks.length ? (
                <ul className="mt-2 space-y-2">
                  {sc.tracks.map((tr) => {
                    const p = tr.total ? Math.round((tr.done / tr.total) * 100) : 0;
                    return (
                      <li key={tr.title}>
                        <div className="flex justify-between gap-3 font-dm text-[13px]">
                          <span className="min-w-0 break-words font-semibold text-[var(--a-ink)]">{tr.title}{tr.certified ? " ✓ certified" : ""}</span>
                          <span className="shrink-0 text-[var(--a-ink-2)]">{tr.done}/{tr.total} · {p}%</span>
                        </div>
                        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[var(--a-surface-2)]">
                          <div className="h-full rounded-full bg-[#F47C20]" style={{ width: `${p}%` }} />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="mt-1 font-dm text-[13px] text-[var(--a-ink-3)]">Choosing tracks.</p>
              )}
            </div>
          ))}
          <p className="font-dm text-[11.5px] text-[var(--a-ink-3)]">Scholars are shown by first name and initial only. Issued by TIBLOGICS · ARFA AI Academy.</p>
        </div>
      </div>
    </div>
  );
}
