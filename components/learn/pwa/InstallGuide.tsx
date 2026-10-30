"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronDown, CircleCheck, Download, Smartphone, WifiOff, Zap } from "lucide-react";
import { useT } from "@/lib/i18n/client";
import { registerServiceWorker } from "@/lib/learn/pwa/client";
import { installNow, isStandalone, useInstallPlatform } from "@/lib/learn/pwa/platform";
import { GUIDES, Guide, IconText, guideFor, hintKey } from "./InstallSteps";

/**
 * The body of /learn/install: the way to install on this device (the
 * browser's own dialog in one click, or the steps for this browser with
 * small drawings of its buttons), every other browser under "Other devices",
 * and on a computer a QR code to open this page on a phone.
 */
export default function InstallGuide({ qr, shortUrl }: { qr: string; shortUrl: string }) {
  const t = useT();
  const env = useInstallPlatform();
  const [state, setState] = useState<"idle" | "busy" | "dismissed">("idle");
  const [standalone, setStandalone] = useState(false);

  useEffect(() => {
    setStandalone(isStandalone());
    // This page sits outside the member area (it opens without signing in),
    // so it registers the service worker itself: the install needs it.
    void registerServiceWorker();
  }, []);

  async function install() {
    setState("busy");
    const r = await installNow();
    setState(r === "accepted" ? "idle" : "dismissed");
  }

  const current = env ? guideFor(env.platform) : null;
  const card = "mt-6 rounded-2xl border border-[var(--border)] bg-white p-5 sm:p-6";

  return (
    <div data-testid="install-page" data-platform={env?.platform ?? "loading"}>
      <section className={card}>
        <div className="flex items-start gap-4">
          <img src="/pwa/icon-192.png" alt="" width={64} height={64} className="h-16 w-16 shrink-0 rounded-2xl shadow-sm" />
          <div className="min-w-0">
            <h1 className="text-xl font-extrabold text-[var(--ink)] sm:text-2xl">{t("pwa.page.title")}</h1>
            <p className="mt-1.5 text-sm leading-relaxed text-[var(--ink2)]">{t("pwa.page.lead")}</p>
          </div>
        </div>
        <ul className="mt-4 grid gap-2 sm:grid-cols-3">
          {[
            [Zap, "pwa.page.why.1"],
            [WifiOff, "pwa.page.why.2"],
            [Smartphone, "pwa.page.why.3"],
          ].map(([Icon, k]) => {
            const I = Icon as typeof Zap;
            return (
              <li key={k as string} className="flex items-center gap-2 rounded-xl bg-[var(--s2)] px-3 py-2 text-xs font-semibold text-[var(--ink2)]">
                <I size={16} aria-hidden className="shrink-0 text-[#F47C20]" /> {t(k as string)}
              </li>
            );
          })}
        </ul>
      </section>

      <section className={card} aria-labelledby="install-here" data-testid="install-current" data-platform={env?.platform}>
        <h2 id="install-here" className="text-xs font-bold uppercase tracking-wider text-[var(--ink3)]">
          {t("pwa.page.here")}
        </h2>
        <div className="mt-3" aria-live="polite">
          {!env ? (
            <p className="text-sm text-[var(--ink3)]">{t("pwa.page.loading")}</p>
          ) : env.platform === "installed" ? (
            <div data-testid="install-success">
              <p className="flex items-center gap-2 text-base font-bold text-green-700">
                <CircleCheck size={20} aria-hidden /> {standalone ? t("pwa.page.running") : t("pwa.page.success.title")}
              </p>
              {!standalone && <p className="mt-1.5 text-sm leading-relaxed text-[var(--ink2)]">{t("pwa.page.success.body")}</p>}
              <Link
                href="/learn"
                className="mt-4 inline-flex min-h-[44px] items-center rounded-full bg-[#1B3A6B] px-5 text-sm font-bold text-white hover:opacity-90"
              >
                {t("pwa.page.go")} →
              </Link>
            </div>
          ) : env.platform === "prompt" ? (
            <div>
              <p className="text-sm text-[var(--ink2)]">{t("pwa.page.oneClick")}</p>
              <button
                type="button"
                onClick={install}
                disabled={state === "busy"}
                className="mt-3 inline-flex min-h-[48px] items-center gap-2 rounded-full bg-[#1B3A6B] px-6 text-sm font-bold text-white hover:opacity-90 disabled:opacity-60"
                data-testid="install-oneclick"
                data-track="cta-install-arfa-app"
              >
                <Download size={18} aria-hidden /> {state === "busy" ? t("pwa.page.installing") : t("pwa.install.button")}
              </button>
            </div>
          ) : current ? (
            <Guide id={current} env={env} t={t} />
          ) : (
            <p className="text-sm text-[var(--ink2)]">
              <IconText text={t(hintKey(env))} />
            </p>
          )}
          {state === "dismissed" && env?.platform !== "installed" && (
            <p className="mt-3 text-sm text-[var(--ink3)]" role="status">
              {t("pwa.page.dismissed")}
            </p>
          )}
        </div>
      </section>

      {env && !env.mobile && (
        <section className={`${card} flex flex-col items-center gap-5 sm:flex-row`} data-testid="install-qr">
          <div className="shrink-0 rounded-xl border border-[var(--border)] bg-white p-2" dangerouslySetInnerHTML={{ __html: qr }} />
          <div className="min-w-0 text-center sm:text-left">
            <h2 className="text-base font-bold text-[var(--ink)]">{t("pwa.page.qr.title")}</h2>
            <p className="mt-1 text-sm leading-relaxed text-[var(--ink2)]">{t("pwa.page.qr.body")}</p>
            <p className="mt-2 break-all font-mono text-sm font-semibold text-[#1B3A6B]">{shortUrl}</p>
          </div>
        </section>
      )}

      <section className={card} data-testid="install-others">
        <h2 className="text-base font-bold text-[var(--ink)]">{t("pwa.page.others")}</h2>
        <div className="mt-3 divide-y divide-[var(--border)]">
          {GUIDES.filter((g) => g !== current).map((g) => (
            <details key={g} className="group py-1" data-guide-item={g}>
              <summary className="flex min-h-[44px] cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-[var(--ink)] [&::-webkit-details-marker]:hidden">
                {t(`pwa.guide.${g}.title`)}
                <ChevronDown size={16} aria-hidden className="shrink-0 text-[var(--ink3)] transition-transform group-open:rotate-180" />
              </summary>
              <div className="pb-4 pt-1">
                <Guide id={g} t={t} showTitle={false} />
              </div>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
