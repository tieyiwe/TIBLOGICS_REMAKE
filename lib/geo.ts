import prisma from "@/lib/prisma";

// Approximate location (country, region, city) of a visitor from their IP.
//
//   1. Edge headers when the host sets them (Cloudflare, Vercel, CloudFront).
//      Replit usually sends none.
//   2. A lookup: ipinfo.io when IPINFO_TOKEN is set, otherwise ipwho.is (HTTPS,
//      no key). GEO_LOOKUP_URL overrides both (tests, or another provider that
//      answers the same JSON): "{ip}" in it is replaced by the address.
//
// The full address is only ever held in memory for the lookup; tables keep the
// anonymised form (lib/require-admin anonymiseIp). Lookups run after the
// response (geoLater), time out after 1.5 s, are cached for 24 h (about 5,000
// addresses), skip private and reserved ranges, and never throw.

export interface Geo {
  /** ISO 3166-1 alpha-2, upper case. */
  country: string | null;
  countryName: string | null;
  region: string | null;
  city: string | null;
}

const TTL = 24 * 3_600_000;
const MAX = 5_000;
const TIMEOUT = 1_500;
const cache = new Map<string, { at: number; geo: Geo | null }>();

type HeaderBag = Headers | Record<string, unknown> | null | undefined;
function header(h: HeaderBag, name: string): string | null {
  if (!h) return null;
  if (typeof (h as Headers).get === "function") return (h as Headers).get(name);
  const v = (h as Record<string, unknown>)[name];
  return typeof v === "string" ? v : null;
}

let names: Intl.DisplayNames | null = null;
export function countryName(code: string | null | undefined): string | null {
  if (!code || !/^[A-Z]{2}$/.test(code)) return null;
  try {
    names ??= new Intl.DisplayNames(["en"], { type: "region" });
    return names.of(code) ?? null;
  } catch {
    return null;
  }
}

/** "🇫🇷" for "FR". */
export function flag(code: string | null | undefined): string {
  if (!code || !/^[A-Z]{2}$/.test(code)) return "";
  return String.fromCodePoint(...[...code].map((c) => 0x1f1a5 + c.charCodeAt(0)));
}

const clean = (v: unknown, n = 80): string | null => {
  if (typeof v !== "string") return null;
  const s = v.replace(/[\u0000-\u001f<>]/g, "").trim().slice(0, n);
  return s || null;
};

function decodeHeader(v: string | null): string | null {
  if (!v) return null;
  try {
    return clean(decodeURIComponent(v));
  } catch {
    return clean(v);
  }
}

/** Location from edge headers, when the host provides them. */
export function geoFromHeaders(h: HeaderBag): Geo | null {
  let country: string | null = null;
  for (const name of ["cf-ipcountry", "x-vercel-ip-country", "cloudfront-viewer-country", "x-country-code", "x-appengine-country"]) {
    const v = header(h, name)?.trim().toUpperCase();
    if (v && /^[A-Z]{2}$/.test(v) && v !== "XX" && v !== "T1" && v !== "ZZ") {
      country = v;
      break;
    }
  }
  if (!country) return null;
  const region = decodeHeader(header(h, "x-vercel-ip-country-region") ?? header(h, "cf-region") ?? header(h, "cloudfront-viewer-country-region-name"));
  const city = decodeHeader(header(h, "x-vercel-ip-city") ?? header(h, "cf-ipcity") ?? header(h, "cloudfront-viewer-city"));
  return { country, countryName: countryName(country), region, city };
}

/** The caller's address from the proxy headers (first hop). */
export function clientIp(h: HeaderBag): string | null {
  const raw = header(h, "x-forwarded-for")?.split(",")[0].trim() || header(h, "x-real-ip")?.trim() || header(h, "cf-connecting-ip")?.trim() || "";
  const ip = raw.replace(/^\[|\]$/g, "").replace(/^::ffff:(?=\d+\.\d+\.\d+\.\d+$)/i, "");
  return ip || null;
}

/** Private, loopback, link-local, CGNAT, multicast and reserved ranges. */
export function isPublicIp(ip: string | null | undefined): ip is string {
  if (!ip || ip === "unknown") return false;
  const v4 = ip.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (v4) {
    const [a, b] = [Number(v4[1]), Number(v4[2])];
    if ([a, b, Number(v4[3]), Number(v4[4])].some((n) => n > 255)) return false;
    if (a === 0 || a === 10 || a === 127 || a >= 224) return false;
    if (a === 100 && b >= 64 && b <= 127) return false;
    if (a === 169 && b === 254) return false;
    if (a === 172 && b >= 16 && b <= 31) return false;
    if (a === 192 && (b === 168 || (b === 0 && Number(v4[3]) <= 2))) return false;
    if (a === 198 && (b === 18 || b === 19 || b === 51)) return false;
    if (a === 203 && b === 0 && Number(v4[3]) === 113) return false;
    return true;
  }
  if (!/^[0-9a-f:]+$/i.test(ip) || !ip.includes(":")) return false;
  const s = ip.toLowerCase();
  if (s === "::" || s === "::1") return false;
  if (/^(fc|fd|fe8|fe9|fea|feb|ff)/.test(s)) return false;
  if (s.startsWith("2001:db8") || s.startsWith("2001:0db8")) return false;
  return /^[23]/.test(s);
}

