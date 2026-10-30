"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useLocale, useT } from "@/lib/i18n/client";
import { fmtDate } from "@/lib/learn/format";

export interface MemberAssignmentView {
  id: string;
  slug: string;
  title: string;
  dueAt: string | null;
  assignedAt?: string;
  percent: number;
  overdue: boolean;
}

export interface NextStepView {
  href: string;
  title: string;
  kind: string;
}

export interface BoardView {
  optedIn: boolean;
  rows: Array<{ rank: number; name: string; xp: number; isMe: boolean }>;
}

/** Where the learner should be by now, as a percent of the time between assignment and due date. */
export function expectedPercent(a: MemberAssignmentView, now = Date.now()): number | null {
  if (!a.dueAt || !a.assignedAt) return null;
  const start = new Date(a.assignedAt).getTime();
  const end = new Date(a.dueAt).getTime();
  if (end <= start) return 100;
  return Math.round(Math.min(100, Math.max(0, ((now - start) / (end - start)) * 100)));
}

export function planStatus(a: MemberAssignmentView): "done" | "overdue" | "behind" | "onTrack" | "notStarted" {
  if (a.percent >= 100) return "done";
  if (a.overdue) return "overdue";
  const exp = expectedPercent(a);
  if (exp != null && a.percent + 10 < exp) return "behind";
  return a.percent > 0 ? "onTrack" : "notStarted";
}

const pillCls = (s: ReturnType<typeof planStatus>) =>
  s === "done" ? "bg-green-50 text-green-800" : s === "overdue" ? "bg-red-50 text-red-800" : s === "behind" ? "bg-amber-50 text-amber-900" : s === "onTrack" ? "bg-blue-50 text-blue-900" : "bg-[var(--s3)] text-[var(--ink2)]";
const barCls = (s: ReturnType<typeof planStatus>) => (s === "done" ? "bg-green-600" : s === "overdue" ? "bg-red-600" : s === "behind" ? "bg-[var(--orange)]" : "bg-[var(--blue2)]");

