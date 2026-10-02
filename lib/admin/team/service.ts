// Team & Roles: every change to staff access goes through here, so the rules
// live in one place and are enforced on the server whatever the screen sends.
//
//   - The owner (OWNER_EMAIL, "Super Admin") is not a collaborator row and
//     can never be edited, deactivated, demoted or invited, by anyone.
//   - Changing staff needs team:manage (admins have it; only the owner can
//     grant it to anyone else).
//   - Only the owner creates, edits, removes or signs out Admins, assigns the
//     Admin role, or grants anything in the Team & Roles area.
//   - A non-owner never hands out more than they hold themselves, and never
//     changes their own access or anyone holding team:manage.
//   - Every change is audited (before and after) and the owner is emailed.
import { createHash, randomBytes } from "crypto";
import type { Session } from "next-auth";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { OWNER_EMAIL } from "@/lib/auth";
import { audit } from "@/lib/admin/audit";
import {
  ADMIN_ROLE_ID,
  FEATURE_KEYS,
  LEVELS,
  NO_ROLE_ID,
  PRESET_ROLES,
  can,
  cleanAccess,
  effectiveAccess,
  levelOf,
  presetRole,
  RANKS,
  validGrant,
  validRevoke,
  withinActor,
  type Access,
  type Level,
  type RoleDef,
} from "@/lib/admin/permissions";
import { ensureTeamAccessTables } from "./db";
import { accessRow, allRoles, computeAccess, forgetAllStaffState, forgetStaffState, materialize, materializeRole, migrateAllLegacy, roleById } from "./state";
import { recordStaffEvent } from "./footprint";
import { sendOwnerAlert } from "./alerts";

export class TeamError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

type Actor = Session["user"];

export const hashInviteToken = (t: string) => createHash("sha256").update(t).digest("hex");

function actorLabel(a: Actor): string {
  return a.isOwner ? "the owner" : a.name || a.email;
}

// ── Schemas ─────────────────────────────────────────────────────────────────

const Entry = z.string().trim().min(3).max(60);
export const Overrides = z.object({
  grants: z.array(Entry).max(80).default([]),
  revokes: z.array(Entry).max(80).default([]),
});

const RoleId = z.string().trim().min(2).max(60).regex(/^[a-z0-9_-]+$/);

export const InviteBody = z.object({
  emails: z.array(z.string().trim().toLowerCase().email("Enter valid email addresses").max(320)).min(1, "Add at least one email").max(50, "Invite at most 50 people at once"),
  name: z.string().trim().max(100).optional(),
  roleId: RoleId,
  grants: z.array(Entry).max(80).default([]),
  revokes: z.array(Entry).max(80).default([]),
  note: z.string().trim().max(1000).optional().default(""),
  expiryDays: z.number().int().min(1).max(30).optional().default(7),
});

export const MemberPatch = z
  .object({
    name: z.string().trim().min(1).max(100).optional(),
    roleId: RoleId.optional(),
    grants: z.array(Entry).max(80).optional(),
    revokes: z.array(Entry).max(80).optional(),
    active: z.boolean().optional(),
  })
  .strict();

const LevelMap = z.record(z.string().max(40), z.enum(LEVELS as [Level, ...Level[]]));
export const RoleBody = z.object({
  name: z.string().trim().min(2, "Give the role a name").max(60),
  description: z.string().trim().max(300).optional().default(""),
  levels: LevelMap.default({}),
  caps: z.array(z.string().max(40)).max(40).default([]),
});

// ── Guards ──────────────────────────────────────────────────────────────────

export function canManageTeam(a: Actor | undefined | null): boolean {
  return !!a && can(a, "team:manage");
}

function requireManage(a: Actor) {
  if (!canManageTeam(a)) throw new TeamError("You do not have permission to change the team.", 403);
}

function cleanOverrides(grants: string[], revokes: string[]) {
  const g = [...new Set(grants)];
  const r = [...new Set(revokes)];
  const badG = g.find((x) => !validGrant(x));
  if (badG) throw new TeamError(`Unknown permission "${badG}".`);
  const badR = r.find((x) => !validRevoke(x));
  if (badR) throw new TeamError(`Unknown permission "${badR}".`);
  return { grants: g.sort(), revokes: r.sort() };
}

