/**
 * A bounded row count for admin list endpoints.
 *
 * Several of these read a table that grows with traffic — appointments,
 * registrations, prospects, leads — with no `take` at all. That is fine on a
 * new site and becomes a slow query and a large JSON payload as the table
 * fills, on exactly the pages someone needs when the site is busiest.
 *
 * Callers keep their existing response shape; this only caps how much is read,
 * and lets the client ask for less (or more, up to `max`) with ?limit=.
 */
export function listLimit(
  url: string | URL,
  { def = 200, max = 1000 }: { def?: number; max?: number } = {},
): number {
  const raw = (typeof url === "string" ? new URL(url) : url).searchParams.get("limit");
  if (!raw) return def;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 1) return def;
  return Math.min(Math.floor(n), max);
}
