"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { hrefKey, isTrackablePath, normalizePath, safeLabel } from "@/lib/analytics/paths";
import { FIRST_TOUCH_COOKIE, FIRST_TOUCH_DAYS, LAST_TOUCH_COOKIE, cleanTag, type TouchCookie } from "@/lib/analytics/sources";

// First-party analytics for the whole platform (mounted once, in the root
// layout):
//   - page views and the "online now" heartbeat (/api/analytics/track), with
//     the session's source (UTM tags, a /go link, or the referring site) on
//     every view, and the time the tab was visible on each page;
//   - which links and buttons are clicked (/api/analytics/clicks);
//   - how far key pages are scrolled (25/50/75/100%).
//
// Never on the admin area, the APIs, or pages whose path holds a secret
// (/parent/<token>, /play/<token>): isTrackablePath. Recorded paths have no
// query string and ids or tokens are replaced (lib/analytics/paths.ts).
// Clicks record the control's name and kind, never what anyone typed.
//
// Do Not Track / Global Privacy Control: no clicks, no scroll depth and no
// attribution cookies; page views are still counted anonymously.
//
// Cookies (first party, nothing personal: campaign tags, a landing path, a
// referrer host and a time): tib_ft keeps the first visit for 90 days;
// tib_lt is this session's source (deleted when the browser closes). Both are
// read only when someone signs up, books, leaves a lead or buys
// (lib/analytics/touch.ts), so the conversion can be credited to its source.

function getSessionId(): string {
  try {
    let sid = sessionStorage.getItem("_tbl_sid");
    if (!sid) {
      sid = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      sessionStorage.setItem("_tbl_sid", sid);
    }
    return sid;
  } catch {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }
}

function trackEvent(event: string, page: string, meta?: Record<string, unknown>) {
  const sessionId = getSessionId();
  fetch("/api/analytics/event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event, page: normalizePath(page), sessionId, meta }),
    keepalive: true,
  }).catch(() => {});
}

/**
 * A named funnel or feature event (lib/analytics/funnels.ts reads some of
 * them). Props are bounded and must not hold personal data: short labels,
 * numbers and booleans only.
 */
export function track(event: string, props?: Record<string, string | number | boolean | null>) {
  try {
    if (typeof window === "undefined" || !isTrackablePath(window.location.pathname)) return;
    const clean: Record<string, string | number | boolean | null> = {};
    for (const [k, v] of Object.entries(props ?? {}).slice(0, 8)) {
      if (typeof v === "string") {
        const s = safeLabel(v);
        if (s) clean[k.slice(0, 30)] = s;
      } else if (typeof v === "number" || typeof v === "boolean" || v === null) clean[k.slice(0, 30)] = v;
    }
    trackEvent(event.slice(0, 60), window.location.pathname, clean);
  } catch {
    /* analytics never breaks the page */
  }
}

export { trackEvent };

/** Do Not Track or Global Privacy Control. */
export function privacySignal(): boolean {
  if (typeof navigator === "undefined") return false;
  const n = navigator as Navigator & { globalPrivacyControl?: boolean; msDoNotTrack?: string };
  const w = typeof window !== "undefined" ? (window as Window & { doNotTrack?: string }) : undefined;
  return n.globalPrivacyControl === true || n.doNotTrack === "1" || n.doNotTrack === "yes" || n.msDoNotTrack === "1" || w?.doNotTrack === "1";
}

