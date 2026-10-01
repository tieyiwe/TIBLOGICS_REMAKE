import prisma from "@/lib/prisma";
import { anonymiseIp } from "@/lib/require-admin";

// Learner sign-in history (TIBLOGICS Learn): one LoginEvent per successful
// sign-in through the "student" provider in lib/auth.ts, shown to staff on the
// admin learner pages. Privacy: no password, no full IP (IPv4 /24, IPv6 /48),
// the user agent trimmed to 300 characters, rows older than 400 days pruned.
//
// The table is created at runtime, once per process, like lib/learn/method/db.ts
// (this project has no migrations). The statements mirror the LoginEvent model
// at the end of prisma/schema.prisma; keep the two in step. Plain id column, no
// Prisma relation (so Student is not edited); the foreign key below cascades.

const STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS "LoginEvent" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipPrefix" TEXT,
    "userAgent" TEXT,
    "deviceType" TEXT,
    "browser" TEXT,
    "os" TEXT,
    "country" TEXT,
    "method" TEXT NOT NULL DEFAULT 'password',
    CONSTRAINT "LoginEvent_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE INDEX IF NOT EXISTS "LoginEvent_studentId_at_idx" ON "LoginEvent"("studentId", "at")`,
  `CREATE INDEX IF NOT EXISTS "LoginEvent_at_idx" ON "LoginEvent"("at")`,
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'LoginEvent_studentId_fkey') THEN
      ALTER TABLE "LoginEvent" ADD CONSTRAINT "LoginEvent_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
  END $$`,
];

let ready: Promise<void> | null = null;

/** Throws if the table cannot be created; callers decide how to degrade. */
export function ensureLoginEventTable(): Promise<void> {
  ready ??= (async () => {
    for (const sql of STATEMENTS) await prisma.$executeRawUnsafe(sql);
  })().catch((err) => {
    ready = null;
    throw err;
  });
  return ready;
}

/** Same, but never throws: false when the table is unavailable. */
export async function loginEventsReady(): Promise<boolean> {
  try {
    await ensureLoginEventTable();
    return true;
  } catch (err) {
    console.error("[learn/logins] table", err);
    return false;
  }
}

export const LOGIN_RETENTION_DAYS = 400;
export type LoginMethod = "password" | "owner-admin-password" | "invite";

type HeaderBag = Record<string, unknown> | Headers | undefined | null;

function header(h: HeaderBag, name: string): string | null {
  if (!h) return null;
  if (typeof (h as Headers).get === "function") return (h as Headers).get(name);
  const v = (h as Record<string, unknown>)[name] ?? (h as Record<string, unknown>)[name.toLowerCase()];
  if (Array.isArray(v)) return typeof v[0] === "string" ? v[0] : null;
  return typeof v === "string" ? v : null;
}

/** IPv4 to its /24 (via anonymiseIp), IPv6 to its /48. Null when unknown. */
export function ipPrefix(raw: string | null | undefined): string | null {
  let ip = (raw ?? "").split(",")[0].trim();
  if (!ip) return null;
  ip = ip.replace(/^\[|\]$/g, "").replace(/^::ffff:(?=\d+\.\d+\.\d+\.\d+$)/i, "");
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(ip)) {
    const a = anonymiseIp(ip);
    return a === "unknown" ? null : a + "/24";
  }
  if (ip.includes(":")) {
    // Expand a leading "::"-compressed address far enough to keep 3 groups.
    const [head, tail] = ip.split("::");
    const groups = head ? head.split(":") : [];
    if (tail !== undefined) while (groups.length < 3) groups.push("0");
    if (groups.length < 3 || groups.slice(0, 3).some((g) => !/^[0-9a-f]{1,4}$/i.test(g))) return null;
    return groups.slice(0, 3).map((g) => g.toLowerCase()).join(":") + "::/48";
  }
  return null;
}

/** Two-letter country from the edge's geo header, if the host sets one. */
export function countryFrom(h: HeaderBag): string | null {
  for (const name of ["cf-ipcountry", "x-vercel-ip-country", "cloudfront-viewer-country", "x-country-code", "x-appengine-country"]) {
    const v = header(h, name)?.trim().toUpperCase();
    if (v && /^[A-Z]{2}$/.test(v) && v !== "XX" && v !== "T1" && v !== "ZZ") return v;
  }
  return null;
}

export interface DeviceInfo { deviceType: "desktop" | "mobile" | "tablet" | "bot" | "unknown"; browser: string; os: string }

/** A small user-agent reading: good enough for "which device", not fingerprinting. */
export function parseUserAgent(ua: string | null | undefined): DeviceInfo {
  const s = ua ?? "";
  if (!s) return { deviceType: "unknown", browser: "Unknown", os: "Unknown" };

  const os =
    /Windows NT/i.test(s) ? "Windows"
    : /iPad|iPhone|iPod/i.test(s) ? "iOS"
    : /Android/i.test(s) ? "Android"
    : /CrOS/i.test(s) ? "ChromeOS"
    : /Mac OS X|Macintosh/i.test(s) ? "macOS"
    : /Linux/i.test(s) ? "Linux"
    : "Other";

  const ver = (re: RegExp) => s.match(re)?.[1];
  let browser = "Other";
  let v: string | undefined;
  if ((v = ver(/Edg(?:e|A|iOS)?\/(\d+)/))) browser = `Edge ${v}`;
  else if ((v = ver(/OPR\/(\d+)/))) browser = `Opera ${v}`;
  else if ((v = ver(/SamsungBrowser\/(\d+)/))) browser = `Samsung Internet ${v}`;
  else if ((v = ver(/(?:Firefox|FxiOS)\/(\d+)/))) browser = `Firefox ${v}`;
  else if ((v = ver(/(?:Chrome|CriOS)\/(\d+)/))) browser = `Chrome ${v}`;
  else if (/Safari\//.test(s) && (v = ver(/Version\/(\d+)/))) browser = `Safari ${v}`;
  else if (/HeadlessChrome|curl|wget|python|bot|spider|crawl/i.test(s)) browser = "Script";

  const deviceType: DeviceInfo["deviceType"] =
    /bot|spider|crawl|curl|wget|python-requests/i.test(s) ? "bot"
    : /iPad|Tablet|PlayBook|Silk|(Android(?!.*Mobile))/i.test(s) ? "tablet"
    : /Mobi|iPhone|iPod|Android.*Mobile|Windows Phone/i.test(s) ? "mobile"
    : "desktop";

  return { deviceType, browser, os };
}

/** "Desktop · Chrome 120 · Windows" */
export function deviceLabel(d: { deviceType: string | null; browser: string | null; os: string | null }): string {
  const type = d.deviceType ? d.deviceType[0].toUpperCase() + d.deviceType.slice(1) : "Unknown";
  return [type, d.browser ?? "?", d.os ?? "?"].join(" · ");
}

/**
 * "invite" when the sign-in came from a team invitation (/join-team/... in
 * the page's own URL or its ?next). The sign-in POST is same-origin, so the
 * Referer carries the login page's full URL.
 */
export function methodFromReferer(referer: string | null): "invite" | null {
  if (!referer) return null;
  try {
    const u = new URL(referer);
    const next = u.searchParams.get("next") ?? "";
    return u.pathname.startsWith("/join-team/") || next.startsWith("/join-team/") ? "invite" : null;
  } catch {
    return null;
  }
}

/**
 * Records one successful learner sign-in. Never throws: a failed write must
 * not fail the sign-in. Prunes rows past retention about once in 50 writes.
 */
export async function recordLoginEvent(p: { studentId: string; headers: HeaderBag; method: LoginMethod }): Promise<void> {
  try {
    await ensureLoginEventTable();
    const h = p.headers;
    const ua = (header(h, "user-agent") ?? "").slice(0, 300) || null;
    const ip = header(h, "x-forwarded-for") ?? header(h, "x-real-ip") ?? header(h, "cf-connecting-ip");
    const device = parseUserAgent(ua);
    const method: LoginMethod = p.method === "password" ? (methodFromReferer(header(h, "referer")) ?? "password") : p.method;
    await prisma.loginEvent.create({
      data: {
        studentId: p.studentId,
        ipPrefix: ipPrefix(ip),
        userAgent: ua,
        deviceType: device.deviceType,
        browser: device.browser,
        os: device.os,
        country: countryFrom(h),
        method,
      },
    });
    if (Math.random() < 0.02) {
      await prisma.loginEvent.deleteMany({ where: { at: { lt: new Date(Date.now() - LOGIN_RETENTION_DAYS * 86_400_000) } } });
    }
  } catch (err) {
    console.error("[learn/logins] record", err);
  }
}
