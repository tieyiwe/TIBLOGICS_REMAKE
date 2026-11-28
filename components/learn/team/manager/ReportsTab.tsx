"use client";

import { useState } from "react";
import { useT } from "@/lib/i18n/client";
import { fmtDate } from "@/lib/learn/format";
import { BarList, WeekBars } from "../TeamCharts";
import { Kpi, call, cls, type DashCtx } from "./ui";

/** Team progress over time, completion by track, skills gaps, CSV exports and the email report settings. */
export default function ReportsTab({ ctx, digestOn, monthlyOn }: { ctx: DashCtx; digestOn: boolean; monthlyOn: boolean | null }) {
  const t = useT();
  const { report, locale, busy, run } = ctx;
  const [digest, setDigest] = useState(digestOn);
  const [monthly, setMonthly] = useState(monthlyOn ?? false);
  const assignedTracks = new Set(report.assignments.map((a) => a.trackId));
  // Assigned tracks first, then any track someone started.
  const byTrack = [...report.progressByTrack]
    .filter((x) => assignedTracks.has(x.trackId) || x.started > 0)
    .sort((a, b) => Number(assignedTracks.has(b.trackId)) - Number(assignedTracks.has(a.trackId)) || b.started - a.started);

  const toggleDigest = (on: boolean) => {
    setDigest(on);
    return run(
      "digest",
      async () => {
        try {
          await call("/api/learn/team/settings", "POST", { digest: on });
        } catch (err) {
          setDigest(!on);
          throw err;
        }
        return t(on ? "team.reports.digestOn" : "team.reports.digestOff");
      },
      { refresh: false },
    );
  };

  const toggleMonthly = (on: boolean) => {
    setMonthly(on);
    return run(
      "monthly",
      async () => {
        try {
          await call("/api/learn/team/settings", "POST", { monthly: on });
        } catch (err) {
          setMonthly(!on);
          throw err;
        }
        return t(on ? "team.reports.monthlyOn" : "team.reports.monthlyOff");
      },
      { refresh: false },
    );
  };

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3" aria-label={t("team.reports.last7")}>
        <Kpi label={t("team.reports.lessons7")} value={String(report.pulse.lessons7)} />
        <Kpi label={t("team.reports.active7")} value={String(report.pulse.active7)} />
        <Kpi label={t("team.reports.certs7")} value={String(report.pulse.certificates7)} />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className={cls.card} aria-labelledby="chart-weeks">
          <h2 id="chart-weeks" className={cls.h2}>{t("team.charts.completions")}</h2>
          <p className="mt-1 text-xs text-[var(--ink3)]">{t("team.charts.completionsHint")}</p>
          <WeekBars weeks={report.completionsByWeek.map((w) => ({ label: fmtDate(w.week, locale), value: w.lessons }))} unitLabel={t("team.charts.lessons")} />
        </section>
        <section className={cls.card} aria-labelledby="chart-active">
          <h2 id="chart-active" className={cls.h2}>{t("team.reports.activeWeeks")}</h2>
          <p className="mt-1 text-xs text-[var(--ink3)]">{t("team.reports.activeWeeksHint")}</p>
          <WeekBars weeks={report.activeByWeek.map((w) => ({ label: fmtDate(w.week, locale), value: w.learners }))} unitLabel={t("team.reports.learners")} />
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className={cls.card} aria-labelledby="chart-tracks">
          <h2 id="chart-tracks" className={cls.h2}>{t("team.reports.byTrack")}</h2>
          <p className="mt-1 text-xs text-[var(--ink3)]">{t("team.charts.byTrackHint")}</p>
          <BarList
            items={byTrack.map((x) => ({
              key: x.trackId,
              label: ctx.titles[x.trackId] ?? x.title,
              value: x.avgPercent,
              note: `${t("team.charts.startedDone", { s: x.started, c: x.completed })}${assignedTracks.has(x.trackId) ? ` · ${t("team.reports.assigned")}` : ""}`,
            }))}
            max={100}
            unit="%"
            empty={t("team.charts.empty")}
          />
        </section>
        <section className={cls.card} aria-labelledby="chart-gaps">
          <h2 id="chart-gaps" className={cls.h2}>{t("team.charts.gaps")}</h2>
          <p className="mt-1 text-xs text-[var(--ink3)]">{t("team.charts.gapsHint")}</p>
          <BarList
            items={report.skillGaps.map((g) => ({
              key: g.moduleId,
              label: g.module,
              sub: g.track,
              value: g.avgScore,
              note: t(g.learners === 1 ? "team.charts.learners.one" : "team.charts.learners.other", { n: g.learners }),
            }))}
            max={100}
            unit="%"
            empty={t("team.charts.gapsEmpty")}
          />
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className={cls.card} aria-labelledby="export-title">
          <h2 id="export-title" className={cls.h2}>{t("team.reports.export")}</h2>
          <p className={cls.hint}>{t("team.reports.exportHint")}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <a href="/api/learn/team/export" className={cls.btn}>{t("team.reports.csvProgress")}</a>
            <a href="/api/learn/team/export?kind=assignments" className={cls.btn}>{t("team.reports.csvAssignments")}</a>
          </div>
        </section>
        <section className={cls.card} aria-labelledby="digest-title">
          <h2 id="digest-title" className={cls.h2}>{t("team.reports.digestTitle")}</h2>
          <p className={cls.hint}>{t("team.reports.digestHint")}</p>
          <label className="mt-4 flex cursor-pointer items-center gap-3 text-sm font-semibold text-[var(--ink)]">
            <input type="checkbox" checked={digest} disabled={busy !== null} onChange={(e) => void toggleDigest(e.target.checked)} className="h-4 w-4" />
            {t("team.reports.digestLabel")}
          </label>
          {monthlyOn !== null && (
            <>
              <p className="mt-4 text-sm text-[var(--ink2)]">{t("team.reports.monthlyHint")}</p>
              <label className="mt-2 flex cursor-pointer items-center gap-3 text-sm font-semibold text-[var(--ink)]">
                <input type="checkbox" checked={monthly} disabled={busy !== null} onChange={(e) => void toggleMonthly(e.target.checked)} className="h-4 w-4" data-testid="team-monthly-toggle" />
                {t("team.reports.monthlyLabel")}
              </label>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
