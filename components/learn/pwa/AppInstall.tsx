"use client";

import { useEffect, useState } from "react";
import { useT } from "@/lib/i18n/client";
import { clearOfflineData, downloadedLessons } from "@/lib/learn/pwa/client";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/**
 * Account settings: install the Learn app (the browser's own prompt where
 * there is one, instructions on iOS and elsewhere) and the lessons saved on
 * this device.
 */
export default function AppInstall() {
  const t = useT();
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [ios, setIos] = useState(false);
  const [count, setCount] = useState<number | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    const nav = navigator as Navigator & { standalone?: boolean };
    setInstalled(window.matchMedia("(display-mode: standalone)").matches || nav.standalone === true);
    setIos(/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));
    void downloadedLessons().then((d) => setCount(d.length));
    // PwaShell keeps the event (it can fire before this page opens).
    const stashed = () => (window as Window & { __tibInstallPrompt?: BeforeInstallPromptEvent }).__tibInstallPrompt ?? null;
    setPrompt(stashed());
    const onPrompt = () => setPrompt(stashed());
    const onInstalled = () => {
      try {
        localStorage.setItem("arfa-installed", "1");
      } catch {
        /* ignore */
      }
      setInstalled(true);
      setPrompt(null);
    };
    window.addEventListener("tib-install-ready", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("tib-install-ready", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function install() {
    if (!prompt) return;
    await prompt.prompt();
    const choice = await prompt.userChoice.catch(() => null);
    if (choice?.outcome === "accepted") setInstalled(true);
    // A prompt can be shown once.
    (window as Window & { __tibInstallPrompt?: Event }).__tibInstallPrompt = undefined;
    setPrompt(null);
  }

  async function clear() {
    await clearOfflineData();
    setCount(0);
    setMsg(t("pwa.install.cleared"));
  }

  return (
    <section id="app" className="mt-6 rounded-2xl border border-[var(--border)] bg-white p-6" data-testid="app-install">
      <h2 className="text-sm font-bold text-[var(--ink)]">{t("pwa.install.title")}</h2>
      <p className="mt-1 text-sm text-[var(--ink2)]">{t("pwa.install.body")}</p>

      <div className="mt-4">
        {installed ? (
          <p className="text-sm font-semibold text-green-700">✓ {t("pwa.install.installed")}</p>
        ) : prompt ? (
          <button
            type="button"
            onClick={install}
            className="min-h-[44px] rounded-full bg-[#1B3A6B] px-5 py-2.5 text-sm font-bold text-white hover:opacity-90"
          >
            ⬇ {t("pwa.install.button")}
          </button>
        ) : (
          <p className="rounded-lg bg-[var(--s2)] px-3 py-2 text-sm text-[var(--ink2)]">{ios ? t("pwa.install.ios") : t("pwa.install.other")}</p>
        )}
      </div>

      {count != null && (
        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-[var(--border)] pt-4">
          <p className="text-xs text-[var(--ink3)]">{count > 0 ? t("pwa.install.count", { n: count }) : t("pwa.install.none")}</p>
          {count > 0 && (
            <button type="button" onClick={clear} className="text-xs font-semibold text-red-700 underline">
              {t("pwa.install.clear")}
            </button>
          )}
        </div>
      )}
      {msg && (
        <p role="status" className="mt-2 text-xs text-[var(--ink3)]">
          {msg}
        </p>
      )}
    </section>
  );
}
