"use client";

import { useEffect, useState } from "react";
import { useLocale, useT } from "@/lib/i18n/client";
import { DAILY_EVENT, localDay, readGoal, readPractice, writeGoal } from "@/lib/learn/game-client";

// Daily goal ring and 7-day activity strip. Days are bucketed in the
// learner's own time zone, so everything date-related is worked out after
// mount (the server does not know the time zone). Lessons come from the
// server; practice activity (pad runs, checks, quizzes, labs) is counted in
// this browser and earns no points.
export default function DailyPanel({
  lessonTimes,
  activityTimes,
  accent = "#F47C4C",
}: {
  /** ISO times of lessons completed in the last 8 days. */
  lessonTimes: string[];
  /** ISO times of any XP earned in the last 8 days. */
  activityTimes: string[];
  accent?: string;
}) {
  const t = useT();
  const locale = useLocale();
  const [ready, setReady] = useState(false);
  const [goal, setGoal] = useState(1);
  const [practice, setPractice] = useState<Record<string, number>>({});

  useEffect(() => {
    const sync = () => {
      setGoal(readGoal());
      setPractice(readPractice());
    };
    sync();
    setReady(true);
    window.addEventListener(DAILY_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(DAILY_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const today = ready ? localDay() : "";
  const lessonDays = ready ? lessonTimes.map((x) => localDay(new Date(x))) : [];
  const activeDays = new Set(ready ? [...lessonDays, ...activityTimes.map((x) => localDay(new Date(x)))] : []);
  for (const [d, n] of Object.entries(practice)) if (n > 0) activeDays.add(d);

  const lessonsToday = lessonDays.filter((d) => d === today).length;
  const practiceToday = practice[today] ?? 0;
  const done = lessonsToday + practiceToday;
  const met = ready && done >= goal;
  const pct = Math.min(1, done / goal);

  const days = ready
    ? Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return { key: localDay(d), label: d.toLocaleDateString(locale, { weekday: "short" }), full: d.toLocaleDateString(locale, { weekday: "long" }) };
      })
    : [];
  const activeCount = days.filter((d) => activeDays.has(d.key)).length;

  const size = 88;
  const stroke = 9;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;

  const changeGoal = (n: number) => {
    const v = Math.max(1, Math.min(5, n));
    writeGoal(v);
    setGoal(v);
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {/* Daily goal */}
      <div className="flex items-center gap-5 rounded-2xl border border-[var(--border)] bg-white p-5">
        <span
          className="relative shrink-0"
          style={{ width: size, height: size }}
          role="img"
          aria-label={t("game.daily.ringLabel", { done, goal })}
        >
          <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--s3)" strokeWidth={stroke} />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={met ? "#22A387" : accent}
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={c}
              strokeDashoffset={c * (1 - pct)}
              style={{ transition: "stroke-dashoffset .6s cubic-bezier(.16,1,.3,1)" }}
            />
          </svg>
          <span aria-hidden="true" className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-black text-[var(--ink)]">{met ? "✓" : `${done}/${goal}`}</span>
          </span>
        </span>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ink3)]">{t("game.daily.title")}</p>
          <p className="mt-1 text-sm font-bold text-[var(--ink)]">
            {!ready
              ? " "
              : met
              ? t("game.daily.met")
              : t(goal - done === 1 ? "game.daily.left.one" : "game.daily.left.other", { n: goal - done })}
          </p>
          <p className="mt-1 text-xs text-[var(--ink2)]">{t("game.daily.hint")}</p>
          <div className="mt-2 flex items-center gap-2 text-xs text-[var(--ink2)]">
            <button
              onClick={() => changeGoal(goal - 1)}
              disabled={goal <= 1}
              aria-label={t("game.daily.less")}
              className="h-7 w-7 rounded-full border border-[var(--border)] font-bold disabled:opacity-40"
            >
              −
            </button>
            <span aria-live="polite">{t(goal === 1 ? "game.daily.goal.one" : "game.daily.goal.other", { n: goal })}</span>
            <button
              onClick={() => changeGoal(goal + 1)}
              disabled={goal >= 5}
              aria-label={t("game.daily.more")}
              className="h-7 w-7 rounded-full border border-[var(--border)] font-bold disabled:opacity-40"
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* Last 7 days */}
      <div className="rounded-2xl border border-[var(--border)] bg-white p-5">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ink3)]">{t("game.week.title")}</p>
          {ready && <p className="text-xs font-bold text-[var(--ink2)]">{t("game.week.count", { n: activeCount })}</p>}
        </div>
        <ol className="mt-4 grid grid-cols-7 gap-1.5">
          {(ready ? days : Array.from({ length: 7 }, (_, i) => ({ key: String(i), label: "", full: "" }))).map((d) => {
            const on = activeDays.has(d.key);
            const isToday = d.key === today;
            return (
              <li key={d.key} className="flex flex-col items-center gap-1.5">
                <span
                  aria-hidden="true"
                  className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-black ${
                    on ? "text-white" : "bg-[var(--s2)] text-[var(--ink3)]"
                  } ${isToday ? "ring-2 ring-[var(--ink)] ring-offset-2" : ""}`}
                  style={on ? { background: accent } : undefined}
                >
                  {on ? "✓" : "·"}
                </span>
                <span aria-hidden="true" className={`text-[11px] ${isToday ? "font-bold text-[var(--ink)]" : "text-[var(--ink3)]"}`}>
                  {d.label}
                </span>
                {ready && (
                  <span className="sr-only">
                    {t(on ? "game.week.dayOn" : "game.week.dayOff", { day: d.full })}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
