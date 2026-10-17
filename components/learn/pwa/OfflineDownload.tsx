"use client";

import { useCallback, useEffect, useState } from "react";
import { useT } from "@/lib/i18n/client";
import { downloadPages, isSaved, pwaEnabled, removeDownloads, type DownloadPage } from "@/lib/learn/pwa/client";

interface ModuleItem {
  id: string;
  title: string;
  lessons: Array<{ id: string; title: string }>;
}

/**
 * "Download for offline" on a track page: the whole track or one module.
 * Saves each lesson page (in the learner's language, as the server renders it
 * for them), the track page and the dashboard, with their scripts, styles and
 * images, through the service worker (public/sw.js).
 */
export default function OfflineDownload({ trackSlug, trackTitle, modules, accentColor }: { trackSlug: string; trackTitle: string; modules: ModuleItem[]; accentColor: string }) {
  const t = useT();
  const [supported, setSupported] = useState<boolean | null>(null);
  const [online, setOnline] = useState(true);
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const allLessons = modules.flatMap((m) => m.lessons);
  const total = allLessons.length;

  const refresh = useCallback(async () => {
    const hits = await Promise.all(allLessons.map(async (l) => ((await isSaved(`/learn/lesson/${l.id}`)) ? l.id : null)));
    setSaved(new Set(hits.filter(Boolean) as string[]));
    // allLessons is derived from props, which do not change on this page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setSupported(pwaEnabled() && typeof caches !== "undefined");
    setOnline(navigator.onLine);
    void refresh();
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, [refresh]);

  async function save(key: string, lessons: Array<{ id: string; title: string }>) {
    if (busy) return;
    setBusy(key);
    setMsg(null);
    const pages: DownloadPage[] = [
      ...lessons.map((l) => ({ url: `/learn/lesson/${l.id}`, title: l.title, track: trackTitle, kind: "lesson" as const })),
      { url: `/learn/track/${trackSlug}`, kind: "page" },
      { url: "/learn", kind: "page" },
    ];
    setProgress({ done: 0, total: pages.length });
    try {
      const r = await downloadPages(pages, (done, n) => setProgress({ done, total: n }));
      setMsg(r.failed > 0 ? t("pwa.download.failed", { n: r.failed }) : t("pwa.download.done"));
    } catch {
      setMsg(t("pwa.download.unsupported"));
    } finally {
      setBusy(null);
      setProgress(null);
      await refresh();
    }
  }

  async function remove() {
    await removeDownloads(allLessons.map((l) => `/learn/lesson/${l.id}`));
    // The worker removes them in the background; give it a moment.
    setTimeout(() => void refresh(), 400);
    setMsg(t("pwa.download.removed"));
  }

  if (supported === null || total === 0) return null;

  const btn =
    "rounded-full border px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 min-h-[40px]";

  return (
    <section aria-labelledby="offline-title" className="rounded-2xl border border-[var(--border)] bg-white p-6" data-testid="offline-download">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1" style={{ flexBasis: 220 }}>
          <h2 id="offline-title" className="text-base font-bold text-[var(--ink)]">
            {t("pwa.download.title")}
          </h2>
          <p className="mt-1 text-sm text-[var(--ink2)]">{t("pwa.download.body")}</p>
          <p className="mt-2 text-xs text-[var(--ink3)]" data-testid="offline-count">
            {t("pwa.download.count", { n: saved.size, total })}
          </p>
        </div>
        {supported && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => save("track", allLessons)}
              disabled={!!busy || !online}
              className={`${btn} border-transparent text-white`}
              style={{ background: accentColor }}
            >
              ⬇ {t("pwa.download.track")}
            </button>
            {saved.size > 0 && (
              <button type="button" onClick={remove} disabled={!!busy} className={`${btn} border-[var(--border)] bg-white text-[var(--ink2)]`}>
                {t("pwa.download.remove")}
              </button>
            )}
          </div>
        )}
      </div>

      {!supported && <p className="mt-3 text-xs text-[var(--ink3)]">{t("pwa.download.unsupported")}</p>}
      {supported && !online && <p className="mt-3 text-xs font-semibold text-amber-800">{t("pwa.download.offlineNow")}</p>}

      {supported && (
        <ul className="mt-4 divide-y divide-[var(--border)]">
          {modules.map((m, i) => {
            const have = m.lessons.filter((l) => saved.has(l.id)).length;
            const all = have === m.lessons.length && have > 0;
            return (
              <li key={m.id} className="flex items-center justify-between gap-3 py-2.5">
                <span className="min-w-0 flex-1 truncate text-sm text-[var(--ink2)]">
                  {i + 1}. {m.title}
                </span>
                {all ? (
                  <span className="shrink-0 text-xs font-semibold text-green-700">✓ {t("pwa.download.saved")}</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => save(m.id, m.lessons)}
                    disabled={!!busy || !online || m.lessons.length === 0}
                    aria-label={t("pwa.download.moduleLabel", { n: i + 1 })}
                    className={`${btn} shrink-0 border-[var(--border)] bg-white py-1.5 text-xs text-[var(--ink)]`}
                  >
                    ⬇ {t("pwa.download.module")}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <p role="status" aria-live="polite" className="mt-2 text-xs font-semibold text-[var(--ink2)]">
        {progress ? t("pwa.download.saving", { done: progress.done, total: progress.total }) : msg}
      </p>
    </section>
  );
}
