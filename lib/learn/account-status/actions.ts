// Admin actions on one ARFA learner account. Called by
// app/api/admin/learn/learners/[id]/actions (single) and .../bulk (many),
// after the owner/admin check. Every action writes an audit entry; none
// returns a password hash or token (the temporary password is returned once,
// in clear, to the admin who set it, and only its bcrypt hash is stored).
import { createHash, randomBytes, randomInt, randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import type { Session } from "next-auth";
import prisma from "@/lib/prisma";
import { OWNER_EMAIL } from "@/lib/auth";
import { clearRateLimit } from "@/lib/rate-limit";
import { audit } from "@/lib/admin/audit";
import { sendPasswordResetEmail } from "@/lib/learn/emails";
import { COMP_STATUS } from "@/lib/admin/test-access";
import { ensureAccountTables } from "./db";
import { emailHash, readAccountState } from "./index";
import { sendEmailChangedEmails } from "./emails";
import { normaliseTag } from "@/lib/learn/admin/learners";

export class ActionError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export interface ActionResult {
  ok: true;
  message: string;
  /** Shown once to the admin (temporary password only). */
  secret?: string;
}

type Student = { id: string; email: string; name: string; locale: string };

const RESET_TTL_MS = 60 * 60 * 1000;

async function loadStudent(id: string): Promise<Student> {
  const s = await prisma.student.findUnique({ where: { id }, select: { id: true, email: true, name: true, locale: true } });
  if (!s) throw new ActionError(404, "Learner not found");
  return s;
}

const isOwner = (s: Student) => s.email.toLowerCase() === OWNER_EMAIL.toLowerCase();

function protectOwner(s: Student, what: string) {
  if (isOwner(s)) throw new ActionError(409, `The owner's own learner account cannot be ${what}.`);
}

async function upsertAccount(studentId: string, data: Record<string, unknown>) {
  await ensureAccountTables();
  await prisma.learnerAccount.upsert({
    where: { studentId },
    create: { studentId, ...data, updatedAt: new Date() },
    update: { ...data, updatedAt: new Date() },
  });
}

const target = (s: Student) => ({ type: "learner", id: s.id, label: s.email });

const by = (session: Session) => session.user.email ?? "admin";

// ── Status ─────────────────────────────────────────────────────────────────

export async function suspend(session: Session, id: string, reason: string, until: Date | null): Promise<ActionResult> {
  const s = await loadStudent(id);
  protectOwner(s, "suspended");
  const state = await readAccountState(id);
  if (state.status === "blocked" || state.status === "deleted") throw new ActionError(409, `This account is ${state.status}.`);
  if (until && until.getTime() <= Date.now()) throw new ActionError(400, "The end date must be in the future.");
  await upsertAccount(id, {
    status: "suspended",
    suspendedUntil: until,
    statusReason: reason,
    statusChangedAt: new Date(),
    statusChangedBy: by(session),
  });
  await audit(session, "learner.suspend", target(s), { reason, until: until?.toISOString() ?? "indefinite" });
  return { ok: true, message: until ? `Suspended until ${until.toISOString().slice(0, 10)}` : "Suspended until you lift it" };
}

export async function unsuspend(session: Session, id: string, reason: string): Promise<ActionResult> {
  const s = await loadStudent(id);
  const state = await readAccountState(id);
  if (state.status !== "suspended") throw new ActionError(409, "This account is not suspended.");
  await upsertAccount(id, { status: "active", suspendedUntil: null, statusReason: reason || null, statusChangedAt: new Date(), statusChangedBy: by(session) });
  await audit(session, "learner.unsuspend", target(s), { reason: reason || null });
  return { ok: true, message: "Suspension lifted" };
}

export async function block(session: Session, id: string, reason: string): Promise<ActionResult> {
  const s = await loadStudent(id);
  protectOwner(s, "blocked");
  const state = await readAccountState(id);
  if (state.status === "deleted") throw new ActionError(409, "This account is deleted.");
  await upsertAccount(id, {
    status: "blocked",
    suspendedUntil: null,
    statusReason: reason,
    statusChangedAt: new Date(),
    statusChangedBy: by(session),
    sessionVersion: state.sessionVersion + 1,
  });
  await prisma.learnerBlockedEmail.upsert({
    where: { emailHash: emailHash(s.email) },
    create: { emailHash: emailHash(s.email), studentId: s.id, reason, createdBy: by(session) },
    update: { studentId: s.id, reason, createdBy: by(session) },
  });
  await audit(session, "learner.block", target(s), { reason });
  return { ok: true, message: "Blocked. Sign-in and sign-up with this email are refused." };
}

export async function unblock(session: Session, id: string, reason: string): Promise<ActionResult> {
  const s = await loadStudent(id);
  const state = await readAccountState(id);
  if (state.status !== "blocked") throw new ActionError(409, "This account is not blocked.");
  await upsertAccount(id, { status: "active", statusReason: reason || null, statusChangedAt: new Date(), statusChangedBy: by(session) });
  await ensureAccountTables();
  await prisma.learnerBlockedEmail.deleteMany({ where: { OR: [{ studentId: s.id }, { emailHash: emailHash(s.email) }] } });
  await audit(session, "learner.unblock", target(s), { reason: reason || null });
  return { ok: true, message: "Unblocked" };
}

// ── Passwords and sessions ─────────────────────────────────────────────────

/** Same token and email as "Forgot password" (app/api/learn/auth/forgot). */
export async function sendResetLink(session: Session, id: string): Promise<ActionResult> {
  const s = await loadStudent(id);
  const state = await readAccountState(id);
  if (state.status === "deleted") throw new ActionError(409, "This account is deleted.");
  const token = randomBytes(32).toString("base64url");
  await prisma.student.update({
    where: { id },
    data: { resetToken: createHash("sha256").update(token).digest("hex"), resetTokenExpires: new Date(Date.now() + RESET_TTL_MS) },
  });
  try {
    await sendPasswordResetEmail({ email: s.email, name: s.name, token, locale: s.locale });
  } catch (err) {
    console.error("[learner-admin] reset email", err instanceof Error ? err.message : err);
    throw new ActionError(502, "The reset email could not be sent. Check the mail settings and try again.");
  }
  await audit(session, "learner.password.reset_link", target(s), null);
  return { ok: true, message: `Reset link sent to ${s.email} (valid 1 hour)` };
}

// No 0/O, 1/l/I: read aloud or copied from a screen without mistakes.
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";

export function strongPassword(): string {
  const groups: string[] = [];
  for (let g = 0; g < 4; g++) {
    let part = "";
    for (let i = 0; i < 4; i++) part += ALPHABET[randomInt(ALPHABET.length)];
    groups.push(part);
  }
  return groups.join("-");
}

export async function setTempPassword(session: Session, id: string): Promise<ActionResult> {
  const s = await loadStudent(id);
  protectOwner(s, "given a temporary password");
  const state = await readAccountState(id);
  if (state.status === "deleted") throw new ActionError(409, "This account is deleted.");
  const password = strongPassword();
  await prisma.student.update({
    where: { id },
    data: { passwordHash: await bcrypt.hash(password, 12), resetToken: null, resetTokenExpires: null },
  });
  // Ends every existing session, and the next sign-in must choose a new password.
  await upsertAccount(id, { mustChangePassword: true, sessionVersion: state.sessionVersion + 1 });
  await clearRateLimit(`login:student:${s.email.toLowerCase().trim()}`).catch(() => {});
  await audit(session, "learner.password.temporary", target(s), { signedOutEverywhere: true });
  return { ok: true, message: "Temporary password set. Share it privately; it is shown only once.", secret: password };
}

export async function markVerified(session: Session, id: string): Promise<ActionResult> {
  const s = await loadStudent(id);
  await prisma.student.update({ where: { id }, data: { emailVerified: new Date(), verifyToken: null } });
  await audit(session, "learner.email.verified", target(s), null);
  return { ok: true, message: "Email marked as verified" };
}

export async function changeEmail(session: Session, id: string, nextEmail: string): Promise<ActionResult> {
  const s = await loadStudent(id);
  protectOwner(s, "given a new email");
  const email = nextEmail.trim().toLowerCase();
  if (email === s.email.toLowerCase()) throw new ActionError(400, "That is already this learner's email.");
  if (email === OWNER_EMAIL.toLowerCase()) throw new ActionError(409, "That email is reserved.");
  const taken = await prisma.student.findFirst({ where: { email: { equals: email, mode: "insensitive" } }, select: { id: true } });
  if (taken) throw new ActionError(409, "Another account already uses that email.");
  await ensureAccountTables();
  if (await prisma.learnerBlockedEmail.findUnique({ where: { emailHash: emailHash(email) } })) {
    throw new ActionError(409, "That email is blocked.");
  }
  const old = s.email;
  try {
    // Not verified any more: the new address has not proved itself. A reset
    // token sent to the old address stops working too.
    await prisma.student.update({ where: { id }, data: { email, emailVerified: null, verifyToken: null, resetToken: null, resetTokenExpires: null } });
  } catch {
    throw new ActionError(409, "Another account already uses that email.");
  }
  await sendEmailChangedEmails({ name: s.name, locale: s.locale, oldEmail: old, newEmail: email }).catch((err) =>
    console.error("[learner-admin] email change notice", err instanceof Error ? err.message : err),
  );
  await audit(session, "learner.email.change", { type: "learner", id, label: email }, { from: old, to: email });
  return { ok: true, message: `Email changed to ${email}. Both addresses were notified.` };
}

export async function signOutEverywhere(session: Session, id: string): Promise<ActionResult> {
  const s = await loadStudent(id);
  const state = await readAccountState(id);
  await upsertAccount(id, { sessionVersion: state.sessionVersion + 1 });
  await audit(session, "learner.sessions.revoke", target(s), null);
  return { ok: true, message: "Signed out on every device" };
}

// ── Access ─────────────────────────────────────────────────────────────────
//
// The same "comped" subscription as Admin > Test access. A timed comp uses
// plan "comp_timed" with currentPeriodEnd (enforced in lib/learn/session.ts,
// like the referral free month).

const LIVE = ["active", "trialing", "past_due"];

export async function grantComp(session: Session, id: string, reason: string): Promise<ActionResult> {
  const s = await loadStudent(id);
  const sub = await prisma.learnSubscription.findUnique({ where: { studentId: id } });
  if (sub?.stripeSubscriptionId && LIVE.includes(sub.status)) throw new ActionError(409, "This learner already has a paid subscription.");
  await prisma.learnSubscription.upsert({
    where: { studentId: id },
    create: { studentId: id, status: COMP_STATUS, plan: "monthly" },
    update: { status: COMP_STATUS, plan: sub?.plan === "comp_timed" || sub?.plan === "referral" ? "monthly" : sub?.plan, graceUntil: null, cancelAtPeriodEnd: false, currentPeriodEnd: null },
  });
  await audit(session, "access.comp.grant", target(s), { reason: reason || null });
  return { ok: true, message: "Free access granted (every track)" };
}

export async function revokeComp(session: Session, id: string, reason: string): Promise<ActionResult> {
  const s = await loadStudent(id);
  const sub = await prisma.learnSubscription.findUnique({ where: { studentId: id } });
  if (sub?.status !== COMP_STATUS) throw new ActionError(409, "This learner has no free access to revoke.");
  await prisma.learnSubscription.update({ where: { studentId: id }, data: { status: "canceled" } });
  await audit(session, "access.comp.revoke", target(s), { reason: reason || null });
  return { ok: true, message: "Free access revoked" };
}

export async function extendAccess(session: Session, id: string, days: number, reason: string): Promise<ActionResult> {
  const s = await loadStudent(id);
  const sub = await prisma.learnSubscription.findUnique({ where: { studentId: id } });
  const DAY = 86_400_000;
  if (sub?.stripeSubscriptionId && LIVE.includes(sub.status)) {
    throw new ActionError(409, "This learner pays through Stripe. Extend the billing period in Stripe (add trial days) instead.");
  }
  if (sub?.status === COMP_STATUS && sub.plan !== "comp_timed" && sub.plan !== "referral") {
    throw new ActionError(409, "This learner already has free access with no end date.");
  }
  const base = sub?.status === COMP_STATUS && sub.currentPeriodEnd && sub.currentPeriodEnd.getTime() > Date.now() ? sub.currentPeriodEnd.getTime() : Date.now();
  const end = new Date(base + days * DAY);
  await prisma.learnSubscription.upsert({
    where: { studentId: id },
    create: { studentId: id, status: COMP_STATUS, plan: "comp_timed", currentPeriodEnd: end },
    update: {
      status: COMP_STATUS,
      plan: sub?.plan === "referral" ? "referral" : "comp_timed",
      currentPeriodEnd: end,
      graceUntil: null,
      cancelAtPeriodEnd: false,
    },
  });
  await audit(session, "access.extend", target(s), { days, until: end.toISOString(), reason: reason || null });
  return { ok: true, message: `Access extended to ${end.toISOString().slice(0, 10)}` };
}

// ── Notes and tags ─────────────────────────────────────────────────────────

export async function setTags(session: Session, id: string, tags: string[]): Promise<ActionResult> {
  const s = await loadStudent(id);
  const clean = [...new Set(tags.map(normaliseTag).filter(Boolean))].slice(0, 12);
  const before = (await readAccountState(id)).tags;
  await upsertAccount(id, { tags: clean });
  await audit(session, "learner.tags", target(s), { before, after: clean });
  return { ok: true, message: "Tags saved" };
}

export async function addTag(session: Session, id: string, tag: string, remove = false): Promise<ActionResult> {
  const t = normaliseTag(tag);
  if (!t) throw new ActionError(400, "Enter a tag");
  const cur = (await readAccountState(id)).tags;
  const next = remove ? cur.filter((x) => x !== t) : [...new Set([...cur, t])];
  return setTags(session, id, next);
}

export async function addNote(session: Session, id: string, body: string): Promise<ActionResult> {
  const s = await loadStudent(id);
  await ensureAccountTables();
  await prisma.learnerNote.create({
    data: { id: randomUUID(), studentId: id, authorEmail: by(session), authorName: session.user.name ?? null, body },
  });
  await audit(session, "learner.note.add", target(s), { length: body.length });
  return { ok: true, message: "Note added" };
}

export async function deleteNote(session: Session, id: string, noteId: string): Promise<ActionResult> {
  const s = await loadStudent(id);
  await ensureAccountTables();
  const done = await prisma.learnerNote.deleteMany({ where: { id: noteId, studentId: id } });
  if (!done.count) throw new ActionError(404, "Note not found");
  await audit(session, "learner.note.delete", target(s), null);
  return { ok: true, message: "Note deleted" };
}
