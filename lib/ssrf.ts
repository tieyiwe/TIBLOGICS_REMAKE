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

/** An IPv6 address (any textual form, optional zone id) as 16 bytes, or null. */
function ipv6Bytes(addr: string): number[] | null {
  let s = addr.split("%")[0];
  // A trailing dotted IPv4 part becomes two hex groups.
  const dotted = s.match(/^(.*:)(\d{1,3}(?:\.\d{1,3}){3})$/);
  if (dotted) {
    const n = ipv4ToLong(dotted[2]);
    if (n === null) return null;
    s = `${dotted[1]}${((n >>> 16) & 0xffff).toString(16)}:${(n & 0xffff).toString(16)}`;
  }
  const halves = s.split("::");
  if (halves.length > 2) return null;
  const parse = (part: string) => (part ? part.split(":") : []);
  const head = parse(halves[0]);
  const tail = halves.length === 2 ? parse(halves[1]) : [];
  const missing = 8 - head.length - tail.length;
  if (halves.length === 2 ? missing < 1 : missing !== 0) return null;
  const groups = [...head, ...Array(Math.max(0, missing)).fill("0"), ...tail];
  const out: number[] = [];
  for (const g of groups) {
    if (!/^[0-9a-f]{1,4}$/.test(g)) return null;
    const n = parseInt(g, 16);
    out.push(n >> 8, n & 0xff);
  }
  return out.length === 16 ? out : null;
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
    // Judged on the 16 parsed bytes, not the text. WHATWG URL rewrites
    // [::ffff:127.0.0.1] as [::ffff:7f00:1], which the old dotted-only regex
    // did not recognise, so http://[::ffff:127.0.0.1]:5000/ (loopback) and
    // [::ffff:a9fe:a9fe] (metadata service) were allowed.
    const b = ipv6Bytes(lower);
    if (!b) return true; // unparseable: refuse rather than guess
    const v4 = (o: number) => `${b[o]}.${b[o + 1]}.${b[o + 2]}.${b[o + 3]}`;
    const zero = (from: number, to: number) => b.slice(from, to).every((x) => x === 0);
    if (zero(0, 16)) return true; // ::
    if (zero(0, 15) && b[15] === 1) return true; // ::1
    // IPv4-mapped (::ffff:a.b.c.d) and IPv4-compatible (::a.b.c.d): judge the IPv4 part.
    if (zero(0, 10) && ((b[10] === 0xff && b[11] === 0xff) || (b[10] === 0 && b[11] === 0))) return isBlockedAddress(v4(12));
    // NAT64 64:ff9b::/96 and 64:ff9b:1::/48 embed an IPv4 address too.
    if (b[0] === 0x00 && b[1] === 0x64 && b[2] === 0xff && b[3] === 0x9b) return isBlockedAddress(v4(12));
    // 6to4 2002::/16 embeds the IPv4 address in bytes 2-5.
    if (b[0] === 0x20 && b[1] === 0x02) return isBlockedAddress(v4(2));
    return (
      (b[0] === 0x20 && b[1] === 0x01 && b[2] === 0x00 && b[3] === 0x00) || // 2001::/32 Teredo
      (b[0] === 0x20 && b[1] === 0x01 && b[2] === 0x0d && b[3] === 0xb8) || // 2001:db8::/32 documentation
      (b[0] === 0x01 && b[1] === 0x00 && zero(2, 8)) || // 100::/64 discard
      (b[0] & 0xfe) === 0xfc ||               // fc00::/7 unique local
      (b[0] === 0xfe && (b[1] & 0xc0) === 0x80) || // fe80::/10 link-local
      (b[0] === 0xfe && (b[1] & 0xc0) === 0xc0) || // fec0::/10 site-local (deprecated)
      b[0] === 0xff                           // ff00::/8 multicast
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

/**
 * The body as text, reading at most `maxBytes` and then cancelling the stream.
 * `res.text()` buffers the whole body before any `.slice()`, so a scanned site
 * that streams gigabytes (or never ends) could exhaust the server's memory.
 */
export async function readTextLimited(res: Response, maxBytes: number): Promise<string> {
  if (!res.body) return "";
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (total < maxBytes) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      total += value.byteLength;
    }
  } finally {
    reader.cancel().catch(() => {});
  }
  return Buffer.concat(chunks).subarray(0, maxBytes).toString("utf8");
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
