"use client";

import { useEffect, useRef, useState } from "react";
import Markdown from "./Markdown";
import { TRY_EVENT } from "./TryBlock";

// Built-in AI practice pad under every lesson. "Try it" buttons in the lesson
// load their prompt here, so the learner practises without leaving the page.

/** The lesson's "## Try it now" section, shown as the task. */
function tryItNow(bodyMd: string): string | null {
  const m = /^##\s+Try it now\s*$/im.exec(bodyMd);
  if (!m) return null;
  const rest = bodyMd.slice(m.index + m[0].length);
  const end = rest.search(/^##\s/m);
  return (end === -1 ? rest : rest.slice(0, end)).trim() || null;
}

export default function PracticePad({ lessonId, bodyMd, accentColor }: { lessonId: string; bodyMd: string; accentColor: string }) {
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [runs, setRuns] = useState<Array<{ prompt: string; response: string }>>([]);
  const box = useRef<HTMLElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const task = tryItNow(bodyMd);

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
    if (res?.ok && d.response) setRuns((r) => [{ prompt, response: d.response }, ...r].slice(0, 5));
    else setError(d.error ?? "Something went wrong. Try again.");
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
        <span aria-hidden="true">🧪</span> Practice pad
      </h2>
      <p className="mt-1 text-sm text-[var(--ink2)]">
        Run prompts against a real AI model right here. Press <strong>Try it</strong> on any prompt in the lesson, or write your own.
        Don&apos;t paste personal or confidential information.
      </p>
      {task && (
        <details className="mt-3 rounded-xl bg-[var(--s2)] p-3 text-sm" open>
          <summary className="cursor-pointer font-semibold text-[var(--ink)]">Your task from this lesson</summary>
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
        placeholder="Write or paste a prompt, then press Run (Ctrl or Cmd + Enter)."
        aria-label="Practice prompt"
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
          {busy ? "Running..." : "Run"}
        </button>
        {prompt && (
          <button type="button" onClick={() => setPrompt("")} className="text-xs font-semibold text-[var(--ink3)] hover:text-[var(--ink)]">
            Clear
          </button>
        )}
        {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
      </div>
      {runs.map((r, i) => (
        <div key={runs.length - i} className="mt-5 rounded-xl border border-[var(--border)]">
          <p className="border-b border-[var(--border)] bg-[var(--s2)] px-4 py-2 text-xs text-[var(--ink3)]">
            <span className="font-semibold text-[var(--ink2)]">You asked:</span> {r.prompt.length > 160 ? r.prompt.slice(0, 160) + "..." : r.prompt}
          </p>
          <div className="p-4">
            <Markdown source={r.response} />
          </div>
        </div>
      ))}
      {runs.length > 0 && (
        <p className="mt-3 text-xs text-[var(--ink3)]">
          Now judge it: is anything wrong, vague or made up? Change one thing in your prompt and run it again to see the difference.
        </p>
      )}
    </section>
  );
}
