"use client";

import { useEffect, useRef, useState } from "react";
import { useT } from "@/lib/i18n/client";
import { TUTOR_MAX_SELECTION } from "@/lib/learn/tutor/shared";

// "Explain this": when the learner selects text in the page content, a small
// "Ask Tutor" button appears next to it and sends the selection to Tutor.
// Only selections inside <main> count, never inside Tutor itself or a form
// field, so typing an answer never pops it up.

const MIN_CHARS = 3;

export default function TutorSelectionAsk({
  panelRef,
  onAsk,
}: {
  panelRef: React.RefObject<HTMLElement | null>;
  onAsk: (text: string) => void;
}) {
  const t = useT();
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const text = useRef("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const check = () => {
      const sel = window.getSelection();
      const value = sel?.toString().replace(/\s+/g, " ").trim() ?? "";
      if (!sel || sel.rangeCount === 0 || sel.isCollapsed || value.length < MIN_CHARS) {
        setPos(null);
        return;
      }
      const node = sel.anchorNode;
      const el = node instanceof Element ? node : node?.parentElement;
      const main = document.querySelector("main");
      if (
        !el ||
        !main ||
        !main.contains(el) ||
        panelRef.current?.contains(el) ||
        el.closest("input, textarea, select, [contenteditable='true'], [data-tutor-ignore]")
      ) {
        setPos(null);
        return;
      }
      const rect = sel.getRangeAt(0).getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) {
        setPos(null);
        return;
      }
      text.current = value.slice(0, TUTOR_MAX_SELECTION);
      const width = 130;
      const left = Math.min(Math.max(8, rect.left + rect.width / 2 - width / 2), window.innerWidth - width - 8);
      // Below the selection; above it when there is no room (and on touch,
      // where the system menu sits above the text).
      const below = rect.bottom + 8;
      const top = below + 44 > window.innerHeight ? Math.max(8, rect.top - 44) : below;
      setPos({ top, left });
    };
    const soon = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(check, 250);
    };
    const hide = () => setPos(null);
    document.addEventListener("selectionchange", soon);
    window.addEventListener("scroll", hide, { passive: true });
    window.addEventListener("resize", hide);
    return () => {
      document.removeEventListener("selectionchange", soon);
      window.removeEventListener("scroll", hide);
      window.removeEventListener("resize", hide);
      if (timer.current) clearTimeout(timer.current);
    };
  }, [panelRef]);

  if (!pos) return null;
  return (
    <button
      type="button"
      // Keep the selection while clicking.
      onMouseDown={(e) => e.preventDefault()}
      onClick={() => {
        const v = text.current;
        setPos(null);
        window.getSelection()?.removeAllRanges();
        if (v) onAsk(v);
      }}
      className="fixed z-[55] flex items-center gap-1.5 rounded-full bg-[var(--ink)] px-3.5 py-2 text-xs font-bold text-white shadow-lg ring-2 ring-white"
      style={{ top: pos.top, left: pos.left }}
    >
      <span aria-hidden="true">✦</span> {t("tutor.askTutor")}
    </button>
  );
}
