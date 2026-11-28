"use client";

import { useEffect, useState } from "react";
import { useT } from "@/lib/i18n/client";
import type { LessonVideoData } from "@/lib/learn/video/shared";
import VideoPlayer from "./VideoPlayer";

// A lesson with a video: the learner chooses "Video" (the player, with the
// written lesson folded underneath) or "Read" (the written lesson only).
// The choice is remembered in this browser for every lesson. Lessons without
// a video never render this, so nothing changes for them.

type Mode = "video" | "read";
const KEY = "tib:lesson:mode";

export default function LessonMedia({
  lessonId,
  title,
  video,
  accentColor,
  children,
}: {
  lessonId: string;
  title: string;
  video: LessonVideoData;
  accentColor: string;
  /** The written lesson. */
  children?: React.ReactNode;
}) {
  const t = useT();
  const [mode, setMode] = useState<Mode>("video");
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    try {
      const v = window.localStorage.getItem(KEY);
      if (v === "read" || v === "video") setMode(v);
    } catch {
      /* storage unavailable */
    }
  }, []);

  function choose(m: Mode) {
    setMode(m);
    try {
      window.localStorage.setItem(KEY, m);
    } catch {
      /* storage unavailable */
    }
  }

  const tab = (m: Mode, label: string, icon: React.ReactNode) => (
    <button
      type="button"
      onClick={() => choose(m)}
      aria-pressed={mode === m}
      data-testid={`lesson-mode-${m}`}
      className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-bold transition-colors ${
        mode === m ? "bg-[var(--ink)] text-white" : "text-[var(--ink2)] hover:text-[var(--ink)]"
      }`}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-2">
        <div role="group" aria-label={t("video.modeLabel")} className="inline-flex rounded-full border border-[var(--border)] bg-white p-1">
          {tab(
            "video",
            t("video.modeVideo"),
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
              <path d="M8 5v14l11-7z" />
            </svg>,
          )}
          {tab(
            "read",
            t("video.modeRead"),
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M4 5h7a3 3 0 0 1 3 3v11a2 2 0 0 0-2-2H4zM20 5h-4a2 2 0 0 0-2 2" />
            </svg>,
          )}
        </div>
        {mode === "read" && video.watched && (
          <span className="text-xs font-bold text-green-700">✓ {t("video.watched")}</span>
        )}
      </div>

      {mode === "video" && (
        <div className="mt-3">
          <VideoPlayer
            url={video.url}
            title={title}
            chapters={video.chapters}
            captions={video.captions}
            resumeAt={video.resumeAt}
            coverage={video.coverage}
            watched={video.watched}
            lessonId={lessonId}
            accentColor={accentColor}
            sources={video.sources}
            voiceLang={video.voiceLang}
            noSkip={video.noSkip !== false}
            // Opens "Next" and "Mark complete" in the lesson (LessonPlayer).
            onWatched={() => window.dispatchEvent(new CustomEvent("arfa:video-watched", { detail: lessonId }))}
          />
          {video.voiceLang && (
            <p className="mt-2 text-xs text-[var(--ink3)]" data-testid="video-ai-voice">
              {t("video.aiVoice")}
            </p>
          )}
        </div>
      )}

      {children && (
        <div className="mt-6">
          {mode === "video" && !expanded ? (
            <div className="relative">
              <div className="max-h-56 overflow-hidden" aria-hidden="true" inert>
                {children}
              </div>
              <div className="absolute inset-x-0 bottom-0 flex h-32 items-end justify-center bg-gradient-to-t from-[var(--s2)] via-[var(--s2)]/80 to-transparent pb-3">
                <button
                  type="button"
                  onClick={() => setExpanded(true)}
                  className="rounded-full border border-[var(--border)] bg-white px-5 py-2 text-sm font-bold text-[var(--ink)] shadow-sm hover:border-[var(--ink3)]"
                  data-testid="lesson-show-text"
                >
                  {t("video.showText")}
                </button>
              </div>
            </div>
          ) : (
            children
          )}
        </div>
      )}
    </>
  );
}