const touchesTeam = (a: Access) => levelOf(a, "team") !== "none";

/**
 * The checks on the access an actor wants to give someone: the Admin role
 * and Team & Roles management are the owner's to give, and a non-owner
 * never gives more than they hold: every level raised and every capability
 * added (compared with `before`, the person's current access) must be one
 * the actor has. Lowering or removing access is always allowed.
 */
function checkGrantable(actor: Actor, role: RoleDef, grants: string[], revokes: string[], before: Access = { levels: {}, caps: [] }) {
  if (actor.isOwner) return;
  if (role.admin) throw new TeamError("Only the owner can make someone an Admin.", 403);
  const eff = effectiveAccess(role.access, grants, revokes);
  if (levelOf(eff, "team") === "manage" && levelOf(before, "team") !== "manage") throw new TeamError("Only the owner can grant Team & Roles management.", 403);
  const raised: Access = { levels: {}, caps: eff.caps.filter((c) => !before.caps.includes(c)) };
  for (const [k, l] of Object.entries(eff.levels)) if (RANKS[l] > RANKS[levelOf(before, k)]) raised.levels[k] = l;
  if (!withinActor(actor, raised)) throw new TeamError("You can only give access you have yourself.", 403);
}

interface Target {
  id: string;
  email: string;
  name: string;
  isAdmin: boolean;
  active: boolean;
  passwordHash: string | null;
  inviteToken: string | null;
  inviteExpires: Date | null;
}

async function loadTarget(id: string): Promise<Target> {
  if (id === "owner") throw new TeamError("The owner account is locked. Nobody can change it.", 403);
  if (!/^[\w-]{1,64}$/.test(id)) throw new TeamError("Team member not found.", 404);
  const t = await prisma.collaborator.findUnique({
    where: { id },
    select: { id: true, email: true, name: true, isAdmin: true, active: true, passwordHash: true, inviteToken: true, inviteExpires: true },
  });
  if (!t) throw new TeamError("Team member not found.", 404);
  if (t.email.toLowerCase() === OWNER_EMAIL.toLowerCase()) throw new TeamError("The owner account is locked. Nobody can change it.", 403);
  return t;
}

/** May this actor change this person at all? */
async function checkTarget(actor: Actor, t: Target) {
  requireManage(actor);
  if (actor.isOwner) return;
  if (actor.collaboratorId === t.id) throw new TeamError("You cannot change your own access. Ask the owner.", 403);
  const row = await accessRow(t.id);
  const eff = row ? await computeAccess(row, t.isAdmin) : null;
  if (t.isAdmin || eff?.isAdmin) throw new TeamError("Only the owner can change an Admin.", 403);
  if (eff && levelOf(eff.access, "team") === "manage") throw new TeamError("Only the owner can change someone who manages the team.", 403);
}

// ── Reading ─────────────────────────────────────────────────────────────────

export type MemberStatus = "active" | "invited" | "expired" | "deactivated";

export interface MemberView {
  id: string;
  name: string;
  email: string;
  roleId: string;
  roleName: string;
  isAdmin: boolean;
  status: MemberStatus;
  grants: string[];
  revokes: string[];
  inviteNote: string | null;
  invitedBy: string;
  inviteExpires: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  permissions: string[];
  /** Whether the viewer may change this person. */
  editable: boolean;
}

