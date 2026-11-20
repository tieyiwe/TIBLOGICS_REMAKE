"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useT } from "@/lib/i18n/client";

/**
 * A phone-style sheet that slides up from the bottom (a centred panel on
 * wider screens). Escape, the backdrop and the close button dismiss it; the
 * page behind does not scroll while it is open, and focus returns to what
 * opened it.
 */
export default function BottomSheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  const t = useT();
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const before = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panel.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", onKey);
      before?.focus?.();
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;
  return createPortal(
    <div className="fixed inset-0 z-[900] flex items-end justify-center sm:items-center" data-testid="bottom-sheet">
      <button type="button" aria-label={t("learn.tile.close")} onClick={onClose} className="learn-sheet-fade absolute inset-0 bg-black/45" />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className="learn-sheet-up relative max-h-[88vh] w-full overflow-y-auto rounded-t-3xl bg-white px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3 shadow-2xl outline-none sm:max-w-lg sm:rounded-3xl"
      >
        <div aria-hidden className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-[var(--s3)] sm:hidden" />
        <button
          type="button"
          onClick={onClose}
          aria-label={t("learn.tile.close")}
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-[var(--s2)] text-lg text-[var(--ink2)]"
        >
          ×
        </button>
        {children}
      </div>
    </div>,
    document.body,
  );
}
