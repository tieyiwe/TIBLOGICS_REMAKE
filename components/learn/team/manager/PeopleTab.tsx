"use client";

import { useMemo, useState } from "react";
import { useT } from "@/lib/i18n/client";
import { fmtDate } from "@/lib/learn/format";
import type { MemberSummary } from "@/lib/learn/team/report";
import { Bar, Pill, assignmentStatus, barTone, call, cls, displayName, isInactive, type DashCtx } from "./ui";

type Filter = "all" | "active" | "invited" | "overdue" | "inactive" | "managers";

/** Searchable member table: assigned-track progress, last active, status; a row opens the detail drawer. */
export default function PeopleTab({ ctx }: { ctx: DashCtx }) {
  const t = useT();
  const { report, locale, busy, run, isOwner } = ctx;
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const byStudent = useMemo(() => {
    const m = new Map<string, typeof report.assignments>();
    for (const a of report.assignments) m.set(a.studentId, [...(m.get(a.studentId) ?? []), a]);
    return m;
  }, [report.assignments]);

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return report.members.filter((m) => {
      if (needle && !`${m.name ?? ""} ${m.invite?.name ?? ""} ${m.email}`.toLowerCase().includes(needle)) return false;
      const as = byStudent.get(m.studentId ?? "") ?? [];
      switch (filter) {
        case "active": return m.status === "active";
        case "invited": return m.status !== "active";
        case "overdue": return as.some((a) => a.overdue);
        case "inactive": return isInactive(m) && m.role !== "owner";
        case "managers": return m.role !== "member";
        default: return true;
      }
    });
  }, [report.members, q, filter, byStudent]);

  const memberAction = (m: MemberSummary, body: Record<string, string>, confirmText?: string) => {
    if (confirmText && !window.confirm(confirmText)) return;
    void run(`${m.memberId}:${body.action}`, async () => {
      await call(`/api/learn/team/members/${m.memberId}`, "POST", body);
      return t(`team.member.done.${body.action}`);
    });
  };

  const statusPill = (m: MemberSummary) =>
    m.status === "active" ? (
      isInactive(m) ? <Pill tone="amber">{t("team.people.inactive")}</Pill> : <Pill tone="green">{t("team.status.active")}</Pill>
    ) : m.status === "expired" ? (
      <Pill tone="red">{t("team.status.expired")}</Pill>
    ) : (
      <Pill tone="amber">{t("team.status.invited")}</Pill>
    );

  return (
    <section className={cls.card} aria-labelledby="people-title">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 id="people-title" className={cls.h2}>{t("team.people.title")}</h2>
          <p className={cls.hint}>{t("team.people.hint")}</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <label className="sr-only" htmlFor="people-search">{t("team.people.search")}</label>
          <input
            id="people-search"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("team.people.search")}
            className="h-10 w-full rounded-lg border border-[var(--border)] px-3 text-sm sm:w-56"
          />
          <label className="sr-only" htmlFor="people-filter">{t("team.people.filter")}</label>
          <select id="people-filter" value={filter} onChange={(e) => setFilter(e.target.value as Filter)} className="h-10 rounded-lg border border-[var(--border)] bg-white px-3 text-sm">
            {(["all", "active", "invited", "overdue", "inactive", "managers"] as Filter[]).map((f) => (
              <option key={f} value={f}>{t(`team.people.f.${f}`)}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4 hidden grid-cols-[minmax(0,2fr)_minmax(0,3fr)_minmax(0,1fr)_auto] gap-4 border-b border-[var(--border)] pb-2 text-xs font-semibold uppercase tracking-wide text-[var(--ink3)] lg:grid">
        <span>{t("team.people.col.person")}</span>
        <span>{t("team.people.col.assigned")}</span>
        <span>{t("team.members.lastActive")}</span>
        <span className="sr-only">{t("team.people.col.actions")}</span>
      </div>

      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-[var(--ink3)]">{t("team.people.none")}</p>
      ) : (
        <ul className="divide-y divide-[var(--border)]">
          {rows.map((m) => {
            const as = byStudent.get(m.studentId ?? "") ?? [];
            const who = displayName(m);
            return (
              <li key={m.memberId} className="grid gap-3 py-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)_minmax(0,1fr)_auto] lg:items-center lg:gap-4">
                <div className="min-w-0">
                  {m.status === "active" ? (
                    <button type="button" onClick={() => ctx.openMember(m.memberId)} className="block max-w-full truncate text-left text-sm font-bold text-[var(--ink)] hover:underline">
                      {who}
                    </button>
                  ) : (
                    <p className="truncate text-sm font-bold text-[var(--ink)]">{who}</p>
                  )}
                  <p className="truncate text-xs text-[var(--ink3)]">{m.email}</p>
                  <p className="mt-1 flex flex-wrap gap-1.5">
                    <Pill tone="grey">{t(`team.role.${m.status === "active" ? m.role : m.invite?.role ?? m.role}`)}</Pill>
                    {statusPill(m)}
                  </p>
                </div>

                <div className="min-w-0">
                  {m.status !== "active" ? (
                    <p className="text-xs text-[var(--ink3)]">
                      {m.invite?.trackIds.length
                        ? t("team.people.willAssign", { tracks: m.invite.trackIds.map((id) => ctx.titles[id] ?? "").filter(Boolean).join(", ") })
                        : m.status === "expired"
                          ? t("team.members.expired")
                          : m.inviteExpiresAt
                            ? t("team.members.expires", { date: fmtDate(m.inviteExpiresAt, locale) })
                            : ""}
                    </p>
                  ) : as.length === 0 ? (
                    <p className="text-xs text-[var(--ink3)]">
                      {t("team.people.noAssigned")} · {t("team.people.overall", { n: m.overallPercent })}
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {as.map((a) => {
                        const s = assignmentStatus(a);
                        return (
                          <li key={a.id}>
                            <div className="flex items-baseline justify-between gap-2 text-xs">
                              <span className="min-w-0 truncate text-[var(--ink2)]">{ctx.titles[a.trackId] ?? ""}</span>
                              <span className={`shrink-0 font-bold tabular-nums ${a.overdue ? "text-red-700" : "text-[var(--ink)]"}`}>{a.percent}%</span>
                            </div>
                            <div className="mt-0.5"><Bar value={a.percent} tone={barTone(s)} label={ctx.titles[a.trackId]} /></div>
                            {a.dueAt && (
                              <p className={`mt-0.5 text-[11px] ${a.overdue ? "font-bold text-red-700" : "text-[var(--ink3)]"}`}>
                                {t(a.overdue ? "team.assign.overdue" : "team.assign.dueOn", { date: fmtDate(a.dueAt, locale) })}
                              </p>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>

                {m.status === "active" ? (
                  <p className="text-xs text-[var(--ink2)]">
                    <span className="lg:hidden">{m.lastActiveAt ? t("team.attention.lastActive", { date: fmtDate(m.lastActiveAt, locale) }) : t("team.attention.neverActive")}</span>
                    <span className="hidden lg:inline">{m.lastActiveAt ? fmtDate(m.lastActiveAt, locale) : t("team.members.never")}</span>
                  </p>
                ) : (
                  <p className="hidden text-xs text-[var(--ink3)] lg:block">-</p>
                )}

                <div className="flex flex-wrap gap-2 lg:justify-end">
                  {m.status === "active" && (
                    <button type="button" className={cls.btn} onClick={() => ctx.openMember(m.memberId)}>{t("team.people.view")}</button>
                  )}
                  {m.status !== "active" && (
                    <button type="button" className={cls.btn} disabled={busy !== null || !ctx.team.entitled} onClick={() => memberAction(m, { action: "resend" })}>
                      {t("team.member.resend")}
                    </button>
                  )}
                  {isOwner && m.status === "active" && m.role !== "owner" && (
                    <button type="button" className={cls.btn} disabled={busy !== null} onClick={() => memberAction(m, { action: "role", role: m.role === "manager" ? "member" : "manager" })}>
                      {m.role === "manager" ? t("team.member.demote") : t("team.member.promote")}
                    </button>
                  )}
                  {m.role !== "owner" && (isOwner || m.role !== "manager") && (
                    <button
                      type="button"
                      className={`${cls.btn} text-red-700`}
                      disabled={busy !== null}
                      onClick={() => memberAction(m, { action: "remove" }, m.status === "active" ? t("team.member.confirmRemove", { who }) : undefined)}
                    >
                      {m.status === "active" ? t("team.member.remove") : t("team.member.revoke")}
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
