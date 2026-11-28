// Lesson video helpers shared by the browser and the server: URL parsing and
// validation, chapters, WebVTT parsing and validation, and the draft captions
// built from a video script. No database or Node imports here.

export const CAPTION_LANGS = ["en", "fr"] as const;
export type CaptionLang = (typeof CAPTION_LANGS)[number];

export interface Chapter {
  /** Seconds from the start. */
  time: number;
  title: string;
}

export type Captions = Partial<Record<CaptionLang, string>>;

export interface VideoSource {
  kind: "youtube" | "vimeo" | "file" | "hls";
  /** The embed URL (youtube/vimeo) or the media URL (file/hls). */
  src: string;
  /** Provider id for embeds. */
  id?: string;
}

/** What a lesson page hands the player. */
export interface LessonVideoData {
  url: string;
  chapters: Chapter[];
  captions: Captions;
  /** Saved position in seconds (0 when none). */
  resumeAt: number;
  /** Parts already seen ("0"/"1" buckets). */
  coverage: string;
  watched: boolean;
  /** Learners cannot skip ahead until watched; false for the owner (checking content). */
  noSkip?: boolean;
  /** Generated narrated video: the files to offer, best first (MP4 then WebM). */
  sources?: Array<{ src: string; type: string }>;
  /** Generated narrated video: the language the AI voice speaks. */
  voiceLang?: CaptionLang;
}

export const LIMITS = {
  url: 500,
  chapters: 40,
  chapterTitle: 120,
  /** Characters of WebVTT per language (about 2 hours of dense speech). */
  vtt: 200_000,
};

/**
 * Watched once this share of the video has been seen (by coverage, not
 * position): in practice, played to the end. Learners cannot skip ahead of
 * what they have seen until then (VideoPlayer noSkip).
 */
export const WATCHED_SHARE = 0.95;
/** Coverage is kept as this many buckets ("0"/"1"), each a slice of the video. */
export const COVERAGE_BUCKETS = 100;

const YT_HOSTS = new Set(["youtube.com", "m.youtube.com", "youtube-nocookie.com", "music.youtube.com"]);

