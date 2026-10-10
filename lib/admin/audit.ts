// Admin audit log: who did what to whom, shown at /admin_pro/audit.
//
//   await audit(session, "learner.suspend", { type: "learner", id, label: email }, { reason });
//
// Every admin action on learners, communication sends, access grants,
// certificate and capstone decisions and product publishes call this. It
// never throws and never blocks the action it records (a failed write is
// logged). `meta` must not carry secrets: never a password, token or hash.
//
// Table created at runtime once per process (this project has no
// migrations); mirrors the AdminAuditLog model in prisma/schema.prisma.
import { randomUUID } from "crypto";
import { getServerSession, type Session } from "next-auth";
import { Prisma } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

const STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS "AdminAuditLog" (
    "id" TEXT NOT NULL,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actorEmail" TEXT NOT NULL,
    "actorName" TEXT,
    "actorRole" TEXT,
    "action" TEXT NOT NULL,
    "targetType" TEXT,
    "targetId" TEXT,
    "targetLabel" TEXT,
    "meta" JSONB,
    CONSTRAINT "AdminAuditLog_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE INDEX IF NOT EXISTS "AdminAuditLog_at_idx" ON "AdminAuditLog"("at")`,
  `CREATE INDEX IF NOT EXISTS "AdminAuditLog_actorEmail_at_idx" ON "AdminAuditLog"("actorEmail", "at")`,
  `CREATE INDEX IF NOT EXISTS "AdminAuditLog_action_at_idx" ON "AdminAuditLog"("action", "at")`,
  `CREATE INDEX IF NOT EXISTS "AdminAuditLog_targetType_targetId_idx" ON "AdminAuditLog"("targetType", "targetId")`,
];

let ready: Promise<void> | null = null;

export function ensureAuditTable(): Promise<void> {
  ready ??= (async () => {
    for (const sql of STATEMENTS) await prisma.$executeRawUnsafe(sql);
  })().catch((err) => {
    ready = null;
    throw err;
  });
  return ready;
}

export interface AuditActor {
  email: string;
  name?: string | null;
  role?: string | null;
}

export interface AuditTarget {
  type: string;
  id?: string | null;
  label?: string | null;
}

type ActorInput = AuditActor | Session | null | undefined | "system";

function actorOf(a: ActorInput): AuditActor {
  if (a === "system") return { email: "system", name: "Scheduled job", role: "system" };
  if (!a) return { email: "unknown", role: null };
  if ("user" in a && a.user) {
    const u = a.user;
    return {
      email: u.email ?? "unknown",
      name: u.name ?? null,
      role: u.isOwner ? "owner" : u.isAdmin ? "admin" : u.collaboratorId ? "collaborator" : u.studentId ? "learner" : null,
    };
  }
  return a as AuditActor;
}

const clip = (v: string | null | undefined, n: number) => (v == null ? null : String(v).slice(0, n));

/** Records one action. Never throws. */
export async function audit(
  actor: ActorInput,
  action: string,
  target?: AuditTarget | null,
  meta?: Record<string, unknown> | null,
): Promise<void> {
  try {
    await ensureAuditTable();
    const a = actorOf(actor);
    const json = meta ? JSON.stringify(meta).slice(0, 8000) : null;
    await prisma.$executeRaw`
      INSERT INTO "AdminAuditLog" ("id", "actorEmail", "actorName", "actorRole", "action", "targetType", "targetId", "targetLabel", "meta")
      VALUES (${randomUUID()}, ${clip(a.email.toLowerCase(), 320)}, ${clip(a.name, 200)}, ${clip(a.role, 40)}, ${clip(action, 80)},
              ${clip(target?.type, 40)}, ${clip(target?.id, 120)}, ${clip(target?.label, 320)},
              ${json}::jsonb)`;
  } catch (err) {
    console.error("[audit] write failed", action, err);
  }
}

/**
 * For routes that only have their permission check (requireAdmin /
 * requirePermission) at hand: reads the session, then records. Never throws.
 */
export async function auditFromRequest(action: string, target?: AuditTarget | null, meta?: Record<string, unknown> | null) {
  let session: Session | null = null;
  try {
    session = await getServerSession(authOptions);
  } catch {
    /* recorded as unknown */
  }
  await audit(session, action, target, meta);
}

// ── Reading ────────────────────────────────────────────────────────────────

export interface AuditRow {
  id: string;
  at: Date;
  actorEmail: string;
  actorName: string | null;
  actorRole: string | null;
  action: string;
  targetType: string | null;
  targetId: string | null;
  targetLabel: string | null;
  meta: Record<string, unknown> | null;
}

export interface AuditFilters {
  actor: string;
  action: string;
  target: string;
  from: string;
  to: string;
  page: number;
}

type Params = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
const DATE = /^\d{4}-\d{2}-\d{2}$/;

