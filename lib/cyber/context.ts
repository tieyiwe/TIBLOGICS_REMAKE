import { resolve4, resolve6, resolveCaa, resolveCname, resolveMx, resolveNs, resolveTxt } from "node:dns/promises";
import tls from "node:tls";
import { isIP } from "node:net";
import { fetchOnce, guardedLookup, readTextLimited, safeFetch } from "@/lib/ssrf";
import { acceptsLegacyTls, httpRedirectOf } from "@/lib/scanner/security";
import type { CheckResult, Finding, Platform, Subdomain } from "./types";

// What the checks use to reach the outside world. In production every HTTP
// request goes through the SSRF guard (lib/ssrf.ts: the address is checked as
// the connection is made, redirects re-checked) with a clear User-Agent, a
// timeout and a size cap. Tests pass their own (a local server, fixed DNS).

export const UA = "TIBLOGICS-SecurityCheck/1.0 (+https://tiblogics.com/services; authorised website security review)";

export interface HttpResult {
  status: number;
  headers: Headers;
  /** First `max` bytes of the body, as text. */
  body: string;
  /** The URL that answered (after redirects when followed). */
  url: string;
  setCookies: string[];
}

export interface CyberContext {
  /** GET (or other method) with redirects followed (checked) or not. Throws on network errors. */
  http(url: string, opts?: { method?: string; follow?: boolean; max?: number; timeoutMs?: number; headers?: Record<string, string> }): Promise<HttpResult>;
  txt(name: string): Promise<string[] | null>;
  mx(name: string): Promise<string[] | null>;
  ns(name: string): Promise<string[] | null>;
  caa(name: string): Promise<boolean | null>;
  addresses(name: string): Promise<string[] | null>;
  cname(name: string): Promise<string | null>;
  /** Certificate Transparency names for a domain (crt.sh); null = unavailable. */
  ctNames(domain: string): Promise<string[] | null>;
  /** DNSSEC: DS records exist (via DNS over HTTPS); null = unknown. */
  dnssec(domain: string): Promise<boolean | null>;
  /** The certificate and protocol a modern client sees; null = no handshake. */
  tls(host: string, port?: number): Promise<TlsDetail | null>;
  /** Completes a handshake offering only TLS 1.0/1.1; null = could not tell. */
  legacyTls(host: string): Promise<boolean | null>;
  /** What http://host/ does. */
  httpRedirect(host: string): Promise<"https" | "http" | "closed" | null>;
}

export interface TlsDetail {
  trusted: boolean;
  error: string | null;
  validTo: string | null;
  daysLeft: number | null;
  issuer: string | null;
  protocol: string | null;
  /** Public key size in bits (RSA) or curve (EC). */
  bits: number | null;
  curve: string | null;
  /** Names the certificate covers (DNS:...). */
  altNames: string[];
}

function tlsDetail(host: string, port: number, lookup: boolean): Promise<TlsDetail | null> {
  return new Promise((resolve) => {
    let done = false;
    const finish = (v: TlsDetail | null) => {
      if (done) return;
      done = true;
      socket.destroy();
      resolve(v);
    };
    const socket = tls.connect({
      host,
      port,
      ...(isIP(host) ? {} : { servername: host }),
      rejectUnauthorized: false,
      ...(lookup ? { lookup: guardedLookup(`https://${host}`) } : {}),
    });
    socket.setTimeout(6000, () => finish(null));
    socket.on("error", () => finish(null));
    socket.on("secureConnect", () => {
      const c = socket.getPeerCertificate();
      const to = c?.valid_to ? new Date(c.valid_to) : null;
      const ok = to && !Number.isNaN(to.getTime());
      const err = socket.authorizationError as (Error & { code?: string }) | null;
      finish({
        trusted: socket.authorized,
        error: err ? String(err.code ?? err).slice(0, 80) : null,
        validTo: ok ? to!.toISOString() : null,
        daysLeft: ok ? Math.floor((to!.getTime() - Date.now()) / 86_400_000) : null,
        issuer: c?.issuer ? String((c.issuer.O as string | undefined) ?? (c.issuer.CN as string | undefined) ?? "").slice(0, 80) || null : null,
        protocol: socket.getProtocol(),
        bits: typeof c?.bits === "number" ? c.bits : null,
        curve: typeof (c as { asn1Curve?: string })?.asn1Curve === "string" ? (c as { asn1Curve?: string }).asn1Curve! : null,
        altNames: String(c?.subjectaltname ?? "").split(",").map((x) => x.trim().replace(/^DNS:/, "").toLowerCase()).filter(Boolean).slice(0, 100),
      });
    });
  });
}

