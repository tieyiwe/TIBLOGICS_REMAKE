import { NextRequest, NextResponse } from "next/server";
import { checkTargetUrl, safeFetch, BLOCK_MESSAGES, SsrfBlockedError } from "@/lib/ssrf";
import { audit, type Signals } from "@/lib/scanner/audit";
import { checkRateLimit } from "@/lib/rate-limit";

// Real measurement for the AI Scanner.
//
// Fetches the page, robots.txt, sitemap.xml and llms.txt, then scores what it
// finds. Nothing is fabricated and no host is special-cased — see
// lib/scanner/audit.ts for the checks.

export const maxDuration = 30;

const UA = "TIBLOGICSScanner/2.0 (+https://tiblogics.com)";

/** HEAD-or-GET probe that only reports whether something is really there. */
async function probe(url: string, signal: AbortSignal): Promise<string | null> {
  try {
    // safeFetch follows redirects itself and re-checks each hop; plain
    // redirect: "follow" would follow a public URL to an internal one.
    const res = await safeFetch(url, { signal, headers: { "User-Agent": UA } });
    if (!res.ok) return null;
    return (await res.text()).slice(0, 20_000);
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  if (!(await checkRateLimit(`scanner-audit:${ip}`, 20, 3_600_000))) {
    return NextResponse.json({ error: "Rate limit exceeded. Try again later." }, { status: 429 });
  }

  let raw: string;
  try {
    ({ url: raw } = await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!raw || typeof raw !== "string") {
    return NextResponse.json({ error: "URL required" }, { status: 400 });
  }

  // Resolves the name and rejects it if any address behind it is internal —
  // a hostname pointing at 10.x or the metadata service used to get through.
  const checked = await checkTargetUrl(raw);
  if (!checked.ok) {
    return NextResponse.json({ error: BLOCK_MESSAGES[checked.reason] }, { status: 400 });
  }
  const target = checked.url;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);

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
      if (err instanceof SsrfBlockedError) {
        return NextResponse.json({ error: BLOCK_MESSAGES[err.reason] }, { status: 400 });
      }
      const msg = controller.signal.aborted
        ? "The site took too long to respond (over 20 seconds)"
        : err instanceof Error
        ? err.message
        : "Could not reach the site";
      return NextResponse.json({ error: msg }, { status: 502 });
    }

    const ttfb = Math.round(performance.now() - start);
    const html = (await res.text()).slice(0, 900_000);
    const totalTime = Math.round(performance.now() - start);

    const encoding = res.headers.get("content-encoding") ?? "";
    const cacheControl = res.headers.get("cache-control") ?? "";
    const etag = res.headers.get("etag") ?? "";
    const contentLength = res.headers.get("content-length");

    const origin = new URL(res.url || target.toString()).origin;
    const [robotsTxt, sitemapDirect, llms] = await Promise.all([
      probe(`${origin}/robots.txt`, controller.signal),
      probe(`${origin}/sitemap.xml`, controller.signal),
      probe(`${origin}/llms.txt`, controller.signal),
    ]);

    const signals: Signals = {
      html,
      finalUrl: res.url || target.toString(),
      statusCode: res.status,
      ttfb,
      totalTime,
      bytes: contentLength ? parseInt(contentLength, 10) : Buffer.byteLength(html),
      compressed: /gzip|br|deflate|zstd/.test(encoding),
      cached: /max-age|s-maxage|public|immutable/.test(cacheControl) || !!etag,
      https: new URL(res.url || target.toString()).protocol === "https:",
      robotsTxt,
      // A sitemap counts whether it sits at the default path or robots.txt points elsewhere.
      sitemapFound: !!(sitemapDirect && sitemapDirect.includes("<url")) ||
        !!(robotsTxt && /sitemap:\s*https?:\/\//i.test(robotsTxt)),
      llmsTxt: !!llms,
    };

    const result = audit(signals);
    return NextResponse.json({ url: signals.finalUrl, ...result });
  } finally {
    clearTimeout(timeout);
  }
}
