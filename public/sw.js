/* TIBLOGICS Learn service worker.
 *
 * Registered by components/learn/pwa/PwaShell.tsx on /learn pages only, in
 * production, with scope "/learn". What it does:
 *   - /_next/static/*: stale-while-revalidate (the app shell's scripts, styles
 *     and fonts), so a saved lesson can start without a network.
 *   - Lesson, track and dashboard pages (/learn, /learn/tracks,
 *     /learn/track/*, /learn/lesson/*): network first; the copy saved last is
 *     used only when the network fails. Other /learn pages go to the network,
 *     and to the offline page when it fails.
 *   - "Download for offline" (message "download"): saves lesson pages (HTML in
 *     the learner's language, fetched with their cookie) with their scripts,
 *     styles, fonts and images.
 *   - Completions made offline wait in IndexedDB ("queue") and are sent to
 *     /api/learn/progress on Background Sync (tag "tib-completions"), or by
 *     the page when it comes back online. The server decides; the call is
 *     idempotent.
 * Never touched: anything that is not GET (except to notice sign-out),
 * /api/*, auth, Stripe, /admin_pro, the account, sign-in and plan pages, and
 * React Server Component requests. Set-Cookie is invisible to a service
 * worker, so the allow-list of page paths is what keeps sign-in and payment
 * responses out of the cache.
 *
 * Sign-out (POST /api/auth/signout from a Learn page) or a different learner
 * signing in on this device clears every cache and the queue.
 *
 * Bump VERSION when the caching rules change: old caches are deleted on
 * activate. lib/learn/pwa/idb.ts opens the same IndexedDB; keep in step.
 */
const VERSION = "v1";
const PREFIX = "tib-learn-";
const STATIC = `${PREFIX}static-${VERSION}`;
const PAGES = `${PREFIX}pages-${VERSION}`;
const IMAGES = `${PREFIX}images-${VERSION}`;
const KEEP = [STATIC, PAGES, IMAGES];
const OFFLINE_URL = "/learn-offline.html";
const PRECACHE = [OFFLINE_URL, "/pwa/icon-192.png", "/icon.svg"];
/** Pages saved while browsing (not downloaded) are trimmed to this many. */
const MAX_BROWSED_PAGES = 60;
const MAX_IMAGES = 300;

const DB_NAME = "tib-learn-offline";
const DB_VERSION = 1;

// ── IndexedDB (same stores as lib/learn/pwa/idb.ts) ─────────────────────────
function openDb() {
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
async function idb(store, mode, fn) {
  const db = await openDb();
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(store, mode);
      const out = fn(tx.objectStore(store));
      tx.oncomplete = () => resolve(out && "result" in out ? out.result : undefined);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}
const idbAll = (store) => idb(store, "readonly", (s) => s.getAll());
const idbPut = (store, v) => idb(store, "readwrite", (s) => s.put(v));
const idbDel = (store, k) => idb(store, "readwrite", (s) => s.delete(k));
const idbGet = (store, k) => idb(store, "readonly", (s) => s.get(k));
const idbClear = (store) => idb(store, "readwrite", (s) => s.clear());

// ── Lifecycle ───────────────────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC)
      .then((c) => c.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      for (const name of await caches.keys()) {
        if (name.startsWith(PREFIX) && !KEEP.includes(name)) await caches.delete(name);
      }
      await self.clients.claim();
    })(),
  );
});

// ── Routing ─────────────────────────────────────────────────────────────────
const isLearn = (p) => p === "/learn" || p.startsWith("/learn/");
// Never cached, even though they are /learn pages.
const PRIVATE = /^\/learn\/(login|signup|forgot|reset|subscribe|account)(\/|$)/;
// Saved for offline reading.
const CACHEABLE = /^\/learn(\/tracks|\/track\/[^/]+|\/lesson\/[^/]+)?\/?$/;

function isRsc(req) {
  const url = new URL(req.url);
  return req.headers.get("RSC") === "1" || url.searchParams.has("_rsc");
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Sign-out hook: let it through, then forget everything this learner saved.
  if (req.method === "POST" && url.origin === self.location.origin && url.pathname === "/api/auth/signout") {
    event.respondWith(
      fetch(req).then((res) => {
        if (res.status < 400) event.waitUntil(clearEverything());
        return res;
      }),
    );
    return;
  }
  if (req.method !== "GET") return;

  if (url.origin === self.location.origin) {
    if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/admin_pro")) return;
    if (url.pathname.startsWith("/_next/static/")) {
      event.respondWith(staleWhileRevalidate(req, STATIC));
      return;
    }
    if (req.mode === "navigate") {
      if (!isLearn(url.pathname)) return;
      if (!PRIVATE.test(url.pathname) && CACHEABLE.test(url.pathname)) event.respondWith(networkFirstPage(req));
      else event.respondWith(fetch(req).catch(() => offlinePage()));
      return;
    }
    if (isRsc(req)) return; // a failed RSC fetch makes Next.js do a full navigation, which lands above
    if (req.destination === "image" || url.pathname.startsWith("/_next/image")) {
      event.respondWith(staleWhileRevalidate(req, IMAGES));
      return;
    }
    return;
  }

  // Images on other hosts: network, and the saved copy when offline.
  if (req.destination === "image") {
    event.respondWith(fetch(req).catch(() => caches.match(req, { cacheName: IMAGES }).then((r) => r || Response.error())));
  }
});

