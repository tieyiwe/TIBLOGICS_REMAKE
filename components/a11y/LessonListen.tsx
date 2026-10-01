"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Pause, Play, SkipBack, SkipForward, Square, Volume2 } from "lucide-react";
import { useLocale, useT } from "@/lib/i18n/client";
import { learnLocale } from "@/lib/i18n/config";
import { prefersReducedMotion } from "@/lib/a11y/reading-prefs";

// "Listen": reads the lesson aloud with the browser's own speech synthesis
// (Web Speech API, no paid TTS). It reads every element marked data-narrate
// inside the target, sentence by sentence, highlighting the sentence being
// read. Code blocks, try-it prompts, playgrounds and Studio embeds
// (data-narrate-skip) are skipped. Hidden entirely where the browser has no
// speechSynthesis.

const BLOCKS = "h1,h2,h3,h4,h5,h6,p,li,blockquote,th,td,dt,dd,figcaption";
const SKIP = "pre,[data-narrate-skip],button,textarea,select,input,nav,[aria-hidden='true'],[hidden]";
const RATES = [0.75, 1, 1.25, 1.5] as const;
const HIGHLIGHT = "tib-narration";

interface Segment {
  text: string;
  block: HTMLElement;
  range: Range | null;
}

function textNodesOf(block: HTMLElement): Text[] {
  const out: Text[] = [];
  const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) => {
      const p = n.parentElement;
      if (!p || (p !== block && p.closest(SKIP) && block.contains(p.closest(SKIP)))) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  for (let n = walker.nextNode(); n; n = walker.nextNode()) out.push(n as Text);
  return out;
}

