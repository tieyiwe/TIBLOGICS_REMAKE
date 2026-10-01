import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { getStudent } from "@/lib/learn/session";
import { getLocale, getT } from "@/lib/i18n/server";
import { getMembership } from "@/lib/learn/team/access";
import { isManagerRole } from "@/lib/learn/team/config";
import { memberDetail } from "@/lib/learn/team/report";
import { fmtDate } from "@/lib/learn/format";
import { BarList } from "@/components/learn/team/TeamCharts";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("team.detail.metaTitle") };
}

// One member, for their team's managers only. Same privacy limits as the
// dashboard (lib/learn/team/report.ts): no drafts, reflections, Tutor chats
// or practice content. Another team's member id is simply not found.
export default async function TeamMemberPage({ params }: { params: Promise<{ id: string }> }) {
  const student = await getStudent();
  if (!student) redirect("/learn/login");
  const m = await getMembership(student.id);
  if (!m || !isManagerRole(m.role)) redirect("/learn/team");
  const id = (await params).id;
  const d = /^[A-Za-z0-9_-]{1,64}$/.test(id) ? await memberDetail(m.team.id, id) : null;
  if (!d) notFound();
  const [t, locale] = await Promise.all([getT(), getLocale()]);
  const s = d.member;
  const card = "rounded-2xl border border-[var(--border)] bg-white p-5 sm:p-6";

  return (
    <div className="space-y-6">
      <p className="text-sm">
        <Link href="/learn/team" className="font-semibold text-[var(--blue2)] underline">← {t("team.detail.back")}</Link>
      </p>
      <header>
        <h1 className="break-words text-2xl font-black text-[var(--ink)]">{s.name ?? s.email}</h1>
        <p className="mt-1 break-words text-sm text-[var(--ink2)]">
          {s.email} · {t(`team.role.${s.role}`)}
          {s.joinedAt ? ` · ${t("team.detail.joined", { date: fmtDate(s.joinedAt, locale) })}` : ""}
        </p>
      </header>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          [t("team.members.lastActive"), s.lastActiveAt ? fmtDate(s.lastActiveAt, locale) : t("team.members.never")],
          [t("team.members.quiz"), s.quizAverage == null ? "–" : `${s.quizAverage}%`],
          [t("team.members.review"), t(s.reviewStreak === 1 ? "team.days.one" : "team.days.other", { n: s.reviewStreak })],
          [t("team.detail.reviewDays"), String(s.reviewDays30)],
        ].map(([k, v]) => (
          <div key={k} className="min-w-0 rounded-2xl border border-[var(--border)] bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ink3)]">{k}</p>
            <p className="mt-1 text-xl font-black text-[var(--ink)]">{v}</p>
          </div>
        ))}
      </section>

      <section className={card}>
        <h2 className="text-base font-bold text-[var(--ink)]">{t("team.detail.tracks")}</h2>
        <BarList
          items={d.tracks.map((x) => ({
            key: x.trackId,
            label: x.title,
            value: x.percent,
            note: [
              x.examBest != null ? t("team.detail.exam", { n: x.examBest }) : null,
              x.assigned ? (x.assignedDue ? t("team.assign.dueOn", { date: fmtDate(x.assignedDue, locale) }) : t("team.detail.assigned")) : null,
            ]
              .filter(Boolean)
              .join(" · ") || undefined,
          }))}
          max={100}
          unit="%"
          empty={t("team.charts.empty")}
        />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className={card}>
          <h2 className="text-base font-bold text-[var(--ink)]">{t("team.detail.quizzes")}</h2>
          {d.quizzes.length === 0 ? (
            <p className="mt-2 text-sm text-[var(--ink3)]">{t("team.detail.noQuizzes")}</p>
          ) : (
            <ul className="mt-3 divide-y divide-[var(--border)] text-sm">
              {d.quizzes.map((q, i) => (
                <li key={i} className="flex items-center justify-between gap-3 py-2">
                  <span className="min-w-0">
                    <span className="block truncate font-semibold text-[var(--ink)]">{q.module}</span>
                    <span className="block truncate text-xs text-[var(--ink3)]">{q.track}</span>
                  </span>
                  <span className={`shrink-0 font-bold tabular-nums ${q.passed ? "text-green-800" : "text-[var(--ink)]"}`}>{q.best}%</span>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className={card}>
          <h2 className="text-base font-bold text-[var(--ink)]">{t("team.detail.certificates")}</h2>
          {d.certificates.length === 0 ? (
            <p className="mt-2 text-sm text-[var(--ink3)]">{t("team.detail.noCertificates")}</p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {d.certificates.map((c) => (
                <li key={c.verificationId}>
                  <Link href={`/certificates/${c.verificationId}`} className="font-semibold text-[var(--blue2)] underline">{c.certificateName}</Link>
                  <span className="text-xs text-[var(--ink3)]"> · {fmtDate(c.issuedAt, locale)}{c.distinction ? ` · ${t("team.detail.distinction")}` : ""}</span>
                </li>
              ))}
            </ul>
          )}
          <h2 className="mt-6 text-base font-bold text-[var(--ink)]">{t("team.detail.studio")}</h2>
          <p className="mt-1 text-sm text-[var(--ink2)]">
            {t("team.detail.studioLine", { n: d.studio.length, p: d.studio.filter((x) => x.perfect).length })}
          </p>
        </section>
      </div>
      <p className="text-xs leading-relaxed text-[var(--ink3)]">{t("team.privacy.managerNote")}</p>
    </div>
  );
}