export async function listMembers(viewer: Actor): Promise<MemberView[]> {
  await ensureTeamAccessTables();
  await migrateAllLegacy();
  const [collabs, rows, roles] = await Promise.all([
    prisma.collaborator.findMany({
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true, email: true, isAdmin: true, active: true, passwordHash: true, inviteExpires: true, invitedBy: true, lastLoginAt: true, createdAt: true },
    }),
    prisma.$queryRaw<Array<{ collaboratorId: string; roleId: string; grants: unknown; revokes: unknown; sessionVersion: number; inviteNote: string | null }>>`
      SELECT "collaboratorId", "roleId", "grants", "revokes", "sessionVersion", "inviteNote" FROM "StaffAccess"`,
    allRoles(),
  ]);
  const byId = new Map(rows.map((r) => [r.collaboratorId, r]));
  const out: MemberView[] = [];
  for (const c of collabs) {
    const row = byId.get(c.id) ?? { roleId: NO_ROLE_ID, grants: [], revokes: [], sessionVersion: 0, inviteNote: null };
    const eff = await computeAccess(row, c.isAdmin);
    const status: MemberStatus = !c.active
      ? "deactivated"
      : !c.passwordHash
        ? c.inviteExpires && c.inviteExpires < new Date()
          ? "expired"
          : "invited"
        : "active";
    const managesTeam = !eff.isAdmin && levelOf(eff.access, "team") === "manage";
    const editable =
      canManageTeam(viewer) && (viewer.isOwner || (!eff.isAdmin && !managesTeam && viewer.collaboratorId !== c.id));
    out.push({
      id: c.id,
      name: c.name,
      email: c.email,
      roleId: row.roleId,
      roleName: roles.find((r) => r.id === row.roleId)?.name ?? "Unknown role",
      isAdmin: eff.isAdmin,
      status,
      grants: eff.grants,
      revokes: eff.revokes,
      inviteNote: row.inviteNote,
      invitedBy: c.invitedBy,
      inviteExpires: c.inviteExpires?.toISOString() ?? null,
      lastLoginAt: c.lastLoginAt?.toISOString() ?? null,
      createdAt: c.createdAt.toISOString(),
      permissions: eff.permissions,
      editable,
    });
  }
  return out;
}

export async function rolesWithUsage(): Promise<Array<RoleDef & { members: Array<{ id: string; name: string; email: string }> }>> {
  await ensureTeamAccessTables();
  const roles = await allRoles();
  const rows = await prisma.$queryRaw<Array<{ roleId: string; id: string; name: string; email: string }>>`
    SELECT a."roleId", c."id", c."name", c."email" FROM "StaffAccess" a JOIN "Collaborator" c ON c."id" = a."collaboratorId" ORDER BY c."name"`;
  return roles.map((r) => ({ ...r, members: rows.filter((x) => x.roleId === r.id).map(({ id, name, email }) => ({ id, name, email })) }));
}

// ── Invites ─────────────────────────────────────────────────────────────────

function nameFromEmail(email: string): string {
  const local = email.split("@")[0].replace(/[._-]+/g, " ").trim();
  return (local ? local.replace(/\b\w/g, (c) => c.toUpperCase()) : email).slice(0, 100);
}

function appUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "https://tiblogics.com").replace(/\/$/, "");
}

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#x27;" })[c]!);
}

async function sendInviteEmail(p: { to: string; name: string; inviter: string; roleName: string; note: string; url: string; days: number; reminder?: boolean }) {
  const { default: mailer } = await import("@/lib/resend");
  const note = p.note
    ? `<div style="margin:20px 0;padding:14px 16px;background:#F1F4F9;border-left:3px solid #F47C20;border-radius:8px;color:#3A4A5C;font-size:14px;line-height:1.6;white-space:pre-line;"><strong style="color:#0D1B2A;">A note from ${esc(p.inviter)}:</strong><br>${esc(p.note)}</div>`
    : "";
  await mailer.emails.send({
    to: p.to,
    subject: p.reminder ? "Reminder: your invitation to the TIBLOGICS admin" : `${p.inviter} invited you to the TIBLOGICS admin`,
    html: `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#F4F7FB;font-family:Arial,sans-serif;">
  <div style="max-width:560px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #E3E9F1;">
    <div style="background:linear-gradient(135deg,#1B3A6B,#2251A3);padding:28px;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:24px;">TIB<span style="color:#F47C20;">LOGICS</span></h1>
      <p style="color:#C9D6EA;margin:6px 0 0;font-size:13px;">Admin team invitation</p>
    </div>
    <div style="padding:28px 32px;">
      <h2 style="color:#0D1B2A;margin:0 0 12px;font-size:20px;">Hi ${esc(p.name)},</h2>
      <p style="color:#3A4A5C;line-height:1.7;font-size:15px;margin:0;">${esc(p.inviter)} invited you to join the TIBLOGICS admin team as <strong>${esc(p.roleName)}</strong>. Set your password to get started.</p>
      ${note}
      <div style="margin:26px 0;text-align:center;">
        <a href="${p.url}" style="display:inline-block;background:#B8500A;color:#fff;text-decoration:none;padding:14px 32px;border-radius:12px;font-size:15px;font-weight:700;">Accept invitation</a>
      </div>
      <p style="color:#5A6E84;font-size:13px;line-height:1.6;margin:0;">This link works once and expires in ${p.days} day${p.days === 1 ? "" : "s"}. If you did not expect this invitation, ignore this email.</p>
    </div>
    <div style="padding:16px 32px;background:#F6F8FB;color:#5A6E84;font-size:12px;">TIBLOGICS · info@tiblogics.com · tiblogics.com</div>
  </div>
</body></html>`,
  });
}

