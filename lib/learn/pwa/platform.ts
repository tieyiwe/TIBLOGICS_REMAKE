"use client";

// Which way this browser can install ARFA, shared by the install offer
// (InstallPrompt), the nav button (InstallButton), the account card
// (AppInstall) and /learn/install. detectInstallPlatform() is pure (user
// agent in, platform out) so it can be checked with any browser string; the
// hook adds the live signals: the stashed beforeinstallprompt event, running
// installed, the "installed" flag and getInstalledRelatedApps().
//
// Browser support (October 2026):
//   prompt                     beforeinstallprompt fired: Chrome, Edge, Opera,
//                              Samsung Internet, Brave (desktop and Android)
//   ios-safari                 Share, then Add to Home Screen
//   ios-other                  Chrome, Edge, Firefox on iOS 16.4+: same; older
//                              iOS or in-app browsers: open in Safari (legacy)
//   mac-safari                 Safari 17+ (Sonoma): File, Add to Dock; older
//                              Safari cannot (legacy: suggest Chrome or Edge)
//   android-firefox            menu, then Add app to Home screen
//   android-other-no-prompt    Chromium on Android before the prompt fires (or
//                              in-app browser: open in Chrome)
//   desktop-chromium-no-prompt Chrome, Edge, Opera, Brave before the prompt
//                              fires: install icon in the address bar or menu
//   firefox-desktop            no app install: pin the tab or use Chrome/Edge
//   installed / unsupported

import { useEffect, useState } from "react";

export type InstallPlatform =
  | "prompt"
  | "ios-safari"
  | "ios-other"
  | "mac-safari"
  | "android-firefox"
  | "android-other-no-prompt"
  | "desktop-chromium-no-prompt"
  | "firefox-desktop"
  | "installed"
  | "unsupported";

export type InstallBrowser = "chrome" | "edge" | "opera" | "samsung" | "brave" | "firefox" | "safari" | "inapp" | "other";

export interface InstallEnv {
  platform: InstallPlatform;
  browser: InstallBrowser;
  os: "ios" | "android" | "mac" | "windows" | "linux" | "chromeos" | "other";
  mobile: boolean;
  /** ios-other: iOS before 16.4 or an in-app browser; mac-safari: Safari before 17. */
  legacy: boolean;
}

export interface DetectInput {
  ua: string;
  maxTouchPoints?: number;
  /** navigator.platform, for iPadOS that reports itself as a Mac. */
  navPlatform?: string;
  /** navigator.brave exists (Brave hides itself in the user agent). */
  brave?: boolean;
  hasPrompt?: boolean;
  installed?: boolean;
}

const IN_APP = /FBAN|FBAV|FB_IAB|Instagram|LinkedInApp|Line\/|Twitter|Snapchat|TikTok|musical_ly|GSA\/|WhatsApp|; wv\)/;

export function detectInstallPlatform(i: DetectInput): InstallEnv {
  const ua = i.ua || "";
  const ipadAsMac = /Macintosh/.test(ua) && (i.maxTouchPoints ?? 0) > 1;
  const ios = /iPhone|iPad|iPod/.test(ua) || ipadAsMac || (i.navPlatform === "MacIntel" && (i.maxTouchPoints ?? 0) > 1);
  const android = !ios && /Android/.test(ua);
  const os: InstallEnv["os"] = ios
    ? "ios"
    : android
      ? "android"
      : /CrOS/.test(ua)
        ? "chromeos"
        : /Macintosh|Mac OS X/.test(ua)
          ? "mac"
          : /Windows/.test(ua)
            ? "windows"
            : /Linux/.test(ua)
              ? "linux"
              : "other";
  const mobile = ios || android;
  const inApp = IN_APP.test(ua);
  const browser: InstallBrowser = inApp
    ? "inapp"
    : /SamsungBrowser/.test(ua)
      ? "samsung"
      : /EdgiOS|EdgA|Edg\//.test(ua)
        ? "edge"
        : /OPR\/|OPT\/|OPiOS|Opera/.test(ua)
          ? "opera"
          : i.brave
            ? "brave"
            : /FxiOS|Firefox\//.test(ua)
              ? "firefox"
              : /CriOS|Chrome\/|Chromium\//.test(ua)
                ? "chrome"
                : /Safari\//.test(ua) && /Version\//.test(ua)
                  ? "safari"
                  : "other";
  const env = (platform: InstallPlatform, legacy = false): InstallEnv => ({ platform, browser, os, mobile, legacy });

  if (i.installed) return env("installed");
  // The browser's own install dialog is the best path wherever it exists.
  if (i.hasPrompt) return env("prompt");

  if (ios) {
    if (browser === "safari") return env("ios-safari");
    // Other iOS browsers gained Add to Home Screen in iOS 16.4.
    const m = /OS (\d+)[_.](\d+)/.exec(ua) ?? /Version\/(\d+)\.(\d+)/.exec(ua);
    const v = m ? Number(m[1]) + Number(m[2]) / 100 : 99;
    return env("ios-other", inApp || v < 16.04);
  }
  if (android) {
    if (browser === "firefox") return env("android-firefox");
    return env("android-other-no-prompt", inApp);
  }
  if (browser === "safari" && os === "mac") {
    const v = Number(/Version\/(\d+)/.exec(ua)?.[1] ?? 0);
    return env("mac-safari", v < 17);
  }
  if (browser === "firefox") return env("firefox-desktop");
  if (["chrome", "edge", "opera", "brave"].includes(browser)) return env("desktop-chromium-no-prompt");
  return env("unsupported");
}