/** Recognise a supported video link. Null when it is not one. */
export function parseVideoUrl(raw: string): VideoSource | null {
  const url = raw.trim();
  if (!url) return null;
  // Self-hosted files on this site (public/ folder): "/videos/intro.mp4".
  if (url.startsWith("/") && !url.startsWith("//")) {
    const path = url.split(/[?#]/)[0];
    if (/\.m3u8$/i.test(path)) return { kind: "hls", src: url };
    if (/\.(mp4|webm|m4v)$/i.test(path)) return { kind: "file", src: url };
    return null;
  }
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return null;
  }
  if (u.protocol !== "https:") return null;
  const host = u.hostname.toLowerCase().replace(/^www\./, "");

  if (YT_HOSTS.has(host) || host === "youtu.be") {
    let id: string | null = null;
    if (host === "youtu.be") id = u.pathname.slice(1).split("/")[0] || null;
    else if (u.pathname === "/watch") id = u.searchParams.get("v");
    else {
      const m = /^\/(?:embed|shorts|live|v)\/([^/?#]+)/.exec(u.pathname);
      id = m?.[1] ?? null;
    }
    if (!id || !/^[A-Za-z0-9_-]{6,20}$/.test(id)) return null;
    return { kind: "youtube", id, src: `https://www.youtube-nocookie.com/embed/${id}` };
  }

  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const parts = u.pathname.split("/").filter(Boolean);
    const i = parts.findIndex((p) => /^\d{5,12}$/.test(p));
    if (i < 0) return null;
    const id = parts[i];
    // Unlisted videos carry a privacy hash: vimeo.com/123/abc or ?h=abc.
    const hash = u.searchParams.get("h") ?? (parts[i + 1] && /^[0-9a-f]{6,20}$/i.test(parts[i + 1]) ? parts[i + 1] : null);
    const q = new URLSearchParams({ dnt: "1" });
    if (hash) q.set("h", hash);
    return { kind: "vimeo", id, src: `https://player.vimeo.com/video/${id}?${q.toString()}` };
  }

  if (/\.m3u8$/i.test(u.pathname)) return { kind: "hls", src: u.toString() };
  if (/\.(mp4|webm|m4v)$/i.test(u.pathname)) return { kind: "file", src: u.toString() };
  return null;
}

/** Null when the link is acceptable, otherwise the reason (English, admin only). */
export function videoUrlProblem(raw: string): string | null {
  const url = raw.trim();
  if (!url) return null;
  if (url.length > LIMITS.url) return "The link is too long.";
  if (url.startsWith("/") && !url.startsWith("//")) {
    return parseVideoUrl(url) ? null : "A file on this site must end in .mp4, .webm or .m3u8.";
  }
  if (!/^https:\/\//i.test(url)) return "Video links must start with https://";
  if (!parseVideoUrl(url)) {
    return "Use a YouTube or Vimeo link, or a direct link to an .mp4, .webm or .m3u8 (HLS) file.";
  }
  return null;
}

// ── Time ────────────────────────────────────────────────────────────────────

/** 83 -> "1:23", 3723 -> "1:02:03". */
export function formatTime(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) sec = 0;
  const s = Math.floor(sec % 60);
  const m = Math.floor((sec / 60) % 60);
  const h = Math.floor(sec / 3600);
  const ss = String(s).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${ss}` : `${m}:${ss}`;
}

/** "1:23", "01:02:03", "83", "1:23.5" -> seconds. Null when unreadable. */
export function parseClock(raw: string): number | null {
  const v = raw.trim();
  if (!/^\d{1,3}(:\d{1,2}){0,2}(\.\d+)?$/.test(v)) return null;
  const parts = v.split(":").map(Number);
  if (parts.some((n) => !Number.isFinite(n))) return null;
  if (parts.length > 1 && parts.slice(1).some((n) => n >= 60)) return null;
  return parts.reduce((acc, n) => acc * 60 + n, 0);
}

// ── Chapters ────────────────────────────────────────────────────────────────

/** Clean a chapter list: valid entries, sorted, de-duplicated by time. */
export function normaliseChapters(input: unknown): Chapter[] {
  if (!Array.isArray(input)) return [];
  const seen = new Set<number>();
  const out: Chapter[] = [];
  for (const c of input) {
    if (!c || typeof c !== "object") continue;
    const time = Number((c as Chapter).time);
    const title = String((c as Chapter).title ?? "").trim().slice(0, LIMITS.chapterTitle);
    if (!Number.isFinite(time) || time < 0 || time > 86_400 || !title) continue;
    const t = Math.round(time * 10) / 10;
    if (seen.has(t)) continue;
    seen.add(t);
    out.push({ time: t, title });
  }
  return out.sort((a, b) => a.time - b.time).slice(0, LIMITS.chapters);
}

/** "0:00 Intro" lines (the YouTube description format) -> chapters. */
export function parseChapterLines(text: string): { chapters: Chapter[]; bad: number[] } {
  const chapters: Chapter[] = [];
  const bad: number[] = [];
  text.split(/\r?\n/).forEach((line, i) => {
    const l = line.trim();
    if (!l) return;
    const m = /^\(?(\d{1,3}(?::\d{1,2}){1,2})\)?\s*[-.:)]?\s*(.+)$/.exec(l);
    const time = m ? parseClock(m[1]) : null;
    if (!m || time === null) bad.push(i + 1);
    else chapters.push({ time, title: m[2].trim() });
  });
  return { chapters: normaliseChapters(chapters), bad };
}

/** The chapter playing at `t` (index), or -1. */
export function chapterAt(chapters: Chapter[], t: number): number {
  let idx = -1;
  for (let i = 0; i < chapters.length; i++) if (chapters[i].time <= t + 0.25) idx = i;
  return idx;
}

// ── WebVTT ──────────────────────────────────────────────────────────────────

export interface Cue {
  start: number;
  end: number;
  text: string;
}

const TS = /^(?:(\d{1,3}):)?(\d{2}):(\d{2})[.,](\d{3})$/;

function parseTs(v: string): number | null {
  const m = TS.exec(v.trim());
  if (!m) return null;
  const [, h, mm, ss, ms] = m;
  if (Number(mm) > 59 || Number(ss) > 59) return null;
  return Number(h ?? 0) * 3600 + Number(mm) * 60 + Number(ss) + Number(ms) / 1000;
}

function vttTs(sec: number): string {
  const ms = Math.round(sec * 1000);
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms / 60_000) % 60);
  const s = Math.floor((ms / 1000) % 60);
  const r = ms % 1000;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(r).padStart(3, "0")}`;
}

/** Strip the cue markup learners should not see (<v Name>, <b>, <c.x>, timestamps). */
export function cueText(raw: string): string {
  return raw
    .replace(/<\d{2}:[\d:.]+>/g, "")
    .replace(/<\/?[a-z][^>]*>/gi, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .trim();
}

export interface VttResult {
  ok: boolean;
  cues: Cue[];
  /** English, for the admin editor. */
  error?: string;
  line?: number;
  /** Has the "NOTE DRAFT" marker written by the script tool. */
  draft: boolean;
}

/** Parse and validate WebVTT. Tolerant of SRT-style comma milliseconds. */
export function parseVtt(text: string): VttResult {
  const src = text.replace(/^﻿/, "").replace(/\r\n?/g, "\n");
  const lines = src.split("\n");
  const draft = /^NOTE DRAFT\b/m.test(src);
  if (!/^WEBVTT(?:[ \t].*)?$/.test(lines[0] ?? "")) {
    return { ok: false, cues: [], error: 'The first line must be "WEBVTT".', line: 1, draft };
  }
  const cues: Cue[] = [];
  let i = 1;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i++;
      continue;
    }
    // NOTE, STYLE and REGION blocks run until a blank line.
    if (/^(NOTE|STYLE|REGION)\b/.test(line)) {
      while (i < lines.length && lines[i].trim()) i++;
      continue;
    }
    let timing = line;
    let timingLine = i + 1;
    if (!line.includes("-->")) {
      // A cue identifier, then the timing line.
      i++;
      timing = lines[i] ?? "";
      timingLine = i + 1;
      if (!timing.includes("-->")) {
        return { ok: false, cues, error: "Expected a timing line like 00:00:01.000 --> 00:00:04.000.", line: timingLine, draft };
      }
    }
    const [a, rest] = timing.split("-->");
    const start = parseTs(a);
    const end = parseTs((rest ?? "").trim().split(/\s+/)[0] ?? "");
    if (start === null || end === null) {
      return { ok: false, cues, error: "A timestamp is not in the form 00:00:01.000.", line: timingLine, draft };
    }
    if (end <= start) return { ok: false, cues, error: "A cue ends before it starts.", line: timingLine, draft };
    i++;
    const body: string[] = [];
    while (i < lines.length && lines[i].trim()) {
      if (lines[i].includes("-->")) {
        return { ok: false, cues, error: "Missing blank line between cues.", line: i + 1, draft };
      }
      body.push(lines[i]);
      i++;
    }
    const txt = cueText(body.join("\n"));
    if (txt) cues.push({ start, end, text: txt });
  }
  if (!cues.length) return { ok: false, cues, error: "No captions found.", draft };
  cues.sort((x, y) => x.start - y.start);
  return { ok: true, cues, draft };
}

/** SRT (SubRip) -> WebVTT, for owners who export .srt from their editor. */
export function srtToVtt(srt: string): string {
  const body = srt
    .replace(/^﻿/, "")
    .replace(/\r\n?/g, "\n")
    .replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, "$1.$2")
    .trim();
  return `WEBVTT\n\n${body}\n`;
}

