"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Eye, EyeOff, Plus, Save, Trash2, Upload, Video, X } from "lucide-react";
import VideoPlayer from "../VideoPlayer";
import ScriptStudio from "./ScriptStudio";
import {
  CAPTION_LANGS,
  formatTime,
  parseChapterLines,
  parseClock,
  parseVideoUrl,
  parseVtt,
  srtToVtt,
  videoUrlProblem,
  type CaptionLang,
  type Chapter,
} from "@/lib/learn/video/shared";

// The lesson editor's Video section (staff only, English like the rest of the
// admin): the link, chapters, captions per language, a live preview, and the
// script and storyboard generator underneath.

const inputCls =
  "w-full px-3 py-2 border border-[#D2DCE8] rounded-lg text-sm font-dm text-[#0D1B2A] bg-white placeholder:text-[#7A8FA6] focus:outline-none focus:ring-2 focus:ring-[#2251A3]/20 focus:border-[#2251A3]";
const labelCls = "block font-dm text-xs font-semibold text-[#3A4A5C] mb-1";
const btn = "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-dm font-semibold disabled:opacity-50";
const btnPrimary = `${btn} bg-[#1B3A6B] text-white hover:bg-[#2251A3]`;
const btnGhost = `${btn} text-[#2251A3] hover:bg-[#EBF0FA]`;
const btnDanger = `${btn} text-red-600 hover:bg-red-50`;

const LANG_NAME: Record<CaptionLang, string> = { en: "English", fr: "French" };
const KIND_NAME = { youtube: "YouTube (privacy-enhanced)", vimeo: "Vimeo (do not track)", file: "Video file", hls: "HLS stream" } as const;

interface Row {
  key: number;
  time: string;
  title: string;
}

let rowKey = 0;
const toRows = (c: Chapter[]): Row[] => c.map((x) => ({ key: ++rowKey, time: formatTime(x.time), title: x.title }));

