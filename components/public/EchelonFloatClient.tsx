"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const EchelonFloat = dynamic(() => import("@/components/public/EchelonFloat"), {
  ssr: false,
  loading: () => null,
});

// Events the assistant listens for. One arriving before it is mounted mounts
// it at once and is sent again once it is listening.
const WAKE_EVENTS = ["tibo:open", "tibo:scan-complete"] as const;

/**
 * The floating assistant, loaded once the page is idle (it was fetched during
 * hydration, competing with the page's own code and images). Opening it from
 * a "Talk to Tibo" button before then still works: the click mounts it and is
 * replayed.
 */
export default function EchelonFloatClient() {
  const [show, setShow] = useState(false);
  const [pending, setPending] = useState<Event | null>(null);

  // Load when the page is idle.
  useEffect(() => {
    if (show) return;
    const w = window as Window & {
      requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    let idle: number | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const start = () => {
      if (w.requestIdleCallback) idle = w.requestIdleCallback(() => setShow(true), { timeout: 4000 });
      else timer = setTimeout(() => setShow(true), 2000);
    };
    if (document.readyState === "complete") start();
    else window.addEventListener("load", start, { once: true });
    return () => {
      window.removeEventListener("load", start);
      if (idle !== undefined) w.cancelIdleCallback?.(idle);
      if (timer) clearTimeout(timer);
    };
  }, [show]);

  // Until the assistant is listening itself (it marks <html data-echelon-ready>),
  // an event meant for it mounts it now and is kept for replay. This covers
  // the time its code is still downloading after an idle start, too.
  useEffect(() => {
    const wake = (e: Event) => {
      if (document.documentElement.hasAttribute("data-echelon-ready")) return;
      setPending(new CustomEvent(e.type, { detail: (e as CustomEvent).detail }));
      setShow(true);
    };
    for (const name of WAKE_EVENTS) window.addEventListener(name, wake);
    return () => {
      for (const name of WAKE_EVENTS) window.removeEventListener(name, wake);
    };
  }, []);

  // Replay it once the assistant's listeners are attached.
  useEffect(() => {
    if (!show || !pending) return;
    let tries = 0;
    const id = setInterval(() => {
      tries++;
      if (document.documentElement.hasAttribute("data-echelon-ready") || tries > 100) {
        clearInterval(id);
        window.dispatchEvent(pending);
        setPending(null);
      }
    }, 100);
    return () => clearInterval(id);
  }, [show, pending]);

  return show ? <EchelonFloat /> : null;
}