/** The cue showing at `t`, or -1. */
export function cueAt(cues: Cue[], t: number): number {
  let lo = 0;
  let hi = cues.length - 1;
  let found = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (cues[mid].start <= t) {
      found = mid;
      lo = mid + 1;
    } else hi = mid - 1;
  }
  return found >= 0 && t < cues[found].end ? found : -1;
}

/** The last cue that started at or before `t` (for the transcript highlight). */
export function cueBefore(cues: Cue[], t: number): number {
  let found = -1;
  for (let i = 0; i < cues.length && cues[i].start <= t; i++) found = i;
  return found;
}

// ── Coverage (watched tracking) ─────────────────────────────────────────────

export function emptyCoverage(): string {
  return "0".repeat(COVERAGE_BUCKETS);
}

export function mergeCoverage(a: string, b: string): string {
  let out = "";
  for (let i = 0; i < COVERAGE_BUCKETS; i++) out += a[i] === "1" || b[i] === "1" ? "1" : "0";
  return out;
}

export function coverageShare(c: string): number {
  let n = 0;
  for (let i = 0; i < COVERAGE_BUCKETS; i++) if (c[i] === "1") n++;
  return n / COVERAGE_BUCKETS;
}

// ── Video scripts ───────────────────────────────────────────────────────────

