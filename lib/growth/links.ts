import { createHash, randomBytes, randomUUID } from "crypto";
import prisma from "@/lib/prisma";
import { ensureGrowthTables } from "./db";
import { cleanUtm } from "./attribution";

// Tracked short links: /go/[code] → target with utm_* appended.
//
// Only staff create links, but the redirect is public, so the target is
// checked twice (on create and on every redirect): https only, and the host
// must be this site or one listed in GROWTH_LINK_ALLOWED_HOSTS
// (comma-separated, e.g. "calendly.com,wa.me"). That keeps /go from ever
// becoming an open redirect, even if a row were tampered with.

export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL ?? "https://tiblogics.com").replace(/\/$/, "");
}

export function shortUrl(code: string): string {
  return `${siteUrl()}/go/${code}`;
}

function allowedHosts(): Set<string> {
  const hosts = new Set<string>(["tiblogics.com", "www.tiblogics.com"]);
  try {
    const h = new URL(siteUrl()).hostname.toLowerCase();
    hosts.add(h);
    hosts.add(h.startsWith("www.") ? h.slice(4) : `www.${h}`);
  } catch { /* default only */ }
  for (const h of (process.env.GROWTH_LINK_ALLOWED_HOSTS ?? "").split(",")) {
    const v = h.trim().toLowerCase();
    if (/^[a-z0-9.-]+$/.test(v)) hosts.add(v);
  }
  return hosts;
}

export type TargetCheck = { ok: true; url: URL } | { ok: false; error: string };

/**
 * Resolves and checks a link target. A path ("/learning-box") resolves
 * against the site. Absolute URLs must be https on an allowed host; plain
 * http is accepted only for this site's own origin (local development).
 */
export function checkTarget(raw: unknown): TargetCheck {
  if (typeof raw !== "string" || !raw.trim() || raw.length > 2000) return { ok: false, error: "Enter a target URL or a site path." };
  const v = raw.trim();
  if (/[\s\\]/.test(v) || /^\/\//.test(v)) return { ok: false, error: "That URL is not valid." };
  let url: URL;
  try {
    url = v.startsWith("/") ? new URL(v, siteUrl()) : new URL(v);
  } catch {
    return { ok: false, error: "That URL is not valid." };
  }
  if (url.username || url.password) return { ok: false, error: "URLs with credentials are not allowed." };
  const site = new URL(siteUrl());
  const sameOrigin = url.origin === site.origin;
  if (url.protocol !== "https:" && !(sameOrigin && url.protocol === "http:")) {
    return { ok: false, error: "Only https links are allowed." };
  }
  if (!sameOrigin && !allowedHosts().has(url.hostname.toLowerCase())) {
    return { ok: false, error: `${url.hostname} is not an allowed destination. Use a tiblogics.com page, or add the host to GROWTH_LINK_ALLOWED_HOSTS.` };
  }
  return { ok: true, url };
}

/** The final destination: target with this link's UTM parameters set. */
export function destinationFor(link: { targetUrl: string; utmSource: string; utmMedium: string; utmCampaign: string; utmContent?: string | null }): URL | null {
  const c = checkTarget(link.targetUrl);
  if (!c.ok) return null;
  const u = c.url;
  u.searchParams.set("utm_source", link.utmSource);
  u.searchParams.set("utm_medium", link.utmMedium);
  u.searchParams.set("utm_campaign", link.utmCampaign);
  if (link.utmContent) u.searchParams.set("utm_content", link.utmContent);
  else u.searchParams.delete("utm_content");
  return u;
}

const ALPHABET = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function newCode(len = 7): string {
  const bytes = randomBytes(len);
  let s = "";
  for (let i = 0; i < len; i++) s += ALPHABET[bytes[i] % ALPHABET.length];
  return s;
}

export const MEDIUMS = ["social", "email", "outreach", "ads", "referral"] as const;

export interface NewLink {
  targetUrl: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmContent?: string | null;
  label?: string | null;
  kitId?: string | null;
}

export async function createLink(input: NewLink) {
  const c = checkTarget(input.targetUrl);
  if (!c.ok) throw new LinkError(c.error);
  const utmSource = cleanUtm(input.utmSource);
  const utmMedium = cleanUtm(input.utmMedium);
  const utmCampaign = cleanUtm(input.utmCampaign?.replace(/\s+/g, "-"));
  if (!utmSource || !utmMedium || !utmCampaign) throw new LinkError("Source, medium and campaign are required.");
  await ensureGrowthTables();
  // Strip any utm_* already on the target: the link's own values are added on redirect.
  for (const k of [...c.url.searchParams.keys()]) if (k.startsWith("utm_")) c.url.searchParams.delete(k);
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      return await prisma.growthLink.create({
        data: {
          code: newCode(),
          targetUrl: c.url.toString(),
          utmSource,
          utmMedium,
          utmCampaign,
          utmContent: cleanUtm(input.utmContent),
          label: input.label?.trim().slice(0, 200) || null,
          kitId: input.kitId ?? null,
        },
      });
    } catch (err) {
      if ((err as { code?: string })?.code !== "P2002") throw err;
    }
  }
  throw new LinkError("Could not allocate a link code; try again.");
}

export class LinkError extends Error {}

// ── Clicks ────────────────────────────────────────────────────────────────

const BOT_UA =
  /bot|crawl|spider|slurp|preview|facebookexternalhit|facebot|embedly|quora link|outbrain|pinterest|vkshare|w3c_validator|whatsapp|telegram|skypeuripreview|discord|slack|curl|wget|python|httpclient|okhttp|java\/|go-http|axios|node-fetch|undici|headless|phantom|lighthouse|monitor|uptime|scan/i;

export function isBot(ua: string | null | undefined): boolean {
  return !ua || ua.length < 12 || BOT_UA.test(ua);
}

/**
 * Counts one click per link, visitor and UTC day. The visitor is a salted
 * hash of IP + user agent + day: no raw IP is stored, and the hash cannot be
 * joined across days.
 */
export async function recordClick(opts: { code: string; ip: string; ua: string; referrer?: string | null; country?: string | null }): Promise<boolean> {
  const day = new Date().toISOString().slice(0, 10);
  const salt = process.env.GROWTH_CLICK_SALT || process.env.NEXTAUTH_SECRET || "tib-growth";
  const visitorHash = createHash("sha256").update(`${salt}|${day}|${opts.ip}|${opts.ua}`).digest("hex").slice(0, 32);
  let ref: string | null = null;
  try {
    ref = opts.referrer ? new URL(opts.referrer).hostname.slice(0, 120) : null;
  } catch { /* ignore */ }
  const country = opts.country && /^[A-Z]{2}$/i.test(opts.country) ? opts.country.toUpperCase() : null;
  const n = await prisma.$executeRaw`
    INSERT INTO "GrowthClick" ("id", "linkCode", "visitorHash", "day", "referrer", "country")
    VALUES (${randomUUID()}, ${opts.code}, ${visitorHash}, ${day}, ${ref}, ${country})
    ON CONFLICT ("linkCode", "visitorHash", "day") DO NOTHING`;
  return n > 0;
}
