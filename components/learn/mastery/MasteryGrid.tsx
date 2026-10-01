import Link from "next/link";
import prisma from "@/lib/prisma";
import { getLocale, getT } from "@/lib/i18n/server";
import { loadTrackSources, localizedTracks } from "@/lib/i18n/sources/learn";
import { masteryForTracks, type ModuleMastery } from "@/lib/learn/mastery/overview";
import { safeModuleWeakness } from "@/lib/learn/mastery/weakness";
import type { GridState } from "@/lib/learn/mastery/rules";
import { GRID_STYLE } from "./styles";

const STATES: GridState[] = ["mastered", "partial", "weak", "new"];

function detail(t: (k: string, v?: Record<string, string | number>) => string, m: ModuleMastery): string {
  const parts: string[] = [];
  if (m.testedOut) parts.push(t("mastery.grid.testedOut"));
  else if (m.quizPassed) parts.push(t("mastery.grid.quizPassed"));
  if (m.estimate) parts.push(t("mastery.grid.diagnostic", { c: m.estimate.correct, n: m.estimate.asked }));
  if (!m.testedOut && m.lessonsTotal > 0) parts.push(t("learn.dash.lessonsFraction", { done: m.lessonsDone, total: m.lessonsTotal }));
  if (m.weakness?.weak) parts.push(t(m.weakness.missedIdeas === 1 ? "mastery.grid.missed.one" : "mastery.grid.missed.other", { n: m.weakness.missedIdeas }));
  return parts.join(" · ");
}

// Per track, per module: one cell with colour, a symbol and a text label.
export default async function MasteryGrid({ studentId, trackIds }: { studentId: string; trackIds: "all" | string[] }) {
  const [t, locale] = await Promise.all([getT(), getLocale()]);
  const tracks = await prisma.learnTrack.findMany({
    where: { status: "live", ...(trackIds === "all" ? {} : { id: { in: trackIds } }) },
    orderBy: { sortOrder: "asc" },
    select: { id: true, slug: true, title: true, accentColor: true, modules: { orderBy: { sortOrder: "asc" }, select: { id: true, title: true } } },
  });
  const ids = tracks.map((x) => x.id);
  const weakness = await safeModuleWeakness(studentId, ids);
  const [byTrack, sources] = await Promise.all([masteryForTracks(studentId, ids, weakness), loadTrackSources({ id: { in: ids } })]);
  const { texts } = await localizedTracks(sources, locale);

  // Only tracks the learner has started (any lesson, quiz, diagnostic or answer).
  const active = tracks.filter((tr) =>
    (byTrack.get(tr.id) ?? []).some((m) => m.lessonsDone > 0 || m.quizTried || m.estimate || m.testedOut || m.weakness),
  );

  return (
    <div className="space-y-6">
      <ul aria-label={t("mastery.grid.legend")} className="flex flex-wrap gap-2 text-xs">
        {STATES.map((s) => (
          <li key={s} className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-semibold ${GRID_STYLE[s].cls}`}>
            <span aria-hidden="true" className="font-black">{GRID_STYLE[s].mark}</span>
            {t(`mastery.grid.state.${s}`)}
            <span className="font-normal">: {t(`mastery.grid.stateHint.${s}`)}</span>
          </li>
        ))}
      </ul>

      {active.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-[var(--border)] bg-white p-8 text-center text-sm text-[var(--ink3)]">
          {t("mastery.grid.empty")}{" "}
          <Link href="/learn/tracks" className="font-semibold text-[var(--blue2)] underline">
            {t("mastery.grid.browse")}
          </Link>
        </p>
      ) : (
        active.map((tr) => {
          const text = texts.get(tr.slug);
          const mods = byTrack.get(tr.id) ?? [];
          const titleOf = new Map(tr.modules.map((m, i) => [m.id, { title: text?.modules[m.id]?.title ?? m.title, n: i + 1 }]));
          const mastered = mods.filter((m) => m.grid === "mastered").length;
          return (
            <section key={tr.id} aria-labelledby={`mg-${tr.id}`} className="rounded-2xl border border-[var(--border)] bg-white p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 id={`mg-${tr.id}`} className="text-base font-bold text-[var(--ink)]">
                  <span aria-hidden="true" className="mr-2 inline-block h-3 w-3 rounded-full" style={{ background: tr.accentColor }} />
                  <Link href={`/learn/track/${tr.slug}`} className="hover:underline">
                    {text?.title ?? tr.title}
                  </Link>
                </h2>
                <p className="text-xs font-semibold text-[var(--ink3)]">{t("mastery.grid.trackSummary", { n: mastered, total: mods.length })}</p>
              </div>
              <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {mods.map((m) => {
                  const st = GRID_STYLE[m.grid];
                  const info = titleOf.get(m.moduleId);
                  return (
                    <li key={m.moduleId} className={`rounded-xl border-2 p-3 ${st.cls}`}>
                      <p className="flex items-start justify-between gap-2">
                        <span className="min-w-0 text-sm font-bold">
                          {info?.n}. {info?.title}
                        </span>
                        <span className="inline-flex shrink-0 items-center gap-1 text-xs font-black">
                          <span aria-hidden="true">{st.mark}</span>
                          {t(`mastery.grid.state.${m.grid}`)}
                        </span>
                      </p>
                      <p className="mt-1 text-xs opacity-90">{detail(t, m)}</p>
                      {m.grid === "weak" && (
                        <Link href={`/learn/review?module=${m.moduleId}`} className="mt-1.5 inline-block text-xs font-bold underline">
                          {t("mastery.strengthen.cta")} →
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })
      )}
    </div>
  );
}