export function parseAuditFilters(sp: Params | URLSearchParams): AuditFilters {
  const get = (k: string) => (sp instanceof URLSearchParams ? sp.get(k) ?? "" : one(sp[k]));
  return {
    actor: get("actor").trim().slice(0, 320),
    action: /^[\w.:-]{0,80}$/.test(get("action")) ? get("action") : "",
    target: get("target").trim().slice(0, 200),
    from: DATE.test(get("from")) ? get("from") : "",
    to: DATE.test(get("to")) ? get("to") : "",
    page: Math.max(1, Math.min(10_000, Number.parseInt(get("page"), 10) || 1)),
  };
}

export function auditQuery(f: AuditFilters, over: Partial<AuditFilters> = {}): string {
  const m = { ...f, ...over };
  const p = new URLSearchParams();
  if (m.actor) p.set("actor", m.actor);
  if (m.action) p.set("action", m.action);
  if (m.target) p.set("target", m.target);
  if (m.from) p.set("from", m.from);
  if (m.to) p.set("to", m.to);
  if (m.page > 1) p.set("page", String(m.page));
  const s = p.toString();
  return s ? `?${s}` : "";
}

function where(f: AuditFilters): Prisma.Sql {
  const parts: Prisma.Sql[] = [Prisma.sql`TRUE`];
  if (f.actor) parts.push(Prisma.sql`"actorEmail" = ${f.actor.toLowerCase()}`);
  if (f.action) {
    // A group ("learner") matches every learner.* action; a full name matches exactly.
    parts.push(f.action.includes(".") ? Prisma.sql`"action" = ${f.action}` : Prisma.sql`"action" LIKE ${f.action + ".%"}`);
  }
  if (f.target) {
    const like = `%${f.target.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
    parts.push(Prisma.sql`("targetId" = ${f.target} OR "targetLabel" ILIKE ${like})`);
  }
  if (f.from) parts.push(Prisma.sql`"at" >= ${new Date(`${f.from}T00:00:00Z`)}`);
  if (f.to) parts.push(Prisma.sql`"at" < ${new Date(new Date(`${f.to}T00:00:00Z`).getTime() + 86_400_000)}`);
  return Prisma.join(parts, " AND ");
}

export const AUDIT_PAGE = 50;

export async function listAudit(
  f: AuditFilters,
  limit = AUDIT_PAGE,
): Promise<{ rows: AuditRow[]; total: number; actors: string[]; actions: string[] }> {
  await ensureAuditTable();
  const w = where(f);
  const [rows, count, actors, actions] = await Promise.all([
    prisma.$queryRaw<AuditRow[]>`
      SELECT * FROM "AdminAuditLog" WHERE ${w} ORDER BY "at" DESC LIMIT ${limit} OFFSET ${(f.page - 1) * limit}`,
    prisma.$queryRaw<Array<{ n: number }>>`SELECT COUNT(*)::int AS n FROM "AdminAuditLog" WHERE ${w}`,
    prisma.$queryRaw<Array<{ v: string }>>`SELECT DISTINCT "actorEmail" AS v FROM "AdminAuditLog" ORDER BY 1 LIMIT 200`,
    prisma.$queryRaw<Array<{ v: string }>>`SELECT DISTINCT "action" AS v FROM "AdminAuditLog" ORDER BY 1 LIMIT 300`,
  ]);
  return { rows, total: count[0]?.n ?? 0, actors: actors.map((r) => r.v), actions: actions.map((r) => r.v) };
}

/** Entries about one target (the learner page's Activity tab). */
export async function auditFor(targetType: string, targetId: string, limit = 100): Promise<AuditRow[]> {
  try {
    await ensureAuditTable();
    return await prisma.$queryRaw<AuditRow[]>`
      SELECT * FROM "AdminAuditLog" WHERE "targetType" = ${targetType} AND "targetId" = ${targetId}
      ORDER BY "at" DESC LIMIT ${limit}`;
  } catch (err) {
    console.error("[audit] read", err);
    return [];
  }
}

function cell(v: unknown): string {
  let s = v == null ? "" : typeof v === "string" ? v : v instanceof Date ? v.toISOString() : JSON.stringify(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

/** CSV of every entry matching the filters (capped at 50,000 rows). */
export async function auditCsv(f: AuditFilters): Promise<string> {
  await ensureAuditTable();
  const rows = await prisma.$queryRaw<AuditRow[]>`
    SELECT * FROM "AdminAuditLog" WHERE ${where(f)} ORDER BY "at" DESC LIMIT 50000`;
  const head = ["Time (UTC)", "Actor email", "Actor name", "Role", "Action", "Target type", "Target id", "Target", "Details"];
  const lines = [head.map(cell).join(",")];
  for (const r of rows) {
    lines.push([r.at, r.actorEmail, r.actorName, r.actorRole, r.action, r.targetType, r.targetId, r.targetLabel, r.meta].map(cell).join(","));
  }
  return "﻿" + lines.join("\r\n") + "\r\n";
}
