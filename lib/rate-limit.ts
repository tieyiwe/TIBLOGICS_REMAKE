import { createHmac } from "crypto";
import prisma from "@/lib/prisma";

// Rate limiting that survives a restart and holds across instances.
//
// The counters used to live in a module-level Map. That has two holes worth
// closing now that real abuse controls depend on them — the booking cap, the
// scanner, signup, the webhook:
//
//   - A deploy or a crash reset every counter. Anyone throttled just had to
//     wait for the next restart, which on a platform that recycles idle
//     containers can be minutes.
//   - Two instances meant two independent sets of counters, so the effective
//     limit was the limit times the number of instances.
//
// The counter lives in Postgres, incremented in one atomic statement so two
// simultaneous requests cannot both read the same value. The in-memory map
// stays as a fallback for the case where the table does not exist yet (this
// project has no migrations; the table is created by
// /api/admin/sync-db/rate-limit) or the database is briefly unreachable —
// losing the limit entirely would be worse than an approximate one.

interface Entry {
  count: number;
  resetAt: number;
}

/**
 * Store the identifier as a hash, keeping the namespace readable.
 *
 * `waitlist:203.0.113.7` would otherwise sit in a database table as a plain IP
 * address for the length of the window. Hashing it means the row still counts
 * the right caller and an operator can still see which limit it belongs to,
 * without the table becoming a log of who visited. It also lets callers key on
 * a full IP rather than a /24 — five bookings an hour shared across an entire
 * office network is too tight, and truncating was only ever about not storing
 * the address.
 *
 * Keyed with NEXTAUTH_SECRET so the hashes are not reversible by running the
 * address space through sha256.
 */
function storageKey(key: string): string {
  const parts = key.split(":");

  // The namespace is the leading segments that are plainly labels, not caller
  // identifiers: `appointments:req` and `login:staff` stay legible, while an
  // address or an email address never does. Anything with a digit or an @, or
  // anything long, is treated as the identifier — which also means an IPv6
  // address, full of colons, is hashed whole rather than having its last
  // hextet split off and hashed on its own.
  let labels = 0;
  while (labels < parts.length - 1 && /^[a-z-]{1,14}$/.test(parts[labels])) labels++;
  const namespace = parts.slice(0, Math.max(1, labels)).join(":");

  // The whole key is hashed, not just the tail, so two different namespaces can
  // never collide on a shared identifier.
  const digest = createHmac("sha256", process.env.NEXTAUTH_SECRET ?? "tiblogics-rate-limit")
    .update(key)
    .digest("base64url")
    .slice(0, 22);
  return `${namespace}:${digest}`;
}

const memory = new Map<string, Entry>();

/** Keeps the fallback map from growing without bound in a long-lived process. */
function pruneMemory(now: number) {
  if (memory.size < 5000) return;
  for (const [k, v] of memory) {
    if (v.resetAt <= now) memory.delete(k);
  }
}

function memoryAllows(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  pruneMemory(now);
  const entry = memory.get(key);
  if (!entry || now > entry.resetAt) {
    memory.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= max) return false;
  entry.count++;
  return true;
}

/**
 * The increment itself. One statement, so the read and the write cannot be
 * interleaved by another request. An expired window resets to 1 rather than
 * being deleted first, which would leave a gap two callers could both slip
 * through.
 */
async function consume(stored: string, max: number, resetAt: Date): Promise<boolean> {
  const rows = await prisma.$queryRaw<Array<{ count: number }>>`
    INSERT INTO "RateLimit" ("key", "count", "resetAt")
    VALUES (${stored}, 1, ${resetAt})
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE WHEN "RateLimit"."resetAt" <= now() THEN 1 ELSE "RateLimit"."count" + 1 END,
      "resetAt" = CASE WHEN "RateLimit"."resetAt" <= now() THEN ${resetAt} ELSE "RateLimit"."resetAt" END
    RETURNING "count"
  `;
  return Number(rows[0]?.count ?? 1) <= max;
}

