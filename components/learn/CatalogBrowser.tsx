"use client";

import { useMemo, useState } from "react";
import TrackCard from "./TrackCard";
import WhereToStart from "./WhereToStart";
import { LEVEL_META, TRACK_LEVELS, type TrackLevel } from "@/lib/learn/types";
import type { CatalogTrack } from "@/lib/learn/catalog";

export default function CatalogBrowser({ tracks }: { tracks: CatalogTrack[] }) {
  const [active, setActive] = useState<TrackLevel | "all">("all");
  const [recommended, setRecommended] = useState<string | null>(null);

  // A track spanning beginner→intermediate should match BOTH filters.
  const visible = useMemo(() => {
    if (active === "all") return tracks;
    return tracks.filter((t) => {
      if (t.level === active) return true;
      if (!t.levelEnd) return false;
      const start = TRACK_LEVELS.indexOf(t.level as TrackLevel);
      const end = TRACK_LEVELS.indexOf(t.levelEnd as TrackLevel);
      const target = TRACK_LEVELS.indexOf(active);
      return start >= 0 && end >= 0 && target >= start && target <= end;
    });
  }, [tracks, active]);

  const ordered = useMemo(() => {
    if (!recommended) return visible;
    // Float the recommended track to the front without hiding the rest
    return [...visible].sort((a, b) =>
      a.slug === recommended ? -1 : b.slug === recommended ? 1 : 0,
    );
  }, [visible, recommended]);

  return (
    <>
      <WhereToStart tracks={tracks} onRecommend={setRecommended} />

      {/* Level filter */}
      <div className="mt-10">
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter tracks by level">
          <button
            onClick={() => setActive("all")}
            aria-pressed={active === "all"}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              active === "all"
                ? "bg-[var(--ink)] text-white"
                : "border border-[var(--border)] bg-white text-[var(--ink2)] hover:border-[var(--ink3)]"
            }`}
          >
            All tracks ({tracks.length})
          </button>
          {TRACK_LEVELS.map((lv) => {
            const meta = LEVEL_META[lv];
            const on = active === lv;
            return (
              <button
                key={lv}
                onClick={() => setActive(lv)}
                aria-pressed={on}
                title={meta.meaning}
                className="rounded-full px-4 py-2 text-sm font-semibold transition-colors"
                style={
                  on
                    ? { background: meta.color, color: "#fff" }
                    : { background: meta.bg, color: meta.color }
                }
              >
                <span aria-hidden="true">{meta.emoji}</span> {meta.label}
              </button>
            );
          })}
        </div>

        {active !== "all" && (
          <p className="mt-3 text-sm text-[var(--ink3)]">
            <strong className="text-[var(--ink2)]">{LEVEL_META[active].label}:</strong>{" "}
            {LEVEL_META[active].meaning}
          </p>
        )}
      </div>

      {ordered.length === 0 ? (
        <p className="mt-10 rounded-xl border border-dashed border-[var(--border)] p-10 text-center text-[var(--ink3)]">
          No tracks at this level yet — try another filter.
        </p>
      ) : (
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {ordered.map((t) => (
            <div key={t.id} className={recommended === t.slug ? "ring-2 ring-[var(--orange)] rounded-2xl" : ""}>
              {recommended === t.slug && (
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--orange2)]">
                  ★ Recommended for you
                </p>
              )}
              <TrackCard track={t} />
            </div>
          ))}
        </div>
      )}
    </>
  );
}
