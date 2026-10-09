import { NextRequest, NextResponse, after } from "next/server";
import { randomUUID } from "crypto";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { parseUserAgent } from "@/lib/learn/logins";
import { clientIp, fillGeo, geoFromHeaders } from "@/lib/geo";
import { analyticsReady } from "@/lib/analytics/db";
import { areaOf, isTrackablePath, normalizePath, safeLabel } from "@/lib/analytics/paths";

// Public, first-party click beacon (components/public/AnalyticsTracker.tsx):
// a batch of up to 50 clicks on links and buttons, sent every 10 s, at 20
// clicks, and on pagehide (navigator.sendBeacon). Records which control was
// clicked on which page, never what anyone typed. Everything is re-checked
// here: paths normalised again, labels filtered for anything personal,
// strings bounded, admin and token routes dropped.

const KINDS = ["link", "button", "submit", "summary", "tab", "menu", "other"] as const;

const Event = z.object({
  page: z.string().max(300),
  label: z.string().max(120),
  kind: z.enum(KINDS).catch("other"),
  href: z.string().max(300).nullish(),
});
const Body = z.object({
  sessionId: z.string().max(64).regex(/^[\w.-]+$/).nullish(),
  events: z.array(Event).min(1).max(50),
});

const HREF = /^(\/[\w\-.~:/]*|external:[a-z0-9.-]{1,80}|mailto|tel)$/i;

export async function POST(req: NextRequest) {
  const ip = clientIp(req.headers) ?? "unknown";
  if (!(await checkRateLimit(`analytics-clicks:${ip}`, ip === "unknown" ? 3000 : 120, 10 * 60_000))) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  const text = await req.text().catch(() => "");
  if (text.length > 32_000) return NextResponse.json({ error: "Too large" }, { status: 413 });
  let json: unknown = null;
  try {
    json = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
  const parsed = Body.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Bad request" }, { status: 400 });

  // Respect Do Not Track / Global Privacy Control even if a client ignores it.
  if (req.headers.get("dnt") === "1" || req.headers.get("sec-gpc") === "1") return NextResponse.json({ ok: true, skipped: true });

  const ua = parseUserAgent(req.headers.get("user-agent"));
  if (ua.deviceType === "bot") return NextResponse.json({ ok: true });
  const device = ua.deviceType === "unknown" ? "desktop" : ua.deviceType;
  const country = geoFromHeaders(req.headers)?.country ?? null;
  const sessionId = parsed.data.sessionId ?? null;

  const rows = parsed.data.events
    .filter((e) => isTrackablePath(e.page))
    .map((e) => {
      const page = normalizePath(e.page);
      const label = safeLabel(e.label);
      let href = e.href ? e.href.trim() : null;
      if (href && href.startsWith("/")) href = isTrackablePath(href) ? normalizePath(href) : null;
      if (href && !HREF.test(href)) href = null;
      return label ? { id: randomUUID(), page, area: areaOf(page), label, kind: e.kind, href } : null;
    })
    .filter((r): r is NonNullable<typeof r> => !!r);
  if (!rows.length) return NextResponse.json({ ok: true });

  if (!(await analyticsReady())) return NextResponse.json({ ok: true });
  try {
    const values: unknown[] = [];
    const tuples = rows.map((r, i) => {
      const b = i * 9;
      values.push(r.id, sessionId, r.page, r.area, r.label, r.kind, r.href, device, country);
      return `($${b + 1},$${b + 2},$${b + 3},$${b + 4},$${b + 5},$${b + 6},$${b + 7},$${b + 8},$${b + 9})`;
    });
    await prisma.$executeRawUnsafe(
      `INSERT INTO "ClickEvent" ("id","sessionId","page","area","label","kind","href","device","country") VALUES ${tuples.join(",")}`,
      ...values,
    );
    if (!country) {
      const headers = new Headers(req.headers);
      const ids = rows.map((r) => r.id);
      after(() => fillGeo("ClickEvent", ids, ip, headers));
    }
  } catch (err) {
    console.error("[analytics/clicks]", err instanceof Error ? err.message : err);
  }
  return NextResponse.json({ ok: true });
}
