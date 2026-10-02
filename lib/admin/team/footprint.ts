// The staff footprint: every sign-in (and failed attempt), admin page views
// (one per path per person per 10 minutes), API writes and exports, stored in
// StaffEvent; the detailed actions stay in AdminAuditLog (lib/admin/audit.ts)
// and the timeline merges the two.
//
// Privacy: IPv4 /24 or IPv6 /48 only, a device summary (type, browser, OS)
// instead of the raw user agent, an approximate country only when the host
// sends a geo header. Writes never throw and never block the request.
import { randomUUID } from "crypto";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { countryFrom, ipPrefix, parseUserAgent } from "@/lib/learn/logins";
import { ensureTeamAccessTables } from "./db";
import { sendOwnerAlert } from "./alerts";

export type StaffEventKind = "signin" | "signin_failed" | "page_view" | "api_write" | "export" | "signout_forced";

type HeaderBag = Record<string, unknown> | Headers | undefined | null;

function header(h: HeaderBag, name: string): string | null {
  if (!h) return null;
  if (typeof (h as Headers).get === "function") return (h as Headers).get(name);
  const v = (h as Record<string, unknown>)[name];
  if (Array.isArray(v)) return typeof v[0] === "string" ? v[0] : null;
  return typeof v === "string" ? v : null;
}

export function clientOf(h: HeaderBag) {
  const ip = header(h, "x-forwarded-for") ?? header(h, "x-real-ip");
  const d = parseUserAgent(header(h, "user-agent"));
  return { ipPrefix: ipPrefix(ip), country: countryFrom(h), deviceType: d.deviceType, browser: d.browser, os: d.os };
}

export interface StaffEventInput {
  staffId: string | null;
  email: string;
  kind: StaffEventKind;
  area?: string | null;
  path?: string | null;
  method?: string | null;
  success?: boolean;
  headers?: HeaderBag;
  meta?: Record<string, unknown> | null;
}

export async function recordStaffEvent(e: StaffEventInput): Promise<void> {
  try {
    await ensureTeamAccessTables();
    const c = clientOf(e.headers);
    await prisma.$executeRaw`
      INSERT INTO "StaffEvent" ("id", "staffId", "email", "kind", "area", "path", "method", "success", "ipPrefix", "country", "deviceType", "browser", "os", "meta")
      VALUES (${randomUUID()}, ${e.staffId}, ${e.email.toLowerCase().slice(0, 320)}, ${e.kind}, ${e.area?.slice(0, 40) ?? null},
              ${e.path?.slice(0, 300) ?? null}, ${e.method?.slice(0, 10) ?? null}, ${e.success ?? true},
              ${c.ipPrefix}, ${c.country}, ${c.deviceType}, ${c.browser?.slice(0, 40) ?? null}, ${c.os?.slice(0, 40) ?? null},
              ${e.meta ? JSON.stringify(e.meta).slice(0, 4000) : null}::jsonb)`;
  } catch (err) {
    console.error("[team/footprint] write", e.kind, err instanceof Error ? err.message : err);
  }
}

// ── Throttles (per process; a second instance may add the odd duplicate) ──

const g = globalThis as unknown as { __tibStaffSeen?: Map<string, number> };
const seen = (g.__tibStaffSeen ??= new Map());

function firstIn(key: string, windowMs: number): boolean {
  const now = Date.now();
  const last = seen.get(key);
  if (last && now - last < windowMs) return false;
  if (seen.size > 5000) {
    for (const [k, t] of seen) if (now - t > 600_000) seen.delete(k);
    if (seen.size > 5000) seen.clear();
  }
  seen.set(key, now);
  return true;
}

export const PAGE_VIEW_WINDOW_MS = 10 * 60_000;

/** One page view per person per path per 10 minutes. */
export function recordPageView(p: { staffId: string | null; email: string; path: string; area: string | null; headers: HeaderBag }): void {
  if (!firstIn(`pv|${p.email}|${p.path}`, PAGE_VIEW_WINDOW_MS)) return;
  void recordStaffEvent({ staffId: p.staffId, email: p.email, kind: "page_view", area: p.area, path: p.path, method: "GET", headers: p.headers });
}

