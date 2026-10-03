import { NextRequest, NextResponse } from "next/server";
import { checkTargetUrl } from "@/lib/ssrf";
import { checkRateLimit } from "@/lib/rate-limit";
import { getT } from "@/lib/i18n/server";

export async function POST(req: NextRequest) {
  const t = await getT();
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  if (!(await checkRateLimit(`scanner-speed:${ip}`, 20, 3_600_000))) {
    return NextResponse.json({ error: t("tools.api.rateLimit") }, { status: 429 });
  }

  let url: string;
  try {
    ({ url } = await req.json());
  } catch {
    return NextResponse.json({ error: t("tools.api.invalidRequest") }, { status: 400 });
  }

  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: t("tools.api.urlRequired") }, { status: 400 });
  }

  // Resolves the hostname and refuses it if it maps to anything internal; the
  // old check only looked at the text of the hostname.
  const checked = await checkTargetUrl(url);
  if (!checked.ok) {
    return NextResponse.json({ error: t(`tools.block.${checked.reason}`) }, { status: 400 });
  }
  const parsedUrl = checked.url;

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
      redirect: "manual",
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
    // Shown to the visitor as is, so in their language rather than Node's.
    fetchError = controller.signal.aborted ? t("tools.speed.timeout") : t("tools.speed.failed");
    if (!controller.signal.aborted) console.error("[scanner/speed]", err instanceof Error ? err.message : err);
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
