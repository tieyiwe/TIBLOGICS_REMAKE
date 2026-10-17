import { NextRequest, NextResponse, after } from "next/server";
import { randomUUID } from "crypto";
import prisma from "@/lib/prisma";
import { classify } from "@/lib/analytics/sources";
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
    // page view. Refresh ActiveSession, and the visible time and scroll depth
    // of the view it belongs to (only this session's own view, from the last
    // day), then stop.
    if (beat === true) {
      await prisma.activeSession
        .update({ where: { sessionId }, data: { page, lastSeen: new Date() } })
        .catch(() => {}); // session already expired — nothing to keep alive
      const viewId = typeof body?.view === "string" && /^[\w-]{8,64}$/.test(body.view) ? body.view : null;
      const ms = Number(body?.engagedMs);
      const engaged = Number.isFinite(ms) && ms > 0 ? Math.min(Math.round(ms), 3_600_000) : null;
      // Scroll depth is not kept for Do Not Track / Global Privacy Control.
      const dnt = req.headers.get("dnt") === "1" || req.headers.get("sec-gpc") === "1";
      const scroll = !dnt && [25, 50, 75, 100].includes(Number(body?.scroll)) ? Number(body.scroll) : null;
      if (viewId && (engaged || scroll) && (await analyticsReady())) {
        await prisma
          .$executeRawUnsafe(
            `UPDATE "PageView" SET
               "engagedMs" = CASE WHEN $3::int IS NULL THEN "engagedMs" ELSE LEAST(GREATEST(COALESCE("engagedMs", 0), $3::int), 3600000) END,
               "scrollPct" = CASE WHEN $4::int IS NULL THEN "scrollPct" ELSE GREATEST(COALESCE("scrollPct", 0), $4::int) END
             WHERE "id" = $1 AND "sessionId" = $2 AND "createdAt" > now() - interval '1 day'`,
            viewId, sessionId, engaged, scroll,
          )
          .catch(() => {});
      }
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

    // The session's source, re-derived here from the raw tags the tracker
    // sent (lib/analytics/sources.ts); the client's answer is never trusted.
    const acq = body?.acq && typeof body.acq === "object" ? (body.acq as Record<string, unknown>) : {};
    const refHost = typeof acq.r === "string" && /^[a-z0-9.-]{1,120}$/i.test(acq.r) ? acq.r : null;
    const touch = classify({
      utmSource: acq.s,
      utmMedium: acq.m,
      utmCampaign: acq.c,
      utmContent: acq.n,
      utmTerm: acq.k,
      link: acq.l,
      referrer: refHost ? `https://${refHost}/` : null,
      ownHosts: [req.nextUrl.hostname],
    });
    const landing = body?.landing === true;
    const returning = body?.returning === true;

    if (!(await analyticsReady())) return NextResponse.json({ ok: true });
    const view = { id: randomUUID() };
    await Promise.all([
      prisma.$executeRawUnsafe(
        `INSERT INTO "PageView" ("id","page","referrer","origin","device","browser","os","ip","country","sessionId",
           "source","medium","campaign","content","term","linkCode","landing","returning")
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)`,
        view.id, page, referrer || null, origin, device, browser, os, ip, country, sessionId,
        touch.source, touch.medium, touch.campaign, touch.content, touch.term, touch.link, landing, returning,
      ),
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
    after(() => fillGeo("PageView", [view.id], fullIp, headers));

    // The id lets the tracker report this view's visible time and scroll depth.
    return NextResponse.json({ ok: true, id: view.id });
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
