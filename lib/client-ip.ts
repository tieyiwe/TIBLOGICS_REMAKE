import { isIP } from "node:net";
import { lookup } from "node:dns/promises";
import { isBlockedAddress } from "@/lib/ssrf";

// The visitor's IP address, for rate limits, abuse checks and analytics.
//
// X-Forwarded-For is a list: whatever the client sent first, then one address
// per proxy, each appended on the right. The left-most entry is whatever the
// client chose to write, so keying rate limits on it let anyone get a fresh
// limit per request by sending a random value. The real client address is the
// one the first trusted proxy appended: read from the right, skipping the
// proxies themselves.
//
//   TRUSTED_PROXY_HOPS=N  exact: the client is the Nth entry from the right
//                         (1 = the last one). Set it once the admin check
//                         (/api/admin/client-ip) shows the right address.
//   unset                 automatic: the right-most address that is public,
//                         not a Google front end (35.191.0.0/16,
//                         130.211.0.0/22) and not one of this site's own
//                         addresses (a load balancer appending itself).
//
// Requests from a test or local network (no public entry at all) keep the
// left-most value, so local tools and tests still get distinct keys.

const GOOGLE_FRONT_END = [/^35\.191\./, /^130\.211\.[0-3]\./];

let own = new Set<string>();
let ownAt = 0;
function refreshOwn() {
  if (Date.now() - ownAt < 3_600_000) return;
  ownAt = Date.now();
  const site = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL;
  if (!site) return;
  try {
    const host = new URL(site).hostname;
    void lookup(host, { all: true }).then((r) => { own = new Set(r.map((a) => a.address)); }).catch(() => {});
  } catch {
    /* no site URL */
  }
}

function clean(v: string): string {
  let s = v.trim().replace(/^"|"$/g, "");
  if (s.startsWith("[")) s = s.slice(1, s.indexOf("]") > 0 ? s.indexOf("]") : undefined);
  else if (/^\d+\.\d+\.\d+\.\d+:\d+$/.test(s)) s = s.replace(/:\d+$/, "");
  return s.replace(/^::ffff:(?=\d+\.\d+\.\d+\.\d+$)/i, "");
}

type Bag = { get(name: string): string | null } | Record<string, unknown> | null | undefined;
const get = (h: Bag, n: string): string | null => {
  if (!h) return null;
  if (typeof (h as { get?: unknown }).get === "function") return (h as { get(name: string): string | null }).get(n);
  const v = (h as Record<string, unknown>)[n];
  return Array.isArray(v) ? v.join(",") : typeof v === "string" ? v : null;
};

export function clientIp(h: Bag): string {
  refreshOwn();
  const hops = (get(h, "x-forwarded-for") ?? "").split(",").map(clean).filter(Boolean);
  const n = Number(process.env.TRUSTED_PROXY_HOPS);
  if (Number.isInteger(n) && n >= 1 && hops.length >= n) return hops[hops.length - n];
  for (let i = hops.length - 1; i >= 0; i--) {
    const ip = hops[i];
    if (!isIP(ip) || isBlockedAddress(ip) || own.has(ip) || GOOGLE_FRONT_END.some((r) => r.test(ip))) continue;
    return ip;
  }
  const real = clean(get(h, "x-real-ip") ?? "");
  if (real && isIP(real) && !isBlockedAddress(real)) return real;
  return hops[0] || real || clean(get(h, "cf-connecting-ip") ?? "") || "unknown";
}

/** For the admin check: what the server received and what it uses. */
export function clientIpDebug(h: Bag) {
  return { forwardedFor: get(h, "x-forwarded-for"), realIp: get(h, "x-real-ip"), chosen: clientIp(h), trustedHops: process.env.TRUSTED_PROXY_HOPS ?? null, ownAddresses: [...own] };
}
