// A staff member's live access, read on every staff request (lib/auth.ts jwt
// callback and proxy.ts), so a role change, an override, a deactivation or a
// forced sign-out applies on that person's next request.
//
// Cached for a few seconds per process (a page render resolves the session
// several times), on globalThis so the proxy bundle and the app bundle share
// one cache; every change made through Team & Roles drops the entry at once.
// Another instance sees the change within STATE_TTL_MS.
import prisma from "@/lib/prisma";
import { ensureTeamAccessTables } from "./db";
import {
  ADMIN_ROLE_ID,
  NO_ROLE_ID,
  PRESET_ROLES,
  cleanAccess,
  effectiveAccess,
  expandAccess,
  grantsFromLegacy,
  presetRole,
  type Access,
  type RoleDef,
} from "@/lib/admin/permissions";

export const STATE_TTL_MS = 3_000;

export interface StaffState {
  active: boolean;
  isAdmin: boolean;
  /** Flat effective list (["*"] for admins). */
  permissions: string[];
  sessionVersion: number;
  roleId: string;
}

type Entry = { at: number; value: StaffState | "gone" };
const g = globalThis as unknown as {
  __tibStaffState?: Map<string, Entry>;
  __tibStaffRoles?: { at: number; roles: RoleDef[] } | null;
};
const cache = (g.__tibStaffState ??= new Map());

/** Forget one person's cached state (after any change to them). */
export function forgetStaffState(id: string): void {
  cache.delete(id);
}

/** Forget everything (after a role definition changes). */
export function forgetAllStaffState(): void {
  cache.clear();
  g.__tibStaffRoles = null;
}

interface AccessRow {
  collaboratorId: string;
  roleId: string;
  grants: unknown;
  revokes: unknown;
  sessionVersion: number;
  inviteNote: string | null;
}

const strings = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);

interface RoleRow {
  id: string;
  name: string;
  description: string | null;
  levels: unknown;
  caps: unknown;
}

export function roleFromRow(r: RoleRow): RoleDef {
  return {
    id: r.id,
    name: r.name,
    description: r.description ?? "",
    preset: false,
    access: cleanAccess({ levels: (r.levels ?? {}) as Access["levels"], caps: strings(r.caps) }),
  };
}

/** Presets plus custom roles (cached briefly). */
export async function allRoles(): Promise<RoleDef[]> {
  const hit = g.__tibStaffRoles;
  if (hit && Date.now() - hit.at < STATE_TTL_MS) return hit.roles;
  await ensureTeamAccessTables();
  const rows = await prisma.$queryRaw<RoleRow[]>`SELECT "id", "name", "description", "levels", "caps" FROM "StaffRole" ORDER BY "name"`;
  const roles = [...PRESET_ROLES, ...rows.map(roleFromRow)];
  g.__tibStaffRoles = { at: Date.now(), roles };
  return roles;
}

export async function roleById(id: string): Promise<RoleDef | null> {
  return presetRole(id) ?? (await allRoles()).find((r) => r.id === id) ?? null;
}

export async function accessRow(id: string): Promise<AccessRow | null> {
  const rows = await prisma.$queryRaw<AccessRow[]>`
    SELECT "collaboratorId", "roleId", "grants", "revokes", "sessionVersion", "inviteNote" FROM "StaffAccess" WHERE "collaboratorId" = ${id}`;
  return rows[0] ?? null;
}

/**
 * Creates the v2 row for a collaborator from their legacy permissions, so
 * they keep exactly the access they had: admins (or "*") get the Admin role,
 * everyone else "No base role" plus grants equivalent to their old keys.
 * Idempotent (ON CONFLICT DO NOTHING).
 */
