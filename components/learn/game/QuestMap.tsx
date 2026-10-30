import Link from "next/link";
import { getLocale, getT } from "@/lib/i18n/server";
import { fmtNumber } from "@/lib/learn/format";

export type StageState = "complete" | "current" | "started" | "future";

export interface QuestModule {
  id: string;
  title: string;
  href: string;
  lessonsDone: number;
  lessonsTotal: number;
  stars: { lessons: boolean; quiz: boolean; lab: boolean; count: number };
  state: StageState;
  /** Mastery paths: tested out of (shown as Mastered, distinct from studied). */
  mastered?: boolean;
}

export interface QuestFinal {
  kind: "exam" | "capstone";
  title: string;
  href: string;
  state: StageState;
}

// The track as a trail of checkpoints: one per module (up to three stars
// each), then the final exam and the capstone. Nothing is actually locked:
// future checkpoints only look it, and every one of them is a link.
export default async function QuestMap({
  modules,
  finals,
  xp,
  accent,
}: {
  modules: QuestModule[];
  finals: QuestFinal[];
  xp: { earned: number; available: number };
  accent: string;
}) {
  const [t, locale] = await Promise.all([getT(), getLocale()]);
  const xpPct = xp.available > 0 ? Math.min(100, Math.round((xp.earned / xp.available) * 100)) : 0;
  const totalStars = modules.reduce((n, m) => n + m.stars.count, 0);

  const stages = [
    ...modules.map((m, i) => ({ key: m.id, number: String(i + 1), icon: null as string | null, ...m })),
    ...finals.map((f) => ({
      key: f.kind,
      number: "",
      icon: f.kind === "exam" ? "🎓" : "🏆",
      id: f.kind,
      title: f.title,
      href: f.href,
      state: f.state,
      lessonsDone: 0,
      lessonsTotal: 0,
      stars: null as QuestModule["stars"] | null,
      mastered: false,
    })),
  ];

  return (
    <section aria-labelledby="quest-heading" className="rounded-2xl border border-[var(--border)] bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 id="quest-heading" className="text-base font-bold text-[var(--ink)]">
            {t("game.quest.title")}
          </h2>
          <p className="mt-1 text-xs text-[var(--ink3)]">{t("game.quest.legend")}</p>
        </div>
        <div className="w-full sm:w-64">
          <div className="flex items-baseline justify-between gap-2 text-xs">
            <span className="font-semibold uppercase tracking-wide text-[var(--ink3)]">{t("game.quest.trackXp")}</span>
            <span className="font-black text-[var(--ink)]">
              {t("game.quest.xpOf", { n: fmtNumber(xp.earned, locale), total: fmtNumber(xp.available, locale) })}
            </span>
          </div>
          <div
            className="mt-1.5 h-2 overflow-hidden rounded-full bg-[var(--s3)]"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={xp.available}
            aria-valuenow={xp.earned}
            aria-label={t("game.quest.trackXp")}
          >
            <div className="h-full rounded-full" style={{ width: `${xpPct}%`, background: accent }} />
          </div>
          <p className="mt-1 text-right text-[11px] text-[var(--ink3)]">
            {t("game.quest.starsOf", { n: totalStars, total: modules.length * 3 })}
          </p>
        </div>
      </div>

      <ol className="mt-6">
        {stages.map((s, i) => {
          const first = i === 0;
          const last = i === stages.length - 1;
          const reached = s.state === "complete" || s.state === "current" || s.state === "started";
          const nextReached = !last && stages[i + 1].state !== "future";
          const right = i % 2 === 1; // winding: alternate sides from sm up
          return (
            <li
              key={s.key}
              className="grid grid-cols-[56px_minmax(0,1fr)] gap-x-4 sm:grid-cols-[minmax(0,1fr)_64px_minmax(0,1fr)]"
            >
              {/* Trail + checkpoint */}
              <div className="relative flex justify-center py-3 sm:col-start-2 sm:row-start-1">
                {!first && (
                  <span
                    aria-hidden="true"
                    className="absolute left-1/2 top-0 h-1/2 w-1 -translate-x-1/2 rounded-full"
                    style={reached ? { background: accent } : { backgroundImage: "linear-gradient(var(--s3) 60%, transparent 0)", backgroundSize: "4px 10px" }}
                  />
                )}
                {!last && (
                  <span
                    aria-hidden="true"
                    className="absolute bottom-0 left-1/2 top-1/2 w-1 -translate-x-1/2 rounded-full"
                    style={nextReached ? { background: accent } : { backgroundImage: "linear-gradient(var(--s3) 60%, transparent 0)", backgroundSize: "4px 10px" }}
                  />
                )}
                <span
                  aria-hidden="true"
                  className={`relative z-[1] flex h-14 w-14 items-center justify-center self-center rounded-full text-lg font-black ${
                    s.state === "complete"
                      ? "text-white"
                      : s.state === "current"
                      ? "game-here border-4 bg-white text-[var(--ink)]"
                      : s.state === "started"
                      ? "border-2 bg-white text-[var(--ink)]"
                      : "border-2 border-dashed border-[var(--border)] bg-[var(--s2)] text-[var(--ink3)]"
                  }`}
                  style={{
                    ...(s.state === "complete"
                      ? { background: accent }
                      : s.state === "current" || s.state === "started"
                      ? { borderColor: accent }
                      : {}),
                    // Mastered (tested out): a green double ring and a star.
                    ...(s.mastered ? { boxShadow: "0 0 0 3px #fff, 0 0 0 6px #15803d" } : {}),
                  }}
                >
                  {s.mastered ? "★" : s.state === "complete" ? "✓" : s.icon ?? s.number}
                  {s.state === "future" && (
                    <span className="absolute -bottom-1 -right-1 rounded-full bg-white px-0.5 text-xs">🔒</span>
                  )}
                </span>
              </div>

              {/* Card */}
              <Link
                href={s.href}
                className={`my-2 block self-center rounded-2xl border p-4 transition-shadow hover:shadow-md ${
                  right ? "sm:col-start-3" : "sm:col-start-1"
                } sm:row-start-1 ${
                  s.state === "current"
                    ? "border-2 bg-white shadow-sm"
                    : s.state === "future"
                    ? "border-dashed border-[var(--border)] bg-[var(--s2)]"
                    : "border-[var(--border)] bg-white"
                }`}
                style={s.state === "current" ? { borderColor: accent } : undefined}
                aria-current={s.state === "current" ? "step" : undefined}
              >
                {s.state === "current" && (
                  <span
                    className="mb-2 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white"
                    style={{ background: accent }}
                  >
                    <span aria-hidden="true">📍</span> {t("game.quest.here")}
                  </span>
                )}
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--ink3)]">
                  {s.stars
                    ? t("game.quest.module", { n: s.number })
                    : s.key === "exam"
                    ? t("game.quest.finalExam")
                    : t("game.quest.capstone")}
                  {" · "}
                  {t(`game.quest.state.${s.state}`)}
                  {s.mastered && (
                    <span className="ml-2 inline-flex items-center gap-1 rounded-full border border-green-600 bg-green-50 px-2 py-0.5 normal-case tracking-normal text-green-900">
                      <span aria-hidden="true">★</span> {t("mastery.quest.mastered")}
                    </span>
                  )}
                </p>
                <p className={`mt-0.5 text-sm font-bold ${s.state === "future" ? "text-[var(--ink2)]" : "text-[var(--ink)]"}`}>
                  {s.title}
                </p>
                {s.stars && (
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="text-lg leading-none tracking-wider" role="img" aria-label={t("game.stars.label", { n: s.stars.count })}>
                      {[s.stars.lessons, s.stars.quiz, s.stars.lab].map((on, k) => (
                        <span key={k} aria-hidden="true" style={{ color: on ? "#F9A738" : "var(--ink3)" }}>
                          {on ? "★" : "☆"}
                        </span>
                      ))}
                    </span>
                    <span className="text-xs text-[var(--ink3)]">
                      {t("learn.dash.lessonsFraction", { done: s.lessonsDone, total: s.lessonsTotal })}
                    </span>
                  </div>
                )}
              </Link>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
