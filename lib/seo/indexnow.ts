// IndexNow: tell Bing (which powers ChatGPT search and Copilot), Yandex,
// Seznam, Naver and others the moment a public URL is published or changed,
// instead of waiting for the next crawl. https://www.indexnow.org
//
// Setup: set INDEXNOW_KEY (8 to 128 letters, digits or dashes; e.g. a UUID).
// The key file is served at https://tiblogics.com/<key>.txt (next.config.js
// rewrites it to app/api/indexnow-key/[key]). Without the variable every
// call here is a no-op.
//
// Calls are fire-and-forget and debounced: URLs collected over a few seconds
// go out in one request, and a failure is logged, never thrown. Never await
// this in a request path.

import { SITE_HOST, absUrl } from "./site";

const KEY_RE = /^[A-Za-z0-9-]{8,128}$/;
const ENDPOINT = process.env.INDEXNOW_ENDPOINT || "https://api.indexnow.org/indexnow";
const DEBOUNCE_MS = 5_000;
const MAX_URLS = 10_000;

export function indexNowKey(): string | null {
  const k = process.env.INDEXNOW_KEY?.trim();
  return k && KEY_RE.test(k) ? k : null;
}

const queue = new Set<string>();
let timer: ReturnType<typeof setTimeout> | null = null;

async function flush(): Promise<void> {
  timer = null;
  const key = indexNowKey();
  const urlList = [...queue].slice(0, MAX_URLS);
  queue.clear();
  if (!key || !urlList.length) return;
  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ host: SITE_HOST, key, keyLocation: absUrl(`/${key}.txt`), urlList }),
      signal: AbortSignal.timeout(10_000),
    });
    // 200 and 202 are both success (202: key validation pending).
    if (!res.ok) console.warn(`[indexnow] ${res.status} for ${urlList.length} URL(s)`);
    else console.log(`[indexnow] submitted ${urlList.length} URL(s)`);
  } catch (err) {
    console.warn("[indexnow] submit failed", err instanceof Error ? err.message : err);
  }
}

/**
 * Queue public paths ("/ai-times/my-post") or absolute tiblogics.com URLs
 * for IndexNow. Safe to call anywhere; does nothing without INDEXNOW_KEY.
 */
export function indexNowSoon(paths: Array<string | null | undefined>): void {
  if (!indexNowKey()) return;
  for (const p of paths) {
    if (!p) continue;
    const url = absUrl(p);
    // Only our own canonical host is accepted by IndexNow for this key.
    if (new URL(url).host === SITE_HOST) queue.add(url);
  }
  if (!queue.size || timer) return;
  timer = setTimeout(() => void flush(), DEBOUNCE_MS);
  // Do not keep a script (seed, cron) alive just for this.
  if (typeof timer === "object" && timer && "unref" in timer) timer.unref();
}

/** The section pages that list an item change when it does. */
export const INDEXNOW_SECTIONS = {
  article: (slug: string) => [`/ai-times/${slug}`, "/ai-times"],
  product: (slug: string) => [`/store/${slug}`, "/store"],
  track: (slug: string) => [`/learning-box/${slug}`, "/learning-box"],
  magnet: (slug: string) => [`/free/${slug}`],
  page: (slug: string) => [`/lp/${slug}`],
  event: (slug: string) => [`/events/${slug}`, "/events"],
};
