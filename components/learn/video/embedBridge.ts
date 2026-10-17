"use client";

import { useCallback, useEffect, useRef } from "react";

// Talks to YouTube and Vimeo embeds over postMessage, so the page needs no
// third-party script (the CSP stays script-src 'self'). Both players accept
// commands and report the current time this way:
//   YouTube: enablejsapi=1, {"event":"listening"} then "infoDelivery" events.
//   Vimeo:   {"method":"addEventListener"} then "timeupdate"/"play"/... events.

export interface EmbedState {
  time?: number;
  duration?: number;
  paused?: boolean;
  ended?: boolean;
  rate?: number;
  ready?: boolean;
}

const ORIGINS = {
  youtube: "https://www.youtube-nocookie.com",
  vimeo: "https://player.vimeo.com",
} as const;

export function useEmbedBridge(
  kind: "youtube" | "vimeo" | null,
  frame: React.RefObject<HTMLIFrameElement | null>,
  onState: (s: EmbedState) => void,
) {
  const cb = useRef(onState);
  cb.current = onState;
  const heard = useRef(false);

  const post = useCallback(
    (msg: object) => {
      if (!kind) return;
      frame.current?.contentWindow?.postMessage(JSON.stringify(msg), ORIGINS[kind]);
    },
    [kind, frame],
  );

  const subscribe = useCallback(() => {
    if (kind === "youtube") post({ event: "listening", id: 1, channel: "widget" });
    if (kind === "vimeo") {
      for (const ev of ["timeupdate", "play", "pause", "ended", "playbackratechange", "loaded"]) post({ method: "addEventListener", value: ev });
      post({ method: "getDuration" });
    }
  }, [kind, post]);

  useEffect(() => {
    if (!kind) return;
    heard.current = false;
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== ORIGINS[kind] || e.source !== frame.current?.contentWindow) return;
      let d: Record<string, unknown>;
      try {
        d = typeof e.data === "string" ? JSON.parse(e.data) : e.data;
      } catch {
        return;
      }
      if (!d || typeof d !== "object") return;
      heard.current = true;
      if (kind === "youtube") {
        if (d.event === "onReady") cb.current({ ready: true });
        const info = d.info as Record<string, unknown> | undefined;
        if ((d.event === "infoDelivery" || d.event === "initialDelivery") && info) {
          const s: EmbedState = { ready: true };
          if (typeof info.currentTime === "number") s.time = info.currentTime;
          if (typeof info.duration === "number" && info.duration > 0) s.duration = info.duration;
          if (typeof info.playbackRate === "number") s.rate = info.playbackRate;
          if (typeof info.playerState === "number") {
            s.paused = info.playerState !== 1 && info.playerState !== 3;
            s.ended = info.playerState === 0;
          }
          cb.current(s);
        }
        if (d.event === "onStateChange" && typeof d.info === "number") {
          cb.current({ paused: d.info !== 1 && d.info !== 3, ended: d.info === 0 });
        }
      } else {
        const data = d.data as Record<string, unknown> | undefined;
        if (d.event === "ready") {
          subscribe();
          cb.current({ ready: true });
        } else if (d.event === "timeupdate" && data) {
          cb.current({
            time: typeof data.seconds === "number" ? data.seconds : undefined,
            duration: typeof data.duration === "number" ? data.duration : undefined,
          });
        } else if (d.event === "play") cb.current({ paused: false, ended: false });
        else if (d.event === "pause") cb.current({ paused: true });
        else if (d.event === "ended") cb.current({ paused: true, ended: true });
        else if (d.event === "playbackratechange" && data && typeof data.playbackRate === "number") cb.current({ rate: data.playbackRate });
        else if (d.method === "getDuration" && typeof d.value === "number") cb.current({ duration: d.value });
      }
    };
    window.addEventListener("message", onMessage);
    // The iframe may load before or after this listener: keep asking until it answers.
    let tries = 0;
    const timer = window.setInterval(() => {
      if (heard.current || tries++ > 20) return window.clearInterval(timer);
      subscribe();
    }, 500);
    return () => {
      window.removeEventListener("message", onMessage);
      window.clearInterval(timer);
    };
  }, [kind, frame, subscribe]);

  const command = useCallback(
    (name: "play" | "pause" | "seek" | "rate", value?: number) => {
      if (kind === "youtube") {
        if (name === "play") post({ event: "command", func: "playVideo", args: [] });
        if (name === "pause") post({ event: "command", func: "pauseVideo", args: [] });
        if (name === "seek") post({ event: "command", func: "seekTo", args: [value ?? 0, true] });
        if (name === "rate") post({ event: "command", func: "setPlaybackRate", args: [value ?? 1] });
      } else if (kind === "vimeo") {
        if (name === "play") post({ method: "play" });
        if (name === "pause") post({ method: "pause" });
        if (name === "seek") post({ method: "setCurrentTime", value: value ?? 0 });
        if (name === "rate") post({ method: "setPlaybackRate", value: value ?? 1 });
      }
    },
    [kind, post],
  );

  return { command, subscribe };
}

/** The embed URL with the API switched on and the start time set. */
export function embedSrc(kind: "youtube" | "vimeo", base: string, startAt: number): string {
  const start = Math.max(0, Math.floor(startAt));
  if (kind === "youtube") {
    const q = new URLSearchParams({ enablejsapi: "1", rel: "0", playsinline: "1", modestbranding: "1" });
    if (typeof window !== "undefined") q.set("origin", window.location.origin);
    if (start) q.set("start", String(start));
    return `${base}?${q.toString()}`;
  }
  const u = new URL(base);
  u.searchParams.set("dnt", "1");
  u.searchParams.set("title", "0");
  u.searchParams.set("byline", "0");
  u.searchParams.set("portrait", "0");
  return start ? `${u.toString()}#t=${start}s` : u.toString();
}
