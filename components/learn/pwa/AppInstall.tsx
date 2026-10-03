"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useT } from "@/lib/i18n/client";
import { clearOfflineData, downloadedLessons } from "@/lib/learn/pwa/client";
import { installNow, isStandalone, useInstallPlatform } from "@/lib/learn/pwa/platform";
import { IconText, hintKey } from "./InstallSteps";

/**
 * Account settings: install the Learn app (the browser's own dialog where
 * there is one, the step for this browser elsewhere, with the full guide at
 * /learn/install; lib/learn/pwa/platform.ts) and the lessons saved on this
 * device.
 */
export default function AppInstall() {
  const t = useT();
  const env = useInstallPlatform();
  const [count, setCount] = useState<number | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    void downloadedLessons().then((d) => setCount(d.length));
  }, []);

  async function clear() {
    await clearOfflineData();
    setCount(0);
    setMsg(t("pwa.install.cleared"));
  }

  const link = "text-sm font-semibold text-[var(--blue2)] underline underline-offset-2";

  return (
    <section id="app" className="mt-6 rounded-2xl border border-[var(--border)] bg-white p-6" data-testid="app-install" data-platform={env?.platform}>
      <h2 className="text-sm font-bold text-[var(--ink)]">{t("pwa.install.title")}</h2>
      <p className="mt-1 text-sm text-[var(--ink2)]">{t("pwa.install.body")}</p>

      <div className="mt-4 space-y-3">
        {!env ? null : env.platform === "installed" ? (
          <>
            <p className="text-sm font-semibold text-green-700">✓ {t(isStandalone() ? "pwa.page.running" : "pwa.install.installed")}</p>
            {!isStandalone() && <p className="text-sm text-[var(--ink2)]">{t("pwa.install.open")}</p>}
          </>
        ) : env.platform === "prompt" ? (
          <button
            type="button"
            onClick={() => void installNow()}
            className="min-h-[44px] rounded-full bg-[#1B3A6B] px-5 py-2.5 text-sm font-bold text-white hover:opacity-90"
            data-testid="app-install-button"
          >
            ⬇ {t("pwa.install.button")}
          </button>
        ) : (
          <>
            <p className="rounded-lg bg-[var(--s2)] px-3 py-2 text-sm leading-relaxed text-[var(--ink2)]">
              <IconText text={t(hintKey(env))} />
            </p>
            <Link href="/learn/install" className={link}>
              {t("pwa.install.guide")} →
            </Link>
          </>
        )}
        {env && (env.platform === "installed" || env.platform === "prompt") && (
          <p>
            <Link href="/learn/install" className={link}>
              {t("pwa.install.otherDevice")} →
            </Link>
          </p>
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
