import { NextRequest, NextResponse, after } from "next/server";
import prisma from "@/lib/prisma";
import { anonymiseIp } from "@/lib/require-admin";
import { checkRateLimit } from "@/lib/rate-limit";
import { isTrackablePath, normalizePath } from "@/lib/analytics/paths";
import { analyticsReady } from "@/lib/analytics/db";
import { clientIp, fillGeo } from "@/lib/geo";

function detectDevice(ua: string): string {
  if (/mobile|android|iphone|ipod|blackberry|windows phone/i.test(ua)) return "mobile";
  if (/ipad|tablet|playbook|silk/i.test(ua)) return "tablet";
  return "desktop";
}

function detectBrowser(ua: string): string {
  if (/edg\//i.test(ua)) return "Edge";
  if (/opr\//i.test(ua)) return "Opera";
  if (/chrome\/[\d.]+/i.test(ua) && !/chromium/i.test(ua)) return "Chrome";
  if (/firefox\/[\d.]+/i.test(ua)) return "Firefox";
  if (/safari\/[\d.]+/i.test(ua) && !/chrome/i.test(ua)) return "Safari";
  return "Other";
}

function detectOS(ua: string): string {
  if (/windows nt/i.test(ua)) return "Windows";
  if (/mac os x/i.test(ua)) return "macOS";
  if (/android/i.test(ua)) return "Android";
  if (/iphone|ipad|ipod/i.test(ua)) return "iOS";
  if (/linux/i.test(ua)) return "Linux";
  return "Other";
}

function extractOrigin(referrer: string | null): string {
  if (!referrer) return "direct";
  try {
    const h = new URL(referrer).hostname.replace("www.", "");
    if (h === "tiblogics.com") return "internal";
    if (h.includes("google")) return "google";
    if (h.includes("linkedin")) return "linkedin";
    if (h.includes("twitter") || h.includes("x.com")) return "twitter/X";
    if (h.includes("facebook") || h.includes("instagram")) return "meta";
    if (h.includes("youtube")) return "youtube";
    if (h.includes("bing")) return "bing";
    return h;
  } catch {
    return "direct";
  }
}

function detectCountry(req: NextRequest): string | null {
  return (
    req.headers.get("cf-ipcountry") ??
    req.headers.get("x-vercel-ip-country") ??
    req.headers.get("x-country") ??
    null
  );
}

export async function POST(req: NextRequest) {
  // Public heartbeat; a generous cap so it cannot be used to flood the table.
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? req.headers.get("x-real-ip") ?? "unknown";
  if (!(await checkRateLimit(`analytics-track:${ip}`, ip === "unknown" ? 6000 : 600, 10 * 60_000))) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const body = await req.json();
    const rawPage = typeof body?.page === "string" ? body.page.slice(0, 500) : "";
    const sessionId = typeof body?.sessionId === "string" ? body.sessionId.slice(0, 64) : "";
    const beat = body?.beat;
    // The referrer is kept as origin and path only: a query string can carry
    // someone else's tokens or an email address.
    const referrer = typeof body?.referrer === "string" ? refOnly(body.referrer) : null;
    if (!rawPage || !sessionId) return NextResponse.json({ ok: true });
    // Staff, API and secret-token routes are never recorded; everything else
    // is grouped (ids and tokens become ":id"), with no query string.
    if (!isTrackablePath(rawPage)) return NextResponse.json({ ok: true });
    const page = normalizePath(rawPage);

    // A heartbeat only proves the visitor is still here — it is not a new
    // page view. Refresh ActiveSession and stop, which is one cheap upsert
    // instead of an unbounded INSERT every interval.
    if (beat === true) {
      await prisma.activeSession
        .update({ where: { sessionId }, data: { page, lastSeen: new Date() } })
        .catch(() => {}); // session already expired — nothing to keep alive
      return NextResponse.json({ ok: true });
    }

    const ua = req.headers.get("user-agent") ?? "";
    const rawIp =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
      req.headers.get("x-real-ip") ??
      "unknown";
    // Anonymise to /24 block for GDPR compliance (no raw IPs stored)
    const ip = anonymiseIp(rawIp);

    const device = detectDevice(ua);
    const browser = detectBrowser(ua);
    const os = detectOS(ua);
    const origin = extractOrigin(referrer ?? null);
    const country = detectCountry(req);

    const [view] = await Promise.all([
      prisma.pageView.create({
        data: { page, referrer: referrer || null, origin, device, browser, os, ip, country, sessionId },
        select: { id: true },
      }),
      prisma.activeSession.upsert({
        where: { sessionId },
        create: { sessionId, page, device, browser, os, origin, ip, country, lastSeen: new Date() },
        update: { page, lastSeen: new Date(), country: country ?? undefined },
      }),
    ]);

    // Region and city (and the country when no edge header gave it), after
    // the response: lib/geo.ts, cached per address for a day.
    const headers = new Headers(req.headers);
    const fullIp = clientIp(req.headers);
    after(async () => {
      if (await analyticsReady()) await fillGeo("PageView", [view.id], fullIp, headers);
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}

function refOnly(r: string): string | null {
  try {
    const u = new URL(r.slice(0, 1000));
    if (!/^https?:$/.test(u.protocol)) return null;
    return `${u.origin}${isTrackablePath(u.pathname) ? normalizePath(u.pathname) : ""}`.slice(0, 300);
  } catch {
    return null;
  }
}