// ── Live state ─────────────────────────────────────────────────────────────

export interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}
type W = Window & { __tibInstallPrompt?: BeforeInstallPromptEvent };
type Nav = Navigator & {
  standalone?: boolean;
  brave?: unknown;
  getInstalledRelatedApps?: () => Promise<Array<{ platform: string; url?: string }>>;
};

/** localStorage key shared by every install surface. */
export const INSTALLED_KEY = "arfa-installed";
export const INSTALL_READY_EVENT = "tib-install-ready";

export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const mq = (q: string) => {
    try {
      return window.matchMedia(q).matches;
    } catch {
      return false;
    }
  };
  return (
    mq("(display-mode: standalone)") ||
    mq("(display-mode: minimal-ui)") ||
    mq("(display-mode: window-controls-overlay)") ||
    (navigator as Nav).standalone === true
  );
}

export function installedFlag(): boolean {
  try {
    return localStorage.getItem(INSTALLED_KEY) === "1";
  } catch {
    return false;
  }
}

export function markInstalled() {
  try {
    localStorage.setItem(INSTALLED_KEY, "1");
  } catch {
    /* private mode */
  }
}

export function stashedPrompt(): BeforeInstallPromptEvent | null {
  return typeof window === "undefined" ? null : ((window as W).__tibInstallPrompt ?? null);
}

/**
 * Keeps the browser's install prompt for our own buttons. The early inline
 * script in app/learn/layout.tsx does the same before hydration; this is the
 * fallback, and safe to call more than once.
 */
export function captureInstallPrompt(): () => void {
  const on = (e: Event) => {
    e.preventDefault();
    (window as W).__tibInstallPrompt = e as BeforeInstallPromptEvent;
    window.dispatchEvent(new Event(INSTALL_READY_EVENT));
  };
  window.addEventListener("beforeinstallprompt", on);
  return () => window.removeEventListener("beforeinstallprompt", on);
}

/** Shows the browser's install dialog. Resolves to the outcome, or null without a prompt. */
export async function runInstallPrompt(): Promise<"accepted" | "dismissed" | null> {
  const ev = stashedPrompt();
  if (!ev) return null;
  // A prompt can be shown once.
  (window as W).__tibInstallPrompt = undefined;
  try {
    await ev.prompt();
    const choice = await ev.userChoice;
    if (choice?.outcome === "accepted") {
      markInstalled();
      return "accepted";
    }
    return "dismissed";
  } catch {
    return "dismissed";
  }
}

export function currentEnv(extra: { relatedInstalled?: boolean } = {}): InstallEnv {
  const nav = navigator as Nav;
  return detectInstallPlatform({
    ua: navigator.userAgent,
    maxTouchPoints: navigator.maxTouchPoints,
    navPlatform: navigator.platform,
    brave: !!nav.brave,
    hasPrompt: !!stashedPrompt(),
    installed: isStandalone() || installedFlag() || !!extra.relatedInstalled,
  });
}

/**
 * The install platform for this browser, kept up to date: null until the
 * first check on the client (so nothing flashes on the server render), then
 * re-checked when the prompt arrives and after "appinstalled".
 */
export function useInstallPlatform(): InstallEnv | null {
  const [env, setEnv] = useState<InstallEnv | null>(null);
  useEffect(() => {
    let alive = true;
    let related = false;
    const update = () => alive && setEnv(currentEnv({ relatedInstalled: related }));
    if (isStandalone()) markInstalled(); // running as the app: remember it in this browser
    update();
    // Chrome on Android (and desktop) can say the app is already installed.
    void (navigator as Nav)
      .getInstalledRelatedApps?.()
      .then((apps) => {
        if (apps?.length) {
          related = true;
          markInstalled();
          update();
        }
      })
      .catch(() => {});
    const stop = captureInstallPrompt();
    const onInstalled = () => {
      markInstalled();
      update();
    };
    window.addEventListener(INSTALL_READY_EVENT, update);
    window.addEventListener("appinstalled", onInstalled);
    // Another tab or surface (account card, install page) installed it.
    window.addEventListener("storage", update);
    window.addEventListener("tib-installed", update);
    return () => {
      alive = false;
      stop();
      window.removeEventListener(INSTALL_READY_EVENT, update);
      window.removeEventListener("appinstalled", onInstalled);
      window.removeEventListener("storage", update);
      window.removeEventListener("tib-installed", update);
    };
  }, []);
  return env;
}

/** Runs the prompt and tells every install surface on the page. */
export async function installNow(): Promise<"accepted" | "dismissed" | null> {
  const r = await runInstallPrompt();
  window.dispatchEvent(new Event(r === "accepted" ? "tib-installed" : INSTALL_READY_EVENT));
  return r;
}

/** Short guide for the platforms that need steps (the nav popover and the prompt). */
export function needsSteps(p: InstallPlatform): boolean {
  return p !== "prompt" && p !== "installed" && p !== "unsupported";
}