export interface InviteResult {
  email: string;
  ok: boolean;
  id?: string;
  error?: string;
  inviteUrl?: string;
}

export async function inviteMembers(actor: Actor, raw: unknown): Promise<InviteResult[]> {
  requireManage(actor);
  const body = InviteBody.parse(raw);
  await ensureTeamAccessTables();
  const role = await roleById(body.roleId);
  if (!role) throw new TeamError("That role does not exist.");
  const { grants, revokes } = cleanOverrides(body.grants, body.revokes);
  checkGrantable(actor, role, grants, revokes);
  const roleRow = { roleId: role.id, grants, revokes };
  const eff = await computeAccess(roleRow, false);

  const results: InviteResult[] = [];
  const emails = [...new Set(body.emails)];
  for (const email of emails) {
    if (email === OWNER_EMAIL.toLowerCase()) {
      results.push({ email, ok: false, error: "This is the owner's address." });
      continue;
    }
    const existing = await prisma.collaborator.findUnique({ where: { email }, select: { id: true } });
    if (existing) {
      results.push({ email, ok: false, error: "Already on the team." });
      continue;
    }
    const token = randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + body.expiryDays * 86_400_000);
    const name = emails.length === 1 && body.name ? body.name : nameFromEmail(email);
    // One transaction: the legacy migration (which hashes tokens of rows
    // without an access row) can never see the collaborator without its row.
    const c = await prisma.$transaction(async (tx) => {
      const created = await tx.collaborator.create({
        data: {
          name,
          email,
          role: role.id,
          permissions: eff.permissions,
          isAdmin: eff.isAdmin,
          active: true,
          inviteToken: hashInviteToken(token),
          inviteExpires: expires,
          invitedBy: actor.email,
        },
      });
      await tx.$executeRaw`
        INSERT INTO "StaffAccess" ("collaboratorId", "roleId", "grants", "revokes", "inviteNote", "updatedBy")
        VALUES (${created.id}, ${role.id}, ${JSON.stringify(grants)}::jsonb, ${JSON.stringify(revokes)}::jsonb, ${body.note || null}, ${actor.email})`;
      return created;
    });
    const url = `${appUrl()}/admin_pro/accept-invite?token=${token}`;
    try {
      await sendInviteEmail({ to: email, name, inviter: actor.isOwner ? `${actor.name || "The owner"} (owner)` : actor.name || actor.email, roleName: role.name, note: body.note, url, days: body.expiryDays });
    } catch (err) {
      console.error("[team/invite] email", err instanceof Error ? err.message : err);
    }
    await audit(auditActor(actor), "team.invite", { type: "collaborator", id: c.id, label: email }, {
      role: role.id,
      grants,
      revokes,
      expiresInDays: body.expiryDays,
      note: body.note ? true : false,
    });
    results.push({ email, ok: true, id: c.id, inviteUrl: url });
  }
  const sent = results.filter((r) => r.ok);
  if (sent.length) {
    void sendOwnerAlert("access_change", `${actorLabel(actor)} invited ${sent.length} staff member${sent.length === 1 ? "" : "s"}.`, [
      ["Invited", sent.map((r) => r.email).join(", ")],
      ["Role", role.name],
      ["Extra access", grants.join(", ") || null],
      ["Removed access", revokes.join(", ") || null],
      ["By", actor.email],
    ]);
  }
  return results;
}

function actorRole(a: Actor): string {
  return a.isOwner ? "owner" : a.isAdmin ? "admin" : "collaborator";
}

function auditActor(a: Actor) {
  return { email: a.email, name: a.name, role: actorRole(a) };
}

