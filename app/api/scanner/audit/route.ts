import { NextRequest, NextResponse } from "next/server";
import { audit, type Signals } from "@/lib/scanner/audit";

// Real measurement for the AI Scanner.
//
// Fetches the page, robots.txt, sitemap.xml and llms.txt, then scores what it
// finds. Nothing is fabricated and no host is special-cased — see
// lib/scanner/audit.ts for the checks.

export const maxDuration = 30;

const rateMap = new Map<string, { count: number; resetAt: number }>();

function checkRate(ip: string): boolean {
  const now = Date.now();
  const entry = rateMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateMap.set(ip, { count: 1, resetAt: now + 3_600_000 });
    return true;
  }
  if (entry.count >= 20) return false;
  entry.count++;
  return true;
}

function isPrivateOrLoopback(hostname: string): boolean {
  if (hostname === "localhost" || hostname === "::1") return true;
  return [/^127\./, /^10\./, /^192\.168\./, /^172\.(1[6-9]|2\d|3[01])\./, /^169\.254\./, /^0\./].some(
    (p) => p.test(hostname),
  );
}

const UA = "TIBLOGICSScanner/2.0 (+https://tiblogics.com)";

/** HEAD-or-GET probe that only reports whether something is really there. */
async function probe(url: string, signal: AbortSignal): Promise<string | null> {
  try {
    const res = await fetch(url, { signal, headers: { "User-Agent": UA }, redirect: "follow" });
    if (!res.ok) return null;
    return (await res.text()).slice(0, 20_000);
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  if (!checkRate(ip)) {
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

  let target: URL;
  try {
    target = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
  } catch {
    return NextResponse.json({ error: "That does not look like a valid URL" }, { status: 400 });
  }
  if (!["http:", "https:"].includes(target.protocol)) {
    return NextResponse.json({ error: "Only HTTP and HTTPS are supported" }, { status: 400 });
  }
  if (isPrivateOrLoopback(target.hostname)) {
    return NextResponse.json({ error: "Private and loopback addresses are not allowed" }, { status: 400 });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);

  try {
    const start = performance.now();
    let res: Response;
    try {
      res = await fetch(target.toString(), {
        signal: controller.signal,
        headers: {
          "User-Agent": UA,
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Encoding": "gzip, deflate, br",
        },
        redirect: "follow",
      });
    } catch (err) {
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
