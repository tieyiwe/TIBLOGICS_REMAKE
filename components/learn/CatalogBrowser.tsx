"use client";

import { useMemo, useState } from "react";
import TrackCard from "./TrackCard";
import TrackTile from "./TrackTile";
import WhereToStart from "./WhereToStart";
import { LEVEL_META, TRACK_LEVELS, type TrackLevel } from "@/lib/learn/types";
import { levelLabel, levelMeaning } from "@/lib/learn/format";
import type { CatalogTrack } from "@/lib/learn/catalog";
import { useT } from "@/lib/i18n/client";

export default function CatalogBrowser({
  tracks,
  recommender = true,
  filter = true,
  highlight,
}: {
  tracks: CatalogTrack[];
  /** Show the "find my track" questions above the grid. */
  recommender?: boolean;
  /** Show the level filter chips. */
  filter?: boolean;
  /** A recommendation made elsewhere on the page (when recommender is off). */
  highlight?: string | null;
}) {
  const t = useT();
  const [active, setActive] = useState<TrackLevel | "all">("all");
  const [own, setOwn] = useState<string | null>(null);
  const recommended = recommender ? own : highlight ?? null;

  // A track spanning beginner→intermediate should match BOTH filters.
  const visible = useMemo(() => {
    if (active === "all") return tracks;
    return tracks.filter((x) => {
      if (x.level === active) return true;
      if (!x.levelEnd) return false;
      const start = TRACK_LEVELS.indexOf(x.level as TrackLevel);
      const end = TRACK_LEVELS.indexOf(x.levelEnd as TrackLevel);
      const target = TRACK_LEVELS.indexOf(active);
      return start >= 0 && end >= 0 && target >= start && target <= end;
    });
  }, [tracks, active]);

  const ordered = useMemo(() => {
    // Only the built-in recommender reorders; a highlight from elsewhere
    // leaves the grid where it is and scrolls to the card instead.
    if (!recommender || !recommended) return visible;
    return [...visible].sort((a, b) => (a.slug === recommended ? -1 : b.slug === recommended ? 1 : 0));
  }, [visible, recommended, recommender]);

  return (
    <>
      {recommender && <WhereToStart tracks={tracks} onRecommend={setOwn} />}

      {filter && (
        <div className={recommender ? "mt-10" : ""}>
          <div className="-mx-4 flex snap-x items-center gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden" role="group" aria-label={t("learn.catalog.filterLabel")}>
            <button
              onClick={() => setActive("all")}
              aria-pressed={active === "all"}
              className={`shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                active === "all"
                  ? "bg-[var(--ink)] text-white"
                  : "border border-[var(--border)] bg-white text-[var(--ink2)] hover:border-[var(--ink3)]"
              }`}
            >
              {t("learn.catalog.allCount", { n: tracks.length })}
            </button>
            {TRACK_LEVELS.map((lv) => {
              const meta = LEVEL_META[lv];
              const on = active === lv;
              return (
                <button
                  key={lv}
                  onClick={() => setActive(lv)}
                  aria-pressed={on}
                  title={levelMeaning(t, lv)}
                  className="shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-colors"
                  style={on ? { background: meta.color, color: "#fff" } : { background: meta.bg, color: meta.color }}
                >
                  <span aria-hidden="true">{meta.emoji}</span> {levelLabel(t, lv)}
                </button>
              );
            })}
          </div>

          {active !== "all" && (
            <p className="mt-3 text-sm text-[var(--ink3)]">
              <strong className="text-[var(--ink2)]">{levelLabel(t, active)}:</strong> {levelMeaning(t, active)}
            </p>
          )}
        </div>
      )}

      {ordered.length === 0 ? (
        <p className="mt-10 rounded-xl border border-dashed border-[var(--border)] p-10 text-center text-[var(--ink3)]">
          {t("learn.catalog.noneAtLevel")}
        </p>
      ) : (
        /* Keyed on the active filter so the entrance stagger replays
           when the grid contents change. */
        <div key={active} className={`learn-stagger grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-3 ${filter || recommender ? "mt-6" : ""}`}>
          {ordered.map((x, i) => (
            <div
              key={x.id}
              id={`track-${x.slug}`}
              style={{ "--stagger-index": i } as React.CSSProperties}
              className={`scroll-mt-28 ${recommended === x.slug ? "rounded-2xl ring-2 ring-[var(--orange)] ring-offset-2" : ""}`}
            >
              {recommended === x.slug && (
                <p className="mb-2 px-1 text-xs font-bold uppercase tracking-wide text-[var(--orange2)]">
                  ★ {t("learn.catalog.recommended")}
                </p>
              )}
              {/* Phones: a compact tile, two to a row. Wider screens: the full card. */}
              <div className="h-full sm:hidden">
                <TrackTile track={x} href={`/learning-box/${x.slug}`} />
              </div>
              <div className="hidden h-full sm:block">
                <TrackCard track={x} />
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
