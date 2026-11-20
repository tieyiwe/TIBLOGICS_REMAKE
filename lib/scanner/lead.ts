import { randomBytes } from "crypto";
import type { Prisma, ScannerLead } from "@prisma/client";
import prisma from "@/lib/prisma";
import type { Locale } from "@/lib/i18n/config";
import { scanSite } from "./scan";
import { ensureScannerColumns } from "./db";
import { freeScans, LIMIT_WINDOW_DAYS, siteKey } from "./config";
import type { StoredExtra } from "./view";

// A public scan, measured and saved on the server.
//
// Scores used to be computed here and then POSTed back by the browser to
// /api/scanner-leads, so anyone could save any numbers they liked. Now the
// scan, the scores and the saved lead all happen in one request, and the
// browser gets a report token, never the lead id.
//
// Each site (siteKey: host without "www.") gets freeScans() free scans per 30
// days, counted across all visitors. Staff are never limited. Past the limit a
// visitor can buy the full report (it scans then, and shows nothing until
// paid), use the re-scan that came with a paid report, or book a call.

export const newToken = () => randomBytes(18).toString("base64url");

export type ScanResult =
  | { kind: "ok"; lead: ScannerLead }
  | { kind: "limit"; domain: string; used: number; resetAt: string }
  | { kind: "error"; status: 400 | 502; error: string };

/** Free scans of a site in the window (re-scans and bought scans do not count). */
async function freeScansUsed(domain: string): Promise<{ used: number; oldest: Date | null }> {
  const since = new Date(Date.now() - LIMIT_WINDOW_DAYS * 86_400_000);
  const rows = await prisma.$queryRawUnsafe<Array<{ used: number; oldest: Date | null }>>(
    `SELECT count(*)::int AS used, min("createdAt") AS oldest FROM "ScannerLead"
     WHERE "domain" = $1 AND "createdAt" >= $2 AND "parentId" IS NULL
       AND COALESCE(("extra"->>'held')::boolean, false) = false`,
    domain,
    since,
  );
  return { used: rows[0]?.used ?? 0, oldest: rows[0]?.oldest ?? null };
}

function limitOf(domain: string, used: number, oldest: Date | null): ScanResult {
  const reset = new Date((oldest ?? new Date()).getTime() + LIMIT_WINDOW_DAYS * 86_400_000);
  return { kind: "limit", domain, used, resetAt: reset.toISOString() };
}

/** Takes one re-scan credit from a paid report of this site, if it has one. */
async function claimRescan(token: string, domain: string): Promise<ScannerLead | null> {
  const parent = await prisma.scannerLead.findUnique({ where: { token } });
  if (!parent || parent.domain !== domain || !parent.unlockedAt) return null;
  const claimed = await prisma.scannerLead.updateMany({
    where: { id: parent.id, rescanCredits: { gt: 0 }, rescanUntil: { gt: new Date() } },
    data: { rescanCredits: { decrement: 1 } },
  });
  return claimed.count === 1 ? parent : null;
}

async function refundRescan(parentId: string) {
  await prisma.scannerLead.update({ where: { id: parentId }, data: { rescanCredits: { increment: 1 } } }).catch(() => {});
}

export async function runPublicScan(opts: {
  url: string;
  locale: Locale;
  staff: boolean;
  /** A paid report's token, to use its re-scan. */
  rescanToken?: string | null;
  /** Over the limit and buying: scan, but hold everything until paid. */
  purchase?: boolean;
}): Promise<ScanResult> {
  await ensureScannerColumns();
  const key = siteKey(opts.url);
  if (!key) return { kind: "error", status: 400, error: "invalid" };

  const parent = opts.rescanToken ? await claimRescan(opts.rescanToken, key) : null;
  const free = !opts.staff && !parent;
  let held = false;
  if (free) {
    const { used, oldest } = await freeScansUsed(key);
    if (used >= freeScans()) {
      if (!opts.purchase) return limitOf(key, used, oldest);
      held = true;
    }
  }

  const scan = await scanSite(opts.url, 20_000, { extra: true });
  if (!scan.ok) {
    if (parent) await refundRescan(parent.id);
    return { kind: "error", status: scan.status, error: scan.error };
  }

  // A redirect can land on another site (a short link, a domain that moved):
  // the limit is the final site's too.
  const domain = siteKey(scan.url) ?? key;
  if (free && !held && domain !== key) {
    const { used, oldest } = await freeScansUsed(domain);
    if (used >= freeScans()) {
      if (!opts.purchase) return limitOf(domain, used, oldest);
      held = true;
    }
  }
  if (parent && domain !== parent.domain) {
    await refundRescan(parent.id);
    return { kind: "error", status: 400, error: "rescan-other-site" };
  }

  const extra: StoredExtra | null = scan.extra
    ? {
        growthScore: scan.extra.growthScore,
        securityScore: scan.extra.securityScore,
        findings: scan.extra.findings,
        tech: scan.extra.tech,
        opportunities: scan.extra.opportunities,
        page: scan.page,
        measured: scan.measured as unknown as Record<string, unknown>,
        ...(held ? { held: true } : {}),
      }
    : null;

  const lead = await prisma.scannerLead.create({
    data: {
      url: scan.url.slice(0, 2048),
      domain,
      token: newToken(),
      locale: opts.locale,
      overallScore: scan.overallScore,
      seoScore: scan.seoScore,
      perfScore: scan.perfScore,
      uxScore: scan.uxScore,
      aiScore: scan.aiScore,
      findings: scan.findings as unknown as Prisma.InputJsonValue,
      aiDescription: "",
      ...(extra ? { extra: extra as unknown as Prisma.InputJsonValue } : {}),
      ...(parent
        ? {
            parentId: parent.id,
            email: parent.email,
            name: parent.name,
            consentAt: parent.consentAt,
            growthLeadId: parent.growthLeadId,
            unlockedAt: new Date(),
            unlockSource: "rescan",
            compare: parent.compare ?? undefined,
          }
        : {}),
    },
  });
  return { kind: "ok", lead };
}

export async function leadByToken(token: unknown): Promise<ScannerLead | null> {
  if (typeof token !== "string" || !/^[A-Za-z0-9_-]{16,64}$/.test(token)) return null;
  await ensureScannerColumns();
  return prisma.scannerLead.findUnique({ where: { token } });
}
