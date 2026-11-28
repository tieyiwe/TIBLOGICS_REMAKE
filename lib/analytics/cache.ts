// A small per-process cache for the analytics aggregates: the admin pages
// re-run the same GROUP BY queries on every filter click, and five minutes of
// staleness is fine for trends. Bounded, and a failed computation is not kept.

// ANALYTICS_CACHE_SECONDS overrides the five minutes (0 turns it off, for tests).
const envTtl = Number(process.env.ANALYTICS_CACHE_SECONDS);
const TTL = Number.isFinite(envTtl) && process.env.ANALYTICS_CACHE_SECONDS !== "" && process.env.ANALYTICS_CACHE_SECONDS != null ? envTtl * 1000 : 5 * 60_000;
const MAX = 200;
const store = new Map<string, { at: number; value: Promise<unknown> }>();

export function cached<T>(key: string, fn: () => Promise<T>, ttl = TTL): Promise<T> {
  if (TTL <= 0 || ttl <= 0) return fn();
  const hit = store.get(key);
  if (hit && Date.now() - hit.at < ttl) return hit.value as Promise<T>;
  const value = fn().catch((err) => {
    store.delete(key);
    throw err;
  });
  store.set(key, { at: Date.now(), value });
  while (store.size > MAX) store.delete(store.keys().next().value as string);
  return value;
}

/** Drops everything (tests, or after the owner changes goals). */
export function clearAnalyticsCache(prefix?: string) {
  if (!prefix) return store.clear();
  for (const k of [...store.keys()]) if (k.startsWith(prefix)) store.delete(k);
}
