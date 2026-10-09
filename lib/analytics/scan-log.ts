import { randomUUID } from "crypto";
import prisma from "@/lib/prisma";
import { anonymiseIp } from "@/lib/require-admin";
import { parseUserAgent } from "@/lib/learn/logins";
import { clientIp, fillGeo, geoFromHeaders } from "@/lib/geo";
import { ensureAnalyticsTables } from "./db";
import { BLOCK_MESSAGES } from "@/lib/ssrf";
import { isTrackablePath, normalizePath } from "./paths";

// One row per website scan attempt (app/api/scanner/audit), whatever the
// outcome: what was scanned, when, from where (approximate: country, region,
// city) and on what device. Written after the response; the location is filled
// in after that (lib/geo.ts). The address is stored anonymised.

export const SCAN_OUTCOMES = ["ok", "limit", "held", "error", "rescan", "invalid"] as const;
export type ScanOutcome = (typeof SCAN_OUTCOMES)[number];

export interface ScanLogInput {
  /** What the visitor typed (or the final URL when the scan ran). */
  url: string;
  domain?: string | null;
  outcome: ScanOutcome;
  errorCode?: string | null;
  leadId?: string | null;
  locale?: string | null;
  /** Where the scan was started (the page's path), from the client or the Referer. */
  from?: string | null;
  staff?: boolean;
  headers: Headers;
}

/**
 * A short code for a scan error (the scanner returns English sentences), and
 * whether it means the visitor typed something that is not a website: not a
 * URL, a non-web scheme, or a domain that does not exist.
 */
export function scanErrorCode(error: string | null | undefined): { code: string; invalid: boolean } {
  const e = String(error ?? "");
  if (!e || e === "invalid") return { code: "invalid", invalid: true };
  for (const [reason, message] of Object.entries(BLOCK_MESSAGES)) {
    if (e.startsWith(message)) return { code: reason, invalid: reason === "scheme" || reason === "unresolvable" };
  }
  const http = /\(HTTP (\d{3})\)/.exec(e);
  if (http) return { code: `http_${http[1]}`, invalid: false };
  if (/over \d+ seconds|timed out/i.test(e)) return { code: "timeout", invalid: false };
  if (/^[a-z][a-z0-9_-]{1,40}$/.test(e)) return { code: e, invalid: false };
  return { code: "unreachable", invalid: false };
}

/** Origin and path only: no query string, fragment or credentials. Anything else is summarised. */
export function scanUrlForLog(raw: string): string {
  const s = String(raw ?? "").trim().slice(0, 500);
  if (!s) return "(empty)";
  try {
    const u = new URL(/^https?:\/\//i.test(s) ? s : `https://${s}`);
    if (/^https?:$/.test(u.protocol) && u.hostname.includes(".")) {
      return `${u.protocol}//${u.hostname.toLowerCase()}${u.port ? `:${u.port}` : ""}${u.pathname === "/" ? "" : u.pathname}`.slice(0, 300);
    }
  } catch {
    /* not a URL */
  }
  if (/@/.test(s)) return "(not a URL: email-like input)";
  if (/\d{6,}/.test(s.replace(/[\s()+.-]/g, ""))) return "(not a URL: number-like input)";
  return `(not a URL) ${s.replace(/[\u0000-\u001f]/g, " ").slice(0, 80)}`;
}

function fromPage(from: string | null | undefined, headers: Headers): string | null {
  let p = typeof from === "string" ? from : null;
  if (!p) {
    const ref = headers.get("referer");
    try {
      if (ref) p = new URL(ref).pathname;
    } catch {
      p = null;
    }
  }
  if (!p || !isTrackablePath(p)) return null;
  return normalizePath(p);
}

/** Never throws. Returns the row id (for tests), or null when nothing was written. */
export async function writeScanLog(input: ScanLogInput): Promise<string | null> {
  try {
    await ensureAnalyticsTables();
    const h = input.headers;
    const ua = parseUserAgent(h.get("user-agent"));
    const device = ua.deviceType === "unknown" ? "desktop" : ua.deviceType;
    const ip = clientIp(h);
    const edge = geoFromHeaders(h);
    const id = randomUUID();
    await prisma.$executeRawUnsafe(
      `INSERT INTO "ScanLog" ("id","url","domain","outcome","errorCode","leadId","ip","country","countryName","region","city","device","browser","os","locale","fromPage","staff")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
      id,
      scanUrlForLog(input.url),
      input.domain ? input.domain.slice(0, 253) : null,
      input.outcome,
      input.errorCode ? input.errorCode.slice(0, 60) : null,
      input.leadId ?? null,
      ip ? anonymiseIp(ip) : null,
      edge?.country ?? null,
      edge?.countryName ?? null,
      edge?.region ?? null,
      edge?.city ?? null,
      device,
      ua.browser.slice(0, 40),
      ua.os.slice(0, 40),
      input.locale ? input.locale.slice(0, 8) : null,
      fromPage(input.from, h),
      !!input.staff,
    );
    await fillGeo("ScanLog", [id], ip, h);
    return id;
  } catch (err) {
    console.error("[scan-log]", err instanceof Error ? err.message : err);
    return null;
  }
}

export interface ScanLogRow {
  id: string;
  createdAt: Date;
  url: string;
  domain: string | null;
  outcome: string;
  errorCode: string | null;
  leadId: string | null;
  country: string | null;
  countryName: string | null;
  region: string | null;
  city: string | null;
  device: string | null;
  browser: string | null;
  os: string | null;
  locale: string | null;
  fromPage: string | null;
  staff: boolean;
}

/** The scan-log rows of one lead (admin lead page). */
export async function scanLogsForLead(leadId: string): Promise<ScanLogRow[]> {
  try {
    await ensureAnalyticsTables();
    return await prisma.$queryRawUnsafe<ScanLogRow[]>(
      `SELECT "id","createdAt","url","domain","outcome","errorCode","leadId","country","countryName","region","city","device","browser","os","locale","fromPage","staff"
       FROM "ScanLog" WHERE "leadId" = $1 ORDER BY "createdAt" ASC LIMIT 5`,
      leadId,
    );
  } catch {
    return [];
  }
}
