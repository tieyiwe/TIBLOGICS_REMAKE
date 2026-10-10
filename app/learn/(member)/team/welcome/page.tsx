import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getStudent } from "@/lib/learn/session";
import { getLocale, getT } from "@/lib/i18n/server";
import { fmtDate } from "@/lib/learn/format";
import { myTeamPlan } from "@/lib/learn/team/next";
import { localTitles } from "@/lib/learn/team/titles";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("team.welcome.metaTitle") };
}

// First stop after accepting a team invitation: which team, what the manager
// assigned, and the first lesson, then on to the dashboard.
export default async function TeamWelcomePage() {
  const student = await getStudent();
  if (!student) redirect("/learn/login");
  const plan = await myTeamPlan(student.id);
  if (!plan) redirect("/learn");
  const [t, locale] = await Promise.all([getT(), getLocale()]);
  const titles = await localTitles(locale, plan.items.map((a) => a.trackId));
  const first = student.name.trim().split(/\s+/)[0] ?? "";
  const nextTitle = plan.next ? titles.lesson(plan.next.trackId, plan.next.lessonId, plan.next.title) : null;

  return (
    <div className="mx-auto max-w-xl">
      <div className="overflow-hidden rounded-3xl border border-[var(--border)] bg-white">
        <div className="bg-[var(--ink)] px-6 py-8 text-white sm:px-8">
          <p className="text-xs font-bold uppercase tracking-wide text-[var(--orange)]">{t("team.welcome.kicker")}</p>
          <h1 className="mt-2 break-words text-2xl font-black leading-tight">{t("team.welcome.title", { team: plan.teamName })}</h1>
          <p className="mt-2 text-sm text-white/80">{t("team.welcome.hi", { name: first })}</p>
        </div>
        <div className="space-y-5 px-6 py-6 sm:px-8">
          {plan.items.length > 0 ? (
            <div>
              <p className="text-sm font-semibold text-[var(--ink)]">
                {plan.managers.length
                  ? t(plan.items.length === 1 ? "team.welcome.assignedBy.one" : "team.welcome.assignedBy.other", { names: plan.managers.join(", ") })
                  : t(plan.items.length === 1 ? "team.welcome.assigned.one" : "team.welcome.assigned.other")}
              </p>
              <ul className="mt-2 space-y-2">
                {plan.items.map((a) => (
                  <li key={a.id} className="rounded-xl bg-[var(--s2)] px-4 py-3">
                    <p className="break-words text-sm font-bold text-[var(--ink)]">{titles.track(a.trackId, a.title)}</p>
                    <p className={`text-xs ${a.overdue ? "font-bold text-red-700" : "text-[var(--ink3)]"}`}>
                      {a.dueAt ? t(a.overdue ? "team.assign.overdue" : "team.assign.dueOn", { date: fmtDate(a.dueAt, locale) }) : t("team.assign.noDue")}
                      {a.percent > 0 ? ` · ${a.percent}%` : ""}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-sm text-[var(--ink2)]">{t("team.welcome.noAssigned")}</p>
          )}
          <p className="text-sm text-[var(--ink2)]">{t("team.welcome.access")}</p>
          <div className="flex flex-col gap-3 sm:flex-row">
            {plan.next ? (
              <Link href={plan.next.href} className="inline-flex items-center justify-center rounded-full bg-[var(--orange)] px-6 py-3 text-sm font-bold text-white hover:opacity-90">
                {t(plan.next.kind === "start" ? "team.welcome.start" : "team.plan.continue")} →
              </Link>
            ) : (
              <Link href="/learn/tracks" className="inline-flex items-center justify-center rounded-full bg-[var(--orange)] px-6 py-3 text-sm font-bold text-white hover:opacity-90">
                {t("team.welcome.explore")} →
              </Link>
            )}
            <Link href="/learn" className="inline-flex items-center justify-center rounded-full border border-[var(--border)] px-6 py-3 text-sm font-semibold text-[var(--ink)]">
              {t("team.welcome.dashboard")}
            </Link>
          </div>
          {nextTitle && <p className="break-words text-xs text-[var(--ink3)]">{t("team.plan.nextLesson", { title: nextTitle })}</p>}
          <p className="border-t border-[var(--border)] pt-4 text-xs text-[var(--ink3)]">
            {t("team.privacy.short")}{" "}
            <Link href="/learn/team#privacy" className="font-semibold text-[var(--blue2)] underline">{t("team.card.whatShared")}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
