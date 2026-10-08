"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useLocale } from "@/lib/i18n/client";

// Brings every open tab onto the new version after a publish.
//
// The build time baked into this page is compared with the server's
// (/api/version) when the tab comes back into view, when the device goes
// back online, and every few minutes while it is visible. When they differ:
//   - a tab that was in the background refreshes as soon as it is shown;
//   - a tab in use shows a small "new version" bar, and the next link
//     clicked loads the new version in full;
//   - a tab left idle for 5 minutes refreshes by itself.
// Never while something is typed and not sent, or a video or audio is
// playing. A page that fails to load a script from the old build (the usual
// error after a publish) is refreshed once.

const BUILD = process.env.NEXT_PUBLIC_BUILD_TIME || "";
const CHECK_EVERY_MS = 3 * 60_000;
const IDLE_MS = 5 * 60_000;
const RELOADED_KEY = "tib-reloaded-for";
const STALE_SCRIPT = /ChunkLoadError|Loading chunk|Loading CSS chunk|dynamically imported module|Failed to find Server Action/i;

const TEXT = {
  en: { msg: "A new version of the site is available.", btn: "Refresh" },
  fr: { msg: "Une nouvelle version du site est disponible.", btn: "Actualiser" },
  sw: { msg: "Toleo jipya la tovuti linapatikana.", btn: "Onyesha upya" },
} as const;

function session(key: string, value?: string): string | null {
  try {
    if (value === undefined) return sessionStorage.getItem(key);
    sessionStorage.setItem(key, value);
  } catch {}
  return null;
}

function mediaPlaying(): boolean {
  return [...document.querySelectorAll("video, audio")].some((m) => !(m as HTMLMediaElement).paused && !(m as HTMLMediaElement).ended);
}

function editing(): boolean {
  const el = document.activeElement as HTMLElement | null;
  return !!el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));
}

export default function UpdateWatcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const [stale, setStale] = useState<string | null>(null);
  const typed = useRef(false);
  const lastActive = useRef(Date.now());
  const path = useRef(pathname);

  // Typing marks the page as holding unsent work until the next page.
  useEffect(() => {
    typed.current = false;
    path.current = pathname;
  }, [pathname]);

  useEffect(() => {
    if (!BUILD) return; // dev and preview builds have no stamp
    const onInput = (e: Event) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA)$/.test(t.tagName)) && (t as HTMLInputElement).type !== "search") typed.current = true;
    };
    const onActive = () => { lastActive.current = Date.now(); };
    document.addEventListener("input", onInput, true);
    for (const ev of ["pointerdown", "keydown", "scroll", "touchstart"]) window.addEventListener(ev, onActive, { passive: true, capture: true });
    return () => {
      document.removeEventListener("input", onInput, true);
      for (const ev of ["pointerdown", "keydown", "scroll", "touchstart"]) window.removeEventListener(ev, onActive, true);
    };
  }, []);

  useEffect(() => {
    if (!BUILD) return;
    let latest: string | null = null;
    let busy = false;
    let lastCheck = 0;

    const safe = () => !typed.current && !editing() && !mediaPlaying();
    const reload = (build: string) => {
      // One refresh per new build, so a mismatch that refreshing cannot fix never loops.
      if (session(RELOADED_KEY) === build) return false;
      session(RELOADED_KEY, build);
      window.location.reload();
      return true;
    };
    const act = (wasHidden: boolean) => {
      if (!latest) return;
      if ((wasHidden || Date.now() - lastActive.current > IDLE_MS) && safe() && reload(latest)) return;
      setStale(latest);
    };
    const check = async (wasHidden = false) => {
      if (busy || !navigator.onLine) return;
      busy = true;
      lastCheck = Date.now();
      try {
        const r = await fetch("/api/version", { cache: "no-store" });
        const { build } = (await r.json()) as { build?: string };
        if (build && build !== BUILD) latest = build;
      } catch {}
      busy = false;
      act(wasHidden);
    };

    let hiddenSince: number | null = document.hidden ? Date.now() : null;
    const onVisibility = () => {
      if (document.hidden) { hiddenSince = Date.now(); return; }
      const wasHidden = hiddenSince !== null;
      hiddenSince = null;
      void check(wasHidden);
    };
    const onOnline = () => void check(document.hidden);
    const timer = window.setInterval(() => {
      if (document.hidden) return;
      if (latest) act(false);
      else if (Date.now() - lastCheck >= CHECK_EVERY_MS) void check();
    }, 60_000);

    // A script or server action from the old build failed: the new one is live.
    const onError = (e: ErrorEvent | PromiseRejectionEvent) => {
      const reason = "reason" in e ? e.reason : e.error ?? e.message;
      const text = reason instanceof Error ? `${reason.name} ${reason.message}` : String(reason ?? "");
      if (STALE_SCRIPT.test(text) && safe()) reload(`chunk:${path.current}:${BUILD}`);
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("online", onOnline);
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onError);
    void check();
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onError);
    };
  }, []);

  // Once stale, the next in-site link loads the new version in full.
  useEffect(() => {
    if (!stale) return;
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as HTMLElement | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || (a.target && a.target !== "_self") || a.hasAttribute("download")) return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin || url.pathname.startsWith("/api/")) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search && url.hash) return;
      e.preventDefault();
      session(RELOADED_KEY, stale);
      window.location.assign(url.href);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [stale]);

  if (!stale) return null;
  const t = TEXT[(locale as keyof typeof TEXT) in TEXT ? (locale as keyof typeof TEXT) : "en"];
  return (
    <div
      role="status"
      data-testid="update-bar"
      className="fixed inset-x-0 top-0 z-[1000] flex items-center justify-center gap-3 bg-[#0B1F3A] px-4 py-2 text-center text-sm text-white shadow-md"
    >
      <span>{t.msg}</span>
      <button
        type="button"
        onClick={() => { session(RELOADED_KEY, stale); window.location.reload(); }}
        className="shrink-0 rounded-full bg-white px-3 py-1 text-xs font-bold text-[#0B1F3A] hover:bg-white/90"
      >
        {t.btn}
      </button>
    </div>
  );
}
