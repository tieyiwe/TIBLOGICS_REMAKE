// Outbound-request guard for the features that fetch a URL a visitor supplies:
// the website scanner, the speed check and the Rex scraper.
//
// The previous guard matched the hostname against a handful of string patterns
// like /^10\./ and `localhost`. Three ways past it:
//
//   1. A name that RESOLVES to a private address. `internal.corp.example` or
//      any of the public wildcard DNS services (127.0.0.1.nip.io and friends)
//      are ordinary hostnames and matched nothing.
//   2. A non-dotted IPv4 literal. http://2130706433/ is 127.0.0.1, and
//      http://0x7f.1/ is too.
//   3. A redirect. The fetches used redirect: "follow", so a public URL that
//      302s to http://169.254.169.254/ reached the cloud metadata service with
//      nothing looking at the second hop.
//
// So: resolve the name, check every address it resolves to, and re-check each
// redirect hop rather than letting fetch follow them.
import { lookup } from "dns/promises";
import { isIP } from "net";

export type BlockReason =
  | "scheme"
  | "private"
  | "unresolvable"
  | "too-many-redirects";

/** IPv4 as a 32-bit number, for whichever textual form it arrived in. */
function ipv4ToLong(ip: string): number | null {
  const parts = ip.split(".");
  if (parts.length !== 4) return null;
  let out = 0;
  for (const p of parts) {
    if (!/^\d{1,3}$/.test(p)) return null;
    const n = Number(p);
    if (n > 255) return null;
    out = out * 256 + n;
  }
  return out;
}

/**
 * Is this address one we must never fetch?
 *
 * Covers loopback, the RFC1918 ranges, link-local (which is where the cloud
 * metadata service lives), carrier-grade NAT, benchmarking, multicast and
 * reserved space, plus the IPv6 equivalents and IPv4-mapped IPv6.
 */
export function isBlockedAddress(addr: string): boolean {
  const v = isIP(addr);

  if (v === 4) {
    const n = ipv4ToLong(addr);
    if (n === null) return true; // unparseable: refuse rather than guess
    const inRange = (cidrStart: string, bits: number) => {
      const start = ipv4ToLong(cidrStart)!;
      const mask = bits === 0 ? 0 : (-1 << (32 - bits)) >>> 0;
      return (n & mask) === (start & mask);
    };
    return (
      inRange("0.0.0.0", 8) ||        // "this network"
      inRange("10.0.0.0", 8) ||       // private
      inRange("100.64.0.0", 10) ||    // carrier-grade NAT
      inRange("127.0.0.0", 8) ||      // loopback
      inRange("169.254.0.0", 16) ||   // link-local — cloud metadata
      inRange("172.16.0.0", 12) ||    // private
      inRange("192.0.0.0", 24) ||     // IETF protocol assignments
      inRange("192.0.2.0", 24) ||     // documentation
      inRange("192.168.0.0", 16) ||   // private
      inRange("198.18.0.0", 15) ||    // benchmarking
      inRange("198.51.100.0", 24) ||  // documentation
      inRange("203.0.113.0", 24) ||   // documentation
      n >= ipv4ToLong("224.0.0.0")!   // multicast, reserved, broadcast
    );
  }

  if (v === 6) {
    const lower = addr.toLowerCase().replace(/^\[|\]$/g, "");
    if (lower === "::" || lower === "::1") return true;
    // IPv4-mapped (::ffff:127.0.0.1) and IPv4-compatible: judge the IPv4 part.
    const mapped = lower.match(/^::(?:ffff:)?(\d{1,3}(?:\.\d{1,3}){3})$/);
    if (mapped) return isBlockedAddress(mapped[1]);
    return (
      /^f[cd]/.test(lower) ||   // fc00::/7 unique local
      /^fe[89ab]/.test(lower) || // fe80::/10 link-local
      /^ff/.test(lower)          // ff00::/8 multicast
    );
  }

  return true; // not an IP at all
}

/**
 * Resolve a hostname and refuse it if ANY address it maps to is blocked.
 *
 * A name with both a public and a private record is refused: the fetch could
 * land on either, and a split answer is itself a sign of a rebinding attempt.
 */
