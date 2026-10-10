"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { CircleAlert, CircleCheck, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastTone = "success" | "error" | "info";
type ToastItem = { id: number; tone: ToastTone; title: string; body?: string };
type ToastApi = {
  toast: (t: { title: string; body?: string; tone?: ToastTone; duration?: number }) => void;
  success: (title: string, body?: string) => void;
  error: (title: string, body?: string) => void;
  info: (title: string, body?: string) => void;
};

const Ctx = createContext<ToastApi | null>(null);

const noop: ToastApi = { toast: () => {}, success: () => {}, error: () => {}, info: () => {} };

/** Toasts from anywhere under <ToastProvider> (mounted in the admin layout). */
export function useToast(): ToastApi {
  return useContext(Ctx) ?? noop;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const seq = useRef(0);

  const dismiss = useCallback((id: number) => setItems((xs) => xs.filter((x) => x.id !== id)), []);

  const toast = useCallback<ToastApi["toast"]>(
    ({ title, body, tone = "info", duration = 4500 }) => {
      const id = ++seq.current;
      setItems((xs) => [...xs.slice(-3), { id, tone, title, body }]);
      window.setTimeout(() => dismiss(id), duration);
    },
    [dismiss],
  );

  const api = useMemo<ToastApi>(
    () => ({
      toast,
      success: (title, body) => toast({ title, body, tone: "success" }),
      error: (title, body) => toast({ title, body, tone: "error", duration: 7000 }),
      info: (title, body) => toast({ title, body, tone: "info" }),
    }),
    [toast],
  );

  return (
    <Ctx.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        role="status"
        className="pointer-events-none fixed bottom-4 right-4 z-[80] flex w-[min(360px,calc(100vw-32px))] flex-col gap-2"
      >
        {items.map((t) => {
          const Icon = t.tone === "success" ? CircleCheck : t.tone === "error" ? CircleAlert : Info;
          return (
            <div
              key={t.id}
              className="a-anim-pop pointer-events-auto flex items-start gap-3 rounded-[12px] border border-[var(--a-border)] bg-[var(--a-surface)] px-4 py-3 shadow-[var(--a-shadow-pop)]"
            >
              <Icon
                size={18}
                aria-hidden
                className={cn(
                  "mt-0.5 shrink-0",
                  t.tone === "success" ? "text-[var(--a-success)]" : t.tone === "error" ? "text-[var(--a-danger)]" : "text-[var(--a-info)]",
                )}
              />
              <div className="min-w-0 flex-1 font-dm">
                <p className="text-[13.5px] font-semibold text-[var(--a-ink)]">{t.title}</p>
                {t.body ? <p className="mt-0.5 text-[12.5px] text-[var(--a-ink-3)]">{t.body}</p> : null}
              </div>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                aria-label="Dismiss notification"
                className="-mr-1 flex h-7 w-7 items-center justify-center rounded-md text-[var(--a-ink-3)] hover:bg-[var(--a-surface-2)]"
              >
                <X size={14} aria-hidden />
              </button>
            </div>
          );
        })}
      </div>
    </Ctx.Provider>
  );
}
