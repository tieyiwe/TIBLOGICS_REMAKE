import type { Chapter } from "./shared";

// Timing for generated narrated videos: where each scene starts and ends in
// the finished video (from the measured narration audio), the chapters, and
// WebVTT captions split into short cues of at most two lines. Pure functions,
// no Node imports.

export interface SceneTiming {
  /** Scene start in the video, seconds. */
  start: number;
  /** Narration starts (after the short lead-in silence). */
  speechStart: number;
  /** Narration ends (before the tail pause). */
  speechEnd: number;
  /** Scene end (= next scene's start). */
  end: number;
}

/** Lead-in silence before each scene's narration, and the pause after it. */
export const LEAD_SEC = 0.25;
export const TAIL_SEC = 0.4;

/** Scene timings from the length of each scene's speech (seconds, without padding). */
export function sceneTimings(speechSeconds: number[]): SceneTiming[] {
  const out: SceneTiming[] = [];
  let t = 0;
  for (const s of speechSeconds) {
    const len = LEAD_SEC + Math.max(0, s) + TAIL_SEC;
    out.push({ start: t, speechStart: t + LEAD_SEC, speechEnd: t + LEAD_SEC + Math.max(0, s), end: t + len });
    t += len;
  }
  return out;
}

/** Scene timings from measured audio: speech length and padded scene length. */
export function timingsFrom(parts: Array<{ speech: number; total: number }>): SceneTiming[] {
  const out: SceneTiming[] = [];
  let t = 0;
  for (const p of parts) {
    const speechStart = t + LEAD_SEC;
    out.push({ start: t, speechStart, speechEnd: Math.min(t + p.total, speechStart + p.speech), end: t + p.total });
    t += p.total;
  }
  return out;
}

export function sceneChapters(titles: string[], timings: SceneTiming[]): Chapter[] {
  return titles.map((title, i) => ({ time: i === 0 ? 0 : Math.round(timings[i].start * 10) / 10, title: title.slice(0, 120) }));
}

const MAX_LINE = 42;
const MAX_CUE = MAX_LINE * 2;

/** Wraps text into lines of at most `max` characters (a word longer than that keeps its own line). */
function wrap(text: string, max = MAX_LINE): string[] {
  const lines: string[] = [];
  let cur = "";
  for (const w of text.split(/\s+/).filter(Boolean)) {
    if (cur && cur.length + 1 + w.length > max) {
      lines.push(cur);
      cur = w;
    } else cur = cur ? `${cur} ${w}` : w;
  }
  if (cur) lines.push(cur);
  return lines;
}

/**
 * Narration as caption cues: one sentence per cue when it fits on two lines,
 * longer sentences cut at word boundaries into balanced pieces.
 */
export function splitCues(narration: string): string[] {
  const clean = narration.replace(/\s+/g, " ").trim();
  if (!clean) return [];
  const sentences = clean.split(/(?<=[.!?:;»"])\s+(?=\S)/);
  const out: string[] = [];
  for (const s of sentences) {
    if (s.length <= MAX_CUE) {
      out.push(s);
      continue;
    }
    // Prefer clause breaks (after commas), merged while they fit; a clause
    // still too long is cut into roughly equal pieces at word boundaries.
    const clauses = s.split(/(?<=[,;])\s+/);
    let cur = "";
    const flush = () => {
      if (cur) out.push(cur);
      cur = "";
    };
    for (const c of clauses) {
      const next = cur ? `${cur} ${c}` : c;
      if (next.length <= MAX_CUE) {
        cur = next;
        continue;
      }
      flush();
      if (c.length <= MAX_CUE) {
        cur = c;
        continue;
      }
      const n = Math.ceil(c.length / MAX_CUE);
      const target = c.length / n;
      for (const w of c.split(" ")) {
        const nx = cur ? `${cur} ${w}` : w;
        if (cur && (nx.length > MAX_CUE || cur.length >= target)) {
          out.push(cur);
          cur = w;
        } else cur = nx;
      }
    }
    flush();
  }
  return out;
}

/** The cue text laid out on at most two lines. */
function cueLines(text: string): string {
  if (text.length <= MAX_LINE) return text;
  // Two balanced lines: the break nearest the middle that keeps both short enough.
  const mid = text.length / 2;
  let best = -1;
  for (let i = text.indexOf(" "); i >= 0; i = text.indexOf(" ", i + 1)) {
    if (i <= MAX_LINE && text.length - i - 1 <= MAX_LINE && (best < 0 || Math.abs(i - mid) < Math.abs(best - mid))) best = i;
  }
  if (best > 0) return `${text.slice(0, best)}\n${text.slice(best + 1)}`;
  const lines = wrap(text);
  if (lines.length <= 2) return lines.join("\n");
  // Should not happen after splitCues, but never emit more than two lines.
  const half = Math.ceil(text.length / 2);
  const cut = text.lastIndexOf(" ", half);
  return cut > 0 ? `${text.slice(0, cut)}\n${text.slice(cut + 1)}` : text;
}

function stamp(sec: number): string {
  const ms = Math.max(0, Math.round(sec * 1000));
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);
  const r = ms % 1000;
  const p = (n: number, w = 2) => String(n).padStart(w, "0");
  return `${p(h)}:${p(m)}:${p(s)}.${p(r, 3)}`;
}

/**
 * WebVTT for a video from each scene's narration (in any language) and the
 * scene timings measured from the voice-over. Within a scene, cue times are
 * shared out by length across the time the narrator speaks.
 */
export function buildVtt(narrations: string[], timings: SceneTiming[]): string {
  const parts = ["WEBVTT", ""];
  let n = 0;
  narrations.forEach((text, i) => {
    const tm = timings[i];
    if (!tm) return;
    const cues = splitCues(text);
    if (!cues.length) return;
    const total = cues.reduce((a, c) => a + c.length + 8, 0);
    const span = Math.max(0.5, tm.speechEnd - tm.speechStart);
    let t = tm.speechStart;
    cues.forEach((c, j) => {
      const len = (span * (c.length + 8)) / total;
      const end = j === cues.length - 1 ? tm.speechEnd : t + len;
      const body = cueLines(c).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      parts.push(String(++n), `${stamp(t)} --> ${stamp(Math.max(end, t + 0.3))}`, body, "");
      t = end;
    });
  });
  return parts.join("\n");
}