async function staleWhileRevalidate(req, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(req);
  const refresh = fetch(req)
    .then((res) => {
      if (res.ok && res.type === "basic") cache.put(req, res.clone()).catch(() => {});
      return res;
    })
    .catch(() => null);
  if (hit) {
    refresh.catch(() => {});
    return hit;
  }
  return (await refresh) || Response.error();
}

/** A page response we may keep: ours, 200, HTML, not redirected elsewhere. */
function keepable(req, res) {
  if (!res || !res.ok || res.status !== 200 || res.type !== "basic" || res.redirected) return false;
  if (!(res.headers.get("content-type") || "").includes("text/html")) return false;
  const want = new URL(req.url).pathname.replace(/\/$/, "");
  const got = new URL(res.url || req.url).pathname.replace(/\/$/, "");
  return want === got;
}

const pageKey = (u) => {
  const url = new URL(u, self.location.origin);
  return `${url.origin}${url.pathname.replace(/(.)\/$/, "$1")}`;
};

async function networkFirstPage(req) {
  try {
    const res = await fetch(req);
    if (keepable(req, res)) {
      const copy = res.clone();
      caches
        .open(PAGES)
        .then((c) => c.put(pageKey(req.url), copy))
        .then(trimBrowsedPages)
        .catch(() => {});
    } else if (res && res.redirected && /^\/learn\/login\/?$/.test(new URL(res.url).pathname)) {
      // Signed out without the sign-out button (session expired, cookies
      // cleared): nobody is signed in now, so the last learner's saved pages
      // must not be served to whoever uses this device offline next.
      clearEverything().catch(() => {});
    }
    return res;
  } catch {
    const hit = await caches.match(pageKey(req.url), { cacheName: PAGES });
    return hit || offlinePage();
  }
}

async function offlinePage() {
  return (await caches.match(OFFLINE_URL, { cacheName: STATIC })) || new Response("Offline", { status: 503, headers: { "content-type": "text/plain" } });
}

async function trimBrowsedPages() {
  const cache = await caches.open(PAGES);
  const keys = await cache.keys();
  if (keys.length <= MAX_BROWSED_PAGES) return;
  const downloaded = new Set((await idbAll("downloads").catch(() => [])).map((d) => pageKey(d.url)));
  const browsed = keys.filter((k) => !downloaded.has(pageKey(k.url)));
  for (const k of browsed.slice(0, browsed.length - MAX_BROWSED_PAGES)) await cache.delete(k);
}

async function trimImages() {
  const cache = await caches.open(IMAGES);
  const keys = await cache.keys();
  for (const k of keys.slice(0, Math.max(0, keys.length - MAX_IMAGES))) await cache.delete(k);
}

