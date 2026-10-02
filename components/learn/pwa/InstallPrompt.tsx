"use client";

import { useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";
import { useT } from "@/lib/i18n/client";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type W = Window & { __tibInstallPrompt?: BeforeInstallPromptEvent };
type Nav = Navigator & {
  standalone?: boolean;
  getInstalledRelatedApps?: () => Promise<Array<{ platform: string; url?: string }>>;
};

// Keys in localStorage (per device and browser).
const INSTALLED = "arfa-installed";
const SNOOZE_UNTIL = "arfa-install-snooze";
const VISITS = "arfa-visits";
const DAY = 86_400_000;

function read(k: string): string | null {
  try {
    return localStorage.getItem(k);
  } catch {
    return null;
  }
}
function write(k: string, v: string) {
  try {
    localStorage.setItem(k, v);
  } catch {
    /* private mode: the prompt just shows again next time */
  }
}

/**
 * Offers to install ARFA as an app (the academy only: the manifest is linked
 * from the ARFA pages). Never shown when the app is already installed or
 * running installed, when the browser cannot install, before the learner's
 * second visit, or within the snooze period after "Not now" (14 days) or
 * "Don't ask again" (a year). Uses the browser's own install prompt where
 * there is one (Chrome, Edge, Android) and short instructions on iPhone/iPad
 * and Safari on Mac.
 */
export default function InstallPrompt() {
  const t = useT();
  const [mode, setMode] = useState<"prompt" | "ios" | "mac" | null>(null);

  useEffect(() => {
    const nav = navigator as Nav;
    const standalone = window.matchMedia("(display-mode: standalone)").matches || nav.standalone === true;
    if (standalone) {
      // Running as the installed app: remember it so the browser never asks.
      write(INSTALLED, "1");
      return;
    }
    if (read(INSTALLED) === "1") return;
    if (Number(read(SNOOZE_UNTIL) ?? 0) > Date.now()) return;

    // Count visits (once per browser session) and wait for the second one.
    try {
      if (!sessionStorage.getItem("arfa-visit-counted")) {
        sessionStorage.setItem("arfa-visit-counted", "1");
        write(VISITS, String(Number(read(VISITS) ?? 0) + 1));
      }
    } catch {
      /* ignore */
    }
    if (Number(read(VISITS) ?? 0) < 2) return;

    let cancelled = false;
    const decide = async () => {
      // Chrome on Android can tell us the app is already installed.
      try {
        const apps = (await nav.getInstalledRelatedApps?.()) ?? [];
        if (apps.length > 0) {
          write(INSTALLED, "1");
          return;
        }
      } catch {
        /* not supported */
      }
      if (cancelled) return;
      if ((window as W).__tibInstallPrompt) {
        setMode("prompt");
        return;
      }
      const ua = navigator.userAgent;
      const ios = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
      const safari = /Safari/.test(ua) && !/Chrome|CriOS|FxiOS|EdgiOS|Edg\//.test(ua);
      if (ios && safari) setMode("ios");
      else if (safari && /Macintosh/.test(ua)) setMode("mac");
    };

    // The browser's prompt can arrive late; PwaShell stashes it and signals.
    const onReady = () => void decide();
    const onInstalled = () => {
      write(INSTALLED, "1");
      setMode(null);
    };
    window.addEventListener("tib-install-ready", onReady);
    window.addEventListener("appinstalled", onInstalled);
    const timer = setTimeout(() => void decide(), 1500);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      window.removeEventListener("tib-install-ready", onReady);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!mode) return null;

  const snooze = (days: number) => {
    write(SNOOZE_UNTIL, String(Date.now() + days * DAY));
    setMode(null);
  };

  async function install() {
    const ev = (window as W).__tibInstallPrompt;
    if (!ev) return;
    await ev.prompt();
    const choice = await ev.userChoice.catch(() => null);
    (window as W).__tibInstallPrompt = undefined;
    if (choice?.outcome === "accepted") write(INSTALLED, "1");
    else write(SNOOZE_UNTIL, String(Date.now() + 14 * DAY));
    setMode(null);
  }

  return (
    <div
      role="dialog"
      aria-labelledby="arfa-install-title"
      className="fixed inset-x-3 top-[4.5rem] z-40 mx-auto max-w-md rounded-2xl border border-[var(--border)] bg-white p-4 shadow-xl sm:left-auto sm:right-4 sm:mx-0"
      data-testid="install-prompt"
    >
      <div className="flex items-start gap-3">
        <img src="/pwa/icon-192.png" alt="" width={44} height={44} className="h-11 w-11 shrink-0 rounded-xl" />
        <div className="min-w-0 flex-1">
          <p id="arfa-install-title" className="text-sm font-bold text-[var(--ink)]">{t("pwa.prompt.title")}</p>
          <p className="mt-0.5 text-xs leading-relaxed text-[var(--ink2)]">
            {mode === "prompt" ? t("pwa.prompt.body") : mode === "ios" ? t("pwa.prompt.ios") : t("pwa.prompt.mac")}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {mode === "prompt" ? (
              <button
                type="button"
                onClick={install}
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full bg-[#1B3A6B] px-4 text-xs font-bold text-white hover:opacity-90"
              >
                <Download size={14} aria-hidden /> {t("pwa.prompt.install")}
              </button>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--s2)] px-3 py-2 text-xs font-semibold text-[var(--ink2)]">
                <Share size={14} aria-hidden /> {mode === "ios" ? t("pwa.prompt.iosHint") : t("pwa.prompt.macHint")}
              </span>
            )}
            <button type="button" onClick={() => snooze(14)} className="min-h-[40px] rounded-full px-3 text-xs font-semibold text-[var(--ink3)] hover:text-[var(--ink)]">
              {t("pwa.prompt.later")}
            </button>
            <button type="button" onClick={() => snooze(365)} className="min-h-[40px] rounded-full px-3 text-xs font-semibold text-[var(--ink3)] hover:text-[var(--ink)]">
              {t("pwa.prompt.never")}
            </button>
          </div>
        </div>
        <button type="button" aria-label={t("pwa.prompt.close")} onClick={() => snooze(14)} className="rounded-full p-1 text-[var(--ink3)] hover:bg-[var(--s2)]">
          <X size={16} aria-hidden />
        </button>
      </div>
    </div>
  );
}