/**
 * Create the table if it is missing, at most once per process.
 *
 * Attempted only after a query has already failed, so the happy path never
 * pays for it. IF NOT EXISTS makes it safe when several instances start at
 * once. Returns whether the table should now be usable.
 */
let ensureTablePromise: Promise<boolean> | null = null;
function ensureTable(): Promise<boolean> {
  ensureTablePromise ??= (async () => {
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "RateLimit" (
          "key" TEXT NOT NULL PRIMARY KEY,
          "count" INTEGER NOT NULL DEFAULT 0,
          "resetAt" TIMESTAMP(3) NOT NULL
        )
      `);
      await prisma.$executeRawUnsafe(
        `CREATE INDEX IF NOT EXISTS "RateLimit_resetAt_idx" ON "RateLimit"("resetAt")`,
      );
      return true;
    } catch (err) {
      // A database user without DDL rights, or an unreachable database. Log
      // once — silently running on per-instance counters forever is the kind
      // of thing that should be visible.
      console.error(
        "[rate-limit] could not create the RateLimit table; falling back to " +
          "per-instance counters. Run POST /api/admin/sync-db/rate-limit as an " +
          "admin to create it.",
        err instanceof Error ? err.message : err,
      );
      // Do not retry on every request for the rest of the process's life.
      return false;
    }
  })();
  return ensureTablePromise;
}

/**
 * Consume one unit against `key`. Returns true when the caller may proceed.
 *
 * `max` is the number of allowed requests per `windowMs`. The window starts on
 * the first request and is fixed, not sliding — simple, and the difference does
 * not matter for the abuse this guards against.
 */
export async function checkRateLimit(
  key: string,
  max: number,
  windowMs: number,
): Promise<boolean> {
  const stored = storageKey(key);
  const resetAt = new Date(Date.now() + windowMs);
  try {
    return await consume(stored, max, resetAt);
  } catch {
    // Most likely the table does not exist yet — this project has no
    // migrations, so a deploy arrives before any DDL has run. Create it once,
    // then retry, rather than making someone remember to POST to a sync route
    // for a table the code cannot work properly without.
    if (await ensureTable()) {
      try {
        return await consume(stored, max, resetAt);
      } catch {
        // Fall through to memory.
      }
    }
    // Database unreachable, or the create was not permitted. An approximate
    // per-instance limit is better than none, and better than a 500 on a
    // public endpoint.
    return memoryAllows(stored, max, windowMs);
  }
}

/**
 * Read a key's state without consuming anything.
 *
 * Used where a caller wants to report "try again in N seconds" rather than
 * spending one of the caller's allowance to find out.
 */
export async function rateLimitStatus(
  key: string,
): Promise<{ count: number; resetAt: Date } | null> {
  try {
    const rows = await prisma.$queryRaw<Array<{ count: number; resetAt: Date }>>`
      SELECT "count", "resetAt" FROM "RateLimit" WHERE "key" = ${storageKey(key)} AND "resetAt" > now()
    `;
    const row = rows[0];
    return row ? { count: Number(row.count), resetAt: row.resetAt } : null;
  } catch {
    const entry = memory.get(storageKey(key));
    return entry && entry.resetAt > Date.now()
      ? { count: entry.count, resetAt: new Date(entry.resetAt) }
      : null;
  }
}

/**
 * Delete expired rows. Called opportunistically rather than on a schedule, so
 * the table cannot grow indefinitely on a site with no cron configured.
 */
export async function pruneRateLimits(): Promise<number> {
  try {
    const deleted = await prisma.$executeRaw`
      DELETE FROM "RateLimit" WHERE "resetAt" < now() - interval '1 day'
    `;
    return Number(deleted);
  } catch {
    return 0;
  }
}

/**
 * Forget a key's counter.
 *
 * Used after a successful login so ordinary use — a few mistyped passwords,
 * then the right one — never accumulates toward the lockout.
 */
export async function clearRateLimit(key: string): Promise<void> {
  const stored = storageKey(key);
  memory.delete(stored);
  try {
    await prisma.$executeRaw`DELETE FROM "RateLimit" WHERE "key" = ${stored}`;
  } catch {
    // Already handled by the in-memory delete above.
  }
}
