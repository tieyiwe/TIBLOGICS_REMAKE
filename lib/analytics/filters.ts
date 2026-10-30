import type { Area } from "./paths";

// Filters shared by the analytics admin pages and their CSV exports. They live
// in the URL (?range=30&area=arfa&device=mobile&country=FR&from=&to=), so a
// filtered view can be bookmarked or shared, and every value is checked here
// before it reaches SQL (as a bound parameter, never spliced).

export const RANGE_DAYS = [7, 30, 90, 365] as const;
export type RangeKey = (typeof RANGE_DAYS)[number] | "custom";

export interface Filters {
  range: RangeKey;
  from: Date;
  to: Date;
  /** The period before, same length (for trends). */
  prevFrom: Date;
  prevTo: Date;
  days: number;
  area: Area | "all";
  device: "mobile" | "tablet" | "desktop" | null;
  country: string | null;
  source: string | null;
  q: string | null;
  outcome: string | null;
}

type SP = Record<string, string | string[] | undefined> | URLSearchParams;

export function param(sp: SP, k: string): string | null {
  const v = sp instanceof URLSearchParams ? sp.get(k) : sp[k];
  const s = Array.isArray(v) ? v[0] : v;
  return typeof s === "string" && s.trim() ? s.trim().slice(0, 200) : null;
}

const DAY = 86_400_000;
const isoDay = /^\d{4}-\d{2}-\d{2}$/;

function day(s: string | null): Date | null {
  if (!s || !isoDay.test(s)) return null;
  const d = new Date(`${s}T00:00:00Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function parseFilters(sp: SP, defaults: { range?: RangeKey } = {}): Filters {
  const now = Date.now();
  const rawRange = param(sp, "range");
  let range: RangeKey = defaults.range ?? 30;
  const n = Number(rawRange);
  if ((RANGE_DAYS as readonly number[]).includes(n)) range = n as RangeKey;
  let from = new Date(now - (range === "custom" ? 30 : range) * DAY);
  let to = new Date(now);
  const f = day(param(sp, "from"));
  const t = day(param(sp, "to"));
  if (rawRange === "custom" || f || t) {
    if (f || t) {
      range = "custom";
      from = f ?? new Date((t ?? new Date(now)).getTime() - 30 * DAY);
      to = t ? new Date(t.getTime() + DAY) : new Date(now); // "to" is inclusive
      if (to.getTime() - from.getTime() > 400 * DAY) from = new Date(to.getTime() - 400 * DAY);
      if (to <= from) to = new Date(from.getTime() + DAY);
    }
  }
  const len = to.getTime() - from.getTime();
  const areaRaw = param(sp, "area");
  const area: Filters["area"] = areaRaw === "website" || areaRaw === "arfa" || areaRaw === "other" ? areaRaw : "all";
  const dev = param(sp, "device");
  const device: Filters["device"] = dev === "mobile" || dev === "tablet" || dev === "desktop" ? dev : null;
  const c = param(sp, "country")?.toUpperCase() ?? null;
  const country = c && /^[A-Z]{2}$/.test(c) ? c : null;
  const src = param(sp, "source");
  const source = src && /^[\w.\-/ +:]{1,80}$/.test(src) ? src.toLowerCase() : null;
  const q = param(sp, "q")?.toLowerCase().replace(/[%_\\]/g, "").slice(0, 100) || null;
  const o = param(sp, "outcome");
  return {
    range,
    from,
    to,
    prevFrom: new Date(from.getTime() - len),
    prevTo: from,
    days: Math.max(1, Math.round(len / DAY)),
    area,
    device,
    country,
    source,
    q,
    outcome: o && /^[a-z_]{1,20}$/.test(o) ? o : null,
  };
}

/** The same filters as a query string (for links and CSV), with overrides. */
export function filterQuery(f: Filters, over: Record<string, string | null> = {}): string {
  const base: Record<string, string | null> = {
    range: f.range === "custom" ? null : String(f.range),
    from: f.range === "custom" ? f.from.toISOString().slice(0, 10) : null,
    to: f.range === "custom" ? new Date(f.to.getTime() - DAY).toISOString().slice(0, 10) : null,
    area: f.area === "all" ? null : f.area,
    device: f.device,
    country: f.country,
    source: f.source,
    q: f.q,
    outcome: f.outcome,
  };
  const merged = { ...base, ...over };
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(merged)) if (v) qs.set(k, v);
  const s = qs.toString();
  return s ? `?${s}` : "";
}

export const fmtDay = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
