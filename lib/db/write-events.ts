// Which tables were just written to, from the SQL Prisma sends (lib/prisma.ts
// listens to its query events). Covers ORM calls and raw SQL alike, so caches
// of public data (lib/cache/public-data.ts) are dropped by any write, from any
// admin screen, webhook or script, without each one having to remember to.
//
// No imports on purpose: lib/prisma.ts depends on this module.

type Listener = (table: string, sql: string) => void;
// On globalThis: one registry per process even if this module is bundled
// into several chunks (the Prisma client is a process-wide singleton too).
const g = globalThis as unknown as { __tibWriteListeners?: Set<Listener> };
const listeners: Set<Listener> = (g.__tibWriteListeners ??= new Set());

const WRITE = /^\s*(?:INSERT\s+INTO|UPDATE|DELETE\s+FROM|TRUNCATE(?:\s+TABLE)?)\s+(?:ONLY\s+)?(?:"?public"?\.)?"?([A-Za-z_][A-Za-z0-9_]*)"?/i;

/** Called for every query Prisma reports. */
export function noteQuery(sql: string): void {
  if (listeners.size === 0) return;
  const m = WRITE.exec(sql); // anchored: a SELECT fails on its first letter
  if (!m) return;
  for (const l of listeners) {
    try {
      l(m[1], sql);
    } catch {
      /* a cache must never break a write */
    }
  }
}

export function onTableWrite(l: Listener): void {
  listeners.add(l);
}