/** API writes: at most one entry per person, method and path per minute. */
export function recordApiWrite(p: { staffId: string | null; email: string; path: string; method: string; area: string | null; headers: HeaderBag; allowed: boolean }): void {
  if (!firstIn(`w|${p.email}|${p.method}|${p.path}|${p.allowed}`, 60_000)) return;
  void recordStaffEvent({
    staffId: p.staffId,
    email: p.email,
    kind: "api_write",
    area: p.area,
    path: p.path,
    method: p.method,
    success: p.allowed,
    headers: p.headers,
  });
}

/** A CSV export: logged, and the owner is told when someone else did it. */
export function recordExport(p: { staffId: string | null; email: string; name?: string | null; path: string; query?: string; area: string | null; headers: HeaderBag; isOwner: boolean }): void {
  void recordStaffEvent({ staffId: p.staffId, email: p.email, kind: "export", area: p.area, path: p.path, method: "GET", headers: p.headers, meta: p.query ? { query: p.query.slice(0, 300) } : null });
  if (!p.isOwner) {
    void sendOwnerAlert("export", `${p.name || p.email} downloaded a CSV export.`, [
      ["Who", `${p.name ? `${p.name} ` : ""}<${p.email}>`],
      ["Export", p.path + (p.query ? `?${p.query}` : "")],
      ["Area", p.area],
      ["When", new Date().toISOString().replace("T", " ").slice(0, 19)],
      ...deviceRows(p.headers),
    ]);
  }
}

function deviceRows(h: HeaderBag): Array<[string, string | null]> {
  const c = clientOf(h);
  return [
    ["Device", [c.deviceType, c.browser, c.os].filter(Boolean).join(" · ") || null],
    ["Network", c.ipPrefix],
    ["Country", c.country],
  ];
}

// ── Sign-ins ────────────────────────────────────────────────────────────────

const FAILED_WINDOW_MS = 15 * 60_000;
const FAILED_ALERT_AT = 5;

/**
 * Records a staff sign-in attempt. On success, emails the owner when the
 * browser and OS have never signed in to this account before (skipped for
 * the very first sign-in, which is always "new"). On failure, emails the
 * owner when 5 or more failed staff sign-ins happened in 15 minutes (once
 * per window).
 */
export async function recordStaffSignin(p: {
  staffId: string | null;
  email: string;
  name?: string | null;
  success: boolean;
  reason?: string;
  headers: HeaderBag;
}): Promise<void> {
  const email = p.email.toLowerCase().trim().slice(0, 320);
  try {
    await ensureTeamAccessTables();
  } catch {
    return;
  }
  const c = clientOf(p.headers);
  if (p.success) {
    let isNew = false;
    let hadAny = false;
    try {
      const rows = await prisma.$queryRaw<Array<{ n: number; same: number }>>`
        SELECT COUNT(*)::int AS n,
               COUNT(*) FILTER (WHERE split_part(COALESCE("browser", ''), ' ', 1) = split_part(${c.browser ?? ""}, ' ', 1)
                                  AND "os" IS NOT DISTINCT FROM ${c.os} AND "deviceType" IS NOT DISTINCT FROM ${c.deviceType})::int AS same
        FROM "StaffEvent" WHERE "email" = ${email} AND "kind" = 'signin' AND "success" = true`;
      hadAny = (rows[0]?.n ?? 0) > 0;
      isNew = hadAny && (rows[0]?.same ?? 0) === 0;
    } catch {
      /* no alert */
    }
    await recordStaffEvent({ staffId: p.staffId, email, kind: "signin", success: true, headers: p.headers, meta: isNew ? { newDevice: true } : null });
    if (isNew) {
      void sendOwnerAlert("new_device", `${p.name || email} signed in to the admin from a browser or device not seen on this account before.`, [
        ["Who", `${p.name ? `${p.name} ` : ""}<${email}>`],
        ["When", new Date().toISOString().replace("T", " ").slice(0, 19)],
        ...deviceRows(p.headers),
      ]);
    }
    return;
  }
  await recordStaffEvent({ staffId: p.staffId, email, kind: "signin_failed", success: false, headers: p.headers, meta: p.reason ? { reason: p.reason } : null });
  try {
    const since = new Date(Date.now() - FAILED_WINDOW_MS);
    const rows = await prisma.$queryRaw<Array<{ n: number }>>`
      SELECT COUNT(*)::int AS n FROM "StaffEvent" WHERE "kind" = 'signin_failed' AND "at" >= ${since}`;
    const n = rows[0]?.n ?? 0;
    if (n >= FAILED_ALERT_AT && firstIn("failed-signins-alert", FAILED_WINDOW_MS)) {
      const top = await prisma.$queryRaw<Array<{ email: string; n: number }>>`
        SELECT "email", COUNT(*)::int AS n FROM "StaffEvent" WHERE "kind" = 'signin_failed' AND "at" >= ${since}
        GROUP BY "email" ORDER BY n DESC LIMIT 5`;
      void sendOwnerAlert("failed_signins", `${n} failed staff sign-ins in the last 15 minutes.`, [
        ["Accounts tried", top.map((t) => `${t.email} (${t.n})`).join(", ")],
        ["Latest", new Date().toISOString().replace("T", " ").slice(0, 19)],
        ...deviceRows(p.headers),
      ]);
    }
  } catch {
    /* alert skipped */
  }
}

