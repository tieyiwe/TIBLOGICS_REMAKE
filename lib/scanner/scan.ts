import { checkTargetUrl, safeFetch, readTextLimited, BLOCK_MESSAGES, SsrfBlockedError } from "@/lib/ssrf";
import { audit, type AuditResult, type Signals } from "@/lib/scanner/audit";
import { checkDns, extraAudit, type ExtraResult } from "@/lib/scanner/extra";

// Fetch a site and score it.
//
// Shared by the free scanner (one visitor, one URL) and the Readiness Monitor
// (scheduled rescans of a customer's site and their competitors), so the two
// can never score the same page differently.

const UA = "TIBLOGICSScanner/2.0 (+https://tiblogics.com)";

export type ScanOutcome =
  | ({ ok: true; url: string; extra?: ExtraResult; page?: { title: string; description: string } } & AuditResult)
  /** `status` is the HTTP status the scanner route should answer with. */
  | { ok: false; status: 400 | 502; error: string };

/**
 * GET probe that only reports whether something is really there.
 *
 * `textFile` is for robots.txt and llms.txt. Many sites answer any missing
 * path with their normal HTML page and a 200, which used to count as having
 * the file; the monitor then told customers a competitor "passes" a check it
 * does not. An HTML body is not a text file, whatever the status says.
 */
async function probe(url: string, signal: AbortSignal, textFile = false): Promise<string | null> {
  try {
    // safeFetch follows redirects itself and re-checks each hop; plain
    // redirect: "follow" would follow a public URL to an internal one.
    const res = await safeFetch(url, { signal, headers: { "User-Agent": UA } });
    if (!res.ok) return null;
    // Capped read: a hostile site could stream an endless body.
    const body = (await readTextLimited(res, 64_000)).slice(0, 20_000);
    if (textFile) {
      const type = res.headers.get("content-type") ?? "";
      if (/html/i.test(type) || /^\s*<(!doctype|html|head|body)/i.test(body) || !body.trim()) return null;
    }
    return body;
  } catch {
    return null;
  }
}

/**
 * `opts.extra` adds the lead-capture, security and email checks
 * (lib/scanner/extra.ts) for the public scanner. The monitor leaves it off,
 * so its four scores and overall stay exactly as they were.
 */
export async function scanSite(raw: string, timeoutMs = 20_000, opts: { extra?: boolean } = {}): Promise<ScanOutcome> {
  // Resolves the name and rejects it if any address behind it is internal —
  // a hostname pointing at 10.x or the metadata service used to get through.
  const checked = await checkTargetUrl(raw);
  if (!checked.ok) return { ok: false, status: 400, error: BLOCK_MESSAGES[checked.reason] };
  const target = checked.url;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const start = performance.now();
    let res: Response;
    try {
      res = await safeFetch(target, {
        signal: controller.signal,
        headers: {
          "User-Agent": UA,
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Encoding": "gzip, deflate, br",
        },
      });
    } catch (err) {
      // A redirect into private space is the caller's problem, not ours, and
      // saying so is more useful than "could not reach the site".
      if (err instanceof SsrfBlockedError) return { ok: false, status: 400, error: BLOCK_MESSAGES[err.reason] };
      const error = controller.signal.aborted
        ? `The site took too long to respond (over ${Math.round(timeoutMs / 1000)} seconds)`
        : err instanceof Error
        ? err.message
        : "Could not reach the site";
      return { ok: false, status: 502, error };
    }

    // The public scanner does not score a page it was refused (bot
    // protection, a login wall, a server error): the score would describe the
    // error page, and it would use up one of the site's free scans.
    if (opts.extra && (res.status === 401 || res.status === 403 || res.status === 429 || res.status >= 500)) {
      return { ok: false, status: 502, error: `The site refused the scan (HTTP ${res.status})` };
    }

    const ttfb = Math.round(performance.now() - start);
    // Capped read (not res.text()): an endless body would exhaust memory.
    const html = (await readTextLimited(res, 3_000_000)).slice(0, 900_000);
    const totalTime = Math.round(performance.now() - start);

    const encoding = res.headers.get("content-encoding") ?? "";
    const cacheControl = res.headers.get("cache-control") ?? "";
    const etag = res.headers.get("etag") ?? "";
    const contentLength = res.headers.get("content-length");

    const finalUrl = res.url || target.toString();
    const origin = new URL(finalUrl).origin;
    const [robotsTxt, sitemapDirect, llms, dns] = await Promise.all([
      probe(`${origin}/robots.txt`, controller.signal, true),
      probe(`${origin}/sitemap.xml`, controller.signal),
      probe(`${origin}/llms.txt`, controller.signal, true),
      opts.extra ? checkDns(new URL(finalUrl).hostname).catch(() => null) : Promise.resolve(null),
    ]);

    const signals: Signals = {
      html,
      finalUrl,
      statusCode: res.status,
      ttfb,
      totalTime,
      bytes: contentLength ? parseInt(contentLength, 10) : Buffer.byteLength(html),
      compressed: /gzip|br|deflate|zstd/.test(encoding),
      cached: /max-age|s-maxage|public|immutable/.test(cacheControl) || !!etag,
      https: new URL(finalUrl).protocol === "https:",
      robotsTxt,
      // A sitemap counts whether it sits at the default path or robots.txt points elsewhere.
      sitemapFound: !!(sitemapDirect && sitemapDirect.includes("<url")) ||
        !!(robotsTxt && /sitemap:\s*https?:\/\//i.test(robotsTxt)),
      llmsTxt: !!llms,
    };

    const base = audit(signals);
    if (!opts.extra) return { ok: true, url: finalUrl, ...base };
    const headers: Record<string, string> = {};
    res.headers.forEach((v, k) => {
      headers[k.toLowerCase()] = v;
    });
    const extra = extraAudit({ html, finalUrl, headers, dns });
    return { ok: true, url: finalUrl, ...base, extra, page: pageMeta(html) };
  } finally {
    clearTimeout(timeout);
  }
}

/** The page's own title and description, for the written report. */
function pageMeta(html: string): { title: string; description: string } {
  const clean = (v: string | undefined) =>
    (v ?? "").replace(/&amp;/g, "&").replace(/&#0?39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, " ").trim().slice(0, 300);
  const title = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1];
  const desc =
    /<meta[^>]+name=["']description["'][^>]*content=["']([^"']*)["']/i.exec(html)?.[1] ??
    /<meta[^>]+content=["']([^"']*)["'][^>]*name=["']description["']/i.exec(html)?.[1];
  return { title: clean(title), description: clean(desc) };
}
