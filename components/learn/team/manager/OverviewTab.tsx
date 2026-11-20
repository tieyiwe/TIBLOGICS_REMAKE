"use client";

import { useMemo } from "react";
import { useT } from "@/lib/i18n/client";
import { fmtDate } from "@/lib/learn/format";
import { Bar, Kpi, Pill, activeThisWeek, call, cls, displayName, isInactive, type DashCtx } from "./ui";

/** KPIs and the "needs attention" list, each item one click from its fix. */
export default function OverviewTab({ ctx, aiPool }: { ctx: DashCtx; aiPool: { used: number; limit: number } }) {
  const t = useT();
  const { report, locale, busy, run } = ctx;
  const active = report.members.filter((m) => m.status === "active");
  const learners = active.filter((m) => m.role !== "owner");
  const now = Date.now();

  const byStudent = useMemo(() => {
    const m = new Map<string, typeof report.assignments>();
    for (const a of report.assignments) m.set(a.studentId, [...(m.get(a.studentId) ?? []), a]);
    return m;
  }, [report.assignments]);

  const overdue = report.assignments.filter((a) => a.overdue);
  const overdueMembers = active.filter((m) => (byStudent.get(m.studentId ?? "") ?? []).some((a) => a.overdue));
  const inactive = learners.filter((m) => isInactive(m, now) && !overdueMembers.includes(m));
  const pending = report.members.filter((m) => m.status === "invited" || m.status === "expired");
  const avg = report.assignments.length
    ? Math.round(report.assignments.reduce((n, a) => n + a.percent, 0) / report.assignments.length)
    : active.length
      ? Math.round(active.reduce((n, m) => n + m.overallPercent, 0) / active.length)
      : 0;
  const certs = active.reduce((n, m) => n + m.certificates, 0);

  // Assigned tracks, team-wide.
  const byTrack = useMemo(() => {
    const g = new Map<string, { n: number; sum: number; done: number; overdue: number }>();
    for (const a of report.assignments) {
      const x = g.get(a.trackId) ?? { n: 0, sum: 0, done: 0, overdue: 0 };
      x.n++;
      x.sum += a.percent;
      if (a.percent >= 100) x.done++;
      if (a.overdue) x.overdue++;
      g.set(a.trackId, x);
    }
    return [...g.entries()].map(([trackId, x]) => ({ trackId, ...x, avg: Math.round(x.sum / x.n) }));
  }, [report.assignments]);

  const nudge = (studentId: string, who: string) =>
    run(`nudge:${studentId}`, async () => {
      const d = await call<{ sent: number; recent: number; nothing: number }>("/api/learn/team/nudge", "POST", { studentIds: [studentId] });
      if (d.sent) return t("team.nudge.sentTo", { who });
      if (d.recent) return t("team.nudge.recent", { who });
      return t("team.nudge.nothing", { who });
    });
  const resend = (memberId: string, who: string) =>
    run(`resend:${memberId}`, async () => {
      await call(`/api/learn/team/members/${memberId}`, "POST", { action: "resend" });
      return t("team.attention.resent", { who });
    });

  const attentionCount = overdueMembers.length + inactive.length + pending.length;
  const lastActive = (iso: string | null) => (iso ? t("team.attention.lastActive", { date: fmtDate(iso, locale) }) : t("team.attention.neverActive"));

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-5" aria-label={t("team.dash.summary")}>
        <Kpi label={t("team.kpi.seats")} value={`${ctx.used} / ${ctx.team.seats}`} detail={t(ctx.free === 1 ? "team.dash.free.one" : "team.dash.free.other", { n: ctx.free })} />
        <Kpi label={t("team.kpi.activeWeek")} value={`${active.filter((m) => activeThisWeek(m, now)).length} / ${active.length}`} detail={t("team.kpi.activeWeekHint")} />
        <Kpi label={t("team.kpi.avgProgress")} value={`${avg}%`} detail={t(report.assignments.length ? "team.kpi.avgAssigned" : "team.kpi.avgStarted")} />
        <Kpi
          label={t("team.kpi.overdue")}
          value={String(overdue.length)}
          tone={overdue.length ? "red" : undefined}
          detail={t(overdueMembers.length === 1 ? "team.kpi.people.one" : "team.kpi.people.other", { n: overdueMembers.length })}
        />
        <Kpi label={t("team.kpi.certificates")} value={String(certs)} detail={t("team.kpi.certsWeek", { n: report.pulse.certificates7 })} />
      </section>

      {learners.length === 0 && pending.length === 0 && (
        <section className={`${cls.card} flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between`}>
          <div>
            <h2 className={cls.h2}>{t("team.empty.title")}</h2>
            <p className={cls.hint}>{t("team.empty.body")}</p>
          </div>
          <button type="button" className={cls.accent} onClick={() => ctx.goTab("invite")}>{t("team.dash.inviteCta")}</button>
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <section className={cls.card} aria-labelledby="attn-title">
          <div className="flex items-baseline justify-between gap-3">
            <h2 id="attn-title" className={cls.h2}>{t("team.attention.title")}</h2>
            {attentionCount > 0 && <Pill tone="amber">{attentionCount}</Pill>}
          </div>
          {attentionCount === 0 ? (
            <p className="mt-3 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-900">{t("team.attention.allGood")}</p>
          ) : (
            <div className="mt-3 space-y-5">
              {overdueMembers.length > 0 && (
                <div>
                  <p className={cls.kicker}>{t("team.attention.overdue")}</p>
                  <ul className="mt-1 divide-y divide-[var(--border)]">
                    {overdueMembers.map((m) => {
                      const items = (byStudent.get(m.studentId ?? "") ?? []).filter((a) => a.overdue);
                      const who = displayName(m);
                      return (
                        <li key={m.memberId} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                          <button type="button" className="min-w-0 text-left" onClick={() => ctx.openMember(m.memberId)}>
                            <span className="block truncate text-sm font-bold text-[var(--ink)] hover:underline">{who}</span>
                            <span className="block text-xs text-red-700">
                              {items.map((a) => `${ctx.titles[a.trackId] ?? ""} (${a.percent}%, ${t("team.assign.overdue", { date: fmtDate(a.dueAt!, locale) })})`).join(" · ")}
                            </span>
                          </button>
                          <button type="button" className={`${cls.btn} shrink-0 self-start sm:self-auto`} disabled={busy !== null} onClick={() => nudge(m.studentId!, who)}>
                            {busy === `nudge:${m.studentId}` ? t("team.busy") : t("team.nudge.one")}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
              {inactive.length > 0 && (
                <div>
                  <p className={cls.kicker}>{t("team.attention.inactive", { n: 7 })}</p>
                  <ul className="mt-1 divide-y divide-[var(--border)]">
                    {inactive.map((m) => {
                      const who = displayName(m);
                      const open = (byStudent.get(m.studentId ?? "") ?? []).some((a) => a.percent < 100);
                      return (
                        <li key={m.memberId} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                          <button type="button" className="min-w-0 text-left" onClick={() => ctx.openMember(m.memberId)}>
                            <span className="block truncate text-sm font-bold text-[var(--ink)] hover:underline">{who}</span>
                            <span className="block text-xs text-[var(--ink3)]">{lastActive(m.lastActiveAt)}</span>
                          </button>
                          {open ? (
                            <button type="button" className={`${cls.btn} shrink-0 self-start sm:self-auto`} disabled={busy !== null} onClick={() => nudge(m.studentId!, who)}>
                              {busy === `nudge:${m.studentId}` ? t("team.busy") : t("team.nudge.one")}
                            </button>
                          ) : (
                            <button type="button" className={`${cls.btn} shrink-0 self-start sm:self-auto`} onClick={() => ctx.goTab("assignments")}>
                              {t("team.attention.assign")}
                            </button>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
              {pending.length > 0 && (
                <div>
                  <p className={cls.kicker}>{t("team.attention.pending")}</p>
                  <ul className="mt-1 divide-y divide-[var(--border)]">
                    {pending.map((m) => (
                      <li key={m.memberId} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-[var(--ink)]">{m.invite?.name ? `${m.invite.name} · ${m.email}` : m.email}</p>
                          <p className={`text-xs ${m.status === "expired" ? "text-red-700" : "text-[var(--ink3)]"}`}>
                            {m.status === "expired"
                              ? t("team.attention.expired")
                              : t("team.attention.invitedOn", { date: fmtDate(m.invitedAt, locale), until: m.inviteExpiresAt ? fmtDate(m.inviteExpiresAt, locale) : "" })}
                          </p>
                        </div>
                        <button type="button" className={`${cls.btn} shrink-0 self-start sm:self-auto`} disabled={busy !== null || !ctx.team.entitled} onClick={() => resend(m.memberId, m.email)}>
                          {busy === `resend:${m.memberId}` ? t("team.busy") : t("team.member.resend")}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </section>

        <div className="space-y-6">
          <section className={cls.card} aria-labelledby="assigned-summary">
            <div className="flex items-baseline justify-between gap-3">
              <h2 id="assigned-summary" className={cls.h2}>{t("team.overview.assigned")}</h2>
              <button type="button" className="text-sm font-semibold text-[var(--blue2)] underline" onClick={() => ctx.goTab("assignments")}>{t("team.overview.manage")}</button>
            </div>
            {byTrack.length === 0 ? (
              <p className="mt-3 text-sm text-[var(--ink3)]">{t("team.overview.noAssigned")}</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {byTrack.map((x) => (
                  <li key={x.trackId}>
                    <div className="flex items-baseline justify-between gap-3 text-xs">
                      <span className="min-w-0 truncate font-semibold text-[var(--ink)]">{ctx.titles[x.trackId] ?? ""}</span>
                      <span className="shrink-0 font-bold tabular-nums">{x.avg}%</span>
                    </div>
                    <div className="mt-1"><Bar value={x.avg} tone={x.overdue ? "red" : x.done === x.n ? "green" : "blue"} label={ctx.titles[x.trackId]} /></div>
                    <p className="mt-0.5 text-[11px] text-[var(--ink3)]">
                      {t("team.overview.trackLine", { n: x.n, done: x.done })}
                      {x.overdue ? ` · ${t("team.overview.trackOverdue", { n: x.overdue })}` : ""}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section className={cls.card} aria-labelledby="quick-title">
            <h2 id="quick-title" className={cls.h2}>{t("team.overview.quick")}</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" className={cls.btn} onClick={() => ctx.goTab("invite")}>{t("team.dash.inviteCta")}</button>
              <button type="button" className={cls.btn} onClick={() => ctx.goTab("assignments")}>{t("team.assign.title")}</button>
              <a className={cls.btn} href="/api/learn/team/export">{t("team.dash.export")}</a>
            </div>
            <p className="mt-4 text-xs text-[var(--ink3)]">
              {t("team.overview.aiLine", { used: aiPool.used, limit: aiPool.limit })} · {t("team.dash.aiPoolHint")}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
