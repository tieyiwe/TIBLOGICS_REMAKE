"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Download } from "lucide-react";
import { useT } from "@/lib/i18n/client";
import { installNow, useInstallPlatform } from "@/lib/learn/pwa/platform";
import { IconText, hintKey, offersInstall } from "./InstallSteps";

/**
 * "Install app" in the ARFA nav (lib/learn/pwa/platform.ts decides how).
 * Never shown in the installed app or once ARFA is installed.
 *  icon  the nav button: the browser's install dialog where there is one;
 *        on iPhone/iPad, Safari on Mac and Firefox on Android a short popover
 *        with the one step and a link to the full guide. Hidden elsewhere so
 *        the nav never nags.
 *  row   the account menu rows: the install dialog, or /learn/install with
 *        the steps for this browser (every browser that can install).
 */
export default function InstallButton({ variant = "icon" }: { variant?: "icon" | "row" }) {
  const t = useT();
  const env = useInstallPlatform();
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);

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

  if (!env || env.platform === "installed" || env.platform === "unsupported") return null;
  const prompt = env.platform === "prompt";

  if (variant === "row") {
    const cls = "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold text-[var(--ink2)] hover:bg-[var(--s2)]";
    return prompt ? (
      <button type="button" onClick={() => void installNow()} className={cls} data-testid="install-row">
        <Download size={16} aria-hidden /> {t("pwa.prompt.title")}
      </button>
    ) : (
      <Link href="/learn/install" className={cls} data-testid="install-row">
        <Download size={16} aria-hidden /> {t("pwa.prompt.title")}
      </Link>
    );
  }

  if (!offersInstall(env)) return null;

  return (
    <div ref={wrap} className="relative">
      <button
        type="button"
        onClick={() => (prompt ? void installNow() : setOpen((o) => !o))}
        aria-expanded={prompt ? undefined : open}
        aria-haspopup={prompt ? undefined : "dialog"}
        title={t("pwa.prompt.title")}
        // An obvious call to action: orange, never wrapping. Phones get the
        // short label ("Install"), wider screens the full one.
        className="inline-flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-[var(--orange)] px-3.5 text-xs font-black text-[var(--ink)] shadow-sm ring-2 ring-[var(--orange)]/30 transition hover:brightness-105"
        data-testid="install-button"
        data-platform={env.platform}
      >
        <Download size={15} strokeWidth={2.5} aria-hidden />
        <span className="lg:hidden">{t("pwa.prompt.install")}</span>
        <span className="hidden lg:inline">{t("pwa.prompt.title")}</span>
      </button>
      {open && !prompt ? (
        <div
          role="dialog"
          aria-label={t("pwa.prompt.title")}
          // Phones: across the screen under the nav (the button is not at the
          // edge, so a right-aligned popover would run off the left side).
          className="fixed inset-x-4 top-[4.5rem] z-50 rounded-xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-72 border border-[var(--border)] bg-white p-3 text-xs leading-relaxed text-[var(--ink2)] shadow-lg"
          data-testid="install-popover"
        >
          <p className="font-bold text-[var(--ink)]">{t("pwa.prompt.title")}</p>
          <p className="mt-2 font-semibold text-[var(--ink)]">
            <IconText text={t(hintKey(env))} />
          </p>
          <Link href="/learn/install" onClick={() => setOpen(false)} className="mt-3 inline-block font-bold text-[var(--blue2)] underline underline-offset-2">
            {t("pwa.install.guide")} →
          </Link>
        </div>
      ) : null}
    </div>
  );
}