/** What a member sees: their plan against its dates, who manages them, what is shared, the team board, and a way out. */
export default function TeamMemberView({
  teamName,
  managers,
  assignments,
  role,
  entitled,
  next,
  board,
}: {
  teamName: string;
  managers: string[];
  assignments: MemberAssignmentView[];
  role: string;
  entitled: boolean;
  next: NextStepView | null;
  board: BoardView | null;
}) {
  const t = useT();
  const locale = useLocale();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function leave() {
    if (!window.confirm(t("team.leave.confirm", { team: teamName }))) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/learn/team/leave", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? t("team.error.generic"));
      router.push("/learn");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("team.error.generic"));
      setBusy(false);
    }
  }

  const done = assignments.filter((a) => a.percent >= 100).length;
  const card = "min-w-0 rounded-2xl border border-[var(--border)] bg-white p-5 sm:p-6";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <p className="text-xs font-bold uppercase tracking-wide text-[var(--ink3)]">{t("team.member.kicker")}</p>
        <h1 className="break-words text-2xl font-black text-[var(--ink)]">{teamName}</h1>
        <p className="mt-1 text-sm text-[var(--ink2)]">
          {t(`team.role.${role}`)}
          {managers.length > 0 ? ` · ${t("team.member.managedByLine", { names: managers.join(", ") })}` : ""}
        </p>
      </header>
      {!entitled && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">{t("team.member.inactive")}</p>}

      <section className={card} aria-labelledby="plan-title">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h2 id="plan-title" className="text-base font-bold text-[var(--ink)]">{t("team.plan.title")}</h2>
            <p className="mt-1 text-sm text-[var(--ink2)]">
              {assignments.length ? t("team.plan.summary", { done, n: assignments.length }) : t("team.assigned.none")}
            </p>
          </div>
          {next && (
            <Link href={next.href} className="inline-flex shrink-0 items-center justify-center rounded-full bg-[var(--orange)] px-5 py-2.5 text-sm font-bold text-white hover:opacity-90">
              {t(next.kind === "start" ? "team.plan.start" : "team.plan.continue")} →
            </Link>
          )}
        </div>
        {next && <p className="mt-2 break-words text-xs text-[var(--ink3)]">{t("team.plan.nextLesson", { title: next.title })}</p>}
        {assignments.length > 0 && (
          <ul className="mt-4 space-y-4">
            {assignments.map((a) => {
              const s = planStatus(a);
              const e = expectedPercent(a);
              // A marker at 0% says nothing: show it once some time has passed.
              const exp = e != null && e >= 5 ? e : null;
              return (
                <li key={a.id}>
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <Link href={`/learn/track/${a.slug}`} className="min-w-0 break-words text-sm font-bold text-[var(--ink)] hover:underline">{a.title}</Link>
                    <span className="flex items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${pillCls(s)}`}>{t(`team.assign.status.${s}`)}</span>
                      <span className="text-sm font-black tabular-nums text-[var(--ink)]">{a.percent}%</span>
                    </span>
                  </div>
                  <div className="relative mt-1.5 h-2 overflow-visible rounded-full bg-[var(--s3)]">
                    <div className={`h-full rounded-full ${barCls(s)}`} style={{ width: `${Math.max(0, Math.min(100, a.percent))}%` }} />
                    {exp != null && s !== "done" && (
                      <span aria-hidden="true" title={t("team.plan.expected", { n: exp })} className="absolute -top-1 h-4 w-0.5 rounded bg-[var(--ink)]" style={{ left: `calc(${exp}% - 1px)` }} />
                    )}
                  </div>
                  <p className={`mt-1 text-xs ${a.overdue ? "font-bold text-red-700" : "text-[var(--ink3)]"}`}>
                    {a.dueAt ? t(a.overdue ? "team.assign.overdue" : "team.assign.dueOn", { date: fmtDate(a.dueAt, locale) }) : t("team.assign.noDue")}
                    {exp != null && s !== "done" && !a.overdue ? ` · ${t("team.plan.expected", { n: exp })}` : ""}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {board && (
        <section className={card} aria-labelledby="board-title">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
            <h2 id="board-title" className="text-base font-bold text-[var(--ink)]">{t("team.board.title")}</h2>
            <span className="text-xs text-[var(--ink3)]">{t("team.board.week")}</span>
          </div>
          {!board.optedIn && (
            <p className="mt-2 text-sm text-[var(--ink2)]">
              {t("team.board.optIn")}{" "}
              <Link href="/learn/account" className="font-semibold text-[var(--blue2)] underline">{t("team.board.optInLink")}</Link>
            </p>
          )}
          {board.rows.length === 0 ? (
            <p className="mt-2 text-sm text-[var(--ink3)]">{t("team.board.empty")}</p>
          ) : (
            <ol className="mt-3 divide-y divide-[var(--border)]">
              {board.rows.map((r, i) => (
                <li key={i} className={`flex items-center justify-between gap-3 py-2 text-sm ${r.isMe ? "font-bold" : ""}`}>
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="w-6 shrink-0 text-right tabular-nums text-[var(--ink3)]">{r.rank}</span>
                    <span className="truncate text-[var(--ink)]">{r.name}{r.isMe ? ` (${t("team.board.you")})` : ""}</span>
                  </span>
                  <span className="shrink-0 tabular-nums text-[var(--ink2)]">{t("game.xp", { n: r.xp })}</span>
                </li>
              ))}
            </ol>
          )}
        </section>
      )}

      <section id="privacy" className={`${card} scroll-mt-24`} aria-labelledby="privacy-title">
        <h2 id="privacy-title" className="text-base font-bold text-[var(--ink)]">{t("team.plan.privacyTitle")}</h2>
        <TeamPrivacyNote />
      </section>

      <section className={card}>
        <h2 className="text-base font-bold text-[var(--ink)]">{t("team.leave.title")}</h2>
        <p className="mt-1 text-sm text-[var(--ink2)]">{t("team.leave.body")}</p>
        <button type="button" onClick={leave} disabled={busy} className="mt-4 rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50">
          {busy ? t("team.busy") : t("team.leave.cta")}
        </button>
        {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
      </section>
    </div>
  );
}

export function AssignmentList({ items, locale }: { items: MemberAssignmentView[]; locale: string }) {
  const t = useT();
  return (
    <ul className="mt-3 divide-y divide-[var(--border)]">
      {items.map((a) => (
        <li key={a.id} className="flex items-center justify-between gap-3 py-3">
          <div className="min-w-0">
            <Link href={`/learn/track/${a.slug}`} className="text-sm font-bold text-[var(--ink)] hover:underline">{a.title}</Link>
            <p className={`text-xs ${a.overdue ? "font-bold text-red-700" : "text-[var(--ink3)]"}`}>
              {a.dueAt ? t(a.overdue ? "team.assign.overdue" : "team.assign.dueOn", { date: fmtDate(a.dueAt, locale) }) : t("team.assign.noDue")}
            </p>
          </div>
          <span className="shrink-0 text-sm font-black tabular-nums text-[var(--ink)]">{a.percent}%</span>
        </li>
      ))}
    </ul>
  );
}

/** "Your team manager can see: ... Not your drafts, reflections or Tutor chats." */
export function TeamPrivacyNote() {
  const t = useT();
  return (
    <div className="mt-4 rounded-xl bg-[var(--s2)] p-4 text-sm">
      <p className="font-semibold text-[var(--ink)]">{t("team.privacy.short")}</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-[var(--ink3)]">{t("team.privacy.sees")}</p>
          <ul className="mt-1 space-y-1 text-[var(--ink2)]">
            {["progress", "scores", "certificates", "studio", "review", "activity"].map((k) => (
              <li key={k} className="flex gap-2"><span aria-hidden="true" className="text-green-700">✓</span>{t(`team.privacy.shared.${k}`)}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-[var(--ink3)]">{t("team.privacy.never")}</p>
          <ul className="mt-1 space-y-1 text-[var(--ink2)]">
            {["drafts", "reflections", "tutor", "practice"].map((k) => (
              <li key={k} className="flex gap-2"><span aria-hidden="true" className="text-red-700">✕</span>{t(`team.privacy.private.${k}`)}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
