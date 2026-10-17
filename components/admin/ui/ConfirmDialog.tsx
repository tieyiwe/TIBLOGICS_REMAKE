"use client";

import { createContext, useCallback, useContext, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { TriangleAlert } from "lucide-react";
import { useFocusTrap } from "@/lib/a11y/useFocusTrap";
import { cn } from "@/lib/utils";
import { Button } from "./Button";

export type ConfirmOptions = {
  title: string;
  body?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Red confirm button and warning icon. Defaults to true. */
  danger?: boolean;
  /** Require the user to type this exact text before confirming (e.g. "DELETE" or a record name). */
  typeToConfirm?: string;
};

/**
 * Modal confirmation. Controlled: render it with `open` and handle
 * `onConfirm` (may be async; the button shows a spinner until it settles).
 * For one-off prompts use `useConfirm()` instead.
 */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  body,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger = true,
  typeToConfirm,
}: ConfirmOptions & {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const titleId = useId();
  const bodyId = useId();
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  useFocusTrap(panelRef, open, { initialFocus: typeToConfirm ? inputRef : cancelRef });

  useEffect(() => {
    if (open) {
      setTyped("");
      setBusy(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) {
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, busy, onClose]);

  if (!open) return null;
  const ready = !typeToConfirm || typed.trim() === typeToConfirm;

  const run = async () => {
    if (!ready || busy) return;
    setBusy(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[75] flex items-end justify-center p-4 sm:items-center">
      <div className="a-anim-fade absolute inset-0 bg-[rgba(13,27,42,.45)]" onClick={busy ? undefined : onClose} aria-hidden />
      <div
        ref={panelRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={body ? bodyId : undefined}
        className="a-anim-pop relative w-full max-w-[440px] rounded-[16px] border border-[var(--a-border)] bg-[var(--a-surface)] p-5 shadow-[var(--a-shadow-pop)]"
      >
        <div className="flex gap-3.5">
          {danger ? (
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--a-danger-bg)] text-[var(--a-danger)]">
              <TriangleAlert size={18} aria-hidden />
            </span>
          ) : null}
          <div className="min-w-0 flex-1">
            <h2 id={titleId} className="font-dm text-[16px] font-semibold text-[var(--a-ink)]">
              {title}
            </h2>
            {body ? (
              <div id={bodyId} className="mt-1.5 font-dm text-[13.5px] leading-relaxed text-[var(--a-ink-2)]">
                {body}
              </div>
            ) : null}
            {typeToConfirm ? (
              <label className="mt-4 block font-dm text-[13px] text-[var(--a-ink-2)]">
                Type <span className="rounded bg-[var(--a-surface-2)] px-1.5 py-0.5 font-mono text-[12.5px] font-semibold text-[var(--a-ink)]">{typeToConfirm}</span> to confirm
                <input
                  ref={inputRef}
                  value={typed}
                  onChange={(e) => setTyped(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      run();
                    }
                  }}
                  autoComplete="off"
                  spellCheck={false}
                  className="mt-1.5 h-10 w-full rounded-[var(--a-radius-control)] border border-[var(--a-border-strong)] bg-[var(--a-surface)] px-3 font-dm text-[14px] text-[var(--a-ink)] focus:border-[var(--a-blue)] focus:outline-none focus:ring-2 focus:ring-[var(--a-blue)]/20"
                />
              </label>
            ) : null}
          </div>
        </div>
        <div className={cn("mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end")}>
          <Button ref={cancelRef} variant="secondary" onClick={onClose} disabled={busy}>
            {cancelLabel}
          </Button>
          <Button variant={danger ? "danger" : "primary"} onClick={run} loading={busy} disabled={!ready}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

type ConfirmFn = (opts: ConfirmOptions) => Promise<boolean>;
const ConfirmCtx = createContext<ConfirmFn | null>(null);

/** Mount once (the admin layout does). Then `const confirm = useConfirm(); if (await confirm({...})) ...`. */
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<(ConfirmOptions & { resolve: (v: boolean) => void }) | null>(null);
  const confirm = useCallback<ConfirmFn>(
    (opts) =>
      new Promise<boolean>((resolve) => {
        setState({ ...opts, resolve });
      }),
    [],
  );
  const close = useCallback(() => {
    setState((s) => {
      s?.resolve(false);
      return null;
    });
  }, []);
  return (
    <ConfirmCtx.Provider value={confirm}>
      {children}
      <ConfirmDialog
        open={!!state}
        onClose={close}
        onConfirm={() => {
          state?.resolve(true);
          setState(null);
        }}
        title={state?.title ?? ""}
        body={state?.body}
        confirmLabel={state?.confirmLabel}
        cancelLabel={state?.cancelLabel}
        danger={state?.danger}
        typeToConfirm={state?.typeToConfirm}
      />
    </ConfirmCtx.Provider>
  );
}

/** Promise-based confirm. Falls back to window.confirm outside the provider. */
export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmCtx);
  return ctx ?? (async (o) => window.confirm(o.title));
}