export default function VideoAdmin({ lessonId, lessonTitle, initialUrl }: { lessonId: string; lessonTitle: string; initialUrl: string }) {
  const [loaded, setLoaded] = useState(false);
  const [url, setUrl] = useState(initialUrl);
  const [rows, setRows] = useState<Row[]>([]);
  const [captions, setCaptions] = useState<Record<CaptionLang, string>>({ en: "", fr: "" });
  const [tab, setTab] = useState<CaptionLang>("en");
  const [paste, setPaste] = useState<string | null>(null);
  const [preview, setPreview] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [savedUrl, setSavedUrl] = useState(initialUrl);
  const file = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let live = true;
    fetch(`/api/admin/learn/video?lessonId=${encodeURIComponent(lessonId)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!live || !d) return;
        setUrl(d.videoUrl ?? "");
        setSavedUrl(d.videoUrl ?? "");
        setRows(toRows(d.chapters ?? []));
        setCaptions({ en: d.captions?.en ?? "", fr: d.captions?.fr ?? "" });
      })
      .finally(() => live && setLoaded(true));
    return () => {
      live = false;
    };
  }, [lessonId]);

  const touch = () => {
    setDirty(true);
    setMsg(null);
  };

  const urlProblem = videoUrlProblem(url);
  const source = parseVideoUrl(url);
  const vtt = useMemo(() => {
    const out = {} as Record<CaptionLang, ReturnType<typeof parseVtt> | null>;
    for (const l of CAPTION_LANGS) out[l] = captions[l].trim() ? parseVtt(captions[l]) : null;
    return out;
  }, [captions]);

  const chapterErrors = rows.map((r) => (r.time.trim() && parseClock(r.time) === null ? "Use m:ss" : !r.title.trim() && r.time.trim() ? "Add a title" : null));
  const chapters: Chapter[] = rows
    .map((r) => ({ time: parseClock(r.time) ?? -1, title: r.title.trim() }))
    .filter((c) => c.time >= 0 && c.title)
    .sort((a, b) => a.time - b.time);
  const firstNotZero = chapters.length > 0 && chapters[0].time !== 0;
  const capErrors = CAPTION_LANGS.filter((l) => vtt[l] && !vtt[l]!.ok);
  const canSave = !busy && dirty && !urlProblem && capErrors.length === 0 && chapterErrors.every((e) => !e);

  async function save(remove = false) {
    if (remove && !confirm("Remove the video from this lesson? Chapters and captions are kept in case you add it back.")) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/learn/video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId, videoUrl: remove ? "" : url.trim(), chapters, captions }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) return setMsg({ ok: false, text: d.error ?? "Could not save." });
      if (remove) setUrl("");
      setSavedUrl(remove ? "" : url.trim());
      setDirty(false);
      setMsg({ ok: true, text: remove ? "Video removed from the lesson." : "Video saved. Learners see it now." });
    } catch {
      setMsg({ ok: false, text: "Could not reach the server." });
    } finally {
      setBusy(false);
    }
  }

  async function onFile(f: File | undefined) {
    if (!f) return;
    if (f.size > 400_000) return setMsg({ ok: false, text: "That caption file is too large (400 KB at most)." });
    const text = await f.text();
    const v = /\.srt$/i.test(f.name) || (!/^﻿?WEBVTT/.test(text) && /^\d+\s*\r?\n\d{2}:\d{2}:\d{2},\d{3}/.test(text.trim())) ? srtToVtt(text) : text;
    setCaptions((c) => ({ ...c, [tab]: v }));
    touch();
    if (file.current) file.current.value = "";
  }

  const cur = vtt[tab];
  const lastCue = cur?.cues[cur.cues.length - 1];

  return (
    <section id="video" className="scroll-mt-20 bg-white border border-[#D2DCE8] rounded-2xl p-5 space-y-5" aria-labelledby="video-admin-h">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 id="video-admin-h" className="font-syne font-bold text-base text-[#0D1B2A] inline-flex items-center gap-2">
            <Video size={16} /> Video
          </h2>
          <p className="font-dm text-xs text-[#7A8FA6]">
            A 3 to 5 minute explainer or screen recording. Learners can switch between Video and Read; lessons without a video look exactly as before.
          </p>
        </div>
        <span className={`rounded-full px-2.5 py-0.5 font-dm text-xs font-bold ${savedUrl ? "bg-green-50 text-green-700" : "bg-[#F4F7FB] text-[#7A8FA6]"}`}>
          {savedUrl ? "Live on the lesson" : "No video yet"}
        </span>
      </div>

      {!loaded ? (
        <p className="font-dm text-sm text-[#7A8FA6]">Loading…</p>
      ) : (
        <>
          {/* Link */}
          <div>
            <label className={labelCls} htmlFor="video-url">Video link</label>
            <input
              id="video-url"
              className={inputCls}
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                touch();
              }}
              placeholder="https://www.youtube.com/watch?v=… or https://vimeo.com/… or https://…/lesson.mp4"
              aria-invalid={!!urlProblem}
              aria-describedby="video-url-help"
            />
            <p id="video-url-help" className={`font-dm text-xs mt-1 ${urlProblem ? "text-red-600" : "text-[#7A8FA6]"}`}>
              {urlProblem ??
                (source
                  ? `Recognised: ${KIND_NAME[source.kind]}.${source.kind === "hls" ? " HLS plays where the browser supports it natively (Safari, phones); an MP4 works everywhere." : ""}`
                  : "YouTube (unlisted is fine), Vimeo, or a direct https link to an .mp4, .webm or .m3u8 file. A file in this site's public folder works too: /videos/lesson.mp4")}
            </p>
          </div>

          {/* Chapters */}
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className={labelCls}>Chapters (optional, shown under the player)</span>
              <div className="flex gap-1">
                <button type="button" className={btnGhost} onClick={() => setPaste(paste === null ? rows.map((r) => `${r.time} ${r.title}`).join("\n") : null)}>
                  {paste === null ? "Paste a list" : "Cancel paste"}
                </button>
                <button
                  type="button"
                  className={btnGhost}
                  onClick={() => {
                    setRows((r) => [...r, { key: ++rowKey, time: r.length ? "" : "0:00", title: "" }]);
                    touch();
                  }}
                >
                  <Plus size={14} /> Add chapter
                </button>
              </div>
            </div>
            {paste !== null && (
              <div className="rounded-xl border border-[#2251A3]/30 bg-[#F8FAFD] p-3 space-y-2">
                <p className="font-dm text-xs text-[#3A4A5C]">One chapter per line, time first, as in a YouTube description: <code>0:00 Why this matters</code></p>
                <textarea className={`${inputCls} min-h-[120px] font-mono text-[13px]`} value={paste} onChange={(e) => setPaste(e.target.value)} />
                {(() => {
                  const p = parseChapterLines(paste);
                  return (
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        className={btnPrimary}
                        disabled={!p.chapters.length}
                        onClick={() => {
                          setRows(toRows(p.chapters));
                          setPaste(null);
                          touch();
                        }}
                      >
                        Use {p.chapters.length} chapters
                      </button>
                      {p.bad.length > 0 && <span className="font-dm text-xs text-amber-700">Skipped line {p.bad.join(", ")} (no time at the start).</span>}
                    </div>
                  );
                })()}
              </div>
            )}
            {rows.length > 0 && (
              <ul className="space-y-2 mt-2">
                {rows.map((r, i) => (
                  <li key={r.key} className="grid grid-cols-[84px_1fr_auto] gap-2 items-start">
                    <div>
                      <input
                        aria-label={`Chapter ${i + 1} time`}
                        className={`${inputCls} font-mono ${chapterErrors[i] === "Use m:ss" ? "border-red-400" : ""}`}
                        value={r.time}
                        placeholder="1:30"
                        onChange={(e) => {
                          const v = e.target.value;
                          setRows((rs) => rs.map((x) => (x.key === r.key ? { ...x, time: v } : x)));
                          touch();
                        }}
                      />
                      {chapterErrors[i] && <p className="font-dm text-[11px] text-red-600 mt-0.5">{chapterErrors[i]}</p>}
                    </div>
                    <input
                      aria-label={`Chapter ${i + 1} title`}
                      className={inputCls}
                      value={r.title}
                      placeholder="What this part covers"
                      maxLength={120}
                      onChange={(e) => {
                        const v = e.target.value;
                        setRows((rs) => rs.map((x) => (x.key === r.key ? { ...x, title: v } : x)));
                        touch();
                      }}
                    />
                    <button
                      type="button"
                      className={btnDanger}
                      aria-label={`Remove chapter ${i + 1}`}
                      onClick={() => {
                        setRows((rs) => rs.filter((x) => x.key !== r.key));
                        touch();
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {firstNotZero && <p className="font-dm text-xs text-amber-700 mt-1">Tip: start the first chapter at 0:00 so the opening has a title.</p>}
          </div>

          {/* Captions */}
          <div>
            <span className={labelCls}>Captions and transcript (WebVTT, one per language)</span>
            <div role="tablist" aria-label="Caption language" className="flex flex-wrap gap-1 border-b border-[#E6EBF1]">
              {CAPTION_LANGS.map((l) => {
                const r = vtt[l];
                return (
                  <button
                    key={l}
                    type="button"
                    role="tab"
                    aria-selected={tab === l}
                    onClick={() => setTab(l)}
                    className={`-mb-px rounded-t-lg border px-3 py-1.5 font-dm text-sm font-semibold ${
                      tab === l ? "border-[#D2DCE8] border-b-white bg-white text-[#0D1B2A]" : "border-transparent text-[#7A8FA6] hover:text-[#0D1B2A]"
                    }`}
                  >
                    {LANG_NAME[l]}{" "}
                    <span className={`ml-1 inline-block h-2 w-2 rounded-full ${!r ? "bg-[#D2DCE8]" : !r.ok ? "bg-red-500" : r.draft ? "bg-amber-500" : "bg-green-500"}`} aria-hidden="true" />
                    <span className="sr-only">{!r ? "(empty)" : !r.ok ? "(has an error)" : r.draft ? "(draft)" : "(ready)"}</span>
                  </button>
                );
              })}
            </div>
            <div className="pt-3 space-y-2">
              {cur?.draft && (
                <p className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 font-dm text-xs text-amber-900">
                  <strong>Draft captions.</strong> The timings were estimated from the script, not the recording. Play the video, adjust the times, then delete the
                  &quot;NOTE DRAFT&quot; lines.
                </p>
              )}
              <textarea
                aria-label={`${LANG_NAME[tab]} captions (WebVTT)`}
                className={`${inputCls} min-h-[180px] font-mono text-[12px] leading-5`}
                value={captions[tab]}
                onChange={(e) => {
                  const v = e.target.value;
                  setCaptions((c) => ({ ...c, [tab]: v }));
                  touch();
                }}
                placeholder={"WEBVTT\n\n00:00:00.000 --> 00:00:04.000\nFirst line of what is said.\n\n00:00:04.000 --> 00:00:08.500\nNext line."}
                spellCheck={false}
              />
              <div className="flex flex-wrap items-center gap-2">
                <input ref={file} type="file" accept=".vtt,.srt,text/vtt" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
                <button type="button" className={btnGhost} onClick={() => file.current?.click()}>
                  <Upload size={14} /> Upload .vtt or .srt
                </button>
                {captions[tab] && (
                  <button
                    type="button"
                    className={btnDanger}
                    onClick={() => {
                      setCaptions((c) => ({ ...c, [tab]: "" }));
                      touch();
                    }}
                  >
                    <X size={14} /> Clear
                  </button>
                )}
                <span className={`font-dm text-xs ${cur && !cur.ok ? "text-red-600" : "text-[#7A8FA6]"}`} role="status">
                  {!cur
                    ? "Empty. Learners can still watch; captions also give them the transcript."
                    : !cur.ok
                      ? `Line ${cur.line ?? "?"}: ${cur.error}`
                      : `${cur.cues.length} captions, up to ${formatTime(lastCue?.end ?? 0)}.`}
                </span>
              </div>
            </div>
          </div>

          {/* Preview */}
          <div>
            <button type="button" className={btnGhost} onClick={() => setPreview(!preview)} disabled={!source}>
              {preview ? <EyeOff size={14} /> : <Eye size={14} />} {preview ? "Hide preview" : "Preview as a learner"}
            </button>
            {preview && source && (
              <div className="mt-3 max-w-3xl">
                <VideoPlayer
                  key={url}
                  url={url.trim()}
                  title={lessonTitle}
                  chapters={chapters}
                  captions={Object.fromEntries(CAPTION_LANGS.filter((l) => vtt[l]?.ok).map((l) => [l, captions[l]]))}
                />
              </div>
            )}
          </div>

          {msg && <p className={`font-dm text-sm ${msg.ok ? "text-green-700" : "text-red-600"}`} role="status">{msg.text}</p>}
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" onClick={() => save()} disabled={!canSave} className={btnPrimary}>
              <Save size={14} /> {busy ? "Saving…" : "Save video"}
            </button>
            {savedUrl && (
              <button type="button" onClick={() => save(true)} disabled={busy} className={btnDanger}>
                <Trash2 size={14} /> Remove video
              </button>
            )}
            {dirty && <span className="font-dm text-xs text-amber-700">Unsaved video changes</span>}
          </div>
        </>
      )}

      <ScriptStudio
        lessonId={lessonId}
        onUseCaptions={(v) => {
          setCaptions((c) => ({ ...c, en: v }));
          setTab("en");
          touch();
        }}
        onUseChapters={(c) => {
          setRows(toRows(c));
          touch();
        }}
      />
    </section>
  );
}
