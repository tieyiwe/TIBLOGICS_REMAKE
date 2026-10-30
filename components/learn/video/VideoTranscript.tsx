"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useT } from "@/lib/i18n/client";
import { cueBefore, formatTime, type Cue } from "@/lib/learn/video/shared";

/**
 * The transcript, built from the captions: searchable, the current line
 * highlighted and kept in view (inside the panel, never scrolling the page),
 * and every line a button that jumps the video there.
 */
export default function VideoTranscript({
  cues,
  time,
  onSeek,
  accentColor,
  langLabel,
  bordered,
}: {
  cues: Cue[];
  time: number;
  onSeek: (t: number) => void;
  accentColor: string;
  langLabel: string;
  bordered: boolean;
}) {
  const t = useT();
  const [q, setQ] = useState("");
  const list = useRef<HTMLOListElement>(null);
  const userScrolled = useRef(0);
  const current = cueBefore(cues, time);

  const query = q.trim().toLowerCase();
  const shown = useMemo(
    () => cues.map((c, i) => ({ c, i })).filter(({ c }) => !query || c.text.toLowerCase().includes(query)),
    [cues, query],
  );

  // Keep the current line in view unless the learner scrolled the panel recently.
  useEffect(() => {
    if (query || current < 0 || Date.now() - userScrolled.current < 4000) return;
    const box = list.current;
    const el = box?.querySelector<HTMLElement>(`[data-cue="${current}"]`);
    if (!box || !el) return;
    const top = el.offsetTop - box.offsetTop;
    if (top < box.scrollTop || top + el.offsetHeight > box.scrollTop + box.clientHeight) {
      box.scrollTo({ top: Math.max(0, top - box.clientHeight / 3), behavior: "smooth" });
    }
  }, [current, query]);

  return (
    <div className={`px-3 py-3 sm:px-4 ${bordered ? "border-t border-[var(--border)] md:border-l md:border-t-0" : ""}`}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-xs font-bold uppercase tracking-wide text-[var(--ink3)]">
          {t("video.transcript")} <span className="font-normal normal-case">· {langLabel}</span>
        </h3>
        {query && (
          <span className="text-[11px] text-[var(--ink3)]" role="status">
            {t("video.matches", { n: shown.length })}
          </span>
        )}
      </div>
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={t("video.searchTranscript")}
        aria-label={t("video.searchTranscript")}
        data-testid="video-transcript-search"
        className="mb-2 w-full rounded-lg border border-[var(--border)] bg-white px-3 py-1.5 text-sm text-[var(--ink)] placeholder:text-[var(--ink3)]"
      />
      <ol
        ref={list}
        onWheel={() => (userScrolled.current = Date.now())}
        onTouchMove={() => (userScrolled.current = Date.now())}
        className="relative max-h-72 space-y-0.5 overflow-y-auto pr-1"
        aria-label={t("video.transcript")}
      >
        {shown.length === 0 && <li className="px-2 py-2 text-sm text-[var(--ink3)]">{t("video.noMatches")}</li>}
        {shown.map(({ c, i }) => {
          const active = i === current;
          return (
            <li key={i} data-cue={i}>
              <button
                type="button"
                onClick={() => onSeek(c.start)}
                aria-current={active ? "true" : undefined}
                data-testid="video-cue"
                className={`flex w-full gap-3 rounded-md px-2 py-1 text-left text-sm leading-snug transition-colors ${
                  active ? "bg-[var(--s2)] text-[var(--ink)]" : "text-[var(--ink2)] hover:bg-[var(--s2)]"
                }`}
                style={active ? { boxShadow: `inset 3px 0 0 ${accentColor}` } : undefined}
              >
                <span className="w-10 shrink-0 font-mono text-[11px] tabular-nums text-[var(--ink3)]">{formatTime(c.start)}</span>
                <span className="min-w-0 flex-1">{query ? <Highlight text={c.text} q={query} /> : c.text}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function Highlight({ text, q }: { text: string; q: string }) {
  const parts: React.ReactNode[] = [];
  const lower = text.toLowerCase();
  let i = 0;
  let n = 0;
  while (i < text.length) {
    const j = lower.indexOf(q, i);
    if (j < 0) {
      parts.push(text.slice(i));
      break;
    }
    if (j > i) parts.push(text.slice(i, j));
    parts.push(
      <mark key={n++} className="rounded bg-yellow-200 px-0.5 text-[var(--ink)]">
        {text.slice(j, j + q.length)}
      </mark>,
    );
    i = j + q.length;
  }
  return <>{parts}</>;
}
