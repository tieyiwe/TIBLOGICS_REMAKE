"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useLocale, useT } from "@/lib/i18n/client";
import { fmtDate, fmtPrice } from "@/lib/learn/format";
import type { TeamReport } from "@/lib/learn/team/report";
import { BarList, WeekBars } from "./TeamCharts";

export interface TeamDashboardProps {
  team: {
    id: string;
    name: string;
    status: string;
    seats: number;
    comped: boolean;
    inGrace: boolean;
    graceUntil: string | null;
    entitled: boolean;
    cancelAtPeriodEnd: boolean;
    currentPeriodEnd: string | null;
    hasBilling: boolean;
  };
  role: string;
  used: number;
  seatPriceCents: number;
  minSeats: number;
  aiPool: { used: number; limit: number };
  report: TeamReport;
  welcome?: boolean;
}

async function call(url: string, method: string, body?: unknown) {
  const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Error");
  return data;
}

export default function TeamDashboard(p: TeamDashboardProps) {
  const t = useT();
  const locale = useLocale();
  const router = useRouter();
  const isOwner = p.role === "owner";
  const { report } = p;
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const free = Math.max(0, p.team.seats - p.used);
  const active = report.members.filter((m) => m.status === "active");
  const trackTitle = useMemo(() => new Map(report.tracks.map((x) => [x.id, x.title])), [report.tracks]);
  const nameOf = (sid: string) => {
    const m = report.members.find((x) => x.studentId === sid);
    return m?.name ?? m?.email ?? "";
  };

  async function run(key: string, fn: () => Promise<string | void>) {
    setBusy(key);
    setMsg(null);
    try {
      const ok = await fn();
      if (ok) setMsg({ kind: "ok", text: ok });
      router.refresh();
    } catch (err) {
      setMsg({ kind: "err", text: err instanceof Error ? err.message : t("team.error.generic") });
    } finally {
      setBusy(null);
    }
  }

  // ── Invite ──
  const [inviteText, setInviteText] = useState("");
  const invite = (e: React.FormEvent) => {
    e.preventDefault();
    void run("invite", async () => {
      const d = await call("/api/learn/team/invites", "POST", { text: inviteText });
      const results = d.results as Array<{ email: string; ok: boolean; reason?: string }>;
      const sent = results.filter((r) => r.ok).length;
      const notes = results.filter((r) => !r.ok).map((r) => `${r.email}: ${t(`team.invite.reason.${r.reason}`)}`);
      setInviteText(notes.length ? results.filter((r) => !r.ok && r.reason === "full").map((r) => r.email).join("\n") : "");
      return [t(sent === 1 ? "team.invite.sent.one" : "team.invite.sent.other", { n: sent }), ...notes].join(" · ");
    });
  };

  // ── Seats ──
  const [seats, setSeats] = useState(p.team.seats);
  const changeSeats = (e: React.FormEvent) => {
    e.preventDefault();
    void run("seats", async () => {
      await call("/api/learn/team/seats", "POST", { seats });
      return t("team.seats.updated", { n: seats });
    });
  };
  const portal = () =>
    run("portal", async () => {
      const d = await call("/api/learn/team/billing-portal", "POST");
      window.location.href = d.url;
    });

  // ── Assign ──
  const [assignTrack, setAssignTrack] = useState(report.tracks[0]?.id ?? "");
  const [assignDue, setAssignDue] = useState("");
  const [assignTo, setAssignTo] = useState<string[]>([]);
  const assign = (e: React.FormEvent) => {
    e.preventDefault();
    void run("assign", async () => {
      const d = await call("/api/learn/team/assignments", "POST", { studentIds: assignTo, trackId: assignTrack, dueAt: assignDue || null });
      setAssignTo([]);
      return t("team.assign.done", { n: d.assigned });
    });
  };

  const memberAction = (memberId: string, body: Record<string, string>, confirmText?: string) => {
    if (confirmText && !window.confirm(confirmText)) return;
    void run(`${memberId}:${body.action}`, async () => {
      await call(`/api/learn/team/members/${memberId}`, "POST", body);
      return t(`team.member.done.${body.action}`);
    });
  };

  const card = "min-w-0 rounded-2xl border border-[var(--border)] bg-white p-5 sm:p-6";
  const btn = "rounded-full border border-[var(--border)] px-3 py-1.5 text-xs font-semibold text-[var(--ink2)] hover:border-[var(--ink3)] disabled:opacity-50";
  const primary = "rounded-full bg-[var(--ink)] px-5 py-2.5 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50";
  const label = "block text-sm font-semibold text-[var(--ink)]";
  const input = "mt-1.5 w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm";

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide text-[var(--ink3)]">{t("team.dash.kicker")}</p>
          <h1 className="break-words text-2xl font-black text-[var(--ink)]">{p.team.name}</h1>
          <p className="mt-1 text-sm text-[var(--ink2)]">
            {t(`team.role.${p.role}`)} · {t(`team.teamStatus.${p.team.comped ? "comped" : p.team.status}`)}
          </p>
        </div>
        <a href="/api/learn/team/export" className="self-start rounded-full border border-[var(--border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--ink2)] hover:border-[var(--ink3)] sm:self-auto">
          {t("team.dash.export")}
        </a>
      </header>

      {p.welcome && (
        <p role="status" className="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-900">{t("team.dash.welcome")}</p>
      )}
      {p.team.inGrace && (
        <div role="alert" className="flex flex-col gap-3 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 sm:flex-row sm:items-center sm:justify-between">
          <span>{t("team.dash.grace", { date: p.team.graceUntil ? fmtDate(p.team.graceUntil, locale) : "" })}</span>
          {isOwner && p.team.hasBilling && (
            <button type="button" onClick={portal} disabled={busy !== null} className={btn}>{t("team.billing.portal")}</button>
          )}
        </div>
      )}
      {!p.team.entitled && (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">{t("team.dash.inactive")}</p>
      )}
      {p.team.cancelAtPeriodEnd && p.team.currentPeriodEnd && (
        <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">{t("team.dash.cancelling", { date: fmtDate(p.team.currentPeriodEnd, locale) })}</p>
      )}
      {msg && (
        <p role={msg.kind === "err" ? "alert" : "status"} className={`rounded-xl px-4 py-3 text-sm ${msg.kind === "err" ? "bg-red-50 text-red-800" : "bg-green-50 text-green-900"}`}>
          {msg.text}
        </p>
      )}

      {/* Stat tiles */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label={t("team.dash.summary")}>
        {[
          { l: t("team.dash.seatsUsed"), v: `${p.used} / ${p.team.seats}`, d: t(free === 1 ? "team.dash.free.one" : "team.dash.free.other", { n: free }) },
          { l: t("team.dash.activeMembers"), v: String(active.length), d: t("team.dash.invitedN", { n: report.members.filter((m) => m.status === "invited").length }) },
          {
            l: t("team.dash.certificates"),
            v: String(active.reduce((n, m) => n + m.certificates, 0)),
            d: t("team.dash.tracksStarted", { n: active.reduce((n, m) => n + m.tracksStarted, 0) }),
          },
          { l: t("team.dash.aiPool"), v: `${p.aiPool.used} / ${p.aiPool.limit}`, d: t("team.dash.aiPoolHint") },
        ].map((x) => (
          <div key={x.l} className="min-w-0 rounded-2xl border border-[var(--border)] bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ink3)]">{x.l}</p>
            <p className="mt-1 text-2xl font-black text-[var(--ink)]">{x.v}</p>
            <p className="mt-1 text-xs text-[var(--ink2)]">{x.d}</p>
          </div>
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Invite */}
        <section className={card} aria-labelledby="invite-title">
          <h2 id="invite-title" className="text-base font-bold text-[var(--ink)]">{t("team.invite.title")}</h2>
          <p className="mt-1 text-sm text-[var(--ink2)]">{t("team.invite.body")}</p>
          <form onSubmit={invite} className="mt-4">
            <label htmlFor="invite-emails" className={label}>{t("team.invite.label")}</label>
            <textarea
              id="invite-emails"
              rows={3}
              value={inviteText}
              onChange={(e) => setInviteText(e.target.value)}
              placeholder="ana@company.com, sam@company.com"
              className={input}
            />
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <button type="submit" disabled={busy !== null || !inviteText.trim() || !p.team.entitled} className={primary}>
                {busy === "invite" ? t("team.busy") : t("team.invite.send")}
              </button>
              <span className="text-xs text-[var(--ink3)]">{t(free === 1 ? "team.dash.free.one" : "team.dash.free.other", { n: free })}</span>
            </div>
          </form>
        </section>

        {/* Seats and billing */}
        <section className={card} aria-labelledby="seats-title">
          <h2 id="seats-title" className="text-base font-bold text-[var(--ink)]">{t("team.seats.title")}</h2>
          {p.team.comped ? (
            <p className="mt-1 text-sm text-[var(--ink2)]">{t("team.seats.comped", { n: p.team.seats })}</p>
          ) : (
            <p className="mt-1 text-sm text-[var(--ink2)]">
              {t("team.seats.body", { n: p.team.seats, price: fmtPrice(p.seatPriceCents, locale), total: fmtPrice(p.seatPriceCents * p.team.seats, locale) })}
            </p>
          )}
          {isOwner && !p.team.comped && p.team.hasBilling ? (
            <>
              <form onSubmit={changeSeats} className="mt-4 flex flex-wrap items-end gap-3">
                <div>
                  <label htmlFor="seat-count" className={label}>{t("team.seats.label")}</label>
                  <input
                    id="seat-count"
                    type="number"
                    min={Math.max(p.minSeats, p.used)}
                    max={500}
                    value={Number.isFinite(seats) ? seats : ""}
                    onChange={(e) => setSeats(parseInt(e.target.value, 10))}
                    className="mt-1.5 h-10 w-24 rounded-lg border border-[var(--border)] px-3 text-sm font-bold"
                  />
                </div>
                <button type="submit" disabled={busy !== null || seats === p.team.seats || !Number.isFinite(seats)} className={primary}>
                  {busy === "seats" ? t("team.busy") : t("team.seats.update")}
                </button>
              </form>
              <p className="mt-2 text-xs text-[var(--ink3)]">{t("team.seats.proration", { n: Math.max(p.minSeats, p.used) })}</p>
              <button type="button" onClick={portal} disabled={busy !== null} className={`${btn} mt-4`}>
                {t("team.billing.portal")}
              </button>
            </>
          ) : (
            !isOwner && <p className="mt-3 text-xs text-[var(--ink3)]">{t("team.seats.ownerOnly")}</p>
          )}
        </section>
      </div>

      {/* Members */}
      <section className={card} aria-labelledby="members-title">
        <h2 id="members-title" className="text-base font-bold text-[var(--ink)]">{t("team.members.title")}</h2>
        <ul className="mt-4 divide-y divide-[var(--border)]">
          {report.members.map((m) => (
            <li key={m.memberId} className="flex flex-col gap-3 py-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0 lg:w-64">
                <p className="truncate text-sm font-bold text-[var(--ink)]">
                  {m.status === "active" ? (
                    <Link href={`/learn/team/member/${m.memberId}`} className="hover:underline">{m.name ?? m.email}</Link>
                  ) : (
                    m.email
                  )}
                </p>
                <p className="truncate text-xs text-[var(--ink3)]">{m.status === "active" ? m.email : t("team.members.invitedOn", { date: fmtDate(m.invitedAt, locale) })}</p>
                <p className="mt-1 flex flex-wrap gap-1.5 text-[11px] font-bold">
                  <span className="rounded-full bg-[var(--s3)] px-2 py-0.5 text-[var(--ink2)]">{t(`team.role.${m.role}`)}</span>
                  <span className={`rounded-full px-2 py-0.5 ${m.status === "active" ? "bg-green-50 text-green-800" : m.status === "expired" ? "bg-red-50 text-red-800" : "bg-amber-50 text-amber-900"}`}>
                    {t(`team.status.${m.status}`)}
                  </span>
                </p>
              </div>
              {m.status === "active" ? (
                <dl className="grid flex-1 grid-cols-3 gap-x-3 gap-y-2 text-xs sm:grid-cols-6">
                  {[
                    [t("team.members.progress"), `${m.overallPercent}%`],
                    [t("team.members.tracks"), String(m.tracksStarted)],
                    [t("team.members.quiz"), m.quizAverage == null ? "–" : `${m.quizAverage}%`],
                    [t("team.members.exam"), m.examBest == null ? "–" : `${m.examBest}%`],
                    [t("team.members.certs"), String(m.certificates)],
                    [t("team.members.studio"), String(m.studioChallenges)],
                    [t("team.members.review"), t(m.reviewStreak === 1 ? "team.days.one" : "team.days.other", { n: m.reviewStreak })],
                    [t("team.members.lastActive"), m.lastActiveAt ? fmtDate(m.lastActiveAt, locale) : t("team.members.never")],
                  ].map(([k, v]) => (
                    <div key={k} className="min-w-0">
                      <dt className="truncate text-[var(--ink3)]">{k}</dt>
                      <dd className="font-bold text-[var(--ink)]">{v}</dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="flex-1 text-xs text-[var(--ink3)]">
                  {m.status === "expired" ? t("team.members.expired") : m.inviteExpiresAt ? t("team.members.expires", { date: fmtDate(m.inviteExpiresAt, locale) }) : ""}
                </p>
              )}
              <div className="flex flex-wrap gap-2 lg:justify-end">
                {m.status !== "active" && (
                  <button type="button" className={btn} disabled={busy !== null} onClick={() => memberAction(m.memberId, { action: "resend" })}>
                    {t("team.member.resend")}
                  </button>
                )}
                {isOwner && m.status === "active" && m.role !== "owner" && (
                  <button
                    type="button"
                    className={btn}
                    disabled={busy !== null}
                    onClick={() => memberAction(m.memberId, { action: "role", role: m.role === "manager" ? "member" : "manager" })}
                  >
                    {m.role === "manager" ? t("team.member.demote") : t("team.member.promote")}
                  </button>
                )}
                {m.role !== "owner" && (isOwner || m.role !== "manager") && (
                  <button
                    type="button"
                    className={`${btn} text-red-700`}
                    disabled={busy !== null}
                    onClick={() =>
                      memberAction(m.memberId, { action: "remove" }, m.status === "active" ? t("team.member.confirmRemove", { who: m.name ?? m.email }) : undefined)
                    }
                  >
                    {m.status === "active" ? t("team.member.remove") : t("team.member.revoke")}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className={card} aria-labelledby="chart-tracks">
          <h2 id="chart-tracks" className="text-base font-bold text-[var(--ink)]">{t("team.charts.byTrack")}</h2>
          <p className="mt-1 text-xs text-[var(--ink3)]">{t("team.charts.byTrackHint")}</p>
          <BarList
            items={report.progressByTrack.map((x) => ({
              key: x.trackId,
              label: x.title,
              value: x.avgPercent,
              note: t("team.charts.startedDone", { s: x.started, c: x.completed }),
            }))}
            max={100}
            unit="%"
            empty={t("team.charts.empty")}
          />
        </section>
        <section className={card} aria-labelledby="chart-weeks">
          <h2 id="chart-weeks" className="text-base font-bold text-[var(--ink)]">{t("team.charts.completions")}</h2>
          <p className="mt-1 text-xs text-[var(--ink3)]">{t("team.charts.completionsHint")}</p>
          <WeekBars weeks={report.completionsByWeek.map((w) => ({ label: fmtDate(w.week, locale), value: w.lessons }))} unitLabel={t("team.charts.lessons")} />
        </section>
      </div>
      <section className={card} aria-labelledby="chart-gaps">
        <h2 id="chart-gaps" className="text-base font-bold text-[var(--ink)]">{t("team.charts.gaps")}</h2>
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

      {/* Assignments */}
      <section className={card} aria-labelledby="assign-title">
        <h2 id="assign-title" className="text-base font-bold text-[var(--ink)]">{t("team.assign.title")}</h2>
        <p className="mt-1 text-sm text-[var(--ink2)]">{t("team.assign.body")}</p>
        <form onSubmit={assign} className="mt-4 grid gap-4 md:grid-cols-[1fr_auto]">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="min-w-0">
              <label htmlFor="assign-track" className={label}>{t("team.assign.track")}</label>
              <select id="assign-track" value={assignTrack} onChange={(e) => setAssignTrack(e.target.value)} className={input}>
                {report.tracks.map((x) => (
                  <option key={x.id} value={x.id}>{x.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="assign-due" className={label}>{t("team.assign.due")}</label>
              <input id="assign-due" type="date" value={assignDue} onChange={(e) => setAssignDue(e.target.value)} className={input} />
            </div>
            <fieldset className="min-w-0 sm:col-span-2">
              <legend className={label}>{t("team.assign.who")}</legend>
              <div className="mt-1.5 flex flex-wrap gap-2">
                {active.map((m) => {
                  const on = assignTo.includes(m.studentId!);
                  return (
                    <label key={m.memberId} className={`flex max-w-full cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${on ? "border-[var(--ink)] bg-[var(--s3)]" : "border-[var(--border)]"}`}>
                      <input
                        type="checkbox"
                        checked={on}
                        onChange={() => setAssignTo((xs) => (on ? xs.filter((x) => x !== m.studentId) : [...xs, m.studentId!]))}
                      />
                      <span className="truncate">{m.name ?? m.email}</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
          </div>
          <div className="md:self-end">
            <button type="submit" disabled={busy !== null || assignTo.length === 0 || !assignTrack} className={`${primary} w-full md:w-auto`}>
              {busy === "assign" ? t("team.busy") : t("team.assign.submit")}
            </button>
          </div>
        </form>

        {report.assignments.length > 0 && (
          <ul className="mt-6 divide-y divide-[var(--border)] text-sm">
            {report.assignments.map((a) => (
              <li key={a.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="font-semibold text-[var(--ink)]">{nameOf(a.studentId)}: {trackTitle.get(a.trackId)}</p>
                  <p className={`text-xs ${a.overdue ? "font-bold text-red-700" : "text-[var(--ink3)]"}`}>
                    {a.dueAt ? t(a.overdue ? "team.assign.overdue" : "team.assign.dueOn", { date: fmtDate(a.dueAt, locale) }) : t("team.assign.noDue")} · {a.percent}%
                  </p>
                </div>
                <button
                  type="button"
                  className={btn}
                  disabled={busy !== null}
                  onClick={() =>
                    run(`un:${a.id}`, async () => {
                      await call(`/api/learn/team/assignments?id=${encodeURIComponent(a.id)}`, "DELETE");
                      return t("team.assign.removed");
                    })
                  }
                >
                  {t("team.assign.remove")}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="text-xs leading-relaxed text-[var(--ink3)]">{t("team.privacy.managerNote")}</p>
    </div>
  );
}
