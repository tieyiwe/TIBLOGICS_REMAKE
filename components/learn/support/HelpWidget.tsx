"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { CheckCircle2, LifeBuoy, X } from "lucide-react";
import { useT } from "@/lib/i18n/client";
import { useFocusTrap } from "@/lib/a11y/useFocusTrap";
import { SUPPORT_LINK_MAX, SUPPORT_MSG_MAX, SUPPORT_MSG_MIN, SUPPORT_TOPICS, type SupportTopic } from "@/lib/learn/support/shared";
import { OPEN_HELP_EVENT } from "./events";

// "Need help?" on every learner page: a small button in the bottom corner
// that opens a compact form. Signed-in learners send a message that lands in
// their Inbox (and the ARFA team's Support list); signed-out visitors (login,
// sign-up, join pages) give a name and an email.
//
// Placement (CSS below): bottom right, raised above the Tutor button when a
// Tutor dock is on the page (lesson, lab, studio, review, exam), kept clear of
// the Tutor side tab and shifted left of the docked Tutor panel on desktop, and raised above the mobile join
// summary bar when it shows. place="public" (marketing layout pages) uses the
// bottom left, clear of the site chat button and the mobile bottom nav.

const CSS = `
.arfa-help{position:fixed;right:16px;bottom:calc(16px + env(safe-area-inset-bottom,0px));z-index:40;display:flex;flex-direction:column;align-items:flex-end;gap:10px;pointer-events:none}
.arfa-help>*{pointer-events:auto}
.arfa-help[data-open="true"]{z-index:56}
html:has([data-tutor-ignore]) .arfa-help{bottom:calc(84px + env(safe-area-inset-bottom,0px))}
@media (max-width:1023px){html:has([data-testid="join-bar"][aria-hidden="false"]) .arfa-help{bottom:calc(92px + env(safe-area-inset-bottom,0px))}}
@media (min-width:1024px){html:has([data-tutor-ignore]) .arfa-help{right:66px}html.tutor-docked .arfa-help{right:416px}}
.arfa-help[data-place="public"]{right:auto;left:16px;align-items:flex-start;bottom:calc(92px + env(safe-area-inset-bottom,0px))}
@media (min-width:640px){.arfa-help[data-place="public"]{bottom:24px}}
@media (min-width:640px) and (max-width:1023px){html:has([data-testid="join-bar"][aria-hidden="false"]) .arfa-help[data-place="public"]{bottom:92px}}
.arfa-help-panel{width:min(380px,calc(100vw - 32px));max-height:min(640px,calc(100dvh - 200px));overflow:auto}
@media print{.arfa-help{display:none}}
`;

type Who = { signedIn: true; name: string; email: string } | { signedIn: false };

