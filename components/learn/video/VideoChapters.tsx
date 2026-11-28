"use client";

import { useT } from "@/lib/i18n/client";
import { formatTime, type Chapter } from "@/lib/learn/video/shared";

/** The chapter list under the player: click to jump, the current one marked. */
export default function VideoChapters({
  chapters,
  current,
  onSeek,
  accentColor,
  duration,
}: {
  chapters: Chapter[];
  current: number;
  onSeek: (t: number) => void;
  accentColor: string;
  duration: number;
}) {
  const t = useT();
  return (
    <nav aria-label={t("video.chapters")} className="px-3 py-3 sm:px-4">
      <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--ink3)]">{t("video.chapters")}</h3>
      <ol className="space-y-0.5">
        {chapters.map((c, i) => {
          const next = chapters[i + 1]?.time ?? duration;
          const len = next > c.time ? next - c.time : 0;
          const active = i === current;
          return (
            <li key={`${c.time}-${i}`}>
              <button
                type="button"
                onClick={() => onSeek(c.time)}
                aria-current={active ? "true" : undefined}
                data-testid="video-chapter"
                className={`flex w-full items-baseline gap-3 rounded-lg px-2 py-1.5 text-left text-sm transition-colors ${
                  active ? "bg-[var(--s2)] font-bold text-[var(--ink)]" : "text-[var(--ink2)] hover:bg-[var(--s2)]"
                }`}
              >
                <span className="w-12 shrink-0 font-mono text-xs tabular-nums" style={{ color: active ? accentColor : "var(--ink3)" }}>
                  {formatTime(c.time)}
                </span>
                <span className="min-w-0 flex-1">{c.title}</span>
                {len > 0 && <span className="shrink-0 text-[11px] text-[var(--ink3)]">{formatTime(len)}</span>}
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
