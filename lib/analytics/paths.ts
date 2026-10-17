// Path normalisation for first-party analytics (page views, clicks, scan log).
// Pure: used by the browser tracker and again on the server, which never
// trusts what the browser sent.
//
// Recorded paths never carry a query string, a fragment or a secret: routes
// whose segment is a token (report links, parent links, invites) are replaced
// by a pattern, and any segment that looks like an id (cuid, uuid, number,
// long random string) becomes ":id". Human slugs ("/learning-box/vibe-coding-engineer",
// "/learn/track/ai-foundations") are kept so they group by what they are.

/** Never tracked at all: staff area, APIs, and routes with a secret in the path. */
const SKIP = [/^\/admin_pro(\/|$)/, /^\/api(\/|$)/, /^\/parent(\/|$)/, /^\/play(\/|$)/, /^\/_next(\/|$)/];

/**
 * Known dynamic routes, first match wins. The replacement keeps the static
 * part. Token routes are listed so the token never reaches the database even
 * when it would not look random enough for the generic rule below.
 */
const PATTERNS: Array<[RegExp, string]> = [
  [/^\/tools\/scanner\/report\/[^/]+/, "/tools/scanner/report/:token"],
  [/^\/blueprint\/[^/]+/, "/blueprint/:token"],
  [/^\/monitor\/[^/]+/, "/monitor/:token"],
  [/^\/join-team\/[^/]+/, "/join-team/:token"],
  [/^\/scholarship\/[^/]+/, "/scholarship/:token"],
  [/^\/parent\/[^/]+/, "/parent/:token"],
  [/^\/play\/[^/]+/, "/play/:token"],
  [/^\/go\/[^/]+/, "/go/:code"],
  [/^\/r\/[^/]+/, "/r/:code"],
  [/^\/certificates\/[^/]+/, "/certificates/:id"],
  [/^\/badges\/[^/]+/, "/badges/:id"],
  [/^\/learn\/certificates\/[^/]+/, "/learn/certificates/:id"],
  [/^\/learn\/lesson\/[^/]+/, "/learn/lesson/:id"],
  [/^\/learn\/quiz\/[^/]+/, "/learn/quiz/:id"],
  [/^\/learn\/live\/[^/]+/, "/learn/live/:id"],
  [/^\/learn\/inbox\/[^/]+/, "/learn/inbox/:id"],
  [/^\/learn\/community\/thread\/[^/]+/, "/learn/community/thread/:id"],
  [/^\/learn\/community\/cohort\/[^/]+/, "/learn/community/cohort/:id"],
  [/^\/learn\/team\/member\/[^/]+/, "/learn/team/member/:id"],
  [/^\/learn\/reset\/[^/]+/, "/learn/reset/:token"],
  [/^\/learn\/unsubscribe\/[^/]+/, "/learn/unsubscribe/:token"],
  [/^\/learn\/account-status\/[^/]+/, "/learn/account-status/:token"],
];

const CUID = /^c[a-z0-9]{20,32}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const NUM = /^\d+$/;
const HEX = /^[0-9a-f]{12,}$/i;

/** A segment that is an id or a token rather than a human slug. */
export function looksLikeId(seg: string): boolean {
  if (!seg) return false;
  if (CUID.test(seg) || UUID.test(seg) || NUM.test(seg) || HEX.test(seg)) return true;
  // Base64url and similar tokens: long, and mixing digits with letters
  // (or upper with lower case) instead of being dash-separated words.
  if (seg.length >= 16 && !/-[a-z]+-/.test(seg)) {
    const digits = /\d/.test(seg);
    const mixedCase = /[a-z]/.test(seg) && /[A-Z]/.test(seg);
    if ((digits && /[a-z]/i.test(seg)) || mixedCase || /_/.test(seg)) return true;
  }
  return false;
}

/** Path only (no origin, query or fragment), at most 200 characters. */
function pathOnly(raw: string): string {
  let p = String(raw ?? "").trim();
  if (!p) return "/";
  try {
    if (/^https?:\/\//i.test(p)) p = new URL(p).pathname;
  } catch {
    return "/";
  }
  p = p.split(/[?#]/)[0] || "/";
  if (!p.startsWith("/")) p = "/" + p;
  try {
    p = decodeURI(p);
  } catch {
    /* keep it encoded */
  }
  p = p.replace(/\/{2,}/g, "/");
  if (p.length > 1) p = p.replace(/\/+$/, "");
  return p.slice(0, 200);
}

export function isTrackablePath(raw: string): boolean {
  const p = pathOnly(raw);
  return !SKIP.some((re) => re.test(p));
}

/** The grouping key for a page: "/learn/lesson/:id", "/learning-box/vibe-coding-engineer". */
export function normalizePath(raw: string): string {
  let p = pathOnly(raw);
  for (const [re, to] of PATTERNS) {
    if (re.test(p)) {
      p = p.replace(re, to);
      break;
    }
  }
  const segs = p.split("/").map((s) => (s.startsWith(":") ? s : looksLikeId(s) ? ":id" : s.replace(/[^\w\-.~:]/g, "").slice(0, 80)));
  const out = segs.join("/") || "/";
  return out.length > 1 ? out.replace(/\/+$/, "") || "/" : out;
}

export type Area = "website" | "arfa" | "other";

export function areaOf(path: string): Area {
  if (/^\/learn(\/|$)/.test(path)) return "arfa";
  if (/^\/(toolkit|monitor|blueprint|portal|video)(\/|$)/.test(path)) return "other";
  return "website";
}

/** SQL condition for an area filter on a "page" column (constant strings only). */
export function areaSql(area: Area | "all", col = `"page"`): string {
  if (area === "arfa") return `(${col} = '/learn' OR ${col} LIKE '/learn/%')`;
  if (area === "other") return `(${col} ~ '^/(toolkit|monitor|blueprint|portal|video)(/|$)')`;
  if (area === "website") return `NOT (${col} = '/learn' OR ${col} LIKE '/learn/%' OR ${col} ~ '^/(toolkit|monitor|blueprint|portal|video)(/|$)')`;
  return "TRUE";
}

/** An internal link's normalised path, or "external:host". Null for non-navigations. */
export function hrefKey(href: string | null | undefined, ownHost: string): string | null {
  if (!href) return null;
  const h = href.trim();
  if (!h || h.startsWith("#") || /^(javascript|data|blob):/i.test(h)) return null;
  if (/^mailto:/i.test(h)) return "mailto";
  if (/^tel:/i.test(h)) return "tel";
  try {
    const u = new URL(h, `https://${ownHost || "tiblogics.com"}`);
    if (!/^https?:$/.test(u.protocol)) return null;
    const host = u.hostname.replace(/^www\./, "");
    const own = (ownHost || "tiblogics.com").replace(/^www\./, "");
    if (host !== own && host !== "tiblogics.com" && host !== "localhost") return `external:${host.slice(0, 80)}`;
    if (!isTrackablePath(u.pathname)) return u.pathname.startsWith("/api") ? "/api" : null;
    return normalizePath(u.pathname);
  } catch {
    return null;
  }
}

/** Labels that could carry personal data are dropped. */
export function safeLabel(raw: string | null | undefined): string | null {
  const s = String(raw ?? "").replace(/\s+/g, " ").trim().slice(0, 60);
  if (!s) return null;
  if (/[^\s@]+@[^\s@]+\.[^\s@]+/.test(s)) return null; // email
  if (/(\+?\d[\d\s().-]{7,}\d)/.test(s)) return null; // phone-like
  if (/\d{6,}/.test(s.replace(/[\s-]/g, ""))) return null; // long digit runs (cards, ids)
  return s;
}