function defaultTopic(path: string): SupportTopic | "" {
  if (/^\/learn\/(lesson|lab|quiz|review|exam|capstone|studio)\b/.test(path)) return "lesson";
  if (/^\/learn\/(subscribe|account)\b|^\/learning-box\/join/.test(path)) return "billing";
  if (/^\/learn\/certificates\b/.test(path)) return "certificate";
  if (/^\/learn\/team\b|^\/join-team\//.test(path)) return "team";
  return "";
}

export default function HelpWidget({ place = "learn" }: { place?: "learn" | "public" }) {
  const t = useT();
  const pathname = usePathname() ?? "/";
  const uid = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const fabRef = useRef<HTMLButtonElement>(null);
  const firstRef = useRef<HTMLSelectElement>(null);

  const [open, setOpen] = useState(false);
  const [who, setWho] = useState<Who | null>(null);
  const [topic, setTopic] = useState<SupportTopic | "">("");
  const [message, setMessage] = useState("");
  const [link, setLink] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [includeContext, setIncludeContext] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<null | { threadId: string | null }>(null);

  useFocusTrap(panelRef, open, { initialFocus: done ? undefined : firstRef });

  const openPanel = useCallback(
    (preset?: string) => {
      setOpen(true);
      setDone(null);
      setError(null);
      setTopic((cur) => (preset && (SUPPORT_TOPICS as readonly string[]).includes(preset) ? (preset as SupportTopic) : cur || defaultTopic(pathname)));
    },
    [pathname],
  );

  // Other components open the panel with a window event (OpenHelpButton).
  useEffect(() => {
    const on = (e: Event) => openPanel((e as CustomEvent<{ topic?: string }>).detail?.topic);
    window.addEventListener(OPEN_HELP_EVENT, on);
    return () => window.removeEventListener(OPEN_HELP_EVENT, on);
  }, [openPanel]);

  // Who is asking (once, on first open).
  useEffect(() => {
    if (!open || who) return;
    let live = true;
    fetch("/api/learn/support", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { signedIn: false }))
      .then((d: Who) => live && setWho(d))
      .catch(() => live && setWho({ signedIn: false }));
    return () => {
      live = false;
    };
  }, [open, who]);

  const close = useCallback(() => {
    setOpen(false);
    requestAnimationFrame(() => fabRef.current?.focus());
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        close();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, close]);

  const visitor = who?.signedIn === false;
  const len = message.trim().length;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!topic) return setError(t("support.err.topic"));
    if (len < SUPPORT_MSG_MIN) return setError(t("support.err.short"));
    if (visitor && name.trim().length < 2) return setError(t("support.err.name"));
    if (visitor && !/^\S+@\S+\.\S+$/.test(email.trim())) return setError(t("support.err.email"));
    setBusy(true);
    try {
      const res = await fetch("/api/learn/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          message,
          link: link.trim() || null,
          includeContext,
          path: includeContext ? pathname : null,
          viewport: includeContext ? `${window.innerWidth}x${window.innerHeight}` : null,
          ...(visitor ? { name, email } : {}),
          website,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || t("support.err.server"));
      setDone({ threadId: data.threadId ?? null });
      setMessage("");
      setLink("");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("support.err.server"));
    } finally {
      setBusy(false);
    }
  }

  const field = "mt-1 w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-[15px] text-[var(--ink)] outline-none focus:border-[var(--blue2)] focus:ring-2 focus:ring-[var(--blue2)]/20";
  const label = "block text-[13px] font-bold text-[var(--ink)]";

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="arfa-help" data-place={place} data-open={open ? "true" : undefined}>
        {open && (
          <div
            ref={panelRef}
            id={`${uid}-panel`}
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${uid}-title`}
            data-testid="help-panel"
            className="arfa-help-panel rounded-2xl border border-[var(--border)] bg-white text-left shadow-2xl"
          >
            <div className="sticky top-0 z-[1] flex items-start justify-between gap-3 border-b border-[var(--border)] bg-white px-4 py-3">
              <div>
                <h2 id={`${uid}-title`} className="flex items-center gap-2 text-base font-black text-[var(--ink)]">
                  <LifeBuoy size={18} className="text-[var(--orange)]" aria-hidden /> {t("support.title")}
                </h2>
                <p className="mt-0.5 text-xs text-[var(--ink2)]">{t("support.subtitle")}</p>
              </div>
              <button
                type="button"
                onClick={close}
                aria-label={t("support.close")}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-[var(--ink2)] hover:bg-[var(--s2)] hover:text-[var(--ink)]"
              >
                <X size={18} aria-hidden />
              </button>
            </div>

            {done ? (
              <div className="px-4 py-5" role="status" data-testid="help-done">
                <p className="flex items-start gap-2 text-[15px] font-bold text-[var(--ink)]">
                  <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-green-600" aria-hidden /> {t("support.done.title")}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-[var(--ink2)]">{done.threadId ? t("support.done.learner") : t("support.done.visitor")}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {done.threadId && (
                    <Link
                      href={`/learn/inbox/${done.threadId}`}
                      onClick={() => setOpen(false)}
                      className="inline-flex min-h-11 items-center rounded-full bg-[var(--ink)] px-5 text-sm font-bold text-white hover:opacity-90"
                    >
                      {t("support.done.open")}
                    </Link>
                  )}
                  <button type="button" onClick={() => setDone(null)} className="min-h-11 rounded-full border border-[var(--border)] px-4 text-sm font-semibold text-[var(--ink)]">
                    {t("support.done.another")}
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={submit} noValidate className="space-y-3 px-4 py-4">
                <div>
                  <label htmlFor={`${uid}-topic`} className={label}>
                    {t("support.field.topic")}
                  </label>
                  <select
                    id={`${uid}-topic`}
                    ref={firstRef}
                    value={topic}
                    onChange={(e) => setTopic(e.target.value as SupportTopic)}
                    required
                    className={`${field} min-h-11`}
                  >
                    <option value="">{t("support.field.topicChoose")}</option>
                    {SUPPORT_TOPICS.map((k) => (
                      <option key={k} value={k}>
                        {t(`support.topic.${k}`)}
                      </option>
                    ))}
                  </select>
                </div>

                {visitor && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label htmlFor={`${uid}-name`} className={label}>
                        {t("support.field.name")}
                      </label>
                      <input id={`${uid}-name`} value={name} onChange={(e) => setName(e.target.value.slice(0, 120))} autoComplete="name" required className={`${field} min-h-11`} />
                    </div>
                    <div>
                      <label htmlFor={`${uid}-email`} className={label}>
                        {t("support.field.email")}
                      </label>
                      <input
                        id={`${uid}-email`}
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value.slice(0, 254))}
                        autoComplete="email"
                        inputMode="email"
                        required
                        className={`${field} min-h-11`}
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label htmlFor={`${uid}-msg`} className={label}>
                    {t("support.field.message")}
                  </label>
                  <textarea
                    id={`${uid}-msg`}
                    value={message}
                    onChange={(e) => setMessage(e.target.value.slice(0, SUPPORT_MSG_MAX))}
                    rows={5}
                    maxLength={SUPPORT_MSG_MAX}
                    required
                    aria-describedby={`${uid}-count`}
                    placeholder={t("support.field.messagePlaceholder")}
                    className={`${field} resize-y leading-relaxed`}
                  />
                  <p id={`${uid}-count`} className="mt-0.5 text-right text-xs tabular-nums text-[var(--ink3)]">
                    {len < SUPPORT_MSG_MIN ? t("support.field.min", { n: SUPPORT_MSG_MIN }) + " · " : ""}
                    {message.length}/{SUPPORT_MSG_MAX}
                  </p>
                </div>

                <div>
                  <label htmlFor={`${uid}-link`} className={label}>
                    {t("support.field.link")} <span className="font-normal text-[var(--ink3)]">{t("support.optional")}</span>
                  </label>
                  <input
                    id={`${uid}-link`}
                    type="url"
                    inputMode="url"
                    value={link}
                    onChange={(e) => setLink(e.target.value.slice(0, SUPPORT_LINK_MAX))}
                    placeholder="https://"
                    aria-describedby={`${uid}-linkhint`}
                    className={`${field} min-h-11`}
                  />
                  <p id={`${uid}-linkhint`} className="mt-0.5 text-xs text-[var(--ink3)]">
                    {t("support.field.linkHint")}
                  </p>
                </div>

                {/* Honeypot: hidden from people and assistive tech. */}
                <div aria-hidden="true" className="absolute -left-[10000px] h-px w-px overflow-hidden">
                  <label>
                    Website
                    <input tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} name="website" />
                  </label>
                </div>

                <div className="rounded-xl bg-[var(--s2)] px-3 py-2.5">
                  <label className="flex items-start gap-2.5 text-[13px] text-[var(--ink)]">
                    <input
                      type="checkbox"
                      checked={includeContext}
                      onChange={(e) => setIncludeContext(e.target.checked)}
                      className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--blue2)]"
                      data-testid="help-context"
                    />
                    <span>
                      <span className="font-bold">{visitor ? t("support.context.visitor") : t("support.context.learner")}</span>
                      <span className="mt-0.5 block text-xs text-[var(--ink2)]">{visitor ? t("support.context.visitorHint") : t("support.context.learnerHint")}</span>
                    </span>
                  </label>
                </div>

                {error && (
                  <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                    {error}
                  </p>
                )}

                <div className="flex items-center justify-between gap-3 pt-1">
                  <p className="text-xs text-[var(--ink3)]">{t("support.replyTime")}</p>
                  <button
                    type="submit"
                    disabled={busy || !who}
                    data-testid="help-send"
                    className="min-h-11 shrink-0 rounded-full bg-[var(--ink)] px-5 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                  >
                    {busy ? t("support.sending") : t("support.send")}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        <button
          ref={fabRef}
          type="button"
          onClick={() => (open ? close() : openPanel())}
          aria-expanded={open}
          aria-controls={open ? `${uid}-panel` : undefined}
          aria-haspopup="dialog"
          data-testid="help-fab"
          className="flex min-h-11 items-center gap-2 rounded-full border border-[var(--border)] bg-white px-4 text-sm font-bold text-[var(--ink)] shadow-lg transition-colors hover:border-[var(--ink3)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--blue2)]"
        >
          <LifeBuoy size={18} className="text-[var(--orange)]" aria-hidden />
          {t("support.fab")}
        </button>
      </div>
    </>
  );
}
