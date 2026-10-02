"use client";

import { useEffect, useRef, useState } from "react";
import { Download } from "lucide-react";
import { useT } from "@/lib/i18n/client";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}
type W = Window & { __tibInstallPrompt?: BeforeInstallPromptEvent };
type Nav = Navigator & { standalone?: boolean; getInstalledRelatedApps?: () => Promise<unknown[]> };

/**
 * "Install app" button in the ARFA nav. Visible only when this browser can
 * install ARFA and it is not installed yet (and never inside the installed
 * app). Opens the browser's install dialog, or short instructions on
 * iPhone/iPad and Safari on Mac. Shares the "installed" flag with
 * InstallPrompt and the account settings card.
 */
export default function InstallButton({ variant = "icon" }: { variant?: "icon" | "row" }) {
  const t = useT();
  const [mode, setMode] = useState<"prompt" | "ios" | "mac" | null>(null);
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const nav = navigator as Nav;
    if (window.matchMedia("(display-mode: standalone)").matches || nav.standalone === true) return;
    try {
      if (localStorage.getItem("arfa-installed") === "1") return;
    } catch {
      /* ignore */
    }
    let cancelled = false;
    const decide = async () => {
      try {
        if (((await nav.getInstalledRelatedApps?.()) ?? []).length > 0) return;
      } catch {
        /* not supported */
      }
      if (cancelled) return;
      if ((window as W).__tibInstallPrompt) return setMode("prompt");
      const ua = navigator.userAgent;
      const ios = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
      const safari = /Safari/.test(ua) && !/Chrome|CriOS|FxiOS|EdgiOS|Edg\//.test(ua);
      if (ios && safari) setMode("ios");
      else if (safari && /Macintosh/.test(ua)) setMode("mac");
    };
    const onReady = () => void decide();
    const onInstalled = () => {
      try {
        localStorage.setItem("arfa-installed", "1");
      } catch {
        /* ignore */
      }
      setMode(null);
    };
    window.addEventListener("tib-install-ready", onReady);
    window.addEventListener("appinstalled", onInstalled);
    void decide();
    return () => {
      cancelled = true;
      window.removeEventListener("tib-install-ready", onReady);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!mode) return null;

  async function click() {
    if (mode !== "prompt") return setOpen((o) => !o);
    const ev = (window as W).__tibInstallPrompt;
    if (!ev) return;
    await ev.prompt();
    const choice = await ev.userChoice.catch(() => null);
    (window as W).__tibInstallPrompt = undefined;
    if (choice?.outcome === "accepted") {
      try {
        localStorage.setItem("arfa-installed", "1");
      } catch {
        /* ignore */
      }
      setMode(null);
    }
  }

  const label = t("pwa.prompt.install");
  return (
    <div ref={wrap} className="relative">
      {variant === "row" ? (
        <button
          type="button"
          onClick={click}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold text-[var(--ink2)] hover:bg-[var(--s2)]"
        >
          <Download size={16} aria-hidden /> {t("pwa.prompt.title")}
        </button>
      ) : (
        <button
          type="button"
          onClick={click}
          aria-expanded={mode === "prompt" ? undefined : open}
          title={t("pwa.prompt.title")}
          className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[var(--border)] bg-white px-3 text-xs font-bold text-[var(--ink)] hover:bg-[var(--s2)]"
          data-testid="install-button"
        >
          <Download size={14} aria-hidden />
          <span className="hidden sm:inline">{label}</span>
          <span className="sr-only sm:hidden">{t("pwa.prompt.title")}</span>
        </button>
      )}
      {open && mode !== "prompt" ? (
        <div role="dialog" className="absolute right-0 top-full z-50 mt-2 w-64 rounded-xl border border-[var(--border)] bg-white p-3 text-xs leading-relaxed text-[var(--ink2)] shadow-lg">
          <p className="font-bold text-[var(--ink)]">{t("pwa.prompt.title")}</p>
          <p className="mt-1">{mode === "ios" ? t("pwa.prompt.ios") : t("pwa.prompt.mac")}</p>
          <p className="mt-2 font-semibold text-[var(--ink)]">{mode === "ios" ? t("pwa.prompt.iosHint") : t("pwa.prompt.macHint")}</p>
        </div>
      ) : null}
    </div>
  );
}
