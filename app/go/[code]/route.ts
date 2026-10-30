import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ensureGrowthTables } from "@/lib/growth/db";
import { destinationFor, isBot, recordClick, siteUrl } from "@/lib/growth/links";
import { ATTR_COOKIE, ATTR_MAX_AGE, serializeAttribution } from "@/lib/growth/attribution";
import { checkRateLimit } from "@/lib/rate-limit";

// Public tracked-link redirect. The destination is re-checked on every hit
// (https, same site or GROWTH_LINK_ALLOWED_HOSTS), so this can never be used
// as an open redirect. Unknown codes go to the home page.
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const home = NextResponse.redirect(new URL("/", siteUrl()), 302);
  if (!/^[A-Za-z0-9_-]{3,32}$/.test(code)) return home;

  let link;
  try {
    await ensureGrowthTables();
    link = await prisma.growthLink.findUnique({ where: { code } });
  } catch (err) {
    console.error("[go] lookup", err);
    return home;
  }
  if (!link) return home;
  const dest = destinationFor(link);
  if (!dest) return home;

  const ua = req.headers.get("user-agent") ?? "";
  if (!isBot(ua)) {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? req.headers.get("x-real-ip") ?? "unknown";
    try {
      // The click insert is idempotent per visitor and day; the cap only
      // keeps one address from hammering the database.
      if (await checkRateLimit(`go:${ip}`, 120, 10 * 60_000)) {
        await recordClick({
          code,
          ip,
          ua,
          referrer: req.headers.get("referer"),
          country: req.headers.get("cf-ipcountry") ?? req.headers.get("x-vercel-ip-country"),
        });
      }
    } catch (err) {
      console.error("[go] click", err);
    }
  }

  const res = NextResponse.redirect(dest, 302);
  res.headers.set("Cache-Control", "no-store");
  res.headers.set("X-Robots-Tag", "noindex");
  res.cookies.set(ATTR_COOKIE, serializeAttribution({
    utmSource: link.utmSource,
    utmMedium: link.utmMedium,
    utmCampaign: link.utmCampaign,
    utmContent: link.utmContent,
    linkCode: link.code,
  }), {
    maxAge: ATTR_MAX_AGE,
    path: "/",
    sameSite: "lax",
    secure: siteUrl().startsWith("https://"),
  });
  return res;
}
