import Link from "next/link";
import { getLocale, getT } from "@/lib/i18n/server";
import { accessibleTrackIds } from "@/lib/learn/session";
import { strengthenSuggestions } from "@/lib/learn/mastery/overview";

// Dashboard: "Strengthen: <module>" suggestions with a one-click focused
// review, and the way to the full mastery grid.
export default async function MasteryDashboard({ studentId }: { studentId: string }) {
  const [t, locale, open] = await Promise.all([getT(), getLocale(), accessibleTrackIds(studentId)]);
  const suggestions = await strengthenSuggestions(studentId, locale, open === "all" ? null : open).catch((err) => {
    console.error("[dashboard] strengthen", err);
    return [];
  });

  return (
    <section aria-labelledby="mastery-dash" className="rounded-2xl border border-[var(--border)] bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="mastery-dash" className="text-base font-bold text-[var(--ink)]">
          <span aria-hidden="true">🎯 </span>
          {t("mastery.strengthen.title")}
        </h2>
        <Link href="/learn/mastery" className="text-xs font-semibold text-[var(--blue2)] underline">
          {t("mastery.grid.link")} →
        </Link>
      </div>
      {suggestions.length === 0 ? (
        <p className="mt-2 text-sm text-[var(--ink2)]">{t("mastery.strengthen.none")}</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {suggestions.map((s) => (
            <li key={s.moduleId} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-3">
              <span className="min-w-0">
                <span className="block text-sm font-bold text-[var(--ink)]">{t("mastery.strengthen.item", { module: s.moduleTitle })}</span>
                <span className="block text-xs text-[var(--ink2)]">
                  {s.trackTitle} · {t(s.missedIdeas === 1 ? "mastery.grid.missed.one" : "mastery.grid.missed.other", { n: s.missedIdeas })}
                </span>
              </span>
              {s.reviewable ? (
                <Link
                  href={`/learn/review?module=${s.moduleId}`}
                  className="inline-flex min-h-[40px] items-center rounded-full bg-[var(--ink)] px-4 py-2 text-xs font-bold text-white"
                >
                  {t("mastery.strengthen.cta")} →
                </Link>
              ) : (
                s.lessonId && (
                  <Link href={`/learn/lesson/${s.lessonId}`} className="text-xs font-bold text-[var(--blue2)] underline">
                    {t("mastery.strengthen.revisit")} →
                  </Link>
                )
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