/**
 * Pending member: a fresh single-use invitation link (new expiry).
 * Accepted member: a single-use link to set a new password (24 hours).
 */
export async function resendInvite(actor: Actor, id: string, expiryDays = 7) {
  const t = await loadTarget(id);
  await checkTarget(actor, t);
  const reset = !!t.passwordHash;
  const token = randomBytes(32).toString("hex");
  const days = reset ? 1 : expiryDays;
  const expires = new Date(Date.now() + days * 86_400_000);
  await prisma.collaborator.update({ where: { id }, data: { inviteToken: hashInviteToken(token), inviteExpires: expires, ...(reset ? {} : { active: true }) } });
  const row = await accessRow(id);
  const role = (row && (await roleById(row.roleId))) ?? presetRole(NO_ROLE_ID)!;
  const url = `${appUrl()}/admin_pro/accept-invite?token=${token}${reset ? "&reset=1" : ""}`;
  const inviter = actor.isOwner ? `${actor.name || "The owner"} (owner)` : actor.name || actor.email;
  try {
    if (reset) await sendResetEmail({ to: t.email, name: t.name, inviter, url });
    else await sendInviteEmail({ to: t.email, name: t.name, inviter, roleName: role.name, note: row?.inviteNote ?? "", url, days, reminder: true });
  } catch (err) {
    console.error("[team/resend] email", err instanceof Error ? err.message : err);
  }
  await audit(auditActor(actor), reset ? "team.password_reset" : "team.invite_resend", { type: "collaborator", id, label: t.email }, { expiresInDays: days });
  return { inviteUrl: url, reset };
}

async function sendResetEmail(p: { to: string; name: string; inviter: string; url: string }) {
  const { default: mailer } = await import("@/lib/resend");
  await mailer.emails.send({
    to: p.to,
    subject: "Set a new password for the TIBLOGICS admin",
    html: `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#F4F7FB;font-family:Arial,sans-serif;">
  <div style="max-width:560px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #E3E9F1;">
    <div style="background:linear-gradient(135deg,#1B3A6B,#2251A3);padding:28px;text-align:center;"><h1 style="color:#fff;margin:0;font-size:24px;">TIB<span style="color:#F47C20;">LOGICS</span></h1></div>
    <div style="padding:28px 32px;">
      <h2 style="color:#0D1B2A;margin:0 0 12px;font-size:20px;">Hi ${esc(p.name)},</h2>
      <p style="color:#3A4A5C;line-height:1.7;font-size:15px;margin:0;">${esc(p.inviter)} sent you a link to set a new password for the TIBLOGICS admin.</p>
      <div style="margin:26px 0;text-align:center;"><a href="${p.url}" style="display:inline-block;background:#B8500A;color:#fff;text-decoration:none;padding:14px 32px;border-radius:12px;font-size:15px;font-weight:700;">Set a new password</a></div>
      <p style="color:#5A6E84;font-size:13px;line-height:1.6;margin:0;">This link works once and expires in 24 hours. If you did not ask for this, tell the owner.</p>
    </div>
  </div>
</body></html>`,
  });
}

/** Withdraws a pending invitation (the pending member is removed). */
export async function revokeInvite(actor: Actor, id: string) {
  const t = await loadTarget(id);
  await checkTarget(actor, t);
  if (t.passwordHash) throw new TeamError("This person already accepted. Deactivate them instead.");
  await prisma.collaborator.delete({ where: { id } });
  forgetStaffState(id);
  await audit(auditActor(actor), "team.invite_revoke", { type: "collaborator", id, label: t.email });
}

// ── Accepting ───────────────────────────────────────────────────────────────

export const AcceptBody = z.object({
  token: z.string().trim().min(16).max(200),
  name: z.string().trim().min(1, "Enter your name").max(100).optional(),
  password: z.string().min(10, "Use at least 10 characters").max(200),
});

/** Looks up a pending invitation by its token (only the SHA-256 is stored). */
export async function findInvite(token: string) {
  if (!/^[a-f0-9]{16,200}$/i.test(token)) return null;
  // Pre-v2 invitations are hashed in place by migrateAllLegacy.
  await migrateAllLegacy().catch(() => 0);
  return prisma.collaborator.findUnique({ where: { inviteToken: hashInviteToken(token) } });
}