function lookupUrl(ip: string): string {
  const override = process.env.GEO_LOOKUP_URL?.trim();
  if (override) return override.includes("{ip}") ? override.replace("{ip}", encodeURIComponent(ip)) : `${override.replace(/\/$/, "")}/${encodeURIComponent(ip)}`;
  const token = process.env.IPINFO_TOKEN?.trim();
  if (token) return `https://ipinfo.io/${encodeURIComponent(ip)}?token=${encodeURIComponent(token)}`;
  return `https://ipwho.is/${encodeURIComponent(ip)}?fields=success,country_code,country,region,city`;
}

/** Reads ipinfo.io ({country, region, city}) and ipwho.is ({country_code, country, region, city}). */
function parse(j: Record<string, unknown>): Geo | null {
  if (j.success === false || j.bogon === true) return null;
  const code = (clean(j.country_code, 2) ?? (typeof j.country === "string" && /^[A-Za-z]{2}$/.test(j.country) ? j.country : null))?.toUpperCase() ?? null;
  if (!code || !/^[A-Z]{2}$/.test(code)) return null;
  const nameField = typeof j.country === "string" && j.country.length > 2 ? clean(j.country) : null;
  return { country: code, countryName: nameField ?? countryName(code), region: clean(j.region), city: clean(j.city) };
}

async function lookup(ip: string): Promise<Geo | null> {
  try {
    const res = await fetch(lookupUrl(ip), { signal: AbortSignal.timeout(TIMEOUT), headers: { accept: "application/json" }, cache: "no-store" });
    if (!res.ok) return null;
    const text = await res.text();
    if (text.length > 20_000) return null;
    return parse(JSON.parse(text) as Record<string, unknown>);
  } catch {
    return null;
  }
}

/**
 * Location of an address: edge headers first, then the cached lookup.
 * Null when unknown (private address, provider down, no answer in 1.5 s).
 */
export async function locate(ip: string | null | undefined, headers?: HeaderBag): Promise<Geo | null> {
  try {
    const fromEdge = geoFromHeaders(headers);
    if (fromEdge?.city) return fromEdge;
    if (!isPublicIp(ip)) return fromEdge;
    const hit = cache.get(ip);
    if (hit && Date.now() - hit.at < TTL) {
      cache.delete(ip);
      cache.set(ip, hit); // most recently used last
      return hit.geo ?? fromEdge;
    }
    const geo = await lookup(ip);
    cache.set(ip, { at: Date.now(), geo });
    while (cache.size > MAX) cache.delete(cache.keys().next().value as string);
    if (fromEdge && geo && geo.country !== fromEdge.country) return fromEdge;
    return geo ?? fromEdge;
  } catch {
    return null;
  }
}

/** Tables geoLater may update, and whether each has a countryName column. */
const GEO_TABLES = { ScanLog: true, PageView: false, ClickEvent: false } as const;
export type GeoTable = keyof typeof GEO_TABLES;

/**
 * Fills country, region and city on rows already written, after the response
 * (edge headers win over the lookup, see locate). Never throws.
 */
export async function fillGeo(table: GeoTable, ids: string[], ip: string | null, headers?: HeaderBag): Promise<void> {
  try {
    if (!ids.length || !(table in GEO_TABLES)) return;
    const geo = await locate(ip, headers);
    if (!geo?.country) return;
    const withName = GEO_TABLES[table];
    const cols = table === "ClickEvent" ? `"country" = $1` : `"country" = $1, "region" = $2, "city" = $3${withName ? `, "countryName" = $4` : ""}`;
    const args: unknown[] = table === "ClickEvent" ? [geo.country] : [geo.country, geo.region, geo.city, ...(withName ? [geo.countryName] : [])];
    const n = args.length;
    await prisma.$executeRawUnsafe(`UPDATE "${table}" SET ${cols} WHERE "id" = ANY($${n + 1}::text[])`, ...args, ids.slice(0, 100));
  } catch (err) {
    console.error("[geo] fill", table, err instanceof Error ? err.message : err);
  }
}

/** Test hook. */
export function _clearGeoCache() {
  cache.clear();
}
