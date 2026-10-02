"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useT } from "@/lib/i18n/client";
import {
  CAPTION_LANGS,
  chapterAt,
  coverageShare,
  cueAt,
  emptyCoverage,
  formatTime,
  parseVideoUrl,
  parseVtt,
  type CaptionLang,
  type Captions,
  type Chapter,
  type Cue,
} from "@/lib/learn/video/shared";
import { embedSrc, useEmbedBridge, type EmbedState } from "./embedBridge";
import VideoChapters from "./VideoChapters";
import VideoTranscript from "./VideoTranscript";
import { useVideoProgress } from "./useVideoProgress";

// The lesson video player. YouTube and Vimeo play in their privacy-enhanced
// embeds (youtube-nocookie, Vimeo with dnt=1) driven over postMessage; MP4,
// WebM and HLS (where the browser plays it natively) play in a <video> with
// our own controls. Around both: chapters, captions from WebVTT in English,
// French or Swahili, a searchable transcript, playback speed, keyboard
// shortcuts, and (with a lessonId) the learner's saved position and
// "watched" tracking.

export const SPEEDS = [0.75, 1, 1.25, 1.5, 1.75, 2];
const LANG_LABEL: Record<CaptionLang, string> = { en: "English", fr: "Français" };

function store(key: string, value?: string): string | null {
  try {
    if (value === undefined) return window.localStorage.getItem(key);
    window.localStorage.setItem(key, value);
  } catch {
    /* storage unavailable */
  }
  return null;
}

export interface VideoPlayerProps {
  url: string;
  title: string;
  chapters?: Chapter[];
  captions?: Captions;
  /** Saved position, seconds. */
  resumeAt?: number;
  /** Saved coverage ("0"/"1" buckets). */
  coverage?: string;
  watched?: boolean;
  /** Set to save the learner's progress for this lesson. */
  lessonId?: string;
  accentColor?: string;
  onWatched?: () => void;
  /** Files to offer in order (generated videos: MP4, then WebM); the browser plays the first it can. */
  sources?: Array<{ src: string; type: string }>;
  /** Language of the voice-over (generated videos); captions in it are not switched on by default. */
  voiceLang?: CaptionLang;
}