/** For tests: TLS details from a local server (no address guard). */
export const tlsDetailUnguarded = (host: string, port: number) => tlsDetail(host, port, false);

const NOT_FOUND = new Set(["ENOTFOUND", "ENODATA", "NXDOMAIN"]);
const dnsOr = async <T>(p: Promise<T>, empty: T): Promise<T | null> => {
  try {
    return await withTimeout(p, 5000);
  } catch (e) {
    return NOT_FOUND.has((e as NodeJS.ErrnoException).code ?? "") ? empty : null;
  }
};

export function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  let t: ReturnType<typeof setTimeout> | undefined;
  return Promise.race([p, new Promise<T>((_, rej) => { t = setTimeout(() => rej(Object.assign(new Error(`timed out after ${ms}ms`), { code: "ETIMEOUT" })), ms); })]).finally(() => clearTimeout(t));
}

export function liveContext(): CyberContext {
  return {
    async http(url, opts = {}) {
      const u = new URL(url);
      const init = {
        method: opts.method ?? "GET",
        signal: AbortSignal.timeout(opts.timeoutMs ?? 8000),
        headers: { "User-Agent": UA, Accept: "text/html,application/json;q=0.9,*/*;q=0.8", ...(opts.headers ?? {}) },
      };
      const res = opts.follow === false ? await fetchOnce(u, init) : await safeFetch(u, { ...init, maxRedirects: 5 });
      const body = init.method === "HEAD" ? "" : await readTextLimited(res, opts.max ?? 400_000);
      return { status: res.status, headers: res.headers, body, url: res.url || url, setCookies: res.headers.getSetCookie?.() ?? [] };
    },
    txt: (n) => dnsOr(resolveTxt(n).then((r) => r.map((x) => x.join(""))), [] as string[]),
    mx: (n) => dnsOr(resolveMx(n).then((r) => r.map((x) => x.exchange)), [] as string[]),
    ns: (n) => dnsOr(resolveNs(n), [] as string[]),
    caa: (n) => dnsOr(resolveCaa(n).then((r) => r.length > 0), false),
    async addresses(n) {
      const [a, b] = await Promise.all([dnsOr(resolve4(n), [] as string[]), dnsOr(resolve6(n), [] as string[])]);
      if (a === null && b === null) return null;
      return [...(a ?? []), ...(b ?? [])];
    },
    cname: async (n) => (await dnsOr(resolveCname(n), [] as string[]))?.[0] ?? null,
    async ctNames(domain) {
      // Certificate Transparency: every certificate ever issued for the domain
      // is public. A fixed public service, not the scanned site.
      try {
        const res = await fetch(`https://crt.sh/?q=${encodeURIComponent(`%.${domain}`)}&output=json&exclude=expired`, {
          headers: { "User-Agent": UA, Accept: "application/json" },
          signal: AbortSignal.timeout(20_000),
        });
        if (!res.ok) return null;
        const rows = (await res.json()) as Array<{ name_value?: string }>;
        const names = new Set<string>();
        for (const r of rows.slice(0, 5000)) for (const n of String(r.name_value ?? "").split("\n")) names.add(n.trim().toLowerCase().replace(/^\*\./, ""));
        return [...names].filter((n) => n === domain || n.endsWith(`.${domain}`));
      } catch {
        return null;
      }
    },
    tls: (host, port = 443) => tlsDetail(host, port, true),
    legacyTls: (host) => acceptsLegacyTls(host).catch(() => null),
    httpRedirect: (host) => httpRedirectOf(host).catch(() => null),
    async dnssec(domain) {
      try {
        const res = await fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=DS`, {
          headers: { Accept: "application/dns-json" },
          signal: AbortSignal.timeout(6000),
        });
        if (!res.ok) return null;
        const j = (await res.json()) as { Answer?: Array<{ type: number }> };
        return (j.Answer ?? []).some((a) => a.type === 43);
      } catch {
        return null;
      }
    },
  };
}

/** What every check module returns. */
export interface ModuleOutput {
  findings: Finding[];
  checks: CheckResult[];
  notes?: string[];
  platform?: Partial<Platform>;
  subdomains?: Subdomain[];
}

/** The main page, fetched once and shared by the modules. */
export interface PageInfo {
  requested: string;
  finalUrl: string;
  status: number;
  headers: Record<string, string>;
  setCookies: string[];
  html: string;
  host: string;
  /** The registrable-ish domain: host without "www.". */
  apex: string;
  https: boolean;
}
