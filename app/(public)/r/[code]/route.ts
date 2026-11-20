import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { isBot, siteUrl } from "@/lib/growth/links";
import { ATTR_COOKIE, ATTR_MAX_AGE, serializeAttribution } from "@/lib/growth/attribution";
import { codeOwner, CODE_RE, recordReferralEvent, REF_COOKIE, REF_MAX_AGE, visitorHash } from "@/lib/learn/referrals/service";

// A learner's referral link. Sets the 60-day referral cookie (the code only)
// and the campaign cookie (utm_campaign "learner-referral", so sign-ups and
// purchases also show in Growth → Links & attribution), then lands on the
// AI Academy page (/learning-box). Always redirects to a fixed same-site path: never an
// open redirect. Unknown codes land on the same page without cookies.
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code: raw } = await params;
  const code = raw.toLowerCase();
  const dest = new URL("/learning-box", siteUrl());
  const res = NextResponse.redirect(dest, 302);
  res.headers.set("Cache-Control", "no-store");
  res.headers.set("X-Robots-Tag", "noindex");
  if (!CODE_RE.test(code)) return res;

  let owner = null;
  try {
    owner = await codeOwner(code);
  } catch (err) {
    console.error("[r] lookup", err);
  }
  if (!owner) return res;

  const ua = req.headers.get("user-agent") ?? "";
  if (!isBot(ua)) {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? req.headers.get("x-real-ip") ?? "unknown";
    if (await checkRateLimit(`ref-visit:${ip}`, 60, 10 * 60_000)) await recordReferralEvent(code, "visit", visitorHash(ip, ua));
  }

  const secure = siteUrl().startsWith("https://");
  res.cookies.set(REF_COOKIE, code, { maxAge: REF_MAX_AGE, path: "/", sameSite: "lax", secure, httpOnly: true });
  res.cookies.set(
    ATTR_COOKIE,
    serializeAttribution({ utmSource: "referral", utmMedium: "referral", utmCampaign: "learner-referral", utmContent: code, linkCode: null }),
    { maxAge: ATTR_MAX_AGE, path: "/", sameSite: "lax", secure },
  );
  return res;
}