// ── Changing a member ───────────────────────────────────────────────────────

export async function updateMember(actor: Actor, id: string, raw: unknown) {
  const body = MemberPatch.parse(raw);
  const t = await loadTarget(id);
  await checkTarget(actor, t);
  await ensureTeamAccessTables();
  const before = (await accessRow(id)) ?? null;
  const beforeEff = before ? await computeAccess(before, t.isAdmin) : null;
  const roleId = body.roleId ?? before?.roleId ?? NO_ROLE_ID;
  const role = await roleById(roleId);
  if (!role) throw new TeamError("That role does not exist.");
  const accessChanged = body.roleId !== undefined || body.grants !== undefined || body.revokes !== undefined;
  const { grants, revokes } = cleanOverrides(body.grants ?? beforeEff?.grants ?? [], body.revokes ?? beforeEff?.revokes ?? []);
  if (accessChanged) {
    checkGrantable(actor, role, grants, revokes, beforeEff && !beforeEff.isAdmin ? beforeEff.access : { levels: {}, caps: [] });
    // Demoting an Admin is the owner's call too (checkTarget already refuses
    // non-owners on Admins; this covers the owner making the change).
    await prisma.$executeRaw`
      INSERT INTO "StaffAccess" ("collaboratorId", "roleId", "grants", "revokes", "updatedBy", "updatedAt")
      VALUES (${id}, ${role.id}, ${JSON.stringify(grants)}::jsonb, ${JSON.stringify(revokes)}::jsonb, ${actor.email}, NOW())
      ON CONFLICT ("collaboratorId") DO UPDATE SET "roleId" = EXCLUDED."roleId", "grants" = EXCLUDED."grants", "revokes" = EXCLUDED."revokes",
        "updatedBy" = EXCLUDED."updatedBy", "updatedAt" = NOW()`;
  }
  const data: { name?: string; active?: boolean } = {};
  if (body.name !== undefined) data.name = body.name;
  if (body.active !== undefined) data.active = body.active;
  if (Object.keys(data).length) await prisma.collaborator.update({ where: { id }, data });
  if (body.active === false) await bumpSessionVersion(id);
  await materialize(id);
  forgetStaffState(id);

  const after = await accessRow(id);
  const afterEff = after ? await computeAccess(after, false) : null;
  const meta: Record<string, unknown> = {};
  if (body.name !== undefined && body.name !== t.name) meta.name = { before: t.name, after: body.name };
  if (body.active !== undefined && body.active !== t.active) meta.active = { before: t.active, after: body.active };
  if (accessChanged) {
    if (before?.roleId !== role.id) meta.role = { before: before?.roleId ?? null, after: role.id };
    const added = (afterEff?.permissions ?? []).filter((p) => !(beforeEff?.permissions ?? []).includes(p) && !p.includes(":view") && p !== "*");
    const removed = (beforeEff?.permissions ?? []).filter((p) => !(afterEff?.permissions ?? []).includes(p) && !p.includes(":view") && p !== "*");
    meta.grants = grants;
    meta.revokes = revokes;
    if (added.length) meta.added = added;
    if (removed.length) meta.removed = removed;
  }
  const action = body.active === false ? "team.deactivate" : body.active === true && !t.active ? "team.reactivate" : accessChanged ? "team.access_change" : "team.update";
  await audit(auditActor(actor), action, { type: "collaborator", id, label: t.email }, meta);
  if (accessChanged || body.active !== undefined) {
    void sendOwnerAlert(
      "access_change",
      action === "team.deactivate"
        ? `${actorLabel(actor)} deactivated ${t.name}.`
        : action === "team.reactivate"
          ? `${actorLabel(actor)} reactivated ${t.name}.`
          : `${actorLabel(actor)} changed what ${t.name} can access.`,
      [
        ["Staff member", `${t.name} <${t.email}>`],
        ["Role", meta.role ? `${(meta.role as { before: string }).before ?? "none"} → ${role.id}` : role.name],
        ["Added", ((meta.added as string[] | undefined) ?? []).join(", ") || null],
        ["Removed", ((meta.removed as string[] | undefined) ?? []).join(", ") || null],
        ["By", actor.email],
      ],
    );
  }
  return { ok: true };
}

