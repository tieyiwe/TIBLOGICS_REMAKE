"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useT } from "@/lib/i18n/client";
import { fmtDate } from "@/lib/learn/format";
import type { MemberDetail } from "@/lib/learn/team/report";
import { Bar, Pill, call, cls, type DashCtx } from "./ui";

/**
 * One member, in a side panel (full screen on a phone). Reads the same
 * privacy-limited detail as the member page: progress, scores, certificates,
 * Studio and Daily Review. Never drafts, reflections or Tutor text.
 */
export default function MemberDrawer({ ctx, memberId, onClose }: { ctx: DashCtx; memberId: string; onClose: () => void }) {
  const t = useT();
  const { locale, busy, run } = ctx;
  const [d, setD] = useState<MemberDetail | null>(null);
  const [error, setError] = useState("");
  const closeRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let live = true;
    setD(null);
    setError("");
    call<MemberDetail>(`/api/learn/team/members/${encodeURIComponent(memberId)}`, "GET")
      .then((x) => live && setD(x))
      .catch((e) => live && setError(e instanceof Error ? e.message : t("team.error.generic")));
    return () => {
      live = false;
    };
  }, [memberId, t]);

  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab" && panelRef.current) {
        const f = panelRef.current.querySelectorAll<HTMLElement>("a[href],button:not([disabled]),input,select");
        if (f.length === 0) return;
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      prev?.focus?.();
    };
  }, [onClose]);

  const s = d?.member;
  const assigned = d?.tracks.filter((x) => x.assigned) ?? [];
  const others = d?.tracks.filter((x) => !x.assigned && x.percent > 0) ?? [];
  const now = Date.now();
  const openAssigned = assigned.filter((x) => x.percent < 100);

  const nudge = () =>
    run(`nudge:${s?.studentId}`, async () => {
      const r = await call<{ sent: number; recent: number }>("/api/learn/team/nudge", "POST", { studentIds: [s!.studentId] });
      const who = s?.name ?? s?.email ?? "";
      return r.sent ? t("team.nudge.sentTo", { who }) : r.recent ? t("team.nudge.recent", { who }) : t("team.nudge.nothing", { who });
    });

  const track = (x: MemberDetail["tracks"][number]) => {
    const overdue = !!x.assignedDue && new Date(x.assignedDue).getTime() < now && x.percent < 100;
    return (
      <li key={x.trackId}>
        <div className="flex items-baseline justify-between gap-3 text-sm">
          <span className="min-w-0 truncate font-semibold text-[var(--ink)]">{ctx.titles[x.trackId] ?? x.title}</span>
          <span className={`shrink-0 font-bold tabular-nums ${overdue ? "text-red-700" : ""}`}>{x.percent}%</span>
        </div>
        <div className="mt-1"><Bar value={x.percent} tone={x.percent >= 100 ? "green" : overdue ? "red" : "blue"} label={x.title} /></div>
        <p className={`mt-0.5 text-[11px] ${overdue ? "font-bold text-red-700" : "text-[var(--ink3)]"}`}>
          {[
            x.assigned ? (x.assignedDue ? t(overdue ? "team.assign.overdue" : "team.assign.dueOn", { date: fmtDate(x.assignedDue, locale) }) : t("team.assign.noDue")) : null,
            x.examBest != null ? t("team.detail.exam", { n: x.examBest }) : null,
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </li>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-labelledby="drawer-title">
      <button type="button" aria-label={t("team.drawer.close")} tabIndex={-1} className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div ref={panelRef} className="relative flex h-full w-full max-w-lg flex-col overflow-y-auto bg-[var(--s2)] shadow-2xl">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-[var(--border)] bg-white px-5 py-4">
          <div className="min-w-0">
            <p className={cls.kicker}>{t("team.drawer.kicker")}</p>
            <h2 id="drawer-title" className="break-words text-lg font-black text-[var(--ink)]">{s ? s.name ?? s.email : "…"}</h2>
            {s && (
              <p className="break-words text-xs text-[var(--ink3)]">
                {s.email} · {t(`team.role.${s.role}`)}
                {s.joinedAt ? ` · ${t("team.detail.joined", { date: fmtDate(s.joinedAt, locale) })}` : ""}
              </p>
            )}
          </div>
          <button ref={closeRef} type="button" onClick={onClose} className={cls.btn} aria-label={t("team.drawer.close")}>✕</button>
        </div>

        <div className="space-y-4 p-5">
          {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}
          {!d && !error && <p className="text-sm text-[var(--ink3)]">{t("team.busy")}</p>}
          {s && d && (
            <>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {[
                  [t("team.members.lastActive"), s.lastActiveAt ? fmtDate(s.lastActiveAt, locale) : t("team.members.never")],
                  [t("team.members.quiz"), s.quizAverage == null ? "-" : `${s.quizAverage}%`],
                  [t("team.members.exam"), s.examBest == null ? "-" : `${s.examBest}%`],
                  [t("team.members.certs"), String(s.certificates)],
                  [t("team.members.studio"), String(s.studioChallenges)],
                  [t("team.members.review"), t(s.reviewStreak === 1 ? "team.days.one" : "team.days.other", { n: s.reviewStreak })],
                ].map(([k, v]) => (
                  <div key={k} className="min-w-0 rounded-xl border border-[var(--border)] bg-white p-3">
                    <p className="truncate text-[11px] font-semibold uppercase tracking-wide text-[var(--ink3)]">{k}</p>
                    <p className="mt-0.5 text-base font-black text-[var(--ink)]">{v}</p>
                  </div>
                ))}
              </div>

              <section className="rounded-2xl border border-[var(--border)] bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-bold text-[var(--ink)]">{t("team.drawer.assigned")}</h3>
                  {openAssigned.length > 0 && (
                    <button type="button" className={cls.btn} disabled={busy !== null || !ctx.team.entitled} onClick={nudge}>
                      {busy === `nudge:${s.studentId}` ? t("team.busy") : t("team.nudge.one")}
                    </button>
                  )}
                </div>
                {assigned.length === 0 ? <p className="mt-2 text-sm text-[var(--ink3)]">{t("team.people.noAssigned")}</p> : <ul className="mt-3 space-y-3">{assigned.map(track)}</ul>}
              </section>

              {others.length > 0 && (
                <section className="rounded-2xl border border-[var(--border)] bg-white p-4">
                  <h3 className="text-sm font-bold text-[var(--ink)]">{t("team.drawer.otherTracks")}</h3>
                  <ul className="mt-3 space-y-3">{others.map(track)}</ul>
                </section>
              )}

              <section className="rounded-2xl border border-[var(--border)] bg-white p-4">
                <h3 className="text-sm font-bold text-[var(--ink)]">{t("team.detail.quizzes")}</h3>
                {d.quizzes.length === 0 ? (
                  <p className="mt-2 text-sm text-[var(--ink3)]">{t("team.detail.noQuizzes")}</p>
                ) : (
                  <ul className="mt-2 divide-y divide-[var(--border)] text-sm">
                    {d.quizzes.map((q, i) => (
                      <li key={i} className="flex items-center justify-between gap-3 py-2">
                        <span className="min-w-0">
                          <span className="block truncate font-semibold text-[var(--ink)]">{q.module}</span>
                          <span className="block truncate text-xs text-[var(--ink3)]">{q.track}</span>
                        </span>
                        <span className="shrink-0">{q.passed ? <Pill tone="green">{q.best}%</Pill> : <Pill tone="grey">{q.best}%</Pill>}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="rounded-2xl border border-[var(--border)] bg-white p-4">
                <h3 className="text-sm font-bold text-[var(--ink)]">{t("team.detail.certificates")}</h3>
                {d.certificates.length === 0 ? (
                  <p className="mt-2 text-sm text-[var(--ink3)]">{t("team.detail.noCertificates")}</p>
                ) : (
                  <ul className="mt-2 space-y-1.5 text-sm">
                    {d.certificates.map((c) => (
                      <li key={c.verificationId}>
                        <Link href={`/certificates/${c.verificationId}`} className="font-semibold text-[var(--blue2)] underline">{c.certificateName}</Link>
                        <span className="text-xs text-[var(--ink3)]"> · {fmtDate(c.issuedAt, locale)}{c.distinction ? ` · ${t("team.detail.distinction")}` : ""}</span>
                      </li>
                    ))}
                  </ul>
                )}
                <h3 className="mt-4 text-sm font-bold text-[var(--ink)]">{t("team.detail.studio")}</h3>
                <p className="mt-1 text-sm text-[var(--ink2)]">{t("team.detail.studioLine", { n: d.studio.length, p: d.studio.filter((x) => x.perfect).length })}</p>
                <p className="mt-1 text-sm text-[var(--ink2)]">{t("team.drawer.reviewLine", { n: s.reviewDays30 })}</p>
              </section>

              <p className="text-xs leading-relaxed text-[var(--ink3)]">{t("team.privacy.managerNote")}</p>
              <Link href={`/learn/team/member/${memberId}`} className="inline-block text-sm font-semibold text-[var(--blue2)] underline">{t("team.drawer.fullPage")}</Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
