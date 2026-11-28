import Link from "next/link";
import { getT } from "@/lib/i18n/server";
import { fmtMinutes } from "@/lib/learn/format";
import { diagnosticStatus } from "@/lib/learn/mastery/diagnostic";
import type { ModuleMastery } from "@/lib/learn/mastery/overview";
import { LEVEL_STYLE, STEP_STYLE } from "./styles";

export interface PanelModule {
  id: string;
  title: string;
  summary: string | null;
  quizId: string | null;
  /** First lesson not yet done (or the first lesson). */
  lessonId: string | null;
}

// Track page: "Find your starting point" before the diagnostic, "Your path"
// after it (modules to skip, skim or study, and the time that saves).
export default async function TrackMasteryPanel({
  studentId,
  trackId,
  slug,
  accent,
  modules,
  mastery,
}: {
  studentId: string;
  trackId: string;
  slug: string;
  accent: string;
  modules: PanelModule[];
  mastery: ModuleMastery[];
}) {
  const [t, status] = await Promise.all([getT(), diagnosticStatus(studentId, trackId).catch(() => null)]);
  if (!status) return null;
  const byId = new Map(mastery.map((m) => [m.moduleId, m]));
  const hasPath = mastery.some((m) => m.estimate);
  const hoursLeft = status.retakeAt ? Math.max(1, Math.ceil((status.retakeAt.getTime() - Date.now()) / 3_600_000)) : 0;
  const cta = status.inProgress ? t("mastery.diag.resume") : hasPath ? t("mastery.path.retake") : t("mastery.diag.start");

  if (!hasPath) {
    return (
      <section aria-labelledby="find-start" className="rounded-2xl border-2 border-dashed bg-white p-5 sm:p-6" style={{ borderColor: accent }}>
        <h2 id="find-start" className="text-base font-bold text-[var(--ink)]">
          <span aria-hidden="true">🧭 </span>
          {t("mastery.find.title")}
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-[var(--ink2)]">{t("mastery.find.body")}</p>
        {status.canStart ? (
          <Link
            href={`/learn/track/${slug}/diagnostic`}
            className="mt-4 inline-flex min-h-[44px] items-center rounded-full px-6 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
            style={{ background: accent }}
          >
            {cta} →
          </Link>
        ) : (
          <p className="mt-3 text-xs text-[var(--ink3)]">{t(hoursLeft === 1 ? "mastery.diag.retakeIn.one" : "mastery.diag.retakeIn.other", { n: hoursLeft })}</p>
        )}
      </section>
    );
  }

  const steps = modules.map((m, i) => ({ m, i, mm: byId.get(m.id) }));
  const count = (s: string) => mastery.filter((m) => m.step === s).length;
  const saved = mastery.reduce((n, m) => n + m.saved, 0);

  return (
    <section id="your-path" aria-labelledby="your-path-h" className="scroll-mt-24 rounded-2xl border border-[var(--border)] bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 id="your-path-h" className="text-base font-bold text-[var(--ink)]">
            <span aria-hidden="true">🧭 </span>
            {t("mastery.path.title")}
          </h2>
          <p className="mt-1 text-sm text-[var(--ink2)]">
            {t("mastery.path.summary", { skip: count("skip"), skim: count("skim"), study: count("study") })}
          </p>
          {saved > 0 && (
            <p className="mt-1 text-sm font-semibold text-green-800">{t("mastery.path.saved", { time: fmtMinutes(t, saved) })}</p>
          )}
        </div>
        {status.canStart ? (
          <Link href={`/learn/track/${slug}/diagnostic`} className="text-xs font-semibold text-[var(--blue2)] underline">
            {cta}
          </Link>
        ) : (
          <p className="text-xs text-[var(--ink3)]">{t(hoursLeft === 1 ? "mastery.diag.retakeIn.one" : "mastery.diag.retakeIn.other", { n: hoursLeft })}</p>
        )}
      </div>

      <ol className="mt-4 space-y-3">
        {steps.map(({ m, i, mm }) => {
          const step = mm?.step ?? "study";
          const st = STEP_STYLE[step];
          const lv = mm?.estimate ? LEVEL_STYLE[mm.estimate.level] : null;
          return (
            <li key={m.id} className="rounded-xl border border-[var(--border)] p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="min-w-0 text-sm font-bold text-[var(--ink)]">
                  {i + 1}. {m.title}
                </p>
                <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-bold ${st.cls}`}>
                  <span aria-hidden="true">{st.mark}</span>
                  {t(`mastery.step.${step}`)}
                </span>
              </div>
              {mm?.estimate && lv && (
                <p className="mt-1 text-xs text-[var(--ink3)]">
                  {t("mastery.path.estimate", { level: t(`mastery.level.${mm.estimate.level}`), c: mm.estimate.correct, n: mm.estimate.asked })}
                </p>
              )}
              <p className="mt-1.5 text-xs leading-relaxed text-[var(--ink2)]">{t(`mastery.step.${step}Body`)}</p>

              {step === "skim" && m.summary && (
                <details className="mt-2 rounded-lg bg-[var(--s2)] px-3 py-2 text-sm">
                  <summary className="cursor-pointer text-xs font-semibold text-[var(--ink)]">{t("mastery.path.summaryToggle")}</summary>
                  <p className="mt-2 text-xs leading-relaxed text-[var(--ink2)]">{m.summary}</p>
                </details>
              )}

              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
                {mm?.testedOut ? (
                  <span className="font-bold text-green-800">★ {t("mastery.testOut.done")}</span>
                ) : step === "skip" && m.quizId ? (
                  mm?.quizPassed ? (
                    <span className="font-bold text-green-800">✓ {t("learn.trackHome.quizPassed")}</span>
                  ) : (
                    <Link
                      href={`/learn/quiz/${m.quizId}`}
                      className="inline-flex min-h-[36px] items-center rounded-full px-4 py-1.5 font-bold text-white"
                      style={{ background: accent }}
                    >
                      {t("mastery.testOut.cta")} →
                    </Link>
                  )
                ) : null}
                {m.lessonId && !mm?.testedOut && (
                  <Link href={`/learn/lesson/${m.lessonId}`} className="font-semibold text-[var(--blue2)] underline">
                    {step === "skip" ? t("mastery.path.browse") : step === "skim" ? t("mastery.path.skimCta") : t("mastery.path.studyCta")}
                  </Link>
                )}
                {saved > 0 && mm && mm.saved > 0 && (
                  <span className="text-[var(--ink3)]">{t("mastery.path.savedHere", { time: fmtMinutes(t, mm.saved) })}</span>
                )}
              </div>
            </li>
          );
        })}
      </ol>
      <p className="mt-4 text-xs leading-relaxed text-[var(--ink3)]">{t("mastery.path.certNote")}</p>
    </section>
  );
}

/** Small mark for a module card: tested out, or test out available. */
export function ModuleMasteryTag({
  t,
  mastery,
  quizId,
  quizPassed,
  allDone,
}: {
  t: (key: string, vars?: Record<string, string | number>) => string;
  mastery: ModuleMastery | undefined;
  quizId: string | null;
  quizPassed: boolean;
  allDone: boolean;
}) {
  if (!mastery) return null;
  if (mastery.testedOut) {
    return (
      <p className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-green-600 bg-green-50 px-2.5 py-0.5 text-xs font-bold text-green-900">
        <span aria-hidden="true">★</span> {t("mastery.testOut.done")}
      </p>
    );
  }
  if (mastery.estimate?.level === "mastered" && quizId && !quizPassed && !allDone) {
    return (
      <p className="mt-2 text-xs">
        <Link href={`/learn/quiz/${quizId}`} className="font-bold text-green-800 underline">
          ★ {t("mastery.testOut.cta")} →
        </Link>
      </p>
    );
  }
  return null;
}