function sentences(text: string, lang: string): Array<{ start: number; end: number }> {
  const out: Array<{ start: number; end: number }> = [];
  const Seg = (Intl as unknown as { Segmenter?: typeof Intl.Segmenter }).Segmenter;
  if (Seg) {
    for (const s of new Seg(lang, { granularity: "sentence" }).segment(text)) {
      out.push({ start: s.index, end: s.index + s.segment.length });
    }
  } else {
    const re = /[^.!?…]+[.!?…]*["»”’)]*\s*/g;
    for (let m = re.exec(text); m; m = re.exec(text)) out.push({ start: m.index, end: m.index + m[0].length });
  }
  return out;
}

/** Turns the readable blocks under `root` into sentences with DOM ranges. */
function collect(root: HTMLElement, lang: string): Segment[] {
  const marked = Array.from(root.querySelectorAll<HTMLElement>("[data-narrate]"));
  const blocks: HTMLElement[] = [];
  for (const m of marked) {
    if (m.getClientRects().length === 0) continue; // hidden (e.g. the Video tab is showing)
    const candidates = m.matches(BLOCKS) ? [m] : Array.from(m.querySelectorAll<HTMLElement>(BLOCKS));
    for (const el of candidates) {
      if (el !== m && el.closest(SKIP) && m.contains(el.closest(SKIP))) continue;
      // Outermost block only: a <p> inside an <li> is read with the <li>.
      const outer = el.parentElement?.closest(BLOCKS);
      if (outer && m.contains(outer) && outer !== el) continue;
      blocks.push(el);
    }
  }

  const segs: Segment[] = [];
  for (const block of blocks) {
    const nodes = textNodesOf(block);
    let text = "";
    const map: Array<{ node: Text; start: number }> = [];
    for (const n of nodes) {
      map.push({ node: n, start: text.length });
      text += n.data;
    }
    const locate = (offset: number) => {
      for (let i = map.length - 1; i >= 0; i--) {
        if (offset >= map[i].start) return { node: map[i].node, offset: Math.min(offset - map[i].start, map[i].node.length) };
      }
      return null;
    };
    for (const s of sentences(text, lang)) {
      const raw = text.slice(s.start, s.end);
      const spoken = raw.replace(/\s+/g, " ").trim();
      if (!/[\p{L}\p{N}]/u.test(spoken)) continue;
      // Trim trailing whitespace from the highlighted range.
      const end = s.start + raw.trimEnd().length;
      const a = locate(s.start + (raw.length - raw.trimStart().length));
      const b = locate(end);
      let range: Range | null = null;
      if (a && b) {
        try {
          range = document.createRange();
          range.setStart(a.node, a.offset);
          range.setEnd(b.node, b.offset);
        } catch {
          range = null;
        }
      }
      segs.push({ text: spoken, block, range });
    }
  }
  return segs;
}

type HighlightRegistry = { set(name: string, h: unknown): void; delete(name: string): void };
const highlights = (): HighlightRegistry | null => {
  const c = (globalThis as unknown as { CSS?: { highlights?: HighlightRegistry } }).CSS;
  return c?.highlights && typeof (globalThis as unknown as { Highlight?: unknown }).Highlight === "function" ? c.highlights : null;
};

export default function LessonListen({ targetId }: { targetId: string }) {
  const t = useT();
  const lang = learnLocale(useLocale());
  const [supported, setSupported] = useState(false);
  const [status, setStatus] = useState<"idle" | "playing" | "paused" | "done">("idle");
  const [index, setIndex] = useState(0);
  const [total, setTotal] = useState(0);
  const [rate, setRate] = useState<number>(1);
  const [noVoice, setNoVoice] = useState(false);

  const segs = useRef<Segment[]>([]);
  const gen = useRef(0); // ignores 'end' events from cancelled utterances
  const voice = useRef<SpeechSynthesisVoice | null>(null);
  const rateRef = useRef(rate);
  rateRef.current = rate;

  useEffect(() => {
    setSupported(typeof window !== "undefined" && "speechSynthesis" in window && typeof window.SpeechSynthesisUtterance === "function");
  }, []);

  // Pick a voice for the page language; voices load asynchronously in Chrome.
  useEffect(() => {
    if (!supported) return;
    const choose = () => {
      const all = window.speechSynthesis.getVoices();
      const match = all.filter((v) => v.lang.toLowerCase().startsWith(lang));
      voice.current = match.find((v) => v.localService) ?? match[0] ?? null;
      setNoVoice(all.length > 0 && match.length === 0);
    };
    choose();
    window.speechSynthesis.addEventListener?.("voiceschanged", choose);
    return () => window.speechSynthesis.removeEventListener?.("voiceschanged", choose);
  }, [supported, lang]);

  const clearMarks = useCallback(() => {
    highlights()?.delete(HIGHLIGHT);
    document.querySelectorAll("[data-narrating]").forEach((el) => el.removeAttribute("data-narrating"));
  }, []);

  const mark = useCallback(
    (s: Segment) => {
      clearMarks();
      s.block.setAttribute("data-narrating", "");
      const reg = highlights();
      if (reg && s.range) {
        const H = (globalThis as unknown as { Highlight: new (...r: Range[]) => unknown }).Highlight;
        reg.set(HIGHLIGHT, new H(s.range));
      }
      const r = s.block.getBoundingClientRect();
      if (r.top < 80 || r.bottom > window.innerHeight - 40) {
        s.block.scrollIntoView({ block: "center", behavior: prefersReducedMotion() ? "auto" : "smooth" });
      }
    },
    [clearMarks],
  );

  const speakAt = useCallback(
    (i: number) => {
      const synth = window.speechSynthesis;
      const my = ++gen.current;
      synth.cancel();
      const s = segs.current[i];
      if (!s) {
        clearMarks();
        setStatus("done");
        return;
      }
      setIndex(i);
      setStatus("playing");
      mark(s);
      const u = new SpeechSynthesisUtterance(s.text);
      u.lang = voice.current?.lang ?? (lang === "fr" ? "fr-FR" : "en-GB");
      if (voice.current) u.voice = voice.current;
      u.rate = rateRef.current;
      const next = () => {
        if (gen.current === my) speakAt(i + 1);
      };
      u.onend = next;
      u.onerror = (e) => {
        // 'interrupted' and 'canceled' come from our own cancel(); anything
        // else (no voice, engine failure) moves on rather than stalling.
        if (e.error !== "interrupted" && e.error !== "canceled") next();
      };
      synth.speak(u);
    },
    [clearMarks, lang, mark],
  );

  const start = useCallback(() => {
    const root = document.getElementById(targetId);
    if (!root) return;
    segs.current = collect(root, lang);
    setTotal(segs.current.length);
    speakAt(0);
  }, [lang, speakAt, targetId]);

  const pause = () => {
    gen.current++;
    window.speechSynthesis.cancel();
    setStatus("paused");
  };
  const stop = useCallback(() => {
    gen.current++;
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
    clearMarks();
    setStatus("idle");
    setIndex(0);
  }, [clearMarks]);

  // Stop speaking when the learner leaves the lesson.
  useEffect(() => () => stop(), [stop]);

  const active = status === "playing" || status === "paused";

  if (!supported) return null;

  const btn =
    "inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 rounded-full border border-[var(--border)] bg-white px-3 text-sm font-semibold text-[var(--ink)] hover:border-[var(--ink3)] disabled:opacity-50";

  return (
    <div
      role="group"
      aria-label={t("a11y.listen.region")}
      data-narrate-skip
      className={`mt-4 flex flex-wrap items-center gap-2 rounded-2xl border border-[var(--border)] bg-white/95 p-2 ${
        active ? "sticky top-16 z-20 shadow-md backdrop-blur" : ""
      }`}
    >
      <style>{`::highlight(${HIGHLIGHT}){background-color:#FFE08A;color:#0D1B2A}`}</style>
      {status === "playing" ? (
        <button type="button" onClick={pause} className={btn}>
          <Pause size={16} aria-hidden="true" />
          {t("a11y.listen.pause")}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => (status === "paused" ? speakAt(index) : start())}
          className={`${btn} border-[var(--blue)] bg-[var(--blue)] text-white hover:border-[var(--blue2)] hover:bg-[var(--blue2)]`}
        >
          {status === "paused" ? <Play size={16} aria-hidden="true" /> : <Volume2 size={16} aria-hidden="true" />}
          {status === "paused" ? t("a11y.listen.resume") : t("a11y.listen.play")}
        </button>
      )}

      {active && (
        <>
          <button type="button" onClick={() => speakAt(Math.max(0, index - 1))} className={btn} aria-label={t("a11y.listen.prev")} title={t("a11y.listen.prev")}>
            <SkipBack size={16} aria-hidden="true" />
          </button>
          <button type="button" onClick={() => speakAt(index + 1)} className={btn} aria-label={t("a11y.listen.next")} title={t("a11y.listen.next")}>
            <SkipForward size={16} aria-hidden="true" />
          </button>
          <button type="button" onClick={stop} className={btn} aria-label={t("a11y.listen.stop")} title={t("a11y.listen.stop")}>
            <Square size={14} aria-hidden="true" />
          </button>
        </>
      )}

      <label className="inline-flex min-h-[44px] items-center gap-2 px-1 text-sm text-[var(--ink2)]">
        <span>{t("a11y.listen.speed")}</span>
        <select
          value={rate}
          onChange={(e) => {
            const r = Number(e.target.value);
            setRate(r);
            rateRef.current = r;
            if (status === "playing") speakAt(index);
          }}
          className="min-h-[36px] rounded-lg border border-[var(--border)] bg-white px-2 text-sm text-[var(--ink)]"
        >
          {RATES.map((r) => (
            <option key={r} value={r}>
              {r.toLocaleString(lang)}×
            </option>
          ))}
        </select>
      </label>

      {active && total > 0 && (
        <span className="px-1 text-xs font-semibold text-[var(--ink2)]">{t("a11y.listen.progress", { n: index + 1, total })}</span>
      )}
      <span role="status" className="sr-only">
        {status === "done" ? t("a11y.listen.finished") : ""}
      </span>
      {status === "done" && <span className="px-1 text-xs font-semibold text-[var(--ink2)]">{t("a11y.listen.finished")}</span>}
      {active && (
        <span className="basis-full px-1 text-xs text-[var(--ink2)]">
          {t("a11y.listen.skipped")}
          {noVoice ? ` ${t("a11y.listen.noVoice")}` : ""}
        </span>
      )}
    </div>
  );
}
