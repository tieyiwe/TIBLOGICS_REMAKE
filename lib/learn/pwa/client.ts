"use client";

// Browser side of the Learn app: service worker registration, the offline
// completion queue and "Download for offline". The service worker is
// public/sw.js; the IndexedDB database and its stores must match it.

const DB_NAME = "tib-learn-offline";
const DB_VERSION = 1;
export const SYNC_TAG = "tib-completions";
export const QUEUE_EVENT = "tib-learn-queue";

/** Production only (a dev server rebuilds chunks all the time), unless NEXT_PUBLIC_PWA_DEV=1. */
export function pwaEnabled(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    (process.env.NODE_ENV === "production" || process.env.NEXT_PUBLIC_PWA_DEV === "1")
  );
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!pwaEnabled()) return null;
  try {
    return await navigator.serviceWorker.register("/sw.js", { scope: "/learn", updateViaCache: "none" });
  } catch (err) {
    console.warn("[pwa] service worker", err);
    return null;
  }
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("queue")) db.createObjectStore("queue", { keyPath: "lessonId" });
      if (!db.objectStoreNames.contains("downloads")) db.createObjectStore("downloads", { keyPath: "url" });
      if (!db.objectStoreNames.contains("meta")) db.createObjectStore("meta", { keyPath: "key" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function tx<T>(store: string, mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T> | void): Promise<T | undefined> {
  const db = await openDb();
  try {
    return await new Promise<T | undefined>((resolve, reject) => {
      const t = db.transaction(store, mode);
      const r = fn(t.objectStore(store));
      t.oncomplete = () => resolve(r ? r.result : undefined);
      t.onerror = () => reject(t.error);
      t.onabort = () => reject(t.error);
    });
  } finally {
    db.close();
  }
}

export interface QueuedCompletion {
  lessonId: string;
  queuedAt: number;
  owner: string | null;
}

export interface DownloadRow {
  url: string;
  title: string;
  track: string;
  savedAt: number;
}

async function owner(): Promise<string | null> {
  const row = await tx<{ key: string; value: string } | undefined>("meta", "readonly", (s) => s.get("owner")).catch(() => undefined);
  return row?.value ?? null;
}

/** Tell the worker (and this page) who is signed in; a change clears the last learner's data. */
export async function setOwner(studentId: string): Promise<void> {
  if (!pwaEnabled()) return;
  const reg = await navigator.serviceWorker.ready;
  reg.active?.postMessage({ type: "owner", owner: studentId });
}

export async function queuedCompletions(): Promise<QueuedCompletion[]> {
  if (typeof indexedDB === "undefined") return [];
  return ((await tx<QueuedCompletion[]>("queue", "readonly", (s) => s.getAll()).catch(() => [])) ?? []) as QueuedCompletion[];
}

const announce = () => window.dispatchEvent(new Event(QUEUE_EVENT));

/**
 * Keep a "mark complete" made offline. Returns false when this browser cannot
 * store it (no IndexedDB), so the caller can say the save failed.
 */
export async function queueCompletion(lessonId: string): Promise<boolean> {
  if (typeof indexedDB === "undefined") return false;
  try {
    const row: QueuedCompletion = { lessonId, queuedAt: Date.now(), owner: await owner() };
    await tx("queue", "readwrite", (s) => s.put(row));
  } catch {
    return false;
  }
  announce();
  // Background Sync where the browser has it; the "online" listener in
  // PwaShell covers the others.
  try {
    const reg = pwaEnabled() ? await navigator.serviceWorker.ready : null;
    const sync = (reg as (ServiceWorkerRegistration & { sync?: { register(tag: string): Promise<void> } }) | null)?.sync;
    if (sync) await sync.register(SYNC_TAG);
  } catch {
    /* the online event will send it */
  }
  return true;
}
let flushing: Promise<string[]> | null = null;

/**
 * Send queued completions to /api/learn/progress (idempotent; the server
 * decides). Used when the page comes back online; the worker's Background
 * Sync does the same. Returns the lesson ids the server accepted.
 */
export function flushCompletions(): Promise<string[]> {
  flushing ??= (async () => {
    const me = await owner();
    const done: string[] = [];
    for (const item of await queuedCompletions()) {
      if (item.owner && me && item.owner !== me) {
        await tx("queue", "readwrite", (s) => s.delete(item.lessonId)).catch(() => {});
        continue;
      }
      let res: Response;
      try {
        res = await fetch("/api/learn/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lessonId: item.lessonId }),
        });
      } catch {
        break; // still offline
      }
      if (res.ok || res.status === 400 || res.status === 403 || res.status === 404) {
        await tx("queue", "readwrite", (s) => s.delete(item.lessonId)).catch(() => {});
        if (res.ok) done.push(item.lessonId);
      }
    }
    announce();
    return done;
  })().finally(() => {
    flushing = null;
  });
  return flushing;
}

export async function downloadedLessons(): Promise<DownloadRow[]> {
  if (typeof indexedDB === "undefined") return [];
  return ((await tx<DownloadRow[]>("downloads", "readonly", (s) => s.getAll()).catch(() => [])) ?? []) as DownloadRow[];
}

export interface DownloadPage {
  url: string;
  title?: string;
  track?: string;
  kind: "lesson" | "page";
}

/**
 * Ask the worker to save pages for offline reading. onProgress gets (done,
 * total) as each page is saved; resolves with the number that failed.
 */
export async function downloadPages(pages: DownloadPage[], onProgress?: (done: number, total: number) => void): Promise<{ failed: number }> {
  if (!pwaEnabled()) throw new Error("unsupported");
  const reg = await navigator.serviceWorker.ready;
  const worker = navigator.serviceWorker.controller ?? reg.active;
  if (!worker) throw new Error("unsupported");
  const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return new Promise((resolve) => {
    const onMsg = (e: MessageEvent) => {
      const d = e.data ?? {};
      if (d.id !== id) return;
      if (d.type === "download-progress") onProgress?.(d.done, d.total);
      if (d.type === "download-done") {
        navigator.serviceWorker.removeEventListener("message", onMsg);
        resolve({ failed: d.failed ?? 0 });
      }
    };
    navigator.serviceWorker.addEventListener("message", onMsg);
    worker.postMessage({ type: "download", id, pages });
  });
}

export async function removeDownloads(urls: string[]): Promise<void> {
  if (!pwaEnabled()) return;
  const reg = await navigator.serviceWorker.ready;
  (navigator.serviceWorker.controller ?? reg.active)?.postMessage({ type: "remove", urls });
}

/** Everything saved on this device, gone (also done by the worker on sign-out). */
export async function clearOfflineData(): Promise<void> {
  const worker = pwaEnabled() ? navigator.serviceWorker.controller : null;
  if (worker) {
    // The worker clears and then puts the offline page back.
    const id = `${Date.now()}`;
    await new Promise<void>((resolve) => {
      const onMsg = (e: MessageEvent) => {
        if (e.data?.type === "cleared" && e.data.id === id) {
          navigator.serviceWorker.removeEventListener("message", onMsg);
          resolve();
        }
      };
      navigator.serviceWorker.addEventListener("message", onMsg);
      worker.postMessage({ type: "clear", id });
      setTimeout(resolve, 5000);
    });
    announce();
    return;
  }
  if (typeof caches !== "undefined") {
    for (const k of await caches.keys()) if (k.startsWith("tib-learn-")) await caches.delete(k);
  }
  if (typeof indexedDB !== "undefined") {
    for (const s of ["queue", "downloads", "meta"]) await tx(s, "readwrite", (st) => st.clear()).catch(() => {});
  }
  announce();
}

/** Whether a page is saved on this device (any of the Learn caches). */
export async function isSaved(url: string): Promise<boolean> {
  if (typeof caches === "undefined") return false;
  return !!(await caches.match(new URL(url, location.origin).href));
}
