import { createHash, createHmac, timingSafeEqual } from "crypto";
import type { NextRequest } from "next/server";
import { siteUrl } from "../links";

// Guards shared by the public acquisition endpoints (/api/acquire/*).

export function clientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0].trim() || req.headers.get("x-real-ip") || "unknown";
}

/**
 * CSRF guard for the public JSON posts: the body must be JSON (a plain HTML
 * form cannot send that cross-site without a preflight) and the Origin, when
 * the browser sends one, must be this site.
 */
export function isSameSiteJson(req: NextRequest | Request): boolean {
  const type = req.headers.get("content-type") ?? "";
  if (!type.toLowerCase().startsWith("application/json")) return false;
  return isSameSiteRequest(req);
}

/** Origin / Sec-Fetch-Site check alone (for DELETE, which has no body). */
export function isSameSiteRequest(req: NextRequest | Request): boolean {
  const origin = req.headers.get("origin");
  const fetchSite = req.headers.get("sec-fetch-site");
  if (fetchSite && fetchSite !== "same-origin" && fetchSite !== "none") return false;
  if (!origin) return fetchSite === "same-origin";
  try {
    const o = new URL(origin);
    const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
    if (host && o.host === host) return true;
    return o.origin === new URL(siteUrl()).origin;
  } catch {
    return false;
  }
}

/** Salted, per-day visitor hash (no raw IP is stored). */
export function dayVisitorHash(ip: string, ua: string, day = new Date().toISOString().slice(0, 10)): string {
  const salt = process.env.GROWTH_CLICK_SALT || process.env.NEXTAUTH_SECRET || "tib-acquire";
  return createHash("sha256").update(`${salt}|acq|${day}|${ip}|${ua}`).digest("hex").slice(0, 32);
}

function secret(): string {
  return process.env.OUTREACH_SECRET || process.env.NEXTAUTH_SECRET || "tib-acquire-dev";
}

/** Signed access token for a capture's asset page: "<captureId>.<hmac>". */
export function accessToken(captureId: string): string {
  const sig = createHmac("sha256", secret()).update(`acquire-access:${captureId}`).digest("base64url").slice(0, 24);
  return `${captureId}.${sig}`;
}

export function verifyAccessToken(token: unknown): string | null {
  if (typeof token !== "string" || token.length > 120) return null;
  const [id, sig] = token.split(".");
  if (!id || !sig || !/^[A-Za-z0-9_-]{8,40}$/.test(id)) return null;
  const want = Buffer.from(accessToken(id).split(".")[1]);
  const got = Buffer.from(sig);
  return want.length === got.length && timingSafeEqual(want, got) ? id : null;
}
