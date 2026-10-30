"use client";

import { useT } from "@/lib/i18n/client";
import { bestCombo, quizStars } from "@/lib/learn/badge-defs";

// Star rating and best combo for a scored quiz or micro-check. Both are
// scored only at the end, so the combo is reported here, in the summary,
// after the answers are revealed as they already were.
export default function ResultFlair({
  score,
  passScore,
  graded,
  compact = false,
}: {
  score: number;
  passScore: number;
  graded: Array<{ isCorrect: boolean }>;
  compact?: boolean;
}) {
  const t = useT();
  const stars = quizStars(score, passScore);
  const combo = bestCombo(graded);
  const total = graded.length;
  const comboMsg =
    total > 0 && combo === total
      ? t("game.combo.flawless")
      : combo >= 5
      ? t("game.combo.hot")
      : combo >= 3
      ? t("game.combo.roll")
      : combo >= 1
      ? t("game.combo.start")
      : t("game.combo.none");

  return (
    <div className={`flex flex-col items-center ${compact ? "mt-3" : "mt-4"}`}>
      <p className="flex items-center gap-1" role="img" aria-label={t("game.stars.label", { n: stars })}>
        {[1, 2, 3].map((i) => (
          <span
            key={i}
            aria-hidden="true"
            className={`${i <= stars ? "game-star-pop text-[#F9A738]" : "text-[var(--s3)]"} ${compact ? "text-2xl" : "text-4xl"} leading-none`}
            style={{ "--pop-delay": `${i * 180}ms` } as React.CSSProperties}
          >
            {i <= stars ? "★" : "☆"}
          </span>
        ))}
      </p>
      <p className="mt-1 text-xs font-semibold text-[var(--ink3)]">{t(`game.stars.caption.${stars}`)}</p>
      {total > 0 && (
        <p className="mt-3 inline-flex flex-wrap items-center justify-center gap-2 rounded-full bg-[var(--s2)] px-4 py-1.5 text-sm">
          <span className="font-black text-[var(--ink)]">
            <span aria-hidden="true">⚡ </span>
            {t("game.combo.best", { n: combo })}
          </span>
          <span className="text-[var(--ink2)]">{comboMsg}</span>
        </p>
      )}
    </div>
  );
}
