"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

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
    body: JSON.stringify({ event, page, sessionId, meta }),
    keepalive: true,
  }).catch(() => {});
}

export { trackEvent };

export default function AnalyticsTracker() {
  const pathname = usePathname();
  const lastTracked = useRef<string>("");

  // Page view tracking
  useEffect(() => {
    if (lastTracked.current === pathname) return;
    lastTracked.current = pathname;

    const sessionId = getSessionId();
    const referrer = typeof document !== "undefined" ? document.referrer : "";

    fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ page: pathname, referrer, sessionId }),
      keepalive: true,
    }).catch(() => {});
  }, [pathname]);

  // Heartbeat every 45s to keep active session alive
  useEffect(() => {
    const sessionId = getSessionId();
    const heartbeat = () => {
      fetch("/api/analytics/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ page: pathname, referrer: "", sessionId }),
        keepalive: true,
      }).catch(() => {});
    };
    const interval = setInterval(heartbeat, 45_000);
    return () => clearInterval(interval);
  }, [pathname]);

  // Click tracking on elements with data-track attribute
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = (e.target as HTMLElement).closest("[data-track]") as HTMLElement | null;
      if (!target) return;
      const eventName = target.dataset.track;
      if (!eventName) return;
      trackEvent(eventName, pathname, { label: target.innerText?.slice(0, 60) });
    }
    document.addEventListener("click", handleClick, { passive: true });
    return () => document.removeEventListener("click", handleClick);
  }, [pathname]);

  return null;
}
