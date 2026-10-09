// In-process cache for PUBLIC data that every visitor sees the same way
// (track catalog, store listing, AI Times posts). Never for anything
// per-user: keys hold no user, session or cookie data.
//
// Why not ISR / unstable_cache: the store and catalog pages were made
// force-dynamic because cached pages went stale on the hosted deployment.
// The pages stay dynamic; only the database reads behind them are cached,
// and a write drops them at once:
//
//  - Any INSERT/UPDATE/DELETE on a table listed in TABLE_TAGS, from any code
//    path (admin screens, webhooks, seeds, raw SQL), is seen through Prisma's
//    query events (lib/db/write-events.ts) and clears that tag here, then
//    again a moment later (a read during the write's transaction could have
//    cached the old rows).
//  - Other instances (Replit Autoscale may run several) learn about it from
//    the "CacheVersion" table, which a write bumps; each instance checks it
//    at most every CHECK_MS, so they follow within a few seconds.
//  - Everything also expires after MAX_AGE_MS, whatever happens.
//
// Values are kept as loaded and handed out as structured clones, so a caller
// mutating its copy cannot change what the next visitor sees.

import prisma from "@/lib/prisma";
import { onTableWrite } from "@/lib/db/write-events";

export type CacheTag = "learn" | "shop" | "blog" | "i18n" | "reviews";

/** Tables whose writes invalidate a tag. Prisma model name = table name here. */
const TABLE_TAGS: Record<string, CacheTag[]> = {
  LearnTrack: ["learn"], LearnModule: ["learn"], Lesson: ["learn"], Quiz: ["learn"], QuizQuestion: ["learn"],
  Lab: ["learn"], FinalExam: ["learn"], Capstone: ["learn"], MicroCheck: ["learn"], LessonResource: ["learn"],
  Product: ["shop"], Collection: ["shop"],
  // Post summaries in other languages join BlogPost (lib/i18n/sources/blog.ts).
  BlogPost: ["blog", "i18n"],
  ContentTranslation: ["i18n"],
  // Approved testimonials (lib/reviews/db.ts): home page and Learning Box.
  Testimonial: ["reviews"],
};

/**
 * Columns bumped by visitor activity that the cached pages do not depend on
 * closely (an article's view count). An UPDATE setting only these keeps the
 * cache, or every article view would empty it.
 */
const COUNTERS: Record<string, string[]> = { BlogPost: ["viewCount"] };

function onlyCounters(table: string, sql: string): boolean {
  const cols = COUNTERS[table];
  if (!cols || !/^\s*UPDATE/i.test(sql)) return false;
  const set = /\bSET\b([\s\S]*?)(?:\bWHERE\b|\bRETURNING\b|$)/i.exec(sql)?.[1] ?? "";
  const assigned = [...set.matchAll(/"([A-Za-z0-9_]+)"\s*=/g)].map((m) => m[1]);
  return assigned.length > 0 && assigned.every((c) => cols.includes(c));
}

const MAX_AGE_MS = 5 * 60_000;
// How often other instances' invalidations are picked up. Local ones are
// immediate; production runs one instance, so this only needs to be prompt.
const CHECK_MS = 15_000;
const SETTLE_MS = 1_500;
const MAX_ENTRIES = 1000;

interface Entry { tag: CacheTag; gen: number; at: number; value: Promise<unknown> }

interface State {
  entries: Map<string, Entry>;
  /** Local generation per tag: bumped on every invalidation. */
  gen: Record<CacheTag, number>;
  /** Last seen shared versions (CacheVersion table). */
  shared: Record<string, number>;
  checkedAt: number;
  sharedInit: boolean;
  checking: Promise<void> | null;
  tableReady: Promise<boolean> | null;
  settle: Partial<Record<CacheTag, ReturnType<typeof setTimeout>>>;
  wired: boolean;
}

const g = globalThis as unknown as { __tibPublicCache?: State };
const S: State = (g.__tibPublicCache ??= {
  entries: new Map(),
  gen: { learn: 0, shop: 0, blog: 0, i18n: 0, reviews: 0 },
  shared: {},
  checkedAt: 0,
  sharedInit: false,
  checking: null,
  tableReady: null,
  settle: {},
  wired: false,
});

// A state object made by an older build in the same process (dev reloads)
// may lack a newer tag.
for (const t of ["learn", "shop", "blog", "i18n", "reviews"] as CacheTag[]) S.gen[t] ??= 0;

function dropLocal(tag: CacheTag) {
  S.gen[tag]++;
  for (const [k, e] of S.entries) if (e.tag === tag) S.entries.delete(k);
}

