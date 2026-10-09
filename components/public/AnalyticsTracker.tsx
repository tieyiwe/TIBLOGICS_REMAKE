"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { hrefKey, isTrackablePath, normalizePath, safeLabel } from "@/lib/analytics/paths";

// First-party analytics for the whole platform (mounted once, in the root
// layout): page views and the "online now" heartbeat (/api/analytics/track),
// and which links and buttons are clicked (/api/analytics/clicks).
//
// Never on the admin area, the APIs, or pages whose path holds a secret
// (/parent/<token>, /play/<token>): isTrackablePath. Recorded paths have no
// query string and ids or tokens are replaced (lib/analytics/paths.ts).
// Clicks record the control's name and kind, never what anyone typed, and are
// skipped when the browser sends Do Not Track or Global Privacy Control, or
// inside [data-no-track].

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

export { trackEvent };

/** Do Not Track or Global Privacy Control. */
export function privacySignal(): boolean {
  if (typeof navigator === "undefined") return false;
  const n = navigator as Navigator & { globalPrivacyControl?: boolean; msDoNotTrack?: string };
  const w = typeof window !== "undefined" ? (window as Window & { doNotTrack?: string }) : undefined;
  return n.globalPrivacyControl === true || n.doNotTrack === "1" || n.doNotTrack === "yes" || n.msDoNotTrack === "1" || w?.doNotTrack === "1";
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

export default function AnalyticsTracker() {
  const pathname = usePathname() ?? "/";
  const lastTracked = useRef<string>("");
  const trackable = isTrackablePath(pathname);

  // Page view tracking
  useEffect(() => {
    if (!trackable) return;
    if (lastTracked.current === pathname) return;
    lastTracked.current = pathname;

    const sessionId = getSessionId();
    const referrer = typeof document !== "undefined" ? document.referrer : "";

    fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ page: normalizePath(pathname), referrer, sessionId }),
      keepalive: true,
    }).catch(() => {});
  }, [pathname, trackable]);

  // Heartbeat keeps the "currently online" session alive. It deliberately
  // does NOT record a page view — it posts beat:true so the server only
  // refreshes ActiveSession. Paused while the tab is hidden, since a
  // backgrounded tab is not an active reader.
  useEffect(() => {
    if (!trackable) return;
    const sessionId = getSessionId();
    const heartbeat = () => {
      if (typeof document !== "undefined" && document.hidden) return;
      fetch("/api/analytics/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ page: normalizePath(pathname), sessionId, beat: true }),
        keepalive: true,
      }).catch(() => {});
    };
    const interval = setInterval(heartbeat, 120_000);
    return () => clearInterval(interval);
  }, [pathname, trackable]);

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
