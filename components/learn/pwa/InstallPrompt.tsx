"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Download, X } from "lucide-react";
import { useT } from "@/lib/i18n/client";
import { installNow, useInstallPlatform } from "@/lib/learn/pwa/platform";
import { IconText, hintKey, offersInstall } from "./InstallSteps";

// Keys in localStorage (per device and browser). "arfa-installed" lives in
// lib/learn/pwa/platform.ts.
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
    /* private mode: the offer just shows again next time */
  }
}

/**
 * Offers to install ARFA as an app (the academy only: the manifest is linked
 * from the ARFA pages). Never shown when the app is installed or running
 * installed, before the learner's second visit, or within the snooze period
 * after "Not now" (14 days) or "Don't ask again" (a year). Uses the
 * browser's own install dialog where there is one, and the one step for
 * iPhone/iPad, Safari on Mac and Firefox on Android with a link to the full
 * guide (lib/learn/pwa/platform.ts, components/learn/pwa/InstallSteps.tsx).
 */
export default function InstallPrompt() {
  const t = useT();
  const env = useInstallPlatform();
  const [eligible, setEligible] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
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
    // The browser's prompt can arrive a moment after the page.
    const id = setTimeout(() => setEligible(true), 1500);
    return () => clearTimeout(id);
  }, []);

  if (!eligible || hidden || !env || !offersInstall(env)) return null;
  const prompt = env.platform === "prompt";

  const snooze = (days: number) => {
    write(SNOOZE_UNTIL, String(Date.now() + days * DAY));
    setHidden(true);
  };

  async function install() {
    const r = await installNow();
    if (r === "dismissed") snooze(14);
    else setHidden(true);
  }

  const body =
    env.platform === "ios-safari" || env.platform === "ios-other"
      ? t("pwa.prompt.ios")
      : env.platform === "mac-safari"
        ? t("pwa.prompt.mac")
        : t("pwa.prompt.body");

  return (
    <div
      role="dialog"
      aria-labelledby="arfa-install-title"
      className="fixed inset-x-3 top-[4.5rem] z-40 mx-auto max-w-md rounded-2xl border border-[var(--border)] bg-white p-4 shadow-xl sm:left-auto sm:right-4 sm:mx-0"
      data-testid="install-prompt"
      data-platform={env.platform}
    >
      <div className="flex items-start gap-3">
        <img src="/pwa/icon-192.png" alt="" width={44} height={44} className="h-11 w-11 shrink-0 rounded-xl" />
        <div className="min-w-0 flex-1">
          <p id="arfa-install-title" className="text-sm font-bold text-[var(--ink)]">{t("pwa.prompt.title")}</p>
          <p className="mt-0.5 text-xs leading-relaxed text-[var(--ink2)]">{body}</p>
          {!prompt && (
            <p className="mt-2 rounded-lg bg-[var(--s2)] px-3 py-2 text-xs font-semibold leading-relaxed text-[var(--ink)]">
              <IconText text={t(hintKey(env))} />
            </p>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {prompt ? (
              <button
                type="button"
                onClick={install}
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full bg-[#1B3A6B] px-4 text-xs font-bold text-white hover:opacity-90"
              >
                <Download size={14} aria-hidden /> {t("pwa.prompt.install")}
              </button>
            ) : (
              <Link
                href="/learn/install"
                onClick={() => setHidden(true)}
                className="inline-flex min-h-[40px] items-center rounded-full bg-[#1B3A6B] px-4 text-xs font-bold text-white hover:opacity-90"
              >
                {t("pwa.install.guide")}
              </Link>
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
