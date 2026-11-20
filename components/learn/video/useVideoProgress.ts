"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { markLoop } from "@/lib/learn/method/loop-client";
import { COVERAGE_BUCKETS, WATCHED_SHARE, coverageShare } from "@/lib/learn/video/shared";

// Saves where a learner is in a lesson video and which parts they have seen.
// Coverage counts only time actually played (seeking past a part does not
// count it), so "watched" means about 80% of the video was seen, wherever the
// learner started. Saved every 15 seconds of playback, on pause and when the
// page is hidden (sendBeacon, so leaving the page still saves).

const SAVE_EVERY_MS = 15_000;

export function useVideoProgress({
  lessonId,
  initialCoverage,
  initialWatched,
  onWatched,
}: {
  lessonId?: string;
  initialCoverage: string;
  initialWatched: boolean;
  onWatched?: () => void;
}) {
  const buckets = useRef<string[]>(
    (initialCoverage.length === COVERAGE_BUCKETS ? initialCoverage : "0".repeat(COVERAGE_BUCKETS)).split(""),
  );
  const [coverage, setCoverage] = useState(buckets.current.join(""));
  const [watched, setWatched] = useState(initialWatched);
  const watchedRef = useRef(initialWatched);
  const last = useRef<number | null>(null);
  const pos = useRef(0);
  const dur = useRef(0);
  const dirty = useRef(false);
  const lastSent = useRef(Date.now());
  const onWatchedRef = useRef(onWatched);
  onWatchedRef.current = onWatched;

  // Already watched on an earlier visit: the Learning Loop's Understand step.
  useEffect(() => {
    if (lessonId && initialWatched) markLoop(lessonId, "understand");
  }, [lessonId, initialWatched]);

  const send = useCallback(
    (beacon: boolean) => {
      if (!lessonId || !dirty.current || dur.current <= 0) return;
      dirty.current = false;
      lastSent.current = Date.now();
      const body = JSON.stringify({
        lessonId,
        position: Math.round(pos.current * 10) / 10,
        duration: Math.round(dur.current * 10) / 10,
        coverage: buckets.current.join(""),
      });
      if (beacon && typeof navigator !== "undefined" && navigator.sendBeacon) {
        navigator.sendBeacon("/api/learn/video/progress", new Blob([body], { type: "text/plain" }));
        return;
      }
      fetch("/api/learn/video/progress", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (d?.watched && !watchedRef.current) {
            watchedRef.current = true;
            setWatched(true);
            markLoop(lessonId, "understand");
            onWatchedRef.current?.();
          }
        })
        .catch(() => {
          dirty.current = true; // try again with the next save
        });
    },
    [lessonId],
  );

  const tick = useCallback(
    (t: number, d: number | null, playing: boolean) => {
      if (d && d > 0) dur.current = d;
      const prev = last.current;
      last.current = t;
      if (Math.abs(t - pos.current) > 0.2) dirty.current = true;
      pos.current = t;
      if (!playing || prev === null || dur.current <= 0) return;
      const delta = t - prev;
      if (delta <= 0 || delta > 3) return; // a seek, not playback
      const from = Math.floor((prev / dur.current) * COVERAGE_BUCKETS);
      const to = Math.min(COVERAGE_BUCKETS - 1, Math.floor((t / dur.current) * COVERAGE_BUCKETS));
      let changed = false;
      for (let i = Math.max(0, from); i <= to; i++) {
        if (buckets.current[i] !== "1") {
          buckets.current[i] = "1";
          changed = true;
        }
      }
      if (changed) {
        const c = buckets.current.join("");
        setCoverage(c);
        if (!watchedRef.current && coverageShare(c) >= WATCHED_SHARE) {
          watchedRef.current = true;
          setWatched(true);
          if (lessonId) markLoop(lessonId, "understand");
          onWatchedRef.current?.();
          send(false);
          return;
        }
      }
      if (Date.now() - lastSent.current > SAVE_EVERY_MS) send(false);
    },
    [lessonId, send],
  );

  const seeked = useCallback((t: number) => {
    last.current = t;
    pos.current = t;
    dirty.current = true;
  }, []);

  const flush = useCallback(() => send(false), [send]);

  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === "hidden") send(true);
    };
    const onLeave = () => send(true);
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", onLeave);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", onLeave);
      send(true); // client-side navigation away from the lesson
    };
  }, [send]);

  return useMemo(() => ({ tick, seeked, flush, coverage, watched }), [tick, seeked, flush, coverage, watched]);
}