export const SECTION_KINDS = ["hook", "point", "walkthrough", "recap", "cta"] as const;
export type SectionKind = (typeof SECTION_KINDS)[number];

export interface ScriptSection {
  kind: SectionKind;
  heading: string;
  /** What the presenter says. */
  narration: string;
  /** What to show: camera, slide, screen recording steps. */
  shots: string[];
  /** Suggested B-roll or screen captures. */
  broll: string[];
  /** Short captions or titles shown on screen. */
  onScreenText: string[];
}

export interface VideoScript {
  title: string;
  targetMinutes: number;
  sections: ScriptSection[];
  /** Notes for the presenter (setup, accounts to log into, etc.). */
  notes: string;
}

/** Spoken pace used for timing estimates (UK presenters, explainer pace). */
export const WORDS_PER_MINUTE = 150;

export function countWords(s: string): number {
  const t = s.trim();
  return t ? t.split(/\s+/).length : 0;
}

export function scriptSeconds(script: VideoScript): number {
  return Math.round(script.sections.reduce((n, s) => n + countWords(s.narration), 0) / (WORDS_PER_MINUTE / 60));
}

/** Split narration into caption-sized phrases (about 12 words, at sentence breaks). */
function phrases(text: string): string[] {
  const sentences = text
    .replace(/\s+/g, " ")
    .trim()
    .split(/(?<=[.!?])\s+/)
    .filter(Boolean);
  const out: string[] = [];
  for (const s of sentences) {
    const words = s.split(" ");
    if (words.length <= 14) {
      out.push(s);
      continue;
    }
    // Long sentence: break at commas when possible, else every ~12 words.
    let cur: string[] = [];
    for (const w of words) {
      cur.push(w);
      if ((cur.length >= 8 && /[,;:]$/.test(w)) || cur.length >= 12) {
        out.push(cur.join(" "));
        cur = [];
      }
    }
    if (cur.length) out.push(cur.join(" "));
  }
  return out;
}

/**
 * Draft WebVTT from a script, with timings estimated from the word count.
 * Marked as a draft (NOTE DRAFT) so the editor can label it until the owner
 * has adjusted the timings against the real recording.
 */
export function scriptToDraftVtt(script: VideoScript): string {
  const perWord = 60 / WORDS_PER_MINUTE;
  let t = 0.5;
  const blocks: string[] = [];
  let n = 1;
  for (const s of script.sections) {
    for (const p of phrases(s.narration)) {
      const dur = Math.max(1.5, countWords(p) * perWord);
      blocks.push(`${n++}\n${vttTs(t)} --> ${vttTs(t + dur)}\n${p}`);
      t += dur + 0.1;
    }
    t += 0.6; // a beat between sections
  }
  return [
    "WEBVTT",
    "",
    "NOTE DRAFT: timings are estimated from the script at 150 words a minute.\nPlay the recording and adjust each timing, then remove this note.",
    "",
    blocks.join("\n\n"),
    "",
  ].join("\n");
}

/** Chapters suggested by a script (estimated timings). */
export function scriptChapters(script: VideoScript): Chapter[] {
  const perWord = 60 / WORDS_PER_MINUTE;
  let t = 0;
  const out: Chapter[] = [];
  for (const s of script.sections) {
    out.push({ time: Math.round(t), title: s.heading });
    t += countWords(s.narration) * perWord + 0.6;
  }
  return normaliseChapters(out);
}
