import tls from "tls";
import { isIP } from "net";
import { resolveCaa, resolveTxt } from "dns/promises";
import { fetchOnce, guardedLookup, isBlockedAddress } from "@/lib/ssrf";

// The security probes of the public scanner, beside what extra.ts reads from
// the page itself (headers, cookies, forms, scripts, SPF and DMARC).
//
// Passive, like the rest of the scanner: what any browser or mail server does
// when it meets the site. One TLS handshake to read the certificate, one that
// offers only TLS 1.0/1.1 to see whether the server still accepts them, one
// plain-HTTP request to see whether it redirects to HTTPS, and DNS lookups.
// No paths are guessed, nothing is logged into, no ports are scanned. Every
// connection goes through the internal-address check (lib/ssrf.ts).

export interface TlsInfo {
  /** Certificate end date (ISO). */
  validTo: string | null;
  /** Days until it ends (negative: already ended). */
  daysLeft: number | null;
  issuer: string | null;
  /** The chain is trusted and matches the name. */
  trusted: boolean;
  /** Why not, as OpenSSL says it (CERT_HAS_EXPIRED, ERR_TLS_CERT_ALTNAME_INVALID...). */
  error: string | null;
  /** The version negotiated with a modern client (TLSv1.3, TLSv1.2...). */
  protocol: string | null;
}

export interface SecuritySignals {
  /** null: the handshake could not be made (not scored). */
  tls: TlsInfo | null;
  /** The server still completes a TLS 1.0 or 1.1 handshake; null = not checked. */
  legacyTls: boolean | null;
  /** What http://host/ does: redirect to https, serve the page over http, or nothing answers. */
  httpRedirect: "https" | "http" | "closed" | null;
  /** CAA records exist; null = could not check. */
  caa: boolean | null;
  /** The DKIM selector found among the common ones, "" = none of them; null = could not check. */
  dkim: string | null;
  /** Set-Cookie headers of the main page. */
  setCookies: string[];
}

const TIMEOUT_MS = 5000;

function handshake(host: string, port: number, opts: tls.ConnectionOptions): Promise<TlsInfo | null> {
  return new Promise((resolve) => {
    let done = false;
    const finish = (v: TlsInfo | null) => {
      if (done) return;
      done = true;
      socket.destroy();
      resolve(v);
    };
    const socket = tls.connect({
      host,
      port,
      // SNI needs a name; an IP literal gets none.
      ...(isIP(host) ? {} : { servername: host }),
      rejectUnauthorized: false,
      lookup: guardedLookup(`https://${host}`),
      ...opts,
    });
    socket.setTimeout(TIMEOUT_MS, () => finish(null));
    socket.on("error", () => finish(null));
    socket.on("secureConnect", () => {
      const cert = socket.getPeerCertificate();
      const validTo = cert?.valid_to ? new Date(cert.valid_to) : null;
      const issuer = cert?.issuer ? (cert.issuer.O as string | undefined) ?? (cert.issuer.CN as string | undefined) ?? null : null;
      const err = socket.authorizationError;
      finish({
        validTo: validTo && !Number.isNaN(validTo.getTime()) ? validTo.toISOString() : null,
        daysLeft: validTo && !Number.isNaN(validTo.getTime()) ? Math.floor((validTo.getTime() - Date.now()) / 86_400_000) : null,
        issuer: issuer ? String(issuer).slice(0, 80) : null,
        trusted: socket.authorized,
        error: err ? String((err as Error & { code?: string }).code ?? err).slice(0, 80) : null,
        protocol: socket.getProtocol(),
      });
    });
  });
}

/** The certificate and protocol seen by a modern client. Exported for tests (a local server). */
export function readTls(host: string, port = 443): Promise<TlsInfo | null> {
  return handshake(host, port, {});
}