export async function isHostAllowed(hostname: string): Promise<{ ok: true } | { ok: false; reason: BlockReason }> {
  const host = hostname.replace(/^\[|\]$/g, "").toLowerCase();

  // A bare IP needs no lookup. Note `isIP` rejects 2130706433 and 0x7f.1, so
  // those fall through to the resolver, which either fails or returns the
  // address they denote — either way it is checked.
  if (isIP(host)) {
    return isBlockedAddress(host) ? { ok: false, reason: "private" } : { ok: true };
  }

  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local")) {
    return { ok: false, reason: "private" };
  }

  let addresses: Array<{ address: string }>;
  try {
    addresses = await lookup(host, { all: true });
  } catch {
    return { ok: false, reason: "unresolvable" };
  }
  if (addresses.length === 0) return { ok: false, reason: "unresolvable" };
  if (addresses.some((a) => isBlockedAddress(a.address))) {
    return { ok: false, reason: "private" };
  }
  return { ok: true };
}

export const BLOCK_MESSAGES: Record<BlockReason, string> = {
  scheme: "Only HTTP and HTTPS addresses can be scanned.",
  private: "That address is on a private or internal network, so it cannot be scanned.",
  unresolvable: "That domain could not be resolved. Check the spelling.",
  "too-many-redirects": "That address redirects too many times.",
};

/** Validate a URL string, returning the parsed URL or why it was refused. */
export async function checkTargetUrl(
  input: string,
): Promise<{ ok: true; url: URL } | { ok: false; reason: BlockReason }> {
  const trimmed = input.trim();

  // A bare domain gets https:// added. Anything that already names a scheme
  // keeps it, so file: and gopher: are rejected as schemes rather than being
  // turned into the nonsense "https://file:///etc/passwd" and failing later
  // for the wrong reason.
  // `host:port` is not a scheme. Without this, "mysite.com:8443" and
  // "localhost:5000" were read as the schemes "mysite.com" and "localhost" and
  // refused with the wrong message. A colon followed by digits is a port.
  const hasScheme = /^[a-z][a-z0-9+.-]*:(?!\d)/i.test(trimmed);
  if (hasScheme && !/^https?:\/\//i.test(trimmed)) {
    return { ok: false, reason: "scheme" };
  }

  let url: URL;
  try {
    url = new URL(hasScheme ? trimmed : `https://${trimmed}`);
  } catch {
    return { ok: false, reason: "unresolvable" };
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return { ok: false, reason: "scheme" };
  }
  const host = await isHostAllowed(url.hostname);
  return host.ok ? { ok: true, url } : { ok: false, reason: host.reason };
}

/**
 * fetch() that follows redirects itself, checking every hop.
 *
 * `redirect: "follow"` hands the decision to undici, which will happily follow
 * a public URL to an internal one. Each Location here goes back through the
 * same check as the original URL.
 */
export async function safeFetch(
  target: URL | string,
  init: RequestInit & { maxRedirects?: number } = {},
): Promise<Response> {
  const { maxRedirects = 4, ...rest } = init;
  let current = typeof target === "string" ? new URL(target) : target;

  for (let hop = 0; hop <= maxRedirects; hop++) {
    const res = await fetch(current, { ...rest, redirect: "manual" });
    if (res.status < 300 || res.status > 399) return res;

    const location = res.headers.get("location");
    if (!location) return res; // a 3xx with nowhere to go is the final answer

    let next: URL;
    try {
      next = new URL(location, current);
    } catch {
      return res;
    }
    const check = await checkTargetUrl(next.toString());
    if (!check.ok) {
      throw new SsrfBlockedError(check.reason, next.toString());
    }
    current = check.url;
  }

  throw new SsrfBlockedError("too-many-redirects", current.toString());
}

export class SsrfBlockedError extends Error {
  readonly reason: BlockReason;
  readonly attempted: string;

  constructor(reason: BlockReason, attempted: string) {
    super(`${BLOCK_MESSAGES[reason]} (${attempted})`);
    this.name = "SsrfBlockedError";
    this.reason = reason;
    this.attempted = attempted;
  }
}
