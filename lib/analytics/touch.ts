import { randomUUID } from "crypto";
import prisma from "@/lib/prisma";
import { parseUserAgent } from "@/lib/learn/logins";
import { clientIp, geoFromHeaders, locate } from "@/lib/geo";
import { ensureAnalyticsTables } from "./db";
import { FIRST_TOUCH_COOKIE, LAST_TOUCH_COOKIE, cookieValue, touchFromCookie, type Touch } from "./sources";

// First and last touch on every conversion (sign-up, booking, lead, purchase),
// so revenue and leads can be attributed to where people came from.
//
// A side table keyed by the converted record (kind + refId), like the Growth
// ConversionAttribution table, so no business table changes. The touches come
// from two first-party cookies the tracker sets (lib/analytics/sources.ts):
// tib_ft (first visit, 90 days) and tib_lt (this session's source). Neither
// holds anything personal: campaign tags, a landing path and a referrer host.
// Device and country come from the converting request (no address is kept).

export type TouchKind =
  | "learn_signup"
  | "track_checkout"
  | "learn_subscription_checkout"
  | "toolkit_checkout"
  | "blueprint"
  | "scanner"
  | "scanner_lead"
  | "order"
  | "event_registration"
  | "appointment"
  | "contact"
  | "service_request"
  | "lead_magnet"
  | "youth_sponsor"
  | "donation"
  | "scholarship_application";

type HeaderLike = Headers | { get(name: string): string | null };

export interface TouchRow {
  kind: string;
  refId: string;
  ft: Touch | null;
  lt: Touch | null;
}

/** Never throws; idempotent per (kind, refId): the first record wins. */
export async function recordTouch(opts: {
  kind: TouchKind;
  refId: string;
  cookieHeader?: string | null;
  headers?: HeaderLike | null;
  amountCents?: number | null;
}): Promise<void> {
  try {
    if (!opts.refId) return;
    await ensureAnalyticsTables();
    const cookie = opts.cookieHeader ?? opts.headers?.get("cookie") ?? null;
    const ft = touchFromCookie(cookieValue(cookie, FIRST_TOUCH_COOKIE));
    const lt = touchFromCookie(cookieValue(cookie, LAST_TOUCH_COOKIE)) ?? ft;
    const h = opts.headers ?? null;
    const ua = h ? parseUserAgent(h.get("user-agent")) : null;
    const device = ua ? (ua.deviceType === "unknown" ? null : ua.deviceType) : null;
    const id = randomUUID();
    const edge = h ? geoFromHeaders(h as Headers) : null;
    const amount = Number.isInteger(opts.amountCents) ? (opts.amountCents as number) : null;
    const n = await prisma.$executeRawUnsafe(
      `INSERT INTO "TouchAttribution" ("id","kind","refId",
         "ftSource","ftMedium","ftCampaign","ftContent","ftTerm","ftLink","ftLanding","ftReferrer","ftAt",
         "ltSource","ltMedium","ltCampaign","ltContent","ltTerm","ltLink","ltLanding","ltReferrer",
         "device","country","amountCents")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23)
       ON CONFLICT ("kind","refId") DO NOTHING`,
      id, opts.kind, opts.refId.slice(0, 200),
      ft?.source ?? "(unknown)", ft?.medium ?? null, ft?.campaign ?? null, ft?.content ?? null, ft?.term ?? null, ft?.link ?? null, ft?.landing ?? null, ft?.referrer ?? null, ft?.at ?? null,
      lt?.source ?? "(unknown)", lt?.medium ?? null, lt?.campaign ?? null, lt?.content ?? null, lt?.term ?? null, lt?.link ?? null, lt?.landing ?? null, lt?.referrer ?? null,
      device, edge?.country ?? null, amount,
    );
    // Country from the IP when the edge did not say, off the request path.
    if (n === 1 && !edge?.country && h) {
      const ip = clientIp(h as Headers);
      void locate(ip)
        .then((g) => (g?.country ? prisma.$executeRawUnsafe(`UPDATE "TouchAttribution" SET "country" = $1 WHERE "id" = $2`, g.country, id) : 0))
        .catch(() => {});
    }
  } catch (err) {
    console.error("[analytics/touch]", opts.kind, err instanceof Error ? err.message : err);
  }
}
