import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, ArrowDownRight, ArrowUpRight, CheckCircle2, Trophy, XCircle } from "lucide-react";
import prisma from "@/lib/prisma";
import { findMonitorByToken } from "@/lib/monitor/access";
import {
  AREAS, AREA_LABELS, changesBetween, competitorGaps, describeChange, rankOf, summarise,
  type ScanRow, type SiteSummary,
} from "@/lib/monitor/report";
import { MANUAL_RUN_COOLDOWN_HOURS, STALE_RUN_MINUTES } from "@/lib/monitor/config";
import MonitorControls from "./MonitorControls";
import ScoreHistory from "./ScoreHistory";

// A subscriber's dashboard. The URL is the credential, so it is kept out of
// search engines and out of the Referer header sent to any site linked from
// here — every competitor is linked from this page.
export const metadata: Metadata = {
  title: "Readiness Monitor",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export const dynamic = "force-dynamic";

/** Enough history for six months of weekly runs. */
const HISTORY_RUNS = 26;

function scoreColor(n: number) {
  return n >= 80 ? "#15803d" : n >= 60 ? "#B45309" : "#B91C1C";
}

function fmtDate(d: Date) {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
}

export default async function MonitorDashboard({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const sub = await findMonitorByToken(token);
  if (!sub) notFound();

  const scans = (await prisma.monitorScan.findMany({
    where: { subscriptionId: sub.id },
    orderBy: { createdAt: "desc" },
    take: HISTORY_RUNS * 4,
  })) as ScanRow[] & Array<{ runId: string }>;

  // Group into runs, newest first.
  const runs: Array<{ runId: string; at: Date; scans: typeof scans }> = [];
  for (const s of scans) {
    let run = runs.find((r) => r.runId === s.runId);
    if (!run) runs.push((run = { runId: s.runId, at: s.createdAt, scans: [] }));
    run.scans.push(s);
  }

  const latest: SiteSummary[] = runs[0] ? summarise(runs[0].scans) : [];
  const previous: SiteSummary[] | null = runs[1] ? summarise(runs[1].scans) : null;
  const changes = previous ? changesBetween(previous, latest) : [];
  const gaps = competitorGaps(latest);
  const rank = rankOf(latest);
  const own = latest.find((s) => s.isOwn);
  const ownIssues = own?.findings.filter((f) => f.type !== "good") ?? [];

  const running =
    !!sub.runStartedAt && Date.now() - sub.runStartedAt.getTime() < STALE_RUN_MINUTES * 60_000;
  const manualReadyAt = sub.lastManualRunAt
    ? new Date(sub.lastManualRunAt.getTime() + MANUAL_RUN_COOLDOWN_HOURS * 3_600_000)
    : null;

  const history = [...runs].reverse().map((r) => ({
    at: fmtDate(r.at),
    sites: summarise(r.scans).map((s) => ({ host: s.host, isOwn: s.isOwn, overall: s.scores?.overall ?? null })),
  }));

  return (
    <div className="min-h-screen bg-[#F4F7FB]">
      <header className="bg-[#0D1B2A]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/" className="font-syne font-extrabold text-white tracking-wide">
            TIB<span className="text-[#F47C20]">LOGICS</span>
            <span className="font-dm font-medium text-white/60 text-sm ml-2">Readiness Monitor</span>
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {sub.status === "pending" && (
          <Notice tone="warn">Payment for this subscription was not completed, so nothing is being scanned.</Notice>
        )}
        {sub.status === "past_due" && (
          <Notice tone="warn">
            Your last payment failed. Scans are paused until the card is updated. Use &ldquo;Manage billing&rdquo; below.
          </Notice>
        )}
        {sub.status === "canceled" && (
          <Notice tone="info">This subscription has ended. Your past reports are still here.</Notice>
        )}
        {running && <Notice tone="info">A scan is running now. Refresh in a minute to see the results.</Notice>}

        <section className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="font-syne font-extrabold text-2xl md:text-3xl text-[#0D1B2A]">
              {own ? own.host : sub.siteUrl}
            </h1>
            <p className="font-dm text-sm text-[#7A8FA6] mt-1">
              {runs[0] ? `Last scanned ${fmtDate(runs[0].at)}` : "No scans yet"}
              {sub.status === "active" && sub.nextRunAt ? ` · next scan ${fmtDate(sub.nextRunAt)}` : ""}
            </p>
          </div>
          {rank && own?.scores && (
            <div className="flex items-center gap-3 bg-white border border-[#D2DCE8] rounded-2xl px-5 py-3">
              <Trophy size={22} className={rank.rank === 1 ? "text-[#F47C20]" : "text-[#7A8FA6]"} />
              <div>
                <p className="font-syne font-bold text-lg text-[#0D1B2A] leading-tight">
                  #{rank.rank} of {rank.of}
                </p>
                <p className="font-dm text-xs text-[#7A8FA6]">on overall score</p>
              </div>
            </div>
          )}
        </section>

        {latest.length === 0 ? (
          <div className="bg-white border border-[#D2DCE8] rounded-2xl p-10 text-center font-dm text-sm text-[#7A8FA6]">
            {sub.status === "active"
              ? "Your first scan is queued and usually finishes within a few minutes of signing up."
              : "There are no scans for this subscription."}
          </div>
        ) : (
          <>
            {/* Side-by-side scores */}
            <section className="bg-white border border-[#D2DCE8] rounded-2xl p-5 md:p-6">
              <h2 className="font-syne font-bold text-base text-[#0D1B2A]">You vs your competitors</h2>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[560px] font-dm text-sm">
                  <thead>
                    <tr className="text-xs uppercase tracking-wider text-[#7A8FA6]">
                      <th className="text-left font-semibold py-2 pr-4">Site</th>
                      {AREAS.map((a) => (
                        <th key={a} className="font-semibold py-2 px-2 text-center">{AREA_LABELS[a]}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {latest.map((s) => {
                      const prev = previous?.find((p) => p.url === s.url)?.scores?.overall;
                      return (
                        <tr key={s.url} className={`border-t border-[#F4F7FB] ${s.isOwn ? "bg-[#FEF6EE]" : ""}`}>
                          <td className="py-3 pr-4">
                            <a href={s.url} target="_blank" rel="noopener noreferrer" className="font-medium text-[#0D1B2A] hover:underline">
                              {s.host}
                            </a>
                            {s.isOwn && <span className="ml-2 text-xs font-semibold text-[#B8500A]">you</span>}
                          </td>
                          {s.scores ? (
                            AREAS.map((a) => (
                              <td key={a} className="py-3 px-2 text-center">
                                <span className={`${a === "overall" ? "font-syne font-bold text-base" : "font-semibold"}`} style={{ color: scoreColor(s.scores![a]) }}>
                                  {s.scores![a]}
                                </span>
                                {a === "overall" && prev != null && prev !== s.scores!.overall && (
                                  <span className={`ml-1 inline-flex items-center text-xs ${s.scores!.overall > prev ? "text-green-700" : "text-red-700"}`}>
                                    {s.scores!.overall > prev ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                                    {Math.abs(s.scores!.overall - prev)}
                                  </span>
                                )}
                              </td>
                            ))
                          ) : (
                            <td colSpan={AREAS.length} className="py-3 px-2 text-xs text-[#B45309]">
                              Could not scan: {s.error ?? "unknown error"}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            <div className="grid lg:grid-cols-2 gap-6">
              <section className="bg-white border border-[#D2DCE8] rounded-2xl p-5 md:p-6">
                <h2 className="font-syne font-bold text-base text-[#0D1B2A]">Where competitors are ahead</h2>
                <p className="font-dm text-xs text-[#7A8FA6] mt-0.5">Checks you fail that at least one competitor passes.</p>
                {gaps.length === 0 ? (
                  <p className="font-dm text-sm text-[#3A4A5C] mt-4">
                    {latest.some((s) => !s.isOwn)
                      ? "None. Every check a competitor passes, you pass too."
                      : "Add competitors below to see where they are ahead."}
                  </p>
                ) : (
                  <ul className="mt-4 space-y-3">
                    {gaps.map((g) => (
                      <li key={g.check} className="flex gap-3">
                        {g.severity === "bad" ? (
                          <XCircle size={18} className="text-red-600 shrink-0 mt-0.5" />
                        ) : (
                          <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                        )}
                        <div className="font-dm text-sm">
                          <p className="text-[#0D1B2A]">{g.yours}</p>
                          <p className="text-xs text-[#7A8FA6] mt-0.5">Passing: {g.aheadHosts.join(", ")}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="bg-white border border-[#D2DCE8] rounded-2xl p-5 md:p-6">
                <h2 className="font-syne font-bold text-base text-[#0D1B2A]">Since the last scan</h2>
                {!previous ? (
                  <p className="font-dm text-sm text-[#3A4A5C] mt-4">This is your first scan. Changes appear here from the next one.</p>
                ) : changes.length === 0 ? (
                  <p className="font-dm text-sm text-[#3A4A5C] mt-4">No meaningful changes.</p>
                ) : (
                  <ul className="mt-4 space-y-2">
                    {changes.map((c, i) => (
                      <li key={i} className="flex gap-2 font-dm text-sm text-[#3A4A5C]">
                        {c.kind === "fixed" || (c.kind === "score" && c.isOwn && c.to > c.from) ? (
                          <CheckCircle2 size={16} className="text-green-600 shrink-0 mt-0.5" />
                        ) : (
                          <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                        )}
                        {describeChange(c)}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>

            {history.length > 1 && <ScoreHistory history={history} />}

            <section className="bg-white border border-[#D2DCE8] rounded-2xl p-5 md:p-6">
              <h2 className="font-syne font-bold text-base text-[#0D1B2A]">Your open issues ({ownIssues.length})</h2>
              {ownIssues.length === 0 ? (
                <p className="font-dm text-sm text-[#3A4A5C] mt-4">Every check passes.</p>
              ) : (
                <ul className="mt-4 grid md:grid-cols-2 gap-x-6 gap-y-3">
                  {ownIssues.map((f) => (
                    <li key={f.check} className="flex gap-2 font-dm text-sm text-[#3A4A5C]">
                      {f.type === "bad" ? (
                        <XCircle size={16} className="text-red-600 shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                      )}
                      {f.text}
                    </li>
                  ))}
                </ul>
              )}
              <p className="font-dm text-sm text-[#7A8FA6] mt-5">
                Want these fixed for you?{" "}
                <Link href="/book" className="text-[#2251A3] underline">Book a call</Link>.
              </p>
            </section>
          </>
        )}

        <MonitorControls
          token={token}
          status={sub.status}
          siteUrl={sub.siteUrl}
          competitors={sub.competitors}
          manualReadyAt={manualReadyAt && manualReadyAt.getTime() > Date.now() ? manualReadyAt.toISOString() : null}
          hasBilling={!!sub.stripeCustomerId}
        />
      </main>
    </div>
  );
}

function Notice({ tone, children }: { tone: "warn" | "info"; children: React.ReactNode }) {
  return (
    <div
      className={`rounded-2xl border p-4 font-dm text-sm ${
        tone === "warn" ? "border-amber-200 bg-amber-50 text-amber-900" : "border-[#D2DCE8] bg-white text-[#3A4A5C]"
      }`}
    >
      {children}
    </div>
  );
}
