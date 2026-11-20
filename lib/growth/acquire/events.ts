import { randomUUID } from "crypto";
import prisma from "@/lib/prisma";
import { ensureGrowthTables } from "../db";
import { attributionFromCookieHeader, type Attribution } from "../attribution";
import { ensureAcquireTables } from "./db";
import { dayVisitorHash } from "./security";

export type RefType = "magnet" | "page";
export type EventKind = "view" | "cta" | "quiz";

/** One counted view / CTA click / quiz completion per visitor and day. */
export async function recordAcquireEvent(refType: RefType, refId: string, kind: EventKind, ip: string, ua: string): Promise<boolean> {
  await ensureAcquireTables();
  const day = new Date().toISOString().slice(0, 10);
  const n = await prisma.acquireEvent.createMany({
    data: [{ refType, refId, kind, visitorHash: dayVisitorHash(ip, ua, day), day }],
    skipDuplicates: true,
  });
  return n.count > 0;
}

/** Conversion kinds this module writes into ConversionAttribution. */
export const ACQUIRE_KINDS = { magnet: "magnet_signup", page: "landing_lead" } as const;

/**
 * Ties a capture to its campaign in ConversionAttribution, so it shows up in
 * Growth → Links & attribution. The visitor's UTM cookie wins (they came from
 * a post, an email or a tracked link); without one the capture is credited
 * to the magnet's or page's own campaign. Returns the attribution used.
 */
export async function recordCaptureAttribution(opts: {
  refType: RefType;
  captureId: string;
  cookieHeader: string | null | undefined;
  fallback: Attribution;
}): Promise<Attribution> {
  const a = attributionFromCookieHeader(opts.cookieHeader) ?? opts.fallback;
  try {
    await ensureGrowthTables();
    await prisma.$executeRaw`
      INSERT INTO "ConversionAttribution" ("id", "kind", "refId", "utmSource", "utmMedium", "utmCampaign", "utmContent", "linkCode", "amountCents")
      VALUES (${randomUUID()}, ${ACQUIRE_KINDS[opts.refType]}, ${opts.captureId}, ${a.utmSource}, ${a.utmMedium}, ${a.utmCampaign}, ${a.utmContent}, ${a.linkCode}, ${null})
      ON CONFLICT ("kind", "refId") DO NOTHING`;
  } catch (err) {
    console.error("[acquire] attribution", err instanceof Error ? err.message : err);
  }
  return a;
}