export default function VideoPlayer({
  url,
  title,
  chapters = [],
  captions = {},
  resumeAt = 0,
  coverage,
  watched: watchedInitial = false,
  lessonId,
  accentColor = "#F47C20",
  onWatched,
  sources,
  voiceLang = "en",
}: VideoPlayerProps) {
  const t = useT();
  const locale = useLocale();
  const source = useMemo(() => parseVideoUrl(url), [url]);
  const native = source?.kind === "file" || source?.kind === "hls";
  const embedKind = source?.kind === "youtube" || source?.kind === "vimeo" ? source.kind : null;

  const root = useRef<HTMLElement>(null);
  const frameWrap = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const iframe = useRef<HTMLIFrameElement>(null);

  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [paused, setPaused] = useState(true);
  const [rate, setRateState] = useState(1);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [started, setStarted] = useState(false);
  const [failed, setFailed] = useState(false);
  const [hlsUnsupported, setHlsUnsupported] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [toast, setToast] = useState<{ text: string; restart?: boolean } | null>(null);

  // ── Captions ──────────────────────────────────────────────────────────────
  const tracks = useMemo(() => {
    const out: Partial<Record<CaptionLang, Cue[]>> = {};
    for (const l of CAPTION_LANGS) {
      const v = captions[l];
      if (v) {
        const r = parseVtt(v);
        if (r.cues.length) out[l] = r.cues;
      }
    }
    return out;
  }, [captions]);
  const langs = CAPTION_LANGS.filter((l) => tracks[l]);
  const defaultLang: CaptionLang | null = langs.includes(locale as CaptionLang) ? (locale as CaptionLang) : langs.includes("en") ? "en" : langs[0] ?? null;
  const [lang, setLang] = useState<CaptionLang | null>(defaultLang);
  // On by default when they exist in the learner's language and it is not
  // the voice-over's language; remembered once the learner chooses.
  const [ccOn, setCcOn] = useState<boolean>(!!defaultLang && defaultLang === locale && locale !== voiceLang);
  const [transcriptOpen, setTranscriptOpen] = useState(false);

  useEffect(() => {
    const savedCc = store("tib:video:cc");
    const savedRate = Number(store("tib:video:rate"));
    if (savedCc === "off") setCcOn(false);
    else if (savedCc && langs.includes(savedCc as CaptionLang)) {
      setCcOn(true);
      setLang(savedCc as CaptionLang);
    } else {
      // The language the learner chose on the site, even where this page is
      // only offered in English and French (Swahili captions still apply).
      const chosen = /(?:^|;\s*)tib_lang=([a-z]{2})/.exec(document.cookie)?.[1] as CaptionLang | undefined;
      if (chosen && chosen !== locale && langs.includes(chosen)) {
        setLang(chosen);
        setCcOn(chosen !== voiceLang);
      }
    }
    if (SPEEDS.includes(savedRate) && savedRate !== 1) setRateState(savedRate);
    if (store("tib:video:transcript") === "1") setTranscriptOpen(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cues = lang ? tracks[lang] ?? [] : [];
  const cueIdx = ccOn ? cueAt(cues, time) : -1;

  // ── Progress (resume + watched) ───────────────────────────────────────────
  const progress = useVideoProgress({
    lessonId,
    initialCoverage: coverage ?? emptyCoverage(),
    initialWatched: watchedInitial,
    onWatched,
  });

  // ── Engine ────────────────────────────────────────────────────────────────
  const startAt = resumeAt > 5 ? resumeAt : 0;
  const onEmbed = useCallback(
    (s: EmbedState) => {
      if (s.duration !== undefined) setDuration(s.duration);
      if (s.rate !== undefined) setRateState(s.rate);
      if (s.paused !== undefined) {
        setPaused(s.paused);
        if (!s.paused) setStarted(true);
      }
      if (s.time !== undefined) {
        setTime(s.time);
        progress.tick(s.time, s.duration ?? null, s.paused === false);
      }
      if (s.ended) progress.flush();
    },
    [progress],
  );
  const bridge = useEmbedBridge(embedKind, iframe, onEmbed);
  // The iframe src is fixed on first render (start time included), so a
  // re-render never reloads the embed.
  const [iframeSrc] = useState(() => (embedKind && source ? embedSrc(embedKind, source.src, startAt) : ""));

  const play = useCallback(() => {
    if (native) void video.current?.play().catch(() => {});
    else bridge.command("play");
  }, [native, bridge]);
  const pause = useCallback(() => {
    if (native) video.current?.pause();
    else bridge.command("pause");
  }, [native, bridge]);
  const toggle = useCallback(() => (paused ? play() : pause()), [paused, play, pause]);
  const seek = useCallback(
    (to: number) => {
      const max = duration || Number.MAX_SAFE_INTEGER;
      const v = Math.max(0, Math.min(to, max - 0.25));
      if (native && video.current) video.current.currentTime = v;
      else bridge.command("seek", v);
      setTime(v);
      progress.seeked(v);
    },
    [duration, native, bridge, progress],
  );
  const setRate = useCallback(
    (r: number) => {
      setRateState(r);
      store("tib:video:rate", String(r));
      if (native && video.current) video.current.playbackRate = r;
      else bridge.command("rate", r);
    },
    [native, bridge],
  );

  // Native: apply the remembered speed, and resume.
  useEffect(() => {
    if (native && video.current) video.current.playbackRate = rate;
  }, [native, rate]);
  // Embeds: apply a remembered speed once the player answers.
  const rateApplied = useRef(false);
  useEffect(() => {
    if (!native && duration > 0 && !rateApplied.current) {
      rateApplied.current = true;
      const saved = Number(store("tib:video:rate"));
      if (SPEEDS.includes(saved) && saved !== 1) bridge.command("rate", saved);
    }
  }, [native, duration, bridge]);

  const resumedShown = useRef(false);
  const showResumed = useCallback(() => {
    if (resumedShown.current || startAt <= 0) return;
    resumedShown.current = true;
    setToast({ text: t("video.resumed", { time: formatTime(startAt) }), restart: true });
  }, [startAt, t]);
  useEffect(() => {
    if (!native && startAt > 0) showResumed();
  }, [native, startAt, showResumed]);
  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 7000);
    return () => window.clearTimeout(id);
  }, [toast]);

  // Generated videos: when the browser can play none of the files offered
  // (no error event fires for that), say so instead of a black frame.
  useEffect(() => {
    const v = video.current;
    if (sources?.length && v && !sources.some((x) => v.canPlayType(x.type))) setFailed(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // HLS only where the browser plays it itself (Safari, iOS, Android, newer Chrome).
  useEffect(() => {
    if (source?.kind === "hls" && video.current && !video.current.canPlayType("application/vnd.apple.mpegurl")) {
      setHlsUnsupported(true);
    }
  }, [source]);

  // Native: once the metadata is in, apply the speed and resume. The browser
  // can load the metadata before React attaches its handlers (server-rendered
  // <video>), so this also runs on mount when it is already there.
  const metaDone = useRef(false);
  const onMeta = useCallback(
    (v: HTMLVideoElement) => {
      if (metaDone.current) return;
      metaDone.current = true;
      const d = finite(v.duration);
      setDuration(d);
      v.playbackRate = rate;
      if (startAt > 0 && startAt < d - 3) {
        v.currentTime = startAt;
        setTime(startAt);
        progress.seeked(startAt);
        showResumed();
      }
    },
    [rate, startAt, progress, showResumed],
  );
  useEffect(() => {
    const v = video.current;
    if (native && v && v.readyState >= 1) onMeta(v);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [native]);

  // Fullscreen state
  useEffect(() => {
    const on = () => setFullscreen(document.fullscreenElement === frameWrap.current);
    document.addEventListener("fullscreenchange", on);
    return () => document.removeEventListener("fullscreenchange", on);
  }, []);
  const toggleFullscreen = useCallback(() => {
    const el = frameWrap.current;
    if (!el) return;
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});
    else if (el.requestFullscreen) void el.requestFullscreen().catch(() => {});
    else {
      // iPhone Safari: only the video element itself can go full screen.
      const v = video.current as (HTMLVideoElement & { webkitEnterFullscreen?: () => void }) | null;
      v?.webkitEnterFullscreen?.();
    }
  }, []);

  const toggleMute = useCallback(() => {
    if (!video.current) return;
    video.current.muted = !video.current.muted;
    setMuted(video.current.muted);
  }, []);

  const chooseCaptions = useCallback((v: string) => {
    if (v === "off") {
      setCcOn(false);
      store("tib:video:cc", "off");
    } else {
      setCcOn(true);
      setLang(v as CaptionLang);
      store("tib:video:cc", v);
    }
  }, []);
  const toggleCaptions = useCallback(() => {
    if (!lang) return;
    chooseCaptions(ccOn ? "off" : lang);
  }, [ccOn, lang, chooseCaptions]);
  const toggleTranscript = useCallback(() => {
    setTranscriptOpen((v) => {
      store("tib:video:transcript", v ? "0" : "1");
      return !v;
    });
  }, []);

  // ── Keyboard shortcuts (while focus is in the player area) ────────────────
  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (el.closest("input, textarea, select, [contenteditable=true]")) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key;
      const onButton = el.tagName === "BUTTON" || el.getAttribute("role") === "button";
      let handled = true;
      if (k === " " || k === "k" || k === "K") {
        if (onButton && k === " ") return;
        toggle();
      } else if (k === "ArrowLeft") seek(time - 5);
      else if (k === "ArrowRight") seek(time + 5);
      else if (k === "j" || k === "J") seek(time - 10);
      else if (k === "l" || k === "L") seek(time + 10);
      else if ((k === "ArrowUp" || k === "ArrowDown") && native && video.current) {
        const v = Math.max(0, Math.min(1, video.current.volume + (k === "ArrowUp" ? 0.1 : -0.1)));
        video.current.volume = v;
        setVolume(v);
      } else if (k === "m" || k === "M") toggleMute();
      else if (k === "f" || k === "F") toggleFullscreen();
      else if (k === "c" || k === "C") toggleCaptions();
      else if (k === "t" || k === "T") toggleTranscript();
      else if (k === ">" || k === "<") {
        const i = SPEEDS.indexOf(rate);
        const next = SPEEDS[Math.max(0, Math.min(SPEEDS.length - 1, (i < 0 ? 1 : i) + (k === ">" ? 1 : -1)))];
        setRate(next);
        setToast({ text: t("video.speedToast", { rate: String(next) }) });
      } else if (/^[0-9]$/.test(k) && duration > 0) seek((duration * Number(k)) / 10);
      else if (k === "?") setHelpOpen((v) => !v);
      else if (k === "Escape" && helpOpen) setHelpOpen(false);
      else handled = false;
      if (handled) e.preventDefault();
    },
    [toggle, seek, time, native, toggleMute, toggleFullscreen, toggleCaptions, toggleTranscript, rate, setRate, duration, helpOpen, t],
  );

  if (!source) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="block rounded-2xl border border-[var(--border)] bg-white p-6 text-sm font-semibold text-[var(--blue2)] underline"
      >
        {t("video.openExternal")}
      </a>
    );
  }

  const chapterIdx = chapterAt(chapters, time);
  const seenPct = Math.round(coverageShare(progress.coverage) * 100);

  return (
    <section
      ref={root}
      aria-label={t("video.region", { title })}
      onKeyDown={onKeyDown}
      className="video-player rounded-2xl border border-[var(--border)] bg-white"
      data-video-kind={source.kind}
    >
      {/* ── Frame ───────────────────────────────────────────────────────── */}
      <div
        ref={frameWrap}
        className={`group relative w-full overflow-hidden bg-black ${fullscreen ? "flex h-full items-center" : "rounded-t-2xl"}`}
        style={fullscreen ? undefined : { aspectRatio: "16 / 9" }}
      >
        {native ? (
          <video
            ref={video}
            src={hlsUnsupported || sources?.length ? undefined : source.src}
            preload="metadata"
            playsInline
            className="h-full w-full bg-black"
            onClick={toggle}
            onLoadedMetadata={(e) => onMeta(e.currentTarget)}
            onDurationChange={(e) => setDuration(finite(e.currentTarget.duration))}
            onTimeUpdate={(e) => {
              const v = e.currentTarget;
              setTime(v.currentTime);
              progress.tick(v.currentTime, finite(v.duration) || null, !v.paused);
            }}
            onSeeked={(e) => setTime(e.currentTarget.currentTime)}
            onPlay={() => {
              setPaused(false);
              setStarted(true);
            }}
            onPause={() => {
              setPaused(true);
              progress.flush();
            }}
            onEnded={() => {
              setPaused(true);
              progress.tick(duration, duration, false);
              progress.flush();
            }}
            onRateChange={(e) => setRateState(e.currentTarget.playbackRate)}
            onVolumeChange={(e) => {
              setMuted(e.currentTarget.muted);
              setVolume(e.currentTarget.volume);
            }}
            // React re-dispatches a <source>'s error to the <video>: only the video's own counts here.
            onError={(e) => {
              if (e.target === e.currentTarget) setFailed(true);
            }}
            aria-label={t("video.title", { title })}
          >
            {sources?.map((x, i) => (
              // The last source failing means none could play.
              <source key={x.src} src={x.src} type={x.type} onError={i === sources.length - 1 ? () => setFailed(true) : undefined} />
            ))}
          </video>
        ) : (
          <iframe
            ref={iframe}
            src={iframeSrc}
            title={t("video.title", { title })}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            loading="lazy"
            onLoad={() => bridge.subscribe()}
            className="absolute inset-0 h-full w-full"
          />
        )}

        {/* Captions overlay (ours, so they work the same on every host) */}
        {cueIdx >= 0 && (
          <div
            className={`pointer-events-none absolute inset-x-0 flex justify-center px-4 ${native ? "bottom-16" : "bottom-[14%]"}`}
            aria-hidden="true"
          >
            <p
              data-testid="video-caption"
              className="max-w-[90%] whitespace-pre-line rounded bg-black/75 px-3 py-1 text-center text-sm font-medium leading-snug text-white sm:text-lg"
            >
              {cues[cueIdx].text}
            </p>
          </div>
        )}

        {/* Big play button before the first play (native only) */}
        {native && !started && !failed && !hlsUnsupported && (
          <button
            type="button"
            onClick={play}
            aria-label={t("video.play")}
            className="absolute inset-0 m-auto flex h-16 w-16 items-center justify-center rounded-full text-white shadow-lg transition-transform hover:scale-105 focus-visible:outline focus-visible:outline-4 focus-visible:outline-white"
            style={{ background: accentColor }}
          >
            <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          </button>
        )}

        {(failed || hlsUnsupported) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/85 p-6 text-center text-sm text-white">
            <p className="font-semibold">{hlsUnsupported ? t("video.hlsUnsupported") : t("video.cantPlay")}</p>
            <a href={source.src} target="_blank" rel="noopener noreferrer" className="underline">
              {t("video.openDirect")}
            </a>
          </div>
        )}

        {toast && (
          <div role="status" className="absolute left-3 top-3 flex items-center gap-3 rounded-lg bg-black/80 px-3 py-2 text-xs font-semibold text-white">
            <span>{toast.text}</span>
            {toast.restart && (
              <button
                type="button"
                onClick={() => {
                  seek(0);
                  setToast(null);
                }}
                className="rounded bg-white/20 px-2 py-0.5 hover:bg-white/30"
              >
                {t("video.startOver")}
              </button>
            )}
          </div>
        )}

        {/* Native controls */}
        {native && !failed && !hlsUnsupported && (
          <div
            className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-3 pb-2 pt-8 transition-opacity ${
              paused ? "opacity-100" : "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100"
            }`}
          >
            <SeekBar time={time} duration={duration} chapters={chapters} onSeek={seek} accentColor={accentColor} label={t("video.seek")} />
            <div className="mt-1.5 flex items-center gap-1 text-white">
              <CtrlButton label={paused ? t("video.play") : t("video.pause")} onClick={toggle}>
                {paused ? <path d="M8 5v14l11-7z" /> : <path d="M6 5h4v14H6zM14 5h4v14h-4z" />}
              </CtrlButton>
              <CtrlButton label={t("video.back10")} onClick={() => seek(time - 10)}>
                <path d="M12 5V1L7 6l5 5V7a6 6 0 1 1-6 6H4a8 8 0 1 0 8-8z" />
              </CtrlButton>
              <CtrlButton label={t("video.forward10")} onClick={() => seek(time + 10)}>
                <path d="M12 5V1l5 5-5 5V7a6 6 0 1 0 6 6h2a8 8 0 1 1-8-8z" />
              </CtrlButton>
              <CtrlButton label={muted || volume === 0 ? t("video.unmute") : t("video.mute")} onClick={toggleMute}>
                {muted || volume === 0 ? (
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.6 3 2.7-2.7-1.4-1.4-2.7 2.7-2.7-2.7-1.4 1.4 2.7 2.7-2.7 2.7 1.4 1.4 2.7-2.7 2.7 2.7 1.4-1.4z" />
                ) : (
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 8v8a4.5 4.5 0 0 0 2.5-4z" />
                )}
              </CtrlButton>
              <span className="ml-1 font-mono text-xs tabular-nums" aria-hidden="true">
                {formatTime(time)} / {formatTime(duration)}
              </span>
              <span className="flex-1" />
              {langs.length > 0 && (
                <button
                  type="button"
                  onClick={toggleCaptions}
                  aria-pressed={ccOn}
                  aria-label={t("video.captions")}
                  className={`rounded px-1.5 py-0.5 text-[11px] font-black ${ccOn ? "bg-white text-black" : "border border-white/70 text-white"}`}
                >
                  CC
                </button>
              )}
              <CtrlButton label={fullscreen ? t("video.exitFullscreen") : t("video.fullscreen")} onClick={toggleFullscreen}>
                {fullscreen ? (
                  <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z" />
                ) : (
                  <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
                )}
              </CtrlButton>
            </div>
          </div>
        )}
      </div>

      {/* ── Toolbar ─────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-[var(--border)] px-3 py-2.5 text-xs text-[var(--ink2)] sm:px-4">
        {progress.watched ? (
          <span data-testid="video-watched" className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 font-bold text-green-700">
            ✓ {t("video.watched")}
          </span>
        ) : lessonId && seenPct > 0 ? (
          <span className="text-[var(--ink3)]">{t("video.seenPct", { n: seenPct })}</span>
        ) : null}
        {chapterIdx >= 0 && (
          <span className="min-w-0 max-w-full truncate font-semibold text-[var(--ink)]" aria-live="off">
            {chapters[chapterIdx].title}
          </span>
        )}
        <span className="flex-1" />
        <label className="inline-flex items-center gap-1">
          <span className="text-[var(--ink3)]">{t("video.speed")}</span>
          <select
            value={String(rate)}
            onChange={(e) => setRate(Number(e.target.value))}
            className="rounded-md border border-[var(--border)] bg-white px-1.5 py-1 text-xs font-semibold text-[var(--ink)]"
            data-testid="video-speed"
          >
            {SPEEDS.map((s) => (
              <option key={s} value={String(s)}>
                {s === 1 ? t("video.speedNormal") : `${s}×`}
              </option>
            ))}
          </select>
        </label>
        {langs.length > 0 && (
          <label className="inline-flex items-center gap-1">
            <span className="text-[var(--ink3)]">{t("video.captions")}</span>
            <select
              value={ccOn && lang ? lang : "off"}
              onChange={(e) => chooseCaptions(e.target.value)}
              className="rounded-md border border-[var(--border)] bg-white px-1.5 py-1 text-xs font-semibold text-[var(--ink)]"
              data-testid="video-cc"
            >
              <option value="off">{t("video.captionsOff")}</option>
              {langs.map((l) => (
                <option key={l} value={l}>
                  {LANG_LABEL[l]}
                </option>
              ))}
            </select>
          </label>
        )}
        {langs.length > 0 && (
          <button
            type="button"
            onClick={toggleTranscript}
            aria-expanded={transcriptOpen}
            className="rounded-md border border-[var(--border)] px-2 py-1 font-semibold text-[var(--ink)] hover:bg-[var(--s2)]"
          >
            {transcriptOpen ? t("video.hideTranscript") : t("video.showTranscript")}
          </button>
        )}
        <button
          type="button"
          onClick={() => setHelpOpen((v) => !v)}
          aria-expanded={helpOpen}
          aria-label={t("video.shortcuts")}
          title={t("video.shortcuts")}
          className="hidden h-7 w-7 items-center justify-center rounded-md border border-[var(--border)] font-bold text-[var(--ink)] hover:bg-[var(--s2)] sm:inline-flex"
        >
          ?
        </button>
      </div>

      {helpOpen && (
        <div className="border-t border-[var(--border)] bg-[var(--s2)] px-4 py-3 text-xs text-[var(--ink2)]">
          <p className="mb-2 font-bold text-[var(--ink)]">{t("video.shortcuts")}</p>
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 sm:grid-cols-[auto_1fr_auto_1fr]">
            {(
              [
                ["Space / K", "video.key.play"],
                ["← / →", "video.key.seek5"],
                ["J / L", "video.key.seek10"],
                ["< / >", "video.key.speed"],
                ["C", "video.key.captions"],
                ["T", "video.key.transcript"],
                ["F", "video.key.fullscreen"],
                ["M", "video.key.mute"],
                ["0-9", "video.key.jump"],
                ["?", "video.key.help"],
              ] as const
            ).map(([k, label]) => (
              <div key={k} className="contents">
                <dt>
                  <kbd className="rounded border border-[var(--border)] bg-white px-1.5 py-0.5 font-mono text-[11px]">{k}</kbd>
                </dt>
                <dd>{t(label)}</dd>
              </div>
            ))}
          </dl>
          {!native && <p className="mt-2 text-[var(--ink3)]">{t("video.key.embedNote")}</p>}
        </div>
      )}

      {/* ── Chapters and transcript ─────────────────────────────────────── */}
      {(chapters.length > 0 || (transcriptOpen && cues.length > 0)) && (
        <div className={`grid gap-0 border-t border-[var(--border)] ${chapters.length > 0 && transcriptOpen && cues.length > 0 ? "md:grid-cols-2" : ""}`}>
          {chapters.length > 0 && (
            <VideoChapters chapters={chapters} current={chapterIdx} onSeek={seek} accentColor={accentColor} duration={duration} />
          )}
          {transcriptOpen && cues.length > 0 && (
            <VideoTranscript
              cues={cues}
              time={time}
              onSeek={seek}
              accentColor={accentColor}
              langLabel={lang ? LANG_LABEL[lang] : ""}
              bordered={chapters.length > 0}
            />
          )}
        </div>
      )}
    </section>
  );
}

/** Some files (live recordings, fragmented MP4) report Infinity or NaN at first. */
function finite(n: number): number {
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function CtrlButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
    >
      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
        {children}
      </svg>
    </button>
  );
}

function SeekBar({
  time,
  duration,
  chapters,
  onSeek,
  accentColor,
  label,
}: {
  time: number;
  duration: number;
  chapters: Chapter[];
  onSeek: (t: number) => void;
  accentColor: string;
  label: string;
}) {
  const bar = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<number | null>(null);
  const dragging = useRef(false);
  const at = (clientX: number) => {
    const r = bar.current?.getBoundingClientRect();
    if (!r || !duration) return 0;
    return Math.max(0, Math.min(1, (clientX - r.left) / r.width)) * duration;
  };
  const pct = duration > 0 ? (time / duration) * 100 : 0;
  const hoverChapter = hover !== null ? chapterAt(chapters, hover) : -1;
  return (
    <div
      ref={bar}
      role="slider"
      tabIndex={0}
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={Math.round(duration)}
      aria-valuenow={Math.round(time)}
      aria-valuetext={`${formatTime(time)} / ${formatTime(duration)}`}
      className="relative flex h-4 cursor-pointer items-center"
      onPointerDown={(e) => {
        dragging.current = true;
        e.currentTarget.setPointerCapture(e.pointerId);
        onSeek(at(e.clientX));
      }}
      onPointerMove={(e) => {
        setHover(at(e.clientX));
        if (dragging.current) onSeek(at(e.clientX));
      }}
      onPointerUp={() => (dragging.current = false)}
      onPointerLeave={() => setHover(null)}
    >
      <div className="relative h-1 w-full overflow-hidden rounded-full bg-white/30">
        <div className="absolute inset-y-0 left-0" style={{ width: `${pct}%`, background: accentColor }} />
      </div>
      {duration > 0 &&
        chapters
          .filter((c) => c.time > 0)
          .map((c) => (
            <span key={c.time} className="absolute top-1/2 h-2 w-0.5 -translate-y-1/2 bg-white/80" style={{ left: `${(c.time / duration) * 100}%` }} aria-hidden="true" />
          ))}
      <span
        className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow"
        style={{ left: `${pct}%` }}
        aria-hidden="true"
      />
      {hover !== null && duration > 0 && (
        <span
          className="pointer-events-none absolute bottom-5 -translate-x-1/2 whitespace-nowrap rounded bg-black/90 px-2 py-0.5 text-[11px] text-white"
          style={{ left: `${Math.min(92, Math.max(8, (hover / duration) * 100))}%` }}
          aria-hidden="true"
        >
          {formatTime(hover)}
          {hoverChapter >= 0 ? ` · ${chapters[hoverChapter].title}` : ""}
        </span>
      )}
    </div>
  );
}