export async function bumpSessionVersion(id: string) {
  await prisma.$executeRaw`
    INSERT INTO "StaffAccess" ("collaboratorId", "sessionVersion") VALUES (${id}, 1)
    ON CONFLICT ("collaboratorId") DO UPDATE SET "sessionVersion" = "StaffAccess"."sessionVersion" + 1`;
  forgetStaffState(id);
}

export async function forceSignOut(actor: Actor, id: string) {
  const t = await loadTarget(id);
  await checkTarget(actor, t);
  await bumpSessionVersion(id);
  await recordStaffEvent({ staffId: id, email: t.email, kind: "signout_forced", meta: { by: actor.email } });
  await audit(auditActor(actor), "team.signout", { type: "collaborator", id, label: t.email });
}

export async function deleteMember(actor: Actor, id: string) {
  const t = await loadTarget(id);
  await checkTarget(actor, t);
  const before = await accessRow(id);
  await prisma.collaborator.delete({ where: { id } });
  forgetStaffState(id);
  await audit(auditActor(actor), "team.delete", { type: "collaborator", id, label: t.email }, { role: before?.roleId ?? null, name: t.name });
  void sendOwnerAlert("access_change", `${actorLabel(actor)} removed ${t.name} from the team.`, [
    ["Staff member", `${t.name} <${t.email}>`],
    ["By", actor.email],
  ]);
}

// ── Roles ───────────────────────────────────────────────────────────────────

function slug(name: string): string {
  return (
    "r_" +
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "")
      .slice(0, 40) +
    "_" +
    randomBytes(3).toString("hex")
  );
}

function roleAccess(body: z.infer<typeof RoleBody>): Access {
  for (const k of Object.keys(body.levels)) if (!FEATURE_KEYS.has(k)) throw new TeamError(`Unknown feature "${k}".`);
  return cleanAccess({ levels: body.levels, caps: body.caps });
}

function checkRoleGrantable(actor: Actor, access: Access) {
  if (actor.isOwner) return;
  if (touchesTeam(access) && levelOf(access, "team") === "manage") throw new TeamError("Only the owner can include Team & Roles management in a role.", 403);
  if (!withinActor(actor, access)) throw new TeamError("A role can only include access you have yourself.", 403);
}

async function nameTaken(name: string, exceptId?: string): Promise<boolean> {
  if (PRESET_ROLES.some((r) => r.name.toLowerCase() === name.toLowerCase())) return true;
  const rows = await prisma.$queryRaw<Array<{ id: string }>>`SELECT "id" FROM "StaffRole" WHERE lower("name") = lower(${name})`;
  return rows.some((r) => r.id !== exceptId);
}

/** A non-owner cannot change, through a role, someone who manages the team. */
async function refuseIfManagersHold(ids: string[]) {
  for (const id of ids) {
    const row = await accessRow(id);
    if (!row) continue;
    const eff = await computeAccess(row, false);
    if (eff.isAdmin || levelOf(eff.access, "team") === "manage") throw new TeamError("Someone who manages the team has this role. Only the owner can change it.", 403);
  }
}

export async function createRole(actor: Actor, raw: unknown) {
  requireManage(actor);
  const body = RoleBody.parse(raw);
  await ensureTeamAccessTables();
  const access = roleAccess(body);
  checkRoleGrantable(actor, access);
  if (await nameTaken(body.name)) throw new TeamError("A role with this name already exists.", 409);
  const id = slug(body.name);
  await prisma.$executeRaw`
    INSERT INTO "StaffRole" ("id", "name", "description", "levels", "caps", "createdBy")
    VALUES (${id}, ${body.name}, ${body.description || null}, ${JSON.stringify(access.levels)}::jsonb, ${JSON.stringify(access.caps)}::jsonb, ${actor.email})`;
  forgetAllStaffState();
  await audit(auditActor(actor), "team.role_create", { type: "role", id, label: body.name }, { levels: access.levels, caps: access.caps });
  return { id };
}

