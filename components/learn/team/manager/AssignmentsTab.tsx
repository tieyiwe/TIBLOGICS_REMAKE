"use client";

import { useMemo, useState } from "react";
import { useT } from "@/lib/i18n/client";
import { fmtDate } from "@/lib/learn/format";
import { Bar, Pill, TrackPicker, assignmentStatus, barTone, call, cls, displayName, statusTone, type AssignmentRow, type DashCtx } from "./ui";

/**
 * Assign tracks to several people (or everyone) with a due date; follow each
 * assignment against its date; select people and send a reminder (nudge).
 */
export default function AssignmentsTab({ ctx }: { ctx: DashCtx }) {
  const t = useT();
  const { report, busy, run, locale } = ctx;
  const active = report.members.filter((m) => m.status === "active" && m.studentId);
  const [tracks, setTracks] = useState<string[]>([]);
  const [due, setDue] = useState("");
  const [everyone, setEveryone] = useState(false);
  const [who, setWho] = useState<string[]>([]);
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const nameOf = (sid: string) => {
    const m = report.members.find((x) => x.studentId === sid);
    return m ? displayName(m) : "";
  };

  const groups = useMemo(() => {
    const g = new Map<string, AssignmentRow[]>();
    for (const a of report.assignments) g.set(a.trackId, [...(g.get(a.trackId) ?? []), a]);
    return [...g.entries()]
      .map(([trackId, rows]) => ({
        trackId,
        rows: rows.sort((x, y) => Number(y.overdue) - Number(x.overdue) || x.percent - y.percent),
        avg: Math.round(rows.reduce((n, a) => n + a.percent, 0) / rows.length),
        done: rows.filter((a) => a.percent >= 100).length,
        overdue: rows.filter((a) => a.overdue).length,
      }))
      .sort((a, b) => b.overdue - a.overdue || (ctx.titles[a.trackId] ?? "").localeCompare(ctx.titles[b.trackId] ?? ""));
  }, [report.assignments, ctx.titles]);

  const assign = (e: React.FormEvent) => {
    e.preventDefault();
    void run("assign", async () => {
      const d = await call<{ assigned: number; tracks: number }>("/api/learn/team/assignments", "POST", {
        ...(everyone ? { everyone: true } : { studentIds: who }),
        trackIds: tracks,
        dueAt: due || null,
      });
      setWho([]);
      setTracks([]);
      return t(d.tracks > 1 ? "team.assign.doneMany" : "team.assign.done", { n: d.assigned, k: d.tracks });
    });
  };

  // Selection is per assignment row; the nudge goes to the people behind them.
  const toggle = (id: string) => setSelected((s) => {
    const n = new Set(s);
    if (n.has(id)) n.delete(id);
    else n.add(id);
    return n;
  });
  const selectedRows = report.assignments.filter((a) => selected.has(a.id));
  const selectedPeople = [...new Set(selectedRows.map((a) => a.studentId))];

  const nudge = () =>
    run("nudge", async () => {
      const d = await call<{ sent: number; recent: number; nothing: number; failed: number }>("/api/learn/team/nudge", "POST", {
        studentIds: selectedPeople,
        trackIds: [...new Set(selectedRows.map((a) => a.trackId))],
      });
      setSelected(new Set());
      return [
        t(d.sent === 1 ? "team.nudge.sent.one" : "team.nudge.sent.other", { n: d.sent }),
        d.recent ? t("team.nudge.skippedRecent", { n: d.recent }) : "",
        d.nothing ? t("team.nudge.skippedDone", { n: d.nothing }) : "",
        d.failed ? t("team.nudge.failed", { n: d.failed }) : "",
      ]
        .filter(Boolean)
        .join(" · ");
    });

  const unassign = (a: AssignmentRow) =>
    run(`un:${a.id}`, async () => {
      await call(`/api/learn/team/assignments?id=${encodeURIComponent(a.id)}`, "DELETE");
      return t("team.assign.removed");
    });

  const filteredPeople = active.filter((m) => !q.trim() || `${m.name ?? ""} ${m.email}`.toLowerCase().includes(q.trim().toLowerCase()));
  const overdueIds = report.assignments.filter((a) => a.overdue).map((a) => a.id);
  const recent = (iso: string | null) => !!iso && Date.now() - new Date(iso).getTime() < 24 * 3_600_000;

  return (
    <div className="space-y-6">
      <section className={cls.card} aria-labelledby="assign-title">
        <h2 id="assign-title" className={cls.h2}>{t("team.assign.title")}</h2>
        <p className={cls.hint}>{t("team.assign.body2")}</p>
        <form onSubmit={assign} className="mt-4 grid gap-5 lg:grid-cols-2">
          <div className="space-y-4">
            <TrackPicker id="assign-tracks" tracks={report.tracks} titles={ctx.titles} value={tracks} onChange={setTracks} legend={t("team.assign.tracks")} />
            <div>
              <label htmlFor="assign-due" className={cls.label}>{t("team.assign.due")}</label>
              <input id="assign-due" type="date" value={due} onChange={(e) => setDue(e.target.value)} className={cls.input} />
            </div>
          </div>
          <fieldset className="min-w-0">
            <legend className={cls.label}>{t("team.assign.who")}</legend>
            <label className={`mt-1.5 flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold ${everyone ? "border-[var(--ink)] bg-[var(--s3)]" : "border-[var(--border)]"}`}>
              <input type="checkbox" checked={everyone} onChange={(e) => setEveryone(e.target.checked)} />
              {t("team.assign.everyone", { n: active.length })}
            </label>
            {!everyone && (
              <>
                <label htmlFor="assign-search" className="sr-only">{t("team.people.search")}</label>
                <input id="assign-search" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("team.people.search")} className={`${cls.input} h-9`} />
                <div className="mt-2 max-h-56 space-y-1 overflow-y-auto rounded-lg border border-[var(--border)] p-2">
                  {filteredPeople.map((m) => {
                    const on = who.includes(m.studentId!);
                    return (
                      <label key={m.memberId} className={`flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm ${on ? "bg-[var(--s3)] font-semibold" : ""}`}>
                        <input type="checkbox" checked={on} onChange={() => setWho((xs) => (on ? xs.filter((x) => x !== m.studentId) : [...xs, m.studentId!]))} />
                        <span className="min-w-0 truncate">{displayName(m)}</span>
                      </label>
                    );
                  })}
                </div>
              </>
            )}
            <button
              type="submit"
              disabled={busy !== null || tracks.length === 0 || (!everyone && who.length === 0) || !ctx.team.entitled}
              className={`${cls.primary} mt-4 w-full sm:w-auto`}
            >
              {busy === "assign" ? t("team.busy") : t("team.assign.submit")}
            </button>
          </fieldset>
        </form>
      </section>

      <section className={cls.card} aria-labelledby="progress-title">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 id="progress-title" className={cls.h2}>{t("team.assign.progressTitle")}</h2>
            <p className={cls.hint}>{t("team.assign.progressHint")}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {overdueIds.length > 0 && (
              <button type="button" className={cls.btn} onClick={() => setSelected(new Set(overdueIds))}>{t("team.assign.selectOverdue", { n: overdueIds.length })}</button>
            )}
            <a href="/api/learn/team/export?kind=assignments" className={cls.btn}>{t("team.reports.csvAssignments")}</a>
          </div>
        </div>

        {selected.size > 0 && (
          <div className="sticky top-2 z-10 mt-4 flex flex-col gap-2 rounded-xl bg-[var(--ink)] px-4 py-3 text-sm text-white sm:flex-row sm:items-center sm:justify-between" role="region" aria-label={t("team.nudge.bar")}>
            <span>{t(selectedPeople.length === 1 ? "team.nudge.selected.one" : "team.nudge.selected.other", { n: selectedPeople.length })}</span>
            <span className="flex gap-2">
              <button type="button" className="rounded-full border border-white/40 px-3 py-1.5 text-xs font-semibold" onClick={() => setSelected(new Set())}>{t("team.nudge.clear")}</button>
              <button type="button" className="rounded-full bg-[var(--orange)] px-4 py-1.5 text-xs font-bold text-white disabled:opacity-50" disabled={busy !== null || !ctx.team.entitled} onClick={() => void nudge()}>
                {busy === "nudge" ? t("team.busy") : t("team.nudge.send")}
              </button>
            </span>
          </div>
        )}

        {groups.length === 0 ? (
          <p className="mt-4 text-sm text-[var(--ink3)]">{t("team.overview.noAssigned")}</p>
        ) : (
          <div className="mt-4 space-y-6">
            {groups.map((g) => (
              <div key={g.trackId} className="rounded-xl border border-[var(--border)]">
                <div className="flex flex-col gap-2 border-b border-[var(--border)] bg-[var(--s2)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <h3 className="break-words text-sm font-bold text-[var(--ink)]">{ctx.titles[g.trackId] ?? ""}</h3>
                    <p className="text-xs text-[var(--ink3)]">
                      {t("team.overview.trackLine", { n: g.rows.length, done: g.done })}
                      {g.overdue ? ` · ${t("team.overview.trackOverdue", { n: g.overdue })}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 sm:w-48">
                    <Bar value={g.avg} tone={g.overdue ? "red" : g.done === g.rows.length ? "green" : "blue"} label={ctx.titles[g.trackId]} />
                    <span className="shrink-0 text-sm font-black tabular-nums">{g.avg}%</span>
                  </div>
                </div>
                <ul className="divide-y divide-[var(--border)]">
                  {g.rows.map((a) => {
                    const s = assignmentStatus(a);
                    const name = nameOf(a.studentId);
                    return (
                      <li key={a.id} className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-2 px-4 py-3 sm:grid-cols-[auto_minmax(0,2fr)_minmax(0,2fr)_auto] sm:items-center">
                        <input
                          type="checkbox"
                          aria-label={t("team.nudge.selectOne", { who: name })}
                          checked={selected.has(a.id)}
                          disabled={a.percent >= 100}
                          onChange={() => toggle(a.id)}
                          className="mt-1 sm:mt-0"
                        />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-[var(--ink)]">{name}</p>
                          <p className={`text-xs ${a.overdue ? "font-bold text-red-700" : "text-[var(--ink3)]"}`}>
                            {a.dueAt ? t(a.overdue ? "team.assign.overdue" : "team.assign.dueOn", { date: fmtDate(a.dueAt, locale) }) : t("team.assign.noDue")}
                            {recent(a.lastRemindedAt) ? ` · ${t("team.nudge.remindedToday")}` : ""}
                          </p>
                        </div>
                        <div className="col-start-2 flex items-center gap-3 sm:col-start-auto">
                          <Bar value={a.percent} tone={barTone(s)} label={name} />
                          <span className="w-10 shrink-0 text-right text-xs font-bold tabular-nums">{a.percent}%</span>
                          <Pill tone={statusTone(s)}>{t(`team.assign.status.${s}`)}</Pill>
                        </div>
                        <div className="col-start-2 sm:col-start-auto">
                          <button type="button" className={cls.btn} disabled={busy !== null} onClick={() => void unassign(a)}>{t("team.assign.remove")}</button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
