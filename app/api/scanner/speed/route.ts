import { NextRequest, NextResponse } from "next/server";

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
  return [
    /^127\./,
    /^10\./,
    /^192\.168\./,
    /^172\.(1[6-9]|2\d|3[01])\./,
    /^169\.254\./,
    /^0\./,
  ].some((p) => p.test(hostname));
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  if (!checkRate(ip)) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  let url: string;
  try {
    ({ url } = await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: "URL required" }, { status: 400 });
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    return NextResponse.json({ error: "Only HTTP/HTTPS URLs allowed" }, { status: 400 });
  }

  if (isPrivateOrLoopback(parsedUrl.hostname)) {
    return NextResponse.json({ error: "Private or loopback addresses are not allowed" }, { status: 400 });
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10_000);

  const start = performance.now();
  let ttfb: number | null = null;
  let totalTime: number | null = null;
  let responseSize = 0;
  let cacheControl = "";
  let contentEncoding = "";
  let etag = "";
  let statusCode = 0;
  let fetchError: string | null = null;

  try {
    const response = await fetch(parsedUrl.toString(), {
      signal: controller.signal,
      headers: {
        "User-Agent": "TIBLOGICSScanner/1.0 (+https://tiblogics.com)",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": "en-US,en;q=0.5",
      },
      redirect: "follow",
    });

    ttfb = Math.round(performance.now() - start);
    statusCode = response.status;
    cacheControl = response.headers.get("cache-control") ?? "";
    contentEncoding = response.headers.get("content-encoding") ?? "";
    etag = response.headers.get("etag") ?? "";
    const contentLength = response.headers.get("content-length");

    const body = await response.arrayBuffer();
    totalTime = Math.round(performance.now() - start);
    responseSize = contentLength ? parseInt(contentLength, 10) : body.byteLength;
  } catch (err) {
    fetchError = controller.signal.aborted
      ? "Request timed out (>10s)"
      : err instanceof Error
      ? err.message
      : "Request failed";
    totalTime = Math.round(performance.now() - start);
  } finally {
    clearTimeout(timeoutId);
  }

  const isGzipped =
    contentEncoding.includes("gzip") ||
    contentEncoding.includes("br") ||
    contentEncoding.includes("deflate");

  const hasCaching =
    cacheControl.includes("max-age") ||
    cacheControl.includes("s-maxage") ||
    cacheControl.includes("public") ||
    !!etag;

  let speedRating: "fast" | "average" | "slow" | "unknown" = "unknown";
  if (!fetchError && ttfb !== null && totalTime !== null) {
    if (ttfb < 600 && totalTime < 2000) speedRating = "fast";
    else if (ttfb > 1500 || totalTime > 5000) speedRating = "slow";
    else speedRating = "average";
  }

  return NextResponse.json({
    ttfb,
    totalTime,
    responseSize,
    isGzipped,
    hasCaching,
    statusCode,
    speedRating,
    error: fetchError,
  });
}