export async function migrateLegacy(c: { id: string; isAdmin: boolean; permissions: string[] }): Promise<AccessRow> {
  const admin = c.isAdmin || c.permissions.includes("*");
  const roleId = admin ? ADMIN_ROLE_ID : NO_ROLE_ID;
  const grants = admin ? [] : grantsFromLegacy(c.permissions);
  await prisma.$executeRaw`
    INSERT INTO "StaffAccess" ("collaboratorId", "roleId", "grants", "revokes", "migratedFrom", "updatedBy")
    VALUES (${c.id}, ${roleId}, ${JSON.stringify(grants)}::jsonb, '[]'::jsonb, ${JSON.stringify(c.permissions)}::jsonb, 'legacy-migration')
    ON CONFLICT ("collaboratorId") DO NOTHING`;
  return (await accessRow(c.id)) ?? { collaboratorId: c.id, roleId, grants, revokes: [], sessionVersion: 0, inviteNote: null };
}

/** Migrates every collaborator that has no v2 row yet. Returns how many. */
export async function migrateAllLegacy(): Promise<number> {
  await ensureTeamAccessTables();
  const missing = await prisma.$queryRaw<Array<{ id: string; isAdmin: boolean; permissions: string[] }>>`
    SELECT c."id", c."isAdmin", c."permissions" FROM "Collaborator" c
    LEFT JOIN "StaffAccess" a ON a."collaboratorId" = c."id" WHERE a."collaboratorId" IS NULL`;
  for (const c of missing) await migrateLegacy(c);
  return missing.length;
}

/** Effective access of a person from their role and overrides. */
export async function computeAccess(row: { roleId: string; grants: unknown; revokes: unknown }, isAdminFlag: boolean) {
  const role = (await roleById(row.roleId)) ?? presetRole(NO_ROLE_ID)!;
  const isAdmin = isAdminFlag || !!role.admin;
  const grants = strings(row.grants);
  const revokes = strings(row.revokes);
  const access = isAdmin ? role.access : effectiveAccess(role.access, grants, revokes);
  return { role, isAdmin, grants, revokes, access, permissions: isAdmin ? ["*"] : expandAccess(access) };
}

async function load(id: string): Promise<StaffState | "gone"> {
  const c = await prisma.collaborator.findUnique({ where: { id }, select: { id: true, active: true, isAdmin: true, permissions: true } });
  if (!c) return "gone";
  let row: AccessRow | null = null;
  try {
    await ensureTeamAccessTables();
    row = (await accessRow(id)) ?? (await migrateLegacy(c));
  } catch (err) {
    // Team tables unavailable: fall back to the stored list, as before v2.
    console.error("[team/state] access row", err);
    return { active: c.active, isAdmin: c.isAdmin, permissions: c.isAdmin ? ["*"] : c.permissions, sessionVersion: 0, roleId: "unknown" };
  }
  const eff = await computeAccess(row, c.isAdmin);
  return { active: c.active, isAdmin: eff.isAdmin, permissions: eff.permissions, sessionVersion: row.sessionVersion, roleId: row.roleId };
}

/** Live state, or "gone" (deleted), or null when the database is unreachable. */
export async function staffState(id: string): Promise<StaffState | "gone" | null> {
  const hit = cache.get(id);
  if (hit && Date.now() - hit.at < STATE_TTL_MS) return hit.value;
  try {
    const value = await load(id);
    if (cache.size > 1000) cache.clear();
    cache.set(id, { at: Date.now(), value });
    return value;
  } catch (err) {
    console.error("[team/state]", err);
    return null;
  }
}

/**
 * Writes the effective list (and admin flag, role id) onto the Collaborator
 * row, for the code that reads collaborators directly (Command Center
 * assignee lists, finance approvers), then drops the cached state.
 */
export async function materialize(id: string): Promise<void> {
  const row = await accessRow(id);
  if (!row) return;
  const eff = await computeAccess(row, false);
  await prisma.collaborator.update({
    where: { id },
    data: { permissions: eff.permissions, isAdmin: eff.isAdmin, role: row.roleId.slice(0, 60) },
  });
  forgetStaffState(id);
}

/** Re-materialises everyone holding a role (after the role changed). */
export async function materializeRole(roleId: string): Promise<void> {
  g.__tibStaffRoles = null;
  const rows = await prisma.$queryRaw<Array<{ collaboratorId: string }>>`SELECT "collaboratorId" FROM "StaffAccess" WHERE "roleId" = ${roleId}`;
  for (const r of rows) await materialize(r.collaboratorId);
  forgetAllStaffState();
}
