"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Markdown from "@/components/learn/Markdown";
import { useT } from "@/lib/i18n/client";
import {
  inertFences,
  TUTOR_ACTIONS,
  TUTOR_MAX_INPUT,
  type TutorAction,
  type TutorMessageView,
  type TutorProfileView,
} from "@/lib/learn/tutor/shared";
import TutorProfileForm from "./TutorProfileForm";
import TutorSelectionAsk from "./TutorSelectionAsk";

// Tutor, the AI tutor side panel. Desktop: a panel docked on the right that
// collapses to a side tab. Mobile: a bottom sheet opened from a floating
// button. Replies stream token by token from /api/learn/tutor/chat; the
// conversation for this page is restored from the server on open.

export type TutorDockKind = "lesson" | "lab" | "studio" | "review" | "exam";

interface State {
  messages: TutorMessageView[];
  profile: TutorProfileView | null;
  remaining: number;
  limit: number;
  available: boolean;
  hasTryItNow: boolean;
}

const OPEN_KEY = "tib-tutor-open";
const PANEL_W = 400;

function useIsDesktop(): boolean {
  const [desktop, setDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const on = () => setDesktop(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return desktop;
}

export default function TutorDock({ kind, refId = null }: { kind: TutorDockKind; refId?: string | null }) {
  if (kind === "exam") return <ExamNote />;
  return <TutorPanel kind={kind} refId={refId} />;
}

/** Exams: Tutor is off, with a short note instead of the panel. */
function ExamNote() {
  const t = useT();
  const [show, setShow] = useState(false);
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2" data-tutor-ignore>
      {show && (
        <p role="status" className="max-w-xs rounded-xl border border-[var(--border)] bg-white p-3 text-xs leading-relaxed text-[var(--ink2)] shadow-lg">
          {t("tutor.examOff")}
        </p>
      )}
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        aria-expanded={show}
        className="flex items-center gap-2 rounded-full border border-[var(--border)] bg-white px-4 py-2 text-xs font-bold text-[var(--ink3)] shadow"
      >
        <span aria-hidden="true">✦</span> {t("tutor.button")} <span className="font-normal">· {t("tutor.off")}</span>
      </button>
    </div>
  );
}

function TutorPanel({ kind, refId }: { kind: Exclude<TutorDockKind, "exam">; refId: string | null }) {
  const t = useT();
  const desktop = useIsDesktop();
  const panelRef = useRef<HTMLElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const [open, setOpen] = useState(false);
  const [state, setState] = useState<State | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [disabledNote, setDisabledNote] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [streaming, setStreaming] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  // Remember an open docked panel across lessons (desktop only).
  useEffect(() => {
    try {
      if (window.matchMedia("(min-width: 1024px)").matches && localStorage.getItem(OPEN_KEY) === "1") setOpen(true);
    } catch {
      // storage unavailable: start closed
    }
  }, []);
  useEffect(() => {
    if (!desktop) return;
    try {
      localStorage.setItem(OPEN_KEY, open ? "1" : "0");
    } catch {
      // ignore
    }
  }, [open, desktop]);

  // Docked on desktop: make room for the panel instead of covering the page.
  useEffect(() => {
    const root = document.documentElement;
    if (open && desktop) root.classList.add("tutor-docked");
    else root.classList.remove("tutor-docked");
    return () => root.classList.remove("tutor-docked");
  }, [open, desktop]);

  // Mobile sheet: Escape closes, the page behind does not scroll.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    let prev = "";
    if (!desktop) {
      prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", onKey);
      if (!desktop) document.body.style.overflow = prev;
    };
  }, [open, desktop]);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const qs = new URLSearchParams({ kind, ...(refId ? { ref: refId } : {}) });
      const res = await fetch(`/api/learn/tutor?${qs}`, { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data.disabled === "exam") setDisabledNote(data.error);
        else setLoadError(data.error ?? t("tutor.api.unavailable"));
        return;
      }
      setDisabledNote(null);
      setState({
        messages: data.messages ?? [],
        profile: data.profile ?? null,
        remaining: data.remaining ?? 0,
        limit: data.limit ?? 0,
        available: data.available !== false,
        hasTryItNow: !!data.hasTryItNow,
      });
    } catch {
      setLoadError(t("tutor.error.network"));
    }
  }, [kind, refId, t]);

  useEffect(() => {
    if (open && !state && !disabledNote) load();
  }, [open, state, disabledNote, load]);

  // Keep the newest message in view.
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [state?.messages.length, streaming, open]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const send = useCallback(
    async (opts: { message?: string; action?: TutorAction | "explain"; selection?: string }) => {
      if (busy) return;
      const message = (opts.message ?? "").trim();
      if (!message && !opts.action) return;
      setError(null);
      setNotice(null);
      setProfileOpen(false);

      const shown =
        opts.action === "explain"
          ? [`> ${opts.selection ?? ""}`, t("tutor.explainThis"), message]
          : [opts.action ? t(`tutor.chip.${opts.action}`) : "", message];
      const userMsg: TutorMessageView = { id: `local-${Date.now()}`, role: "user", content: shown.filter(Boolean).join("\n\n") };
      setState((s) => (s ? { ...s, messages: [...s.messages, userMsg] } : s));
      setInput("");
      setBusy(true);
      setStreaming("");

      const ctrl = new AbortController();
      abortRef.current = ctrl;
      let reply = "";
      let finished = false;
      try {
        const res = await fetch("/api/learn/tutor/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kind, ref: refId, message, action: opts.action ?? null, selection: opts.selection ?? null }),
          signal: ctrl.signal,
        });
        if (!res.ok || !res.body) {
          const data = await res.json().catch(() => ({}));
          // The message did not go through: take it back out of the list.
          setState((s) => (s ? { ...s, messages: s.messages.filter((m) => m.id !== userMsg.id) } : s));
          if (data.disabled === "exam") setDisabledNote(data.error);
          if (typeof data.remaining === "number") setState((s) => (s ? { ...s, remaining: data.remaining } : s));
          setError(data.error ?? t("tutor.api.failed"));
          if (message) setInput(message);
          return;
        }
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buf = "";
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          let cut: number;
          while ((cut = buf.indexOf("\n\n")) !== -1) {
            const chunk = buf.slice(0, cut);
            buf = buf.slice(cut + 2);
            for (const line of chunk.split("\n")) {
              if (!line.startsWith("data: ")) continue;
              let ev: { type?: string; text?: string; error?: string; remaining?: number };
              try {
                ev = JSON.parse(line.slice(6));
              } catch {
                continue;
              }
              if (ev.type === "delta" && ev.text) {
                reply += ev.text;
                setStreaming(reply);
              } else if (ev.type === "notice" && ev.text) {
                setNotice(ev.text);
              } else if (ev.type === "done") {
                finished = true;
                if (typeof ev.remaining === "number") {
                  const r = ev.remaining;
                  setState((s) => (s ? { ...s, remaining: r } : s));
                }
              } else if (ev.type === "error") {
                setError(ev.error ?? t("tutor.api.failed"));
              }
            }
          }
          // The reply is complete; the server may still be tidying up.
          if (finished) break;
        }
      } catch (err) {
        if ((err as Error)?.name !== "AbortError") setError(t("tutor.error.network"));
      } finally {
        const text = reply.trim();
        if (text) {
          setState((s) =>
            s ? { ...s, messages: [...s.messages, { id: `local-a-${Date.now()}`, role: "assistant", content: text }] } : s,
          );
        }
        setStreaming(null);
        setBusy(false);
        abortRef.current = null;
        if (desktop) inputRef.current?.focus();
      }
    },
    [busy, kind, refId, t, desktop],
  );

  async function newConversation() {
    if (busy) return;
    setError(null);
    setNotice(null);
    try {
      const res = await fetch("/api/learn/tutor/new", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, ref: refId }),
      });
      if (res.ok) setState((s) => (s ? { ...s, messages: [] } : s));
      else setError((await res.json().catch(() => ({}))).error ?? t("tutor.api.failed"));
    } catch {
      setError(t("tutor.error.network"));
    }
  }

  // "Ask Tutor" on selected text: open the panel, then send once the
  // conversation has loaded.
  const pendingSelection = useRef<string | null>(null);
  const askSelection = useCallback((text: string) => {
    pendingSelection.current = text;
    setOpen(true);
  }, []);
  useEffect(() => {
    if (open && state && !busy && pendingSelection.current) {
      const text = pendingSelection.current;
      pendingSelection.current = null;
      send({ action: "explain", selection: text });
    }
  });

  const out = !!state && state.remaining <= 0;
  const canSend = !!state && state.available && !busy && !out && !disabledNote;
  const chips = TUTOR_ACTIONS.filter((a) => a !== "stuck" || state?.hasTryItNow);

  const launcher = !open && (
    <button
      type="button"
      onClick={() => setOpen(true)}
      aria-label={t("tutor.open")}
      data-tutor-ignore
      className={
        desktop
          ? "fixed right-0 top-1/2 z-50 flex -translate-y-1/2 flex-col items-center gap-1 rounded-l-2xl bg-[var(--ink)] px-2.5 py-4 text-xs font-bold text-white shadow-lg [writing-mode:vertical-rl] hover:opacity-90"
          : "fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full bg-[var(--ink)] px-5 py-3 text-sm font-bold text-white shadow-lg hover:opacity-90"
      }
    >
      <span aria-hidden="true" className={desktop ? "[writing-mode:horizontal-tb]" : ""}>
        ✦
      </span>
      {t("tutor.button")}
    </button>
  );

  const remainingLine =
    state && state.remaining > 0 && state.remaining <= 10
      ? t(state.remaining === 1 ? "tutor.remaining.one" : "tutor.remaining.other", { n: state.remaining })
      : null;

  const panel = open && (
    <aside
      ref={panelRef}
      role={desktop ? "complementary" : "dialog"}
      aria-modal={desktop ? undefined : true}
      aria-label={t("tutor.name")}
      data-tutor-ignore
      className={
        desktop
          ? "fixed bottom-0 right-0 top-0 z-50 flex flex-col border-l border-[var(--border)] bg-white shadow-xl"
          : "fixed inset-x-0 bottom-0 z-50 flex h-[85dvh] flex-col rounded-t-2xl border-t border-[var(--border)] bg-white shadow-2xl"
      }
      style={desktop ? { width: PANEL_W } : undefined}
    >
      {!desktop && <div aria-hidden="true" className="mx-auto mt-2 h-1.5 w-10 shrink-0 rounded-full bg-[var(--border)]" />}
      <header className="flex shrink-0 items-start justify-between gap-2 border-b border-[var(--border)] px-4 py-3">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-base font-black text-[var(--ink)]">
            <span aria-hidden="true" className="text-[var(--orange)]">
              ✦
            </span>
            {t("tutor.name")}
          </p>
          <p className="text-xs text-[var(--ink3)]">{t("tutor.subtitle")}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {state && state.messages.length > 0 && (
            <button
              type="button"
              onClick={newConversation}
              disabled={busy}
              className="rounded-full border border-[var(--border)] px-3 py-1.5 text-xs font-semibold text-[var(--ink2)] hover:border-[var(--ink3)] disabled:opacity-50"
            >
              {t("tutor.newConversation")}
            </button>
          )}
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label={desktop ? t("tutor.collapse") : t("tutor.close")}
            className="flex h-8 w-8 items-center justify-center rounded-full text-lg text-[var(--ink3)] hover:bg-[var(--s2)] hover:text-[var(--ink)]"
          >
            <span aria-hidden="true">{desktop ? "»" : "×"}</span>
          </button>
        </div>
      </header>

      <div ref={listRef} role="log" aria-live="polite" aria-busy={busy} className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {disabledNote ? (
          <p role="status" className="rounded-xl bg-[var(--s2)] p-4 text-sm leading-relaxed text-[var(--ink2)]">
            {disabledNote}
          </p>
        ) : !state ? (
          <p className="text-sm text-[var(--ink3)]">{loadError ?? t("tutor.loading")}</p>
        ) : (
          <>
            {state.messages.length === 0 && streaming === null && (
              <div className="rounded-xl bg-[var(--s2)] p-4">
                <p className="text-sm font-bold text-[var(--ink)]">{t("tutor.empty.title")}</p>
                <p className="mt-1 text-sm leading-relaxed text-[var(--ink2)]">{t("tutor.empty.body")}</p>
                {kind === "lesson" && <p className="mt-2 text-xs text-[var(--ink3)]">{t("tutor.empty.select")}</p>}
              </div>
            )}

            {profileOpen ? (
              <TutorProfileForm
                initial={state.profile}
                onCancel={() => setProfileOpen(false)}
                onSaved={(p) => {
                  setState((s) => (s ? { ...s, profile: p } : s));
                  setProfileOpen(false);
                  setProfileSaved(true);
                }}
              />
            ) : (
              state.messages.length === 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(true);
                    setProfileSaved(false);
                  }}
                  className="text-xs font-semibold text-[var(--blue2)] underline underline-offset-2"
                >
                  {state.profile && (state.profile.role || state.profile.goal || state.profile.level)
                    ? t("tutor.profile.edit")
                    : t("tutor.profile.open")}
                </button>
              )
            )}
            {profileSaved && !profileOpen && (
              <p role="status" className="text-xs font-semibold text-green-700">
                {t("tutor.profile.saved")}
              </p>
            )}

            {state.messages.map((m) => (
              <Bubble key={m.id} role={m.role} content={m.content} you={t("tutor.you")} />
            ))}
            {streaming !== null &&
              (streaming ? (
                <Bubble role="assistant" content={streaming} you={t("tutor.you")} />
              ) : (
                <p className="flex items-center gap-2 text-xs text-[var(--ink3)]">
                  <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-[var(--orange)]" aria-hidden="true" />
                  {t("tutor.thinking")}
                </p>
              ))}
          </>
        )}
      </div>

      {!disabledNote && state && (
        <div className="shrink-0 border-t border-[var(--border)] px-4 pb-3 pt-2">
          {notice && (
            <p role="status" className="mb-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
              {notice}
            </p>
          )}
          {(error || out) && (
            <p role="alert" className="mb-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-800">
              {out && !error ? t("tutor.limitReached") : error}
            </p>
          )}
          {!state.available && !error && <p className="mb-2 text-xs text-[var(--ink3)]">{t("tutor.api.off")}</p>}
          <div role="group" aria-label={t("tutor.chips")} className="mb-2 flex gap-1.5 overflow-x-auto pb-1 lg:flex-wrap lg:overflow-visible">
            {chips.map((a) => (
              <button
                key={a}
                type="button"
                disabled={!canSend}
                onClick={() => send({ action: a })}
                className="shrink-0 rounded-full border border-[var(--border)] bg-[var(--s2)] px-3 py-1.5 text-left text-xs font-medium text-[var(--ink2)] hover:border-[var(--ink3)] hover:text-[var(--ink)] disabled:opacity-50"
              >
                {t(`tutor.chip.${a}`)}
              </button>
            ))}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (canSend) send({ message: input });
            }}
            className="flex items-end gap-2"
          >
            <label className="sr-only" htmlFor="tutor-input">
              {t("tutor.placeholder")}
            </label>
            <textarea
              id="tutor-input"
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value.slice(0, TUTOR_MAX_INPUT))}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  if (canSend && input.trim()) send({ message: input });
                }
              }}
              rows={2}
              maxLength={TUTOR_MAX_INPUT}
              placeholder={t("tutor.placeholder")}
              disabled={out || !state.available}
              className="min-h-[44px] flex-1 resize-none rounded-xl border border-[var(--border)] px-3 py-2 text-sm text-[var(--ink)] focus:border-[var(--blue2)] focus:outline-none disabled:bg-[var(--s2)]"
            />
            <button
              type="submit"
              disabled={!canSend || !input.trim()}
              className="h-[44px] shrink-0 rounded-xl bg-[var(--ink)] px-4 text-sm font-bold text-white disabled:opacity-40"
            >
              {t("tutor.send")}
            </button>
          </form>
          <p className="mt-1.5 flex flex-wrap justify-between gap-x-3 text-[11px] leading-snug text-[var(--ink3)]">
            <span>{t("tutor.footnote")}</span>
            {remainingLine && <span className="font-semibold">{remainingLine}</span>}
          </p>
        </div>
      )}
    </aside>
  );

  return (
    <>
      <style>{`@media (min-width: 1024px) { html.tutor-docked body { padding-right: ${PANEL_W}px; } }`}</style>
      {!desktop && open && <div aria-hidden="true" className="fixed inset-0 z-50 bg-[rgba(13,27,42,0.35)]" onClick={() => setOpen(false)} />}
      {launcher}
      {panel}
      {!disabledNote && <TutorSelectionAsk panelRef={panelRef} onAsk={askSelection} />}
    </>
  );
}

function Bubble({ role, content, you }: { role: "user" | "assistant"; content: string; you: string }) {
  if (role === "user") {
    return (
      <div className="ml-6 rounded-2xl rounded-br-md bg-[var(--ink)] px-3.5 py-2.5 text-white [&_*]:!text-white [&_blockquote]:!border-white/40 [&_blockquote]:!bg-white/10 [&_p]:!mb-1 [&_p]:!text-sm [&_p]:!leading-relaxed">
        <span className="sr-only">{you}: </span>
        <Markdown source={inertFences(content)} />
      </div>
    );
  }
  return (
    <div className="mr-2 rounded-2xl rounded-bl-md border border-[var(--border)] bg-white px-3.5 py-2.5 [&_li]:!text-sm [&_ol]:!mb-2 [&_p]:!mb-2 [&_p]:!text-sm [&_p]:!leading-relaxed [&_ul]:!mb-2">
      <Markdown source={inertFences(content)} />
    </div>
  );
}