export function ensureTable(): Promise<boolean> {
  S.tableReady ??= prisma
    .$executeRawUnsafe(
      `CREATE TABLE IF NOT EXISTS "CacheVersion" ("tag" TEXT NOT NULL PRIMARY KEY, "version" INTEGER NOT NULL DEFAULT 0, "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
    )
    .then(() => true)
    .catch((err) => {
      console.error("[cache] CacheVersion table", err);
      S.tableReady = null;
      return false;
    });
  return S.tableReady;
}

async function bumpShared(tag: CacheTag) {
  if (!(await ensureTable())) return;
  try {
    const rows = await prisma.$queryRawUnsafe<{ version: number }[]>(
      `INSERT INTO "CacheVersion" ("tag", "version", "updatedAt") VALUES ($1, 1, CURRENT_TIMESTAMP)
       ON CONFLICT ("tag") DO UPDATE SET "version" = "CacheVersion"."version" + 1, "updatedAt" = CURRENT_TIMESTAMP
       RETURNING "version"`,
      tag,
    );
    // Our own bump is not news to this instance (it already dropped the tag).
    const v = Number(rows[0]?.version ?? 0);
    S.shared[tag] = Math.max(S.shared[tag] ?? 0, v);
  } catch (err) {
    console.error("[cache] bump", tag, err);
  }
}

/** Drop a tag here and on every other instance. Never throws. */
export function invalidatePublicData(tag: CacheTag): void {
  // A burst of writes (a translation batch of hundreds of rows) shares one
  // shared bump now and one when it settles, not two per row.
  const inBurst = !!S.settle[tag];
  dropLocal(tag);
  if (!inBurst) void bumpShared(tag);
  // Once more after the writing transaction has surely committed.
  if (S.settle[tag]) clearTimeout(S.settle[tag]);
  S.settle[tag] = setTimeout(() => {
    S.settle[tag] = undefined;
    dropLocal(tag);
    void bumpShared(tag);
  }, SETTLE_MS);
  S.settle[tag]?.unref?.();
}

function wire() {
  if (S.wired) return;
  S.wired = true;
  onTableWrite((table, sql) => {
    const tags = TABLE_TAGS[table];
    if (!tags || onlyCounters(table, sql)) return;
    for (const tag of tags) invalidatePublicData(tag);
  });
}
wire();

/** Pick up invalidations made by other instances (one query per CHECK_MS). */
async function syncShared(): Promise<void> {
  if (Date.now() - S.checkedAt < CHECK_MS) return;
  S.checking ??= (async () => {
    try {
      if (!(await ensureTable())) throw new Error("CacheVersion table unavailable");
      const rows = await prisma.$queryRawUnsafe<{ tag: string; version: number }[]>(`SELECT "tag", "version" FROM "CacheVersion"`);
      for (const r of rows) {
        const v = Number(r.version);
        const seen = S.shared[r.tag];
        const known = r.tag in S.gen;
        if (seen === undefined) {
          S.shared[r.tag] = v;
          // A tag first bumped elsewhere after this instance started.
          if (S.sharedInit && known) dropLocal(r.tag as CacheTag);
        } else if (v > seen) {
          S.shared[r.tag] = v;
          if (known) dropLocal(r.tag as CacheTag);
        }
      }
      S.sharedInit = true;
      S.checkedAt = Date.now();
    } catch (err) {
      console.error("[cache] version check", err);
      // Fail safe: without the shared versions, trust nothing older than a
      // check period, and try again after one (not on every request).
      for (const [k, e] of S.entries) if (Date.now() - e.at > CHECK_MS) S.entries.delete(k);
      S.checkedAt = Date.now();
    } finally {
      S.checking = null;
    }
  })();
  await S.checking;
}

/**
 * The cached result of `load` for `key`, loading it on a miss. `key` must
 * identify the data completely (include slugs, locales...). Errors are not
 * cached.
 */
export async function cachedPublicData<T>(tag: CacheTag, key: string, load: () => Promise<T>): Promise<T> {
  await syncShared();
  const full = `${tag}:${key}`;
  const hit = S.entries.get(full);
  if (hit && hit.gen === S.gen[tag] && Date.now() - hit.at < MAX_AGE_MS) {
    return structuredClone(await (hit.value as Promise<T>));
  }
  const gen = S.gen[tag];
  const value = load();
  const entry: Entry = { tag, gen, at: Date.now(), value };
  if (S.entries.size >= MAX_ENTRIES) S.entries.delete(S.entries.keys().next().value as string);
  S.entries.set(full, entry);
  try {
    const v = await value;
    // Invalidated while loading: serve this result to this caller, but do not keep it.
    if (S.gen[tag] !== gen && S.entries.get(full) === entry) S.entries.delete(full);
    return structuredClone(v);
  } catch (err) {
    if (S.entries.get(full) === entry) S.entries.delete(full);
    throw err;
  }
}
