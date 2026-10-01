import Link from "next/link";
import { getLocale, getT } from "@/lib/i18n/server";
import { getMembership } from "@/lib/learn/team/access";
import { isManagerRole } from "@/lib/learn/team/config";
import { myAssignments } from "@/lib/learn/team/service";
import { fmtDate } from "@/lib/learn/format";

/**
 * Learner dashboard card for team members: "Assigned by your team" with due
 * dates and progress, plus the way to the team page (managers: the team
 * dashboard). Renders nothing for learners without a team.
 */
export default async function TeamDashboardCard({ studentId }: { studentId: string }) {
  const m = await getMembership(studentId);
  if (!m?.entitled) return null;
  const [mine, t, locale] = await Promise.all([myAssignments(studentId), getT(), getLocale()]);
  const items = mine?.items ?? [];
  const manager = isManagerRole(m.role);
  if (!manager && items.length === 0) {
    return (
      <section className="flex flex-col gap-2 rounded-2xl border border-[var(--border)] bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-[var(--ink2)]">{t("team.card.member", { team: m.team.name })}</p>
        <Link href="/learn/team" className="shrink-0 text-sm font-semibold text-[var(--blue2)] underline">{t("team.card.whatShared")}</Link>
      </section>
    );
  }
  return (
    <section aria-labelledby="team-assigned" className="rounded-2xl border border-[var(--border)] bg-white p-5">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
        <h2 id="team-assigned" className="text-base font-bold text-[var(--ink)]">
          {items.length > 0 ? t("team.assigned.title") : t("team.card.managerTitle", { team: m.team.name })}
        </h2>
        <Link href="/learn/team" className="text-sm font-semibold text-[var(--blue2)] underline">
          {manager ? t("team.card.manage") : t("team.card.whatShared")}
        </Link>
      </div>
      {items.length > 0 && (
        <ul className="mt-3 divide-y divide-[var(--border)]">
          {items.slice(0, 5).map((a) => (
            <li key={a.id} className="flex items-center justify-between gap-3 py-2.5">
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
      )}
    </section>
  );
}
