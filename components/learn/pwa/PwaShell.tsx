"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/lib/i18n/client";
import { QUEUE_EVENT, flushCompletions, queuedCompletions, registerServiceWorker, setOwner } from "@/lib/learn/pwa/client";

/**
 * Mounted once in the Learn member layout: registers the service worker
 * (production only), tells it who is signed in, shows an offline indicator
 * and the number of completions waiting, and sends them when the connection
 * returns (the fallback where Background Sync is missing).
 */
export default function PwaShell({ studentId }: { studentId: string }) {
  const t = useT();
  const router = useRouter();
  const [online, setOnline] = useState(true);
  const [queued, setQueued] = useState(0);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setOnline(navigator.onLine);
    const count = () => void queuedCompletions().then((q) => alive && setQueued(q.length));
    const flush = async () => {
      const done = await flushCompletions().catch(() => [] as string[]);
      count();
      if (done.length && alive) {
        setNote(t("pwa.offline.synced"));
        router.refresh();
      }
    };
    void registerServiceWorker().then((reg) => {
      if (reg) void setOwner(studentId).catch(() => {});
    });
    count();
    if (navigator.onLine) void flush();

    const goOnline = () => {
      setOnline(true);
      setNote(t("pwa.offline.back"));
      void flush();
    };
    const goOffline = () => {
      setOnline(false);
      setNote(null);
    };
    const onWorker = (e: MessageEvent) => {
      if (e.data?.type === "synced") {
        count();
        setNote(t("pwa.offline.synced"));
        router.refresh();
      }
    };
    // Keep the browser's install prompt for the "Install the app" button in
    // account settings (components/learn/pwa/AppInstall.tsx).
    const onInstallPrompt = (e: Event) => {
      e.preventDefault();
      (window as Window & { __tibInstallPrompt?: Event }).__tibInstallPrompt = e;
      window.dispatchEvent(new Event("tib-install-ready"));
    };
    window.addEventListener("beforeinstallprompt", onInstallPrompt);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    window.addEventListener(QUEUE_EVENT, count);
    if ("serviceWorker" in navigator) navigator.serviceWorker.addEventListener("message", onWorker);
    return () => {
      alive = false;
      window.removeEventListener("beforeinstallprompt", onInstallPrompt);
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
      window.removeEventListener(QUEUE_EVENT, count);
      if ("serviceWorker" in navigator) navigator.serviceWorker.removeEventListener("message", onWorker);
    };
    // studentId is fixed for the life of the layout.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId]);

  useEffect(() => {
    if (!note) return;
    const id = setTimeout(() => setNote(null), 5000);
    return () => clearTimeout(id);
  }, [note]);

  const lines = [
    !online ? t("pwa.offline.banner") : null,
    queued > 0 ? t(queued === 1 ? "pwa.offline.queued.one" : "pwa.offline.queued.other", { n: queued }) : null,
    online && note ? note : null,
  ].filter(Boolean) as string[];

  return (
    <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4">
      {lines.length > 0 && (
        <p
          data-testid="pwa-status"
          className={`pointer-events-auto max-w-md rounded-2xl px-4 py-2.5 text-center text-sm font-semibold shadow-lg ${
            online ? "bg-[var(--ink)] text-white" : "bg-amber-100 text-amber-950 ring-1 ring-amber-300"
          }`}
        >
          {!online && (
            <span aria-hidden="true" className="mr-1.5 inline-block h-2 w-2 rounded-full bg-amber-600 align-middle" />
          )}
          {lines.join(" ")}
        </p>
      )}
    </div>
  );
}
