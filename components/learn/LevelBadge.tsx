import { LEVEL_META, levelLabel, type TrackLevel } from "@/lib/learn/types";

// Level badge with a plain-language meaning (Part C1) — the label alone
// ("Intermediate") means nothing to someone new, so the meaning is always
// available rather than hidden behind a hover.
export default function LevelBadge({
  level,
  levelEnd,
  showMeaning = false,
  size = "sm",
}: {
  level: string;
  levelEnd?: string | null;
  showMeaning?: boolean;
  size?: "sm" | "md";
}) {
  const meta = LEVEL_META[level as TrackLevel] ?? LEVEL_META.beginner;
  const label = levelLabel(level, levelEnd);

  return (
    <span className="inline-flex flex-col gap-1">
      <span
        className={`inline-flex items-center gap-1.5 rounded-full font-semibold ${
          size === "md" ? "px-3 py-1.5 text-sm" : "px-2.5 py-1 text-xs"
        }`}
        style={{ background: meta.bg, color: meta.color }}
      >
        <span aria-hidden="true">{meta.emoji}</span>
        {label}
      </span>
      {showMeaning && (
        <span className="text-xs text-[var(--ink3)]">{meta.meaning}</span>
      )}
    </span>
  );
}
