import Link from "next/link";
import { getLocale, getT } from "@/lib/i18n/server";
import { CHALLENGE_MAX_POINTS } from "@/lib/learn/challenge/content";
import { currentWeek } from "@/lib/learn/challenge/week";
import { getEntry } from "@/lib/learn/challenge/server";

// Dashboard: this week's 10-minute challenge, with the learner's score once
// they have played. Renders nothing on failure.
export default async function DashboardChallengeCard({ studentId }: { studentId: string }) {
  try {
    const week = currentWeek();
    const [t, locale, entry] = await Promise.all([getT(), getLocale(), getEntry(studentId, week.key)]);
    return (
      <section
        aria-labelledby="dash-challenge"
        className="flex flex-col gap-4 rounded-2xl border border-[var(--border)] bg-white p-5 sm:flex-row sm:items-center"
        data-testid="dash-challenge"
      >
        <span aria-hidden="true" className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[var(--orange-light)] text-2xl">
          ⏱️
        </span>
        <div className="min-w-0 flex-1">
          <p id="dash-challenge" className="text-xs font-semibold uppercase tracking-wide text-[var(--ink3)]">
            {t("learn.challenge.dashTitle")}
          </p>
          <p className="mt-1 text-lg font-black text-[var(--ink)] [overflow-wrap:anywhere]">{week.challenge.title[locale]}</p>
          <p className="text-sm text-[var(--ink2)]">
            {entry
              ? t("learn.challenge.dashDone", { n: entry.score, max: CHALLENGE_MAX_POINTS })
              : t("learn.challenge.dashTodo", { max: CHALLENGE_MAX_POINTS })}
          </p>
        </div>
        <Link
          href="/learn/challenge"
          className="inline-flex min-h-[44px] w-fit shrink-0 items-center rounded-full bg-gradient-to-r from-[var(--orange)] to-[#F9A738] px-5 py-2.5 text-sm font-bold text-[var(--ink)] transition-opacity hover:opacity-90"
        >
          {entry ? t("learn.challenge.dashSee") : t("learn.challenge.dashPlay")} →
        </Link>
      </section>
    );
  } catch (err) {
    console.error("[learn/challenge] dashboard card", err);
    return null;
  }
}
