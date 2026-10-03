"use client";

import { useEffect, useRef, useState } from "react";
import Markdown from "./Markdown";
import { TRY_EVENT } from "./TryBlock";
import { useT } from "@/lib/i18n/client";
import { bumpPractice } from "@/lib/learn/game-client";
import { markLoop } from "@/lib/learn/method/loop-client";

// Built-in AI practice pad under every lesson. "Try it" buttons in the lesson
// load their prompt here, so the learner practises without leaving the page.

/** Level-2 headings ("## ...") outside fenced code blocks, with positions. */
function h2s(md: string): Array<{ index: number; end: number; text: string }> {
  const out: Array<{ index: number; end: number; text: string }> = [];
  let fenced = false;
  let pos = 0;
  for (const line of md.split("\n")) {
    if (/^\s*```/.test(line)) fenced = !fenced;
    else if (!fenced && /^##\s/.test(line)) out.push({ index: pos, end: pos + line.length, text: line.replace(/^##\s+/, "").trim() });
    pos += line.length + 1;
  }
  return out;
}

/**
 * The lesson's "## Try it now" section, shown as the task. The heading is
 * found in the English source; in a translated body the section is the one
 * at the same position, since translation keeps the Markdown structure.
 */
function tryItNow(bodyMd: string, sourceMd?: string): string | null {
  const source = h2s(sourceMd ?? bodyMd);
  const at = source.findIndex((h) => /^try it now$/i.test(h.text));
  if (at === -1) return null;
  const target = sourceMd && sourceMd !== bodyMd ? h2s(bodyMd) : source;
  if (target.length !== source.length) return null;
  const md = sourceMd && sourceMd !== bodyMd ? bodyMd : sourceMd ?? bodyMd;
  const start = target[at].end;
  const end = target[at + 1]?.index ?? md.length;
  return md.slice(start, end).trim() || null;
}

export default function PracticePad({
  lessonId,
  bodyMd,
  sourceMd,
  accentColor,
}: {
  lessonId: string;
  bodyMd: string;
  sourceMd?: string;
  accentColor: string;
}) {
  const t = useT();
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [runs, setRuns] = useState<Array<{ prompt: string; response: string }>>([]);
  const box = useRef<HTMLElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const task = tryItNow(bodyMd, sourceMd);

  useEffect(() => {
    const onTry = (e: Event) => {
      setPrompt(String((e as CustomEvent).detail ?? ""));
      box.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      setTimeout(() => input.current?.focus(), 400);
    };
    window.addEventListener(TRY_EVENT, onTry);
    return () => window.removeEventListener(TRY_EVENT, onTry);
  }, []);

  async function run() {
    if (!prompt.trim() || busy) return;
    setBusy(true);
    setError(null);
    const res = await fetch("/api/learn/practice", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lessonId, prompt }),
    }).catch(() => null);
    const d = res ? await res.json().catch(() => ({})) : {};
    if (res?.ok && d.response) {
      setRuns((r) => [{ prompt, response: d.response }, ...r].slice(0, 5));
      // Counts toward the daily goal only: no points, no extra model call.
      bumpPractice();
      markLoop(lessonId, "try");
    }
    else setError(d.error ?? t("learn.error.tryAgain"));
    setBusy(false);
  }

  return (
    <section
      ref={box}
      aria-labelledby="pad-heading"
      className="scroll-mt-24 rounded-2xl border-2 bg-white p-6"
      style={{ borderColor: accentColor }}
    >
      <h2 id="pad-heading" className="flex items-center gap-2 text-base font-bold text-[var(--ink)]">
        <span aria-hidden="true">🧪</span> {t("learn.pad.title")}
      </h2>
      <p className="mt-1 text-sm text-[var(--ink2)]">
        {t("learn.pad.intro1")} <strong>{t("learn.pad.tryIt")}</strong> {t("learn.pad.intro2")}
      </p>
      {task && (
        <details className="mt-3 rounded-xl bg-[var(--s2)] p-3 text-sm" open>
          <summary className="cursor-pointer font-semibold text-[var(--ink)]">{t("learn.pad.task")}</summary>
          <div className="mt-2">
            <Markdown source={task} />
          </div>
        </details>
      )}
      <textarea
        ref={input}
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) run();
        }}
        rows={6}
        placeholder={t("learn.pad.placeholder")}
        aria-label={t("learn.pad.inputLabel")}
        className="mt-4 w-full rounded-xl border border-[var(--border)] p-3 font-mono text-[13px] leading-relaxed text-[var(--ink)] outline-none focus:border-[var(--ink3)]"
      />
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={run}
          disabled={busy || !prompt.trim()}
          className="rounded-full px-5 py-2 text-sm font-bold text-white disabled:opacity-50"
          style={{ background: accentColor }}
        >
          {busy ? t("learn.pad.running") : t("learn.pad.run")}
        </button>
        {prompt && (
          <button type="button" onClick={() => setPrompt("")} className="text-xs font-semibold text-[var(--ink3)] hover:text-[var(--ink)]">
            {t("learn.pad.clear")}
          </button>
        )}
        {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
      </div>
      {runs.map((r, i) => (
        <div key={runs.length - i} className="mt-5 rounded-xl border border-[var(--border)]">
          <p className="border-b border-[var(--border)] bg-[var(--s2)] px-4 py-2 text-xs text-[var(--ink3)]">
            <span className="font-semibold text-[var(--ink2)]">{t("learn.pad.youAsked")}</span> {r.prompt.length > 160 ? r.prompt.slice(0, 160) + "..." : r.prompt}
          </p>
          <div className="p-4">
            <Markdown source={r.response} />
          </div>
        </div>
      ))}
      {runs.length > 0 && (
        <p className="mt-3 text-xs text-[var(--ink3)]">
          {t("learn.pad.judge")}
        </p>
      )}
    </section>
  );
}
