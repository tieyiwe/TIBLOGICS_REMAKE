"use client";

import { useRef, useState } from "react";
import { useT } from "@/lib/i18n/client";

// A lesson paragraph with "Explain simpler" (app/api/learn/explain). The
// button shows on hover or focus where there is a mouse, and as a small icon
// at the end of the paragraph on touch screens. The simpler version opens in
// a soft box under the paragraph. Both are data-narrate-skip: "Listen" reads
// the lesson, not these.

export default function ExplainParagraph({
  lessonId,
  index,
  hash,
  className,
  children,
}: {
  lessonId: string;
  index: number;
  hash: string;
  className: string;
  children: React.ReactNode;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const boxId = `explain-${index}`;

  async function show() {
    if (open) return close();
    setOpen(true);
    if (text || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/learn/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId, index, hash }),
      }).catch(() => null);
      const d = res ? await res.json().catch(() => ({})) : {};
      if (res?.ok && typeof d.text === "string") setText(d.text);
      else setError(typeof d.error === "string" ? d.error : t("learn.explain.error"));
    } finally {
      setBusy(false);
    }
  }

  function close() {
    setOpen(false);
    setError(null);
    trigger.current?.focus();
  }

  return (
    <>
      <p className={`group ${className}`}>
        {children}{" "}
        <button
          ref={trigger}
          type="button"
          onClick={show}
          aria-expanded={open}
          aria-controls={open ? boxId : undefined}
          aria-label={t("learn.explain.buttonLabel")}
          title={t("learn.explain.button")}
          data-narrate-skip
          data-testid="explain-btn"
          data-explain-index={index}
          className={`inline-flex items-center gap-1 rounded-full border border-[var(--border)] bg-white px-1.5 py-0.5 align-middle text-[11px] font-semibold leading-none text-[var(--ink3)] transition-opacity hover:border-[var(--orange)] hover:text-[var(--ink)] focus-visible:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--orange)] ${
            open ? "" : "[@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100"
          }`}
        >
          <span aria-hidden="true">💡</span>
          <span className="hidden [@media(hover:hover)]:inline">{t("learn.explain.button")}</span>
        </button>
      </p>
      {open && (
        <div
          id={boxId}
          role="region"
          aria-label={t("learn.explain.title")}
          aria-busy={busy}
          data-narrate-skip
          data-testid="explain-box"
          className="-mt-2 mb-4 rounded-xl border border-[#FBD9B0] bg-[#FFF8EF] p-3 text-sm leading-relaxed text-[var(--ink2)] sm:p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--orange2)]">{t("learn.explain.title")}</p>
            <button
              type="button"
              onClick={close}
              aria-label={t("learn.explain.close")}
              data-testid="explain-close"
              className="-mr-1 -mt-1 rounded-full p-1.5 text-lg leading-none text-[var(--ink3)] hover:bg-white hover:text-[var(--ink)]"
            >
              ×
            </button>
          </div>
          <div role="status" aria-live="polite">
            {busy ? (
              <p className="mt-1 animate-pulse text-[var(--ink3)]">{t("learn.explain.loading")}</p>
            ) : error ? (
              <p className="mt-1 text-red-700">{error}</p>
            ) : text ? (
              <>
                <p className="mt-1 text-[0.9375rem] text-[var(--ink)]" data-testid="explain-text">{text}</p>
                <p className="mt-2 text-[11px] text-[var(--ink3)]">{t("learn.explain.note")}</p>
              </>
            ) : null}
          </div>
        </div>
      )}
    </>
  );
}