// ── Download for offline ────────────────────────────────────────────────────
const decode = (s) => s.replace(/&amp;/g, "&").replace(/\\u0026/g, "&").replace(/\\\//g, "/");

/** Scripts, styles, fonts and images a saved page needs. */
function assetsIn(html, base) {
  const out = new Set();
  for (const m of html.matchAll(/\/_next\/static\/[A-Za-z0-9_\-./~%@]+/g)) out.add(m[0]);
  // Client component chunks named in the RSC payload: "static/chunks/..."
  for (const m of html.matchAll(/["'(]static\/(?:chunks|css|media)\/[A-Za-z0-9_\-./~%@]+/g)) out.add(`/_next/${m[0].slice(1)}`);
  for (const m of html.matchAll(/<img\b[^>]*?\ssrc="([^"]+)"/g)) out.add(decode(m[1]));
  for (const m of html.matchAll(/\/_next\/image\?[^"'\s<>\\]+/g)) out.add(decode(m[0]));
  const urls = [];
  for (const u of out) {
    try {
      const abs = new URL(u.replace(/[\\]+$/, ""), base);
      if (abs.protocol === "https:" || abs.origin === self.location.origin) urls.push(abs.href);
    } catch {}
  }
  return urls;
}

async function saveAsset(url, seen) {
  if (seen.has(url)) return;
  seen.add(url);
  const u = new URL(url);
  const same = u.origin === self.location.origin;
  const cacheName = same && u.pathname.startsWith("/_next/static/") ? STATIC : IMAGES;
  const cache = await caches.open(cacheName);
  if (await cache.match(url)) return;
  const res = await fetch(url, same ? { credentials: "same-origin" } : { mode: "no-cors", credentials: "omit" });
  if (!(res.ok || res.type === "opaque")) return;
  await cache.put(url, res.clone());
  // Fonts and images referenced from a stylesheet.
  if (same && u.pathname.endsWith(".css")) {
    const css = await res.text();
    for (const m of css.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g)) {
      if (m[1].startsWith("data:")) continue;
      try {
        await saveAsset(new URL(m[1], url).href, seen);
      } catch {}
    }
  }
}

/**
 * pages: [{ url, title, track, kind }]. Posts { type: "download-progress",
 * id, done, total, failed } to the page that asked, then "download-done".
 */
async function download(id, pages, client) {
  const cache = await caches.open(PAGES);
  const seen = new Set();
  let done = 0;
  let failed = 0;
  const post = (type) => client && client.postMessage({ type, id, done, total: pages.length, failed });
  for (const p of pages) {
    try {
      const url = new URL(p.url, self.location.origin);
      if (!isLearn(url.pathname) || PRIVATE.test(url.pathname) || !CACHEABLE.test(url.pathname)) throw new Error("not allowed");
      const req = new Request(url.href, { credentials: "same-origin", headers: { accept: "text/html" } });
      const res = await fetch(req);
      if (!keepable(req, res)) throw new Error(`status ${res.status}`);
      const html = await res.clone().text();
      await cache.put(pageKey(url.href), res);
      for (const a of assetsIn(html, url.href)) await saveAsset(a, seen).catch(() => {});
      if (p.kind === "lesson") await idbPut("downloads", { url: pageKey(url.href), title: p.title || "", track: p.track || "", savedAt: Date.now() });
    } catch {
      failed++;
    }
    done++;
    post("download-progress");
  }
  await trimImages().catch(() => {});
  post("download-done");
}

async function removeDownloads(urls) {
  const cache = await caches.open(PAGES);
  for (const u of urls) {
    await cache.delete(pageKey(u));
    await idbDel("downloads", pageKey(u)).catch(() => {});
  }
}

// ── Offline completions ─────────────────────────────────────────────────────
let flushing = null;
function flushQueue() {
  flushing ??= (async () => {
    const owner = (await idbGet("meta", "owner").catch(() => null))?.value ?? null;
    const items = await idbAll("queue");
    const synced = [];
    let retry = false;
    for (const item of items) {
      if (item.owner && owner && item.owner !== owner) {
        await idbDel("queue", item.lessonId);
        continue;
      }
      let res;
      try {
        res = await fetch("/api/learn/progress", {
          method: "POST",
          credentials: "same-origin",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ lessonId: item.lessonId }),
        });
      } catch {
        retry = true;
        break; // still offline
      }
      if (res.ok || res.status === 400 || res.status === 403 || res.status === 404) {
        // Saved, or refused for good: the server is the authority either way.
        await idbDel("queue", item.lessonId);
        if (res.ok) synced.push(item.lessonId);
      } else {
        retry = true; // 401 (signed out for now), 429, 5xx: try again later
      }
    }
    if (synced.length) for (const c of await self.clients.matchAll({ type: "window" })) c.postMessage({ type: "synced", lessonIds: synced });
    if (retry) throw new Error("retry");
  })().finally(() => {
    flushing = null;
  });
  return flushing;
}

self.addEventListener("sync", (event) => {
  if (event.tag === "tib-completions") event.waitUntil(flushQueue());
});

// ── Clearing ────────────────────────────────────────────────────────────────
async function clearEverything() {
  for (const name of await caches.keys()) {
    if (name.startsWith(PREFIX)) await caches.delete(name);
  }
  await Promise.all(["queue", "downloads", "meta"].map((s) => idbClear(s).catch(() => {})));
  // The offline page and icons come back for the next learner.
  await caches.open(STATIC).then((c) => c.addAll(PRECACHE)).catch(() => {});
}

// ── Messages from Learn pages ───────────────────────────────────────────────
self.addEventListener("message", (event) => {
  const msg = event.data || {};
  const client = event.source;
  if (msg.type === "download" && Array.isArray(msg.pages)) {
    event.waitUntil(download(msg.id, msg.pages.slice(0, 400), client));
  } else if (msg.type === "remove" && Array.isArray(msg.urls)) {
    event.waitUntil(removeDownloads(msg.urls).then(() => client && client.postMessage({ type: "removed", id: msg.id })));
  } else if (msg.type === "flush") {
    event.waitUntil(flushQueue().catch(() => {}));
  } else if (msg.type === "clear") {
    event.waitUntil(clearEverything().then(() => client && client.postMessage({ type: "cleared", id: msg.id })));
  } else if (msg.type === "owner" && typeof msg.owner === "string") {
    // A different learner on this device: nothing of the last one stays.
    event.waitUntil(
      (async () => {
        const cur = (await idbGet("meta", "owner").catch(() => null))?.value ?? null;
        if (cur && cur !== msg.owner) await clearEverything();
        await idbPut("meta", { key: "owner", value: msg.owner });
      })(),
    );
  }
});