// ── Reading: the timeline ───────────────────────────────────────────────────

export interface TimelineRow {
  id: string;
  at: Date;
  email: string;
  source: "event" | "audit";
  kind: string;
  area: string | null;
  summary: string;
  success: boolean;
  device: string | null;
  ipPrefix: string | null;
  country: string | null;
  meta: Record<string, unknown> | null;
}

export interface TimelineFilters {
  email: string;
  type: "" | "signin" | "page_view" | "action" | "export";
  area: string;
  from: string;
  to: string;
  page: number;
}

const DATE = /^\d{4}-\d{2}-\d{2}$/;
type Params = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export function parseTimelineFilters(sp: Params | URLSearchParams): TimelineFilters {
  const get = (k: string) => (sp instanceof URLSearchParams ? sp.get(k) ?? "" : one(sp[k]));
  const type = get("type");
  return {
    email: get("person").trim().toLowerCase().slice(0, 320),
    type: (["signin", "page_view", "action", "export"].includes(type) ? type : "") as TimelineFilters["type"],
    area: /^[a-z_]{1,40}$/.test(get("area")) ? get("area") : "",
    from: DATE.test(get("from")) ? get("from") : "",
    to: DATE.test(get("to")) ? get("to") : "",
    page: Math.max(1, Math.min(10_000, Number.parseInt(get("page"), 10) || 1)),
  };
}

export const TIMELINE_PAGE = 60;

function range(f: TimelineFilters, col: string): Prisma.Sql[] {
  const c = Prisma.raw(`"${col}"`);
  const out: Prisma.Sql[] = [];
  if (f.from) out.push(Prisma.sql`${c} >= ${new Date(`${f.from}T00:00:00Z`)}`);
  if (f.to) out.push(Prisma.sql`${c} < ${new Date(new Date(`${f.to}T00:00:00Z`).getTime() + 86_400_000)}`);
  return out;
}

/** Audit action prefixes per area, for the area filter on audited actions. */
const AUDIT_AREA: Record<string, string[]> = {
  learners: ["learner.", "access.", "certificate.", "capstone."],
  communications: ["comms."],
  promotions: ["promotion."],
  shop: ["product.", "order."],
  team: ["team.", "collaborator."],
  audit: ["audit."],
};

function eventWhere(f: TimelineFilters, emails: string[] | null): Prisma.Sql {
  const parts: Prisma.Sql[] = [Prisma.sql`TRUE`];
  if (emails) parts.push(emails.length ? Prisma.sql`"email" IN (${Prisma.join(emails)})` : Prisma.sql`FALSE`);
  if (f.type === "signin") parts.push(Prisma.sql`"kind" IN ('signin', 'signin_failed', 'signout_forced')`);
  else if (f.type === "page_view") parts.push(Prisma.sql`"kind" = 'page_view'`);
  else if (f.type === "action") parts.push(Prisma.sql`"kind" = 'api_write'`);
  else if (f.type === "export") parts.push(Prisma.sql`"kind" = 'export'`);
  if (f.area) parts.push(Prisma.sql`"area" = ${f.area}`);
  parts.push(...range(f, "at"));
  return Prisma.join(parts, " AND ");
}

