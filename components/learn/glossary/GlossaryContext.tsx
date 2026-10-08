"use client";

import Link from "next/link";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { GlossEntry } from "@/lib/learn/glossary/pattern";

// Glossary pop-ups in lessons. Terms in the lesson text are underlined
// (components/learn/Markdown.tsx); clicking one opens a small panel at the
// side (a sheet at the bottom on phones) with the meaning, a link to the full
// glossary and a close button. One panel at a time; Escape closes it.

interface Ctx {
  entries: GlossEntry[];
  open: (id: string) => void;
}
const GlossaryCtx = createContext<Ctx | null>(null);
export const useGlossary = () => useContext(GlossaryCtx);

export interface GlossaryLabels {
  heading: string;
  close: string;
  more: string;
  /** The lesson sidebar link to the full glossary. */
  nav?: string;
}

export function GlossaryProvider({ entries, labels, children }: { entries: GlossEntry[]; labels: GlossaryLabels; children: React.ReactNode }) {
  const [current, setCurrent] = useState<string | null>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const recorded = useRef(new Set<string>());
  const open = useCallback((id: string) => {
    opener.current = document.activeElement as HTMLElement | null;
    setCurrent(id);
    // The term joins the learner's Daily Review as a glossary card
    // (lib/learn/glossary/review.ts). Once per term per page; never blocks.
    if (!recorded.current.has(id)) {
      recorded.current.add(id);
      void fetch("/api/learn/glossary/seen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ termId: id }),
      }).catch(() => {});
    }
  }, []);
  const close = useCallback(() => {
    setCurrent(null);
    opener.current?.focus?.();
  }, []);
  useEffect(() => {
    if (!current) return;
    closeBtn.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [current, close]);
  const value = useMemo(() => ({ entries, open }), [entries, open]);
  const entry = current ? entries.find((e) => e.id === current) : null;

  return (
    <GlossaryCtx.Provider value={value}>
      {children}
      {entry && (
        <aside
          role="dialog"
          aria-modal="false"
          aria-labelledby="gloss-term-title"
          data-testid="glossary-panel"
          data-narrate-skip
          className="fixed inset-x-3 bottom-3 z-[70] rounded-2xl border border-[var(--border)] bg-white p-4 shadow-2xl sm:inset-x-auto sm:bottom-6 sm:right-6 sm:w-80"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--orange2)]">{labels.heading}</p>
              <h2 id="gloss-term-title" className="mt-0.5 text-base font-black text-[var(--ink)]">{entry.term}</h2>
            </div>
            <button
              ref={closeBtn}
              type="button"
              onClick={close}
              aria-label={labels.close}
              className="-mr-1 -mt-1 rounded-full p-1.5 text-lg leading-none text-[var(--ink3)] hover:bg-[var(--s2)] hover:text-[var(--ink)]"
            >
              ×
            </button>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-[var(--ink2)]">{entry.def}</p>
          <Link href={`/learning-box/glossary#${entry.id}`} className="mt-3 inline-block text-sm font-bold text-[var(--blue2)] underline underline-offset-2">
            {labels.more} →
          </Link>
        </aside>
      )}
    </GlossaryCtx.Provider>
  );
}

/** A term in the lesson text: underlined, opens the panel. */
export function GlossTerm({ id, children }: { id: string; children: React.ReactNode }) {
  const g = useGlossary();
  if (!g) return <>{children}</>;
  return (
    <button
      type="button"
      onClick={() => g.open(id)}
      className="cursor-help rounded-sm text-left underline decoration-[var(--orange)] decoration-dotted decoration-2 underline-offset-4 hover:bg-[#FFF3E6] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--orange)]"
      data-gloss={id}
    >
      {children}
    </button>
  );
}
