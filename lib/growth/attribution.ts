import { randomUUID } from "crypto";
import prisma from "@/lib/prisma";
import { ensureGrowthTables } from "./db";
import { recordTouch } from "@/lib/analytics/touch";

// First-party campaign attribution.
//
// A visitor arriving through a tracked link (/go/[code]) or any URL carrying
// utm_* parameters gets a 30-day cookie, ATTR_COOKIE, holding the campaign
// (never anything personal). When that visitor later signs up, checks out or
// books, the creation point calls recordAttribution() and one
// ConversionAttribution row ties the new record (kind + refId) to the
// campaign. The reports resolve paid/unpaid and revenue from the real
// records at read time, so a refund or an abandoned checkout never counts.
//
// Last touch wins, except that the same campaign landing again keeps the
// existing cookie (so the link code set by /go is not lost when the landing
// page itself sees the utm_* parameters).

export const ATTR_COOKIE = "tib_utm";
export const ATTR_MAX_AGE = 30 * 86_400;

export interface Attribution {
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmContent: string | null;
  linkCode: string | null;
}

export type ConversionKind =
  | "learn_signup"
  | "track_checkout"
  | "learn_subscription_checkout"
  | "toolkit_checkout"
  | "blueprint"
  | "scanner"
  | "order"
  | "event_registration"
  | "appointment";

/** UTM values are free text from URLs: keep a safe, short subset. */
export function cleanUtm(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim().slice(0, 100).replace(/[^A-Za-z0-9._\-+~ ]/g, "");
  return s ? s.toLowerCase() : null;
}

export function cleanCode(v: unknown): string | null {
  return typeof v === "string" && /^[A-Za-z0-9_-]{3,32}$/.test(v) ? v : null;
}

/**
 * The cookie value as plain JSON. NextResponse.cookies.set() URL-encodes it;
 * the client capture (components/public/UtmCapture.tsx) encodes it itself.
 */
export function serializeAttribution(a: Attribution): string {
  return JSON.stringify({ s: a.utmSource, m: a.utmMedium, c: a.utmCampaign, n: a.utmContent, l: a.linkCode, t: Date.now() });
}

export function parseAttributionValue(raw: string | null | undefined): Attribution | null {
  if (!raw || raw.length > 1500) return null;
  try {
    const o = JSON.parse(decodeURIComponent(raw)) as Record<string, unknown>;
    const a: Attribution = {
      utmSource: cleanUtm(o.s),
      utmMedium: cleanUtm(o.m),
      utmCampaign: cleanUtm(o.c),
      utmContent: cleanUtm(o.n),
      linkCode: cleanCode(o.l),
    };
    const t = Number(o.t);
    if (Number.isFinite(t) && Date.now() - t > ATTR_MAX_AGE * 1000) return null;
    return a.utmSource || a.utmCampaign || a.linkCode ? a : null;
  } catch {
    return null;
  }
}

/** Reads the attribution cookie from a raw Cookie header. */
export function attributionFromCookieHeader(cookieHeader: string | null | undefined): Attribution | null {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(";")) {
    const i = part.indexOf("=");
    if (i < 0) continue;
    if (part.slice(0, i).trim() === ATTR_COOKIE) return parseAttributionValue(part.slice(i + 1).trim());
  }
  return null;
}

/**
 * Ties a newly created record to the visitor's campaign, if they have one.
 * Never throws and costs nothing without the cookie: safe to await in any
 * creation path. Idempotent per (kind, refId).
 */
export async function recordAttribution(opts: {
  kind: ConversionKind;
  refId: string;
  cookieHeader: string | null | undefined;
  amountCents?: number | null;
  /** The converting request's headers: device and country for analytics (lib/analytics/touch.ts). */
  headers?: Headers | null;
}): Promise<void> {
  // First and last touch for analytics, for every conversion (with or
  // without a campaign cookie). Never throws.
  await recordTouch({ kind: opts.kind, refId: opts.refId, cookieHeader: opts.cookieHeader, headers: opts.headers, amountCents: opts.amountCents });
  try {
    const a = attributionFromCookieHeader(opts.cookieHeader);
    if (!a || !opts.refId) return;
    await ensureGrowthTables();
    const amount = Number.isInteger(opts.amountCents) ? (opts.amountCents as number) : null;
    await prisma.$executeRaw`
      INSERT INTO "ConversionAttribution" ("id", "kind", "refId", "utmSource", "utmMedium", "utmCampaign", "utmContent", "linkCode", "amountCents")
      VALUES (${randomUUID()}, ${opts.kind}, ${opts.refId.slice(0, 200)}, ${a.utmSource}, ${a.utmMedium}, ${a.utmCampaign}, ${a.utmContent}, ${a.linkCode}, ${amount})
      ON CONFLICT ("kind", "refId") DO NOTHING`;
  } catch (err) {
    console.error("[growth/attribution]", opts.kind, err instanceof Error ? err.message : err);
  }
}