function auditWhere(f: TimelineFilters, emails: string[] | null): Prisma.Sql | null {
  if (f.type === "signin" || f.type === "page_view") return null;
  const parts: Prisma.Sql[] = [Prisma.sql`TRUE`];
  if (emails) parts.push(emails.length ? Prisma.sql`"actorEmail" IN (${Prisma.join(emails)})` : Prisma.sql`FALSE`);
  else parts.push(Prisma.sql`"actorRole" IN ('owner', 'admin', 'collaborator')`);
  if (f.type === "export") parts.push(Prisma.sql`"action" LIKE ${"%export%"}`);
  if (f.area) {
    const pre = AUDIT_AREA[f.area] ?? [`${f.area}.`];
    parts.push(Prisma.sql`(${Prisma.join(pre.map((p) => Prisma.sql`"action" LIKE ${p + "%"}`), " OR ")})`);
  }
  parts.push(...range(f, "at"));
  return Prisma.join(parts, " AND ");
}

interface EventRow {
  id: string;
  at: Date;
  email: string;
  kind: string;
  area: string | null;
  path: string | null;
  method: string | null;
  success: boolean;
  ipPrefix: string | null;
  country: string | null;
  deviceType: string | null;
  browser: string | null;
  os: string | null;
  meta: Record<string, unknown> | null;
}

interface AuditRow {
  id: string;
  at: Date;
  actorEmail: string;
  action: string;
  targetType: string | null;
  targetLabel: string | null;
  meta: Record<string, unknown> | null;
}

function eventSummary(e: EventRow): string {
  switch (e.kind) {
    case "signin":
      return e.meta && (e.meta as { newDevice?: boolean }).newDevice ? "Signed in (new device)" : "Signed in";
    case "signin_failed":
      return `Failed sign-in${e.meta && (e.meta as { reason?: string }).reason ? ` (${(e.meta as { reason?: string }).reason})` : ""}`;
    case "signout_forced":
      return "Signed out by an administrator";
    case "page_view":
      return `Viewed ${e.path ?? ""}`;
    case "export":
      return `Exported ${e.path ?? ""}${e.meta && (e.meta as { query?: string }).query ? `?${(e.meta as { query?: string }).query}` : ""}`;
    case "api_write":
      return `${e.success ? "" : "Refused: "}${e.method ?? ""} ${e.path ?? ""}`.trim();
    default:
      return e.kind;
  }
}

function auditSummary(a: AuditRow): string {
  return `${a.action}${a.targetLabel ? ` · ${a.targetLabel}` : ""}`;
}

function auditArea(action: string): string | null {
  for (const [area, pre] of Object.entries(AUDIT_AREA)) if (pre.some((p) => action.startsWith(p))) return area;
  return action.split(".")[0] || null;
}

/**
 * Merged timeline, newest first. `emails` null = everyone (team-wide view).
 * Paged by fetching page*size from each source and merging, which is fine
 * for the page counts staff browse.
 */
export async function timeline(f: TimelineFilters, emails: string[] | null, size = TIMELINE_PAGE): Promise<{ rows: TimelineRow[]; more: boolean }> {
  await ensureTeamAccessTables();
  const take = f.page * size + 1;
  const ew = eventWhere(f, emails);
  const aw = auditWhere(f, emails);
  const [events, audits] = await Promise.all([
    prisma.$queryRaw<EventRow[]>`SELECT * FROM "StaffEvent" WHERE ${ew} ORDER BY "at" DESC LIMIT ${take}`,
    aw
      ? import("@/lib/admin/audit")
          .then((m) => m.ensureAuditTable())
          .then(() => prisma.$queryRaw<AuditRow[]>`SELECT "id", "at", "actorEmail", "action", "targetType", "targetLabel", "meta" FROM "AdminAuditLog" WHERE ${aw} ORDER BY "at" DESC LIMIT ${take}`)
      : Promise.resolve([] as AuditRow[]),
  ]);
  const merged: TimelineRow[] = [
    ...events.map((e) => ({
      id: `e-${e.id}`,
      at: e.at,
      email: e.email,
      source: "event" as const,
      kind: e.kind,
      area: e.area,
      summary: eventSummary(e),
      success: e.success,
      device: [e.deviceType, e.browser, e.os].filter((x) => x && x !== "unknown").join(" · ") || null,
      ipPrefix: e.ipPrefix,
      country: e.country,
      meta: e.meta,
    })),
    ...audits.map((a) => ({
      id: `a-${a.id}`,
      at: a.at,
      email: a.actorEmail,
      source: "audit" as const,
      kind: "action",
      area: auditArea(a.action),
      summary: auditSummary(a),
      success: true,
      device: null,
      ipPrefix: null,
      country: null,
      meta: a.meta,
    })),
  ].sort((x, y) => y.at.getTime() - x.at.getTime());
  const start = (f.page - 1) * size;
  return { rows: merged.slice(start, start + size), more: merged.length > start + size };
}