export async function updateRole(actor: Actor, id: string, raw: unknown) {
  requireManage(actor);
  if (presetRole(id)) throw new TeamError("Preset roles cannot be edited. Duplicate it to make your own.", 400);
  const body = RoleBody.parse(raw);
  await ensureTeamAccessTables();
  const existing = (await allRoles()).find((r) => r.id === id);
  if (!existing) throw new TeamError("Role not found.", 404);
  const access = roleAccess(body);
  checkRoleGrantable(actor, access);
  // A non-owner cannot change a role held by someone they could not edit.
  if (!actor.isOwner) {
    const holders = await prisma.$queryRaw<Array<{ id: string }>>`SELECT "collaboratorId" AS id FROM "StaffAccess" WHERE "roleId" = ${id}`;
    if (holders.some((h) => h.id === actor.collaboratorId)) throw new TeamError("You cannot change the role you hold yourself. Ask the owner.", 403);
    if (levelOf(existing.access, "team") === "manage") throw new TeamError("Only the owner can change this role.", 403);
    await refuseIfManagersHold(holders.map((h) => h.id));
  }
  if (await nameTaken(body.name, id)) throw new TeamError("A role with this name already exists.", 409);
  await prisma.$executeRaw`
    UPDATE "StaffRole" SET "name" = ${body.name}, "description" = ${body.description || null}, "levels" = ${JSON.stringify(access.levels)}::jsonb,
      "caps" = ${JSON.stringify(access.caps)}::jsonb, "updatedAt" = NOW() WHERE "id" = ${id}`;
  await materializeRole(id);
  await audit(auditActor(actor), "team.role_update", { type: "role", id, label: body.name }, {
    before: { levels: existing.access.levels, caps: existing.access.caps },
    after: { levels: access.levels, caps: access.caps },
  });
  void sendOwnerAlert("access_change", `${actorLabel(actor)} changed the role "${body.name}".`, [
    ["Role", body.name],
    ["By", actor.email],
  ]);
  return { ok: true };
}

export async function deleteRole(actor: Actor, id: string, reassignTo?: string | null) {
  requireManage(actor);
  if (presetRole(id)) throw new TeamError("Preset roles cannot be deleted.", 400);
  await ensureTeamAccessTables();
  const existing = (await allRoles()).find((r) => r.id === id);
  if (!existing) throw new TeamError("Role not found.", 404);
  if (!actor.isOwner && levelOf(existing.access, "team") === "manage") throw new TeamError("Only the owner can delete this role.", 403);
  const holders = await prisma.$queryRaw<Array<{ id: string }>>`SELECT "collaboratorId" AS id FROM "StaffAccess" WHERE "roleId" = ${id}`;
  if (holders.length) {
    if (!reassignTo) throw new TeamError(`${holders.length} team member${holders.length === 1 ? " has" : "s have"} this role. Choose a role to move them to.`, 409);
    if (reassignTo === id) throw new TeamError("Choose a different role.");
    const target = await roleById(reassignTo);
    if (!target) throw new TeamError("That role does not exist.");
    if (!actor.isOwner) {
      await refuseIfManagersHold(holders.map((h) => h.id));
      if (target.admin) throw new TeamError("Only the owner can make someone an Admin.", 403);
      if (holders.some((h) => h.id === actor.collaboratorId)) throw new TeamError("You cannot change your own role. Ask the owner.", 403);
      checkRoleGrantable(actor, target.access);
    }
    await prisma.$executeRaw`UPDATE "StaffAccess" SET "roleId" = ${target.id}, "updatedBy" = ${actor.email}, "updatedAt" = NOW() WHERE "roleId" = ${id}`;
  }
  await prisma.$executeRaw`DELETE FROM "StaffRole" WHERE "id" = ${id}`;
  forgetAllStaffState();
  for (const h of holders) await materialize(h.id);
  await audit(auditActor(actor), "team.role_delete", { type: "role", id, label: existing.name }, { reassignedTo: reassignTo ?? null, members: holders.length });
  if (holders.length) {
    void sendOwnerAlert("access_change", `${actorLabel(actor)} deleted the role "${existing.name}" and moved ${holders.length} member(s) to another role.`, [
      ["Moved to", reassignTo ?? null],
      ["By", actor.email],
    ]);
  }
  return { ok: true };
}

export { ADMIN_ROLE_ID };