function readCookie(name: string): string | null {
  try {
    const m = document.cookie.split("; ").find((c) => c.startsWith(`${name}=`));
    return m ? m.slice(name.length + 1) : null;
  } catch {
    return null;
  }
}
function writeCookie(name: string, value: TouchCookie, maxAge?: number) {
  try {
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${name}=${encodeURIComponent(JSON.stringify(value))}${maxAge ? `; Max-Age=${maxAge}` : ""}; Path=/; SameSite=Lax${secure}`;
  } catch {
    /* cookies blocked */
  }
}

type Acq = { s: string | null; m: string | null; c: string | null; n: string | null; k: string | null; l: string | null; r: string | null; p: string };

/** This session's source, decided on its first page view and kept for the session. */
function sessionAcquisition(path: string): { acq: Acq; landing: boolean; returning: boolean } {
  try {
    const saved = sessionStorage.getItem("_tbl_acq");
    if (saved) return { acq: JSON.parse(saved) as Acq, landing: false, returning: sessionStorage.getItem("_tbl_ret") === "1" };
  } catch {
    /* fall through */
  }
  const q = new URLSearchParams(window.location.search);
  let refHost: string | null = null;
  try {
    const h = document.referrer ? new URL(document.referrer).hostname.toLowerCase().replace(/^www\./, "") : null;
    refHost = h && h !== window.location.hostname.replace(/^www\./, "") ? h.slice(0, 120) : null;
  } catch {
    refHost = null;
  }
  // A /go tracked link sets tib_utm on the server just before the redirect.
  let link: string | null = null;
  let utm: Record<string, unknown> | null = null;
  try {
    const raw = readCookie("tib_utm");
    utm = raw ? (JSON.parse(decodeURIComponent(raw)) as Record<string, unknown>) : null;
    if (utm && typeof utm.l === "string" && Date.now() - Number(utm.t) < 5 * 60_000) link = utm.l;
    else utm = null;
  } catch {
    utm = null;
  }
  const acq: Acq = {
    s: cleanTag(q.get("utm_source")) ?? (utm ? cleanTag(utm.s) : null),
    m: cleanTag(q.get("utm_medium")) ?? (utm ? cleanTag(utm.m) : null),
    c: cleanTag(q.get("utm_campaign")) ?? (utm ? cleanTag(utm.c) : null),
    n: cleanTag(q.get("utm_content")) ?? (utm ? cleanTag(utm.n) : null),
    k: cleanTag(q.get("utm_term")),
    l: link,
    r: refHost,
    p: normalizePath(path),
  };
  let returning = false;
  if (!privacySignal()) {
    const ft = readCookie(FIRST_TOUCH_COOKIE);
    if (ft) {
      try {
        const t = Number((JSON.parse(decodeURIComponent(ft)) as TouchCookie).t);
        returning = Number.isFinite(t) && Date.now() - t > 30 * 60_000;
      } catch {
        returning = true;
      }
    } else writeCookie(FIRST_TOUCH_COOKIE, { ...acq, t: Date.now() }, FIRST_TOUCH_DAYS * 86_400);
    writeCookie(LAST_TOUCH_COOKIE, { ...acq, t: Date.now() });
  }
  try {
    sessionStorage.setItem("_tbl_acq", JSON.stringify(acq));
    sessionStorage.setItem("_tbl_ret", returning ? "1" : "0");
  } catch {
    /* private mode */
  }
  return { acq, landing: true, returning };
}

type Click = { page: string; label: string; kind: string; href: string | null };

const SELECTOR = 'a,button,[role="button"],[role="tab"],[role="menuitem"],input[type="submit"],input[type="button"],summary,[data-track]';
const FLUSH_MS = 10_000;
const FLUSH_AT = 20;

function kindOf(el: Element): string {
  const tag = el.tagName.toLowerCase();
  const role = el.getAttribute("role");
  if (role === "tab") return "tab";
  if (role === "menuitem") return "menu";
  if (tag === "a") return "link";
  if (tag === "summary") return "summary";
  if (tag === "input" || (tag === "button" && (el as HTMLButtonElement).type === "submit")) return "submit";
  if (tag === "button" || role === "button") return "button";
  return "other";
}

/** data-track, aria-label, visible text, title, else the tag. Never an input's value. */
function labelOf(el: Element): string {
  const named = el.getAttribute("data-track") || el.getAttribute("aria-label");
  if (named) return named;
  const tag = el.tagName.toLowerCase();
  if (tag !== "input") {
    const text = (el as HTMLElement).innerText ?? el.textContent ?? "";
    const s = text.replace(/\s+/g, " ").trim();
    if (s) return s.slice(0, 60);
  }
  return el.getAttribute("title") || el.getAttribute("alt") || tag;
}

/** Visible time and deepest scroll of the current page view. */
type ViewState = { id: string | null; visibleMs: number; since: number | null; scroll: number };

export default function AnalyticsTracker() {
  const pathname = usePathname() ?? "/";
  const lastTracked = useRef<string>("");
  const view = useRef<ViewState>({ id: null, visibleMs: 0, since: null, scroll: 0 });
  const trackable = isTrackablePath(pathname);

  // Engagement of the current view: sent on navigation, on hide, and with the heartbeat.
  const engagedMs = () => view.current.visibleMs + (view.current.since != null ? Date.now() - view.current.since : 0);
  const sendEngagement = (beacon: boolean) => {
    const v = view.current;
    if (!v.id) return;
    const ms = Math.min(engagedMs(), 3_600_000);
    if (ms < 1000 && !v.scroll) return;
    const body = JSON.stringify({ beat: true, sessionId: getSessionId(), view: v.id, engagedMs: Math.round(ms), scroll: v.scroll || undefined, page: normalizePath(window.location.pathname) });
    try {
      if (beacon && typeof navigator.sendBeacon === "function") {
        navigator.sendBeacon("/api/analytics/track", new Blob([body], { type: "application/json" }));
        return;
      }
    } catch {
      /* fall through */
    }
    fetch("/api/analytics/track", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(() => {});
  };

  // Page view tracking
  useEffect(() => {
    if (!trackable) return;
    if (lastTracked.current === pathname) return;
    lastTracked.current = pathname;

    const sessionId = getSessionId();
    const referrer = typeof document !== "undefined" ? document.referrer : "";
    const { acq, landing, returning } = sessionAcquisition(pathname);
    view.current = { id: null, visibleMs: 0, since: document.visibilityState === "visible" ? Date.now() : null, scroll: 0 };
    const mine = view.current;

    fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ page: normalizePath(pathname), referrer, sessionId, acq, landing, returning }),
      keepalive: true,
    })
      .then((r) => r.json())
      .then((j: { id?: unknown }) => {
        if (typeof j?.id === "string" && view.current === mine) mine.id = j.id;
      })
      .catch(() => {});
    return () => sendEngagement(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, trackable]);

  // Heartbeat keeps the "currently online" session alive and reports the
  // visible time so far. It never records a page view. Paused while hidden.
  useEffect(() => {
    if (!trackable) return;
    const sessionId = getSessionId();
    const heartbeat = () => {
      if (typeof document !== "undefined" && document.hidden) return;
      fetch("/api/analytics/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ page: normalizePath(pathname), sessionId, beat: true, view: view.current.id ?? undefined, engagedMs: Math.round(Math.min(engagedMs(), 3_600_000)), scroll: view.current.scroll || undefined }),
        keepalive: true,
      }).catch(() => {});
    };
    const interval = setInterval(heartbeat, 60_000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, trackable]);

  // Visible time, and the engagement beacon when the page is hidden or left.
  useEffect(() => {
    const onVisibility = () => {
      const v = view.current;
      if (document.visibilityState === "visible") v.since = Date.now();
      else {
        if (v.since != null) v.visibleMs += Date.now() - v.since;
        v.since = null;
        if (isTrackablePath(window.location.pathname)) sendEngagement(true);
      }
    };
    const onHide = () => {
      if (isTrackablePath(window.location.pathname)) sendEngagement(true);
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onHide);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onHide);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Scroll depth (25/50/75/100), sampled at most twice a second. Not with DNT/GPC.
  useEffect(() => {
    if (privacySignal()) return;
    let pending = false;
    const measure = () => {
      pending = false;
      const doc = document.documentElement;
      const max = Math.max(1, doc.scrollHeight - window.innerHeight);
      const share = doc.scrollHeight <= window.innerHeight + 4 ? 1 : Math.min(1, window.scrollY / max);
      const bucket = share >= 0.98 ? 100 : share >= 0.75 ? 75 : share >= 0.5 ? 50 : share >= 0.25 ? 25 : 0;
      if (bucket > view.current.scroll) view.current.scroll = bucket;
    };
    const onScroll = () => {
      if (pending) return;
      pending = true;
      setTimeout(measure, 500);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Clicks: one delegated capture-phase listener, batched.
  useEffect(() => {
    if (privacySignal()) return;
    let queue: Click[] = [];
    const flush = (beacon = false) => {
      if (!queue.length) return;
      const body = JSON.stringify({ sessionId: getSessionId(), events: queue.slice(0, 50) });
      queue = queue.slice(50);
      try {
        if (beacon && typeof navigator.sendBeacon === "function") {
          navigator.sendBeacon("/api/analytics/clicks", new Blob([body], { type: "application/json" }));
          return;
        }
      } catch {
        /* fall through to fetch */
      }
      fetch("/api/analytics/clicks", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(() => {});
    };

    function onClick(e: MouseEvent) {
      try {
        const path = window.location.pathname;
        if (!isTrackablePath(path)) return;
        const start = e.target instanceof Element ? e.target : null;
        const el = start?.closest(SELECTOR);
        if (!el || el.closest("[data-no-track]")) return;
        const label = safeLabel(labelOf(el));
        if (!label) return;
        const href = el.tagName.toLowerCase() === "a" ? hrefKey(el.getAttribute("href"), window.location.hostname) : null;
        queue.push({ page: normalizePath(path), label, kind: kindOf(el), href });
        if (queue.length >= FLUSH_AT) flush();
      } catch {
        /* analytics never breaks a click */
      }
    }
    const onHide = () => flush(true);
    const onVisibility = () => {
      if (document.visibilityState === "hidden") flush(true);
    };
    document.addEventListener("click", onClick, { capture: true, passive: true });
    window.addEventListener("pagehide", onHide);
    document.addEventListener("visibilitychange", onVisibility);
    const timer = setInterval(() => flush(), FLUSH_MS);
    return () => {
      document.removeEventListener("click", onClick, { capture: true });
      window.removeEventListener("pagehide", onHide);
      document.removeEventListener("visibilitychange", onVisibility);
      clearInterval(timer);
      flush(true);
    };
  }, []);

  return null;
}