/** Whether the server completes a handshake when only TLS 1.0/1.1 are offered. */
export async function acceptsLegacyTls(host: string, port = 443): Promise<boolean | null> {
  const r = await handshake(host, port, {
    minVersion: "TLSv1",
    maxVersion: "TLSv1.1",
    // Node refuses the old versions' ciphers at its default security level.
    ciphers: "DEFAULT:@SECLEVEL=0",
  });
  return r !== null;
}

/** What a plain-HTTP visit to the host gets. */
export async function httpRedirectOf(host: string, port = 80): Promise<SecuritySignals["httpRedirect"]> {
  try {
    const res = await fetchOnce(new URL(`http://${host}:${port}/`), { signal: AbortSignal.timeout(TIMEOUT_MS) });
    const loc = res.headers.get("location") ?? "";
    await res.body?.cancel().catch(() => {});
    if (res.status >= 300 && res.status < 400) return /^https:\/\//i.test(loc) ? "https" : "http";
    return "http";
  } catch (err) {
    const code = (err as { code?: string; cause?: { code?: string } })?.code ?? (err as { cause?: { code?: string } })?.cause?.code;
    // Nothing listening on port 80: plain HTTP is simply not offered.
    if (code === "ECONNREFUSED") return "closed";
    return null;
  }
}

const DKIM_SELECTORS = ["google", "selector1", "selector2", "default", "k1", "k2", "s1", "s2", "mail", "dkim", "smtp", "mxvault", "zoho", "fm1", "everlytickey1"];
const NOT_FOUND = new Set(["ENOTFOUND", "ENODATA", "NXDOMAIN", "ESERVFAIL"]);

async function withTimeout<T>(p: Promise<T>, ms: number): Promise<T | null> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<null>((r) => { timer = setTimeout(() => r(null), ms); });
  try {
    return await Promise.race([p, timeout]);
  } finally {
    clearTimeout(timer);
  }
}

export async function caaOf(apex: string): Promise<boolean | null> {
  return withTimeout(
    resolveCaa(apex).then((r) => r.length > 0).catch((e: NodeJS.ErrnoException) => (NOT_FOUND.has(e.code ?? "") ? false : null)),
    4000,
  );
}

export async function dkimOf(apex: string): Promise<string | null> {
  return withTimeout(
    (async () => {
      const found = await Promise.all(
        DKIM_SELECTORS.map((sel) =>
          resolveTxt(`${sel}._domainkey.${apex}`)
            .then((rows) => (rows.map((r) => r.join("")).some((r) => /v=DKIM1|(?:^|;)\s*p=/i.test(r)) ? sel : null))
            .catch(() => null),
        ),
      );
      return found.find(Boolean) ?? "";
    })(),
    5000,
  );
}

/** All probes for a page fetched at `finalUrl`, in parallel; never throws. */
export async function probeSecurity(finalUrl: string, setCookies: string[]): Promise<SecuritySignals> {
  const u = new URL(finalUrl);
  const host = u.hostname.replace(/^\[|\]$/g, "");
  const apex = host.toLowerCase().replace(/^www\./, "");
  const isHttps = u.protocol === "https:";
  // The page was already checked; an IP literal skips the lookup, so check it here.
  const blockedIp = isIP(host) && isBlockedAddress(host);
  const port = u.port ? Number(u.port) : 443;
  const [tlsInfo, legacy, redirect, caa, dkim] = await Promise.all([
    isHttps && !blockedIp ? readTls(host, port).catch(() => null) : Promise.resolve(null),
    isHttps && !blockedIp && !u.port ? acceptsLegacyTls(host).catch(() => null) : Promise.resolve(null),
    isHttps && !blockedIp && !u.port ? httpRedirectOf(host).catch(() => null) : Promise.resolve(null),
    isIP(host) ? Promise.resolve(null) : caaOf(apex),
    isIP(host) ? Promise.resolve(null) : dkimOf(apex),
  ]);
  return { tls: tlsInfo, legacyTls: legacy, httpRedirect: redirect, caa, dkim, setCookies };
}
