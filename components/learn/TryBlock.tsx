"use client";

import { useState } from "react";
import { useT } from "@/lib/i18n/client";

// A prompt inside a lesson that the learner can load into the practice pad
// and run. Fenced as ```try (or ```text / ```prompt) in lesson Markdown.
export const TRY_EVENT = "learn:try";

export default function TryBlock({ text }: { text: string }) {
  const t = useT();
  const [copied, setCopied] = useState(false);

  function tryIt() {
    window.dispatchEvent(new CustomEvent(TRY_EVENT, { detail: text }));
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div className="mb-4 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--s2)]">
      <pre className="overflow-x-auto whitespace-pre-wrap p-4 font-mono text-[13px] leading-relaxed text-[var(--ink)]">
        {text}
      </pre>
      <div className="flex flex-wrap items-center gap-2 border-t border-[var(--border)] bg-white px-3 py-2">
        <button
          type="button"
          onClick={tryIt}
          className="rounded-full bg-[var(--ink)] px-4 py-1.5 text-xs font-bold text-white hover:opacity-90"
        >
          ▶ {t("learn.try.button")}
        </button>
        <button
          type="button"
          onClick={copy}
          className="rounded-full border border-[var(--border)] px-3 py-1.5 text-xs font-semibold text-[var(--ink2)] hover:border-[var(--ink3)]"
        >
          {copied ? t("learn.try.copied") : t("learn.try.copy")}
        </button>
        <span className="text-xs text-[var(--ink3)]">{t("learn.try.hint")}</span>
      </div>
    </div>
  );
}