/** Sign-in counts and last activity per email (members table). */
export async function footprintSummary(): Promise<Map<string, { signins: number; lastActive: Date | null; lastSignin: Date | null }>> {
  const out = new Map<string, { signins: number; lastActive: Date | null; lastSignin: Date | null }>();
  try {
    await ensureTeamAccessTables();
    const rows = await prisma.$queryRaw<Array<{ email: string; signins: number; last: Date | null; lastSignin: Date | null }>>`
      SELECT "email",
             COUNT(*) FILTER (WHERE "kind" = 'signin' AND "success")::int AS signins,
             MAX("at") FILTER (WHERE "success") AS last,
             MAX("at") FILTER (WHERE "kind" = 'signin' AND "success") AS "lastSignin"
      FROM "StaffEvent" GROUP BY "email"`;
    for (const r of rows) out.set(r.email, { signins: r.signins, lastActive: r.last, lastSignin: r.lastSignin });
  } catch (err) {
    console.error("[team/footprint] summary", err);
  }
  return out;
}

function cell(v: unknown): string {
  let s = v == null ? "" : typeof v === "string" ? v : v instanceof Date ? v.toISOString() : JSON.stringify(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

/** CSV of the filtered timeline (capped at 20,000 rows). */
export async function timelineCsv(f: TimelineFilters, emails: string[] | null): Promise<string> {
  const { rows } = await timeline({ ...f, page: 1 }, emails, 20_000);
  const head = ["Time (UTC)", "Staff email", "Type", "Area", "What", "Result", "Device", "Network", "Country"];
  const lines = [head.map(cell).join(",")];
  for (const r of rows) {
    lines.push([r.at, r.email, r.kind, r.area, r.summary, r.success ? "ok" : "refused/failed", r.device, r.ipPrefix, r.country].map(cell).join(","));
  }
  return "﻿" + lines.join("\r\n") + "\r\n";
}

// ── Retention ───────────────────────────────────────────────────────────────

export const RETENTION_KEY = "staff_log_retention_months";
export const RETENTION_DEFAULT = 12;
export const RETENTION_MIN = 1;
export const RETENTION_MAX = 84;

export async function retentionMonths(): Promise<number> {
  try {
    const row = await prisma.adminSettings.findUnique({ where: { key: RETENTION_KEY } });
    const n = Number(row?.value);
    return Number.isInteger(n) && n >= RETENTION_MIN && n <= RETENTION_MAX ? n : RETENTION_DEFAULT;
  } catch {
    return RETENTION_DEFAULT;
  }
}

/**
 * Deletes staff footprint and audit entries older than the retention setting.
 * Run from the daily teams cron; does real work at most once a day.
 */
export async function runStaffLogRetention(): Promise<{ events: number; audit: number; skipped?: boolean }> {
  await ensureTeamAccessTables();
  const mark = await prisma.adminSettings.findUnique({ where: { key: "staff_log_retention_ran_at" } }).catch(() => null);
  if (mark && Date.now() - Number(mark.value) < 20 * 3_600_000) return { events: 0, audit: 0, skipped: true };
  const months = await retentionMonths();
  const cutoff = new Date();
  cutoff.setUTCMonth(cutoff.getUTCMonth() - months);
  const events = await prisma.$executeRaw`DELETE FROM "StaffEvent" WHERE "at" < ${cutoff}`;
  let auditRows = 0;
  try {
    const { ensureAuditTable } = await import("@/lib/admin/audit");
    await ensureAuditTable();
    auditRows = await prisma.$executeRaw`DELETE FROM "AdminAuditLog" WHERE "at" < ${cutoff}`;
  } catch (err) {
    console.error("[team/retention] audit", err);
  }
  await prisma.adminSettings.upsert({
    where: { key: "staff_log_retention_ran_at" },
    update: { value: String(Date.now()) },
    create: { key: "staff_log_retention_ran_at", value: String(Date.now()) },
  });
  return { events, audit: auditRows };
}
