import Link from "next/link";
import prisma from "@/lib/prisma";
import { getLocale, getT } from "@/lib/i18n/server";
import { isManagerRole } from "@/lib/learn/team/config";
import { myTeamPlan } from "@/lib/learn/team/next";
import { localTitles } from "@/lib/learn/team/titles";
import { fmtDate } from "@/lib/learn/format";

/**
 * Top of the learner dashboard for team members: "Your team learning plan".
 * Company, assigned tracks with due dates (overdue in red) and progress, the
 * next lesson inside them (lib/learn/resume.ts), and what the manager can
 * see. Managers also get a line about their team. Nothing without a team.
 */
export default async function TeamDashboardCard({ studentId }: { studentId: string }) {
  const plan = await myTeamPlan(studentId).catch(() => null);
  if (!plan?.entitled) return null;
  const [t, locale] = await Promise.all([getT(), getLocale()]);
  const manager = isManagerRole(plan.role);
  const titles = await localTitles(locale, plan.items.map((a) => a.trackId));
  const items = plan.items.slice(0, 5);
  const overdue = plan.items.filter((a) => a.overdue).length;
  const nextTitle = plan.next ? titles.lesson(plan.next.trackId, plan.next.lessonId, plan.next.title) : null;

  let teamLine: string | null = null;
  if (manager) {
    const [members, invited] = await Promise.all([
      prisma.teamMember.count({ where: { teamId: plan.teamId, status: "active" } }),
      prisma.teamMember.count({ where: { teamId: plan.teamId, status: "invited", inviteExpiresAt: { gt: new Date() } } }),
    ]);
    teamLine = t("team.card.managerLine", { n: members, i: invited });
  }

  // A manager without assignments of their own: one compact line.
  if (manager && items.length === 0) {
    return (
      <section aria-labelledby="team-plan" className="flex flex-col gap-3 rounded-2xl border border-[var(--border)] bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 id="team-plan" className="break-words text-base font-bold text-[var(--ink)]">{t("team.card.managerTitle", { team: plan.teamName })}</h2>
          {teamLine && <p className="mt-0.5 text-sm text-[var(--ink2)]">{teamLine}</p>}
        </div>
        <Link href="/learn/team" className="inline-flex shrink-0 items-center justify-center rounded-full bg-[var(--ink)] px-5 py-2.5 text-sm font-bold text-white hover:opacity-90">
          {t("team.card.manage")}
        </Link>
      </section>
    );
  }

  return (
    <section aria-labelledby="team-plan" className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white">
      <div className="flex flex-col gap-3 border-b border-[var(--border)] bg-[var(--s2)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="break-words text-xs font-bold uppercase tracking-wide text-[var(--ink3)]">{plan.teamName}</p>
          <h2 id="team-plan" className="text-lg font-black text-[var(--ink)]">{t("team.plan.title")}</h2>
          {overdue > 0 && <p className="mt-0.5 text-sm font-bold text-red-700">{t(overdue === 1 ? "team.card.overdue.one" : "team.card.overdue.other", { n: overdue })}</p>}
        </div>
        {plan.next ? (
          <Link href={plan.next.href} className="inline-flex shrink-0 items-center justify-center rounded-full bg-[var(--orange)] px-5 py-2.5 text-sm font-bold text-white hover:opacity-90">
            {t(plan.next.kind === "start" ? "team.plan.start" : "team.plan.continue")} →
          </Link>
        ) : (
          <Link href="/learn/team" className="inline-flex shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-white px-5 py-2.5 text-sm font-semibold text-[var(--ink)]">
            {t("team.card.open")}
          </Link>
        )}
      </div>
      <div className="px-5 py-4">
        {nextTitle && <p className="mb-3 break-words text-sm text-[var(--ink2)]">{t("team.plan.nextLesson", { title: nextTitle })}</p>}
        {items.length === 0 ? (
          <p className="text-sm text-[var(--ink2)]">{t("team.card.noneYet", { team: plan.teamName })}</p>
        ) : (
          <ul className="space-y-3">
            {items.map((a) => (
              <li key={a.id}>
                <div className="flex items-baseline justify-between gap-3">
                  <Link href={`/learn/track/${a.slug}`} className="min-w-0 break-words text-sm font-bold text-[var(--ink)] hover:underline">{titles.track(a.trackId, a.title)}</Link>
                  <span className="shrink-0 text-sm font-black tabular-nums text-[var(--ink)]">{a.percent}%</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[var(--s3)]">
                  <div
                    className={`h-full rounded-full ${a.percent >= 100 ? "bg-green-600" : a.overdue ? "bg-red-600" : "bg-[var(--blue2)]"}`}
                    style={{ width: `${Math.max(0, Math.min(100, a.percent))}%` }}
                  />
                </div>
                <p className={`mt-0.5 text-xs ${a.overdue ? "font-bold text-red-700" : "text-[var(--ink3)]"}`}>
                  {a.percent >= 100
                    ? t("team.assign.status.done")
                    : a.dueAt
                      ? t(a.overdue ? "team.assign.overdue" : "team.assign.dueOn", { date: fmtDate(a.dueAt, locale) })
                      : t("team.assign.noDue")}
                </p>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-4 flex flex-col gap-2 border-t border-[var(--border)] pt-3 text-sm sm:flex-row sm:items-center sm:justify-between">
          <Link href="/learn/team#privacy" className="font-semibold text-[var(--blue2)] underline">{t("team.card.whatShared")}</Link>
          {manager ? (
            <Link href="/learn/team" className="font-semibold text-[var(--blue2)] underline">{t("team.card.manage")}{teamLine ? ` · ${teamLine}` : ""}</Link>
          ) : (
            <Link href="/learn/team" className="font-semibold text-[var(--blue2)] underline">{t("team.card.open")}</Link>
          )}
        </div>
      </div>
    </section>
  );
}
