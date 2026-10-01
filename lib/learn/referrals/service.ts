import { createHash, randomBytes } from "crypto";
import prisma from "@/lib/prisma";
import { escapeHtml } from "@/lib/require-admin";
import { arfaMailer, mailTransport, MAIL_FROM } from "@/lib/resend";
import { translatorFor } from "@/lib/i18n/server";
import { isLocale, learnLocale } from "@/lib/i18n/config";
import { ensureReferralTables } from "./db";

// ARFA (the TIBLOGICS AI Academy) learner referral program.
//
// Every learner gets a personal link, /r/[code]. Opening it sets a 60-day
// cookie (REF_COOKIE) holding only the code. When the visitor signs up, the
// sign-up records a LearnReferral (referrer → referred). When the referred
// learner later pays (subscription or a track, from the Stripe webhook), the
// referrer earns a reward, "1 free month", recorded as PENDING: the owner
// approves it in /admin_pro/growth/acquire/referrals.
//
// Approval grants time-limited comped access (LearnSubscription status
// "comped", plan "referral", currentPeriodEnd = the end of the free month;
// lib/learn/session.ts treats it as expired after that date). A referrer who
// already pays through Stripe gets a "credit due" the owner applies by hand
// in Stripe, since touching a live subscription from here is not worth the risk.
//
// Fraud guards: no self-referral (same normalised email at sign-up, or the
// referrer's own email or Stripe customer at payment), one reward per
// referred person (unique referralId), and a monthly cap per referrer
// (REFERRAL_MONTHLY_CAP, default 3): rewards over the cap are held as
// "capped" for the owner to approve or reject.

export const REF_COOKIE = "tib_ref";
export const REF_MAX_AGE = 60 * 86_400;
export const REWARD_DAYS = 30;
export const CODE_RE = /^[a-z0-9]{6,12}$/;

export function monthlyCap(): number {
  const n = Number(process.env.REFERRAL_MONTHLY_CAP);
  return Number.isInteger(n) && n >= 0 && n <= 100 ? n : 3;
}

export function referralCouponId(): string | null {
  const c = process.env.STRIPE_REFERRAL_COUPON_ID?.trim();
  return c && /^[A-Za-z0-9_-]{1,100}$/.test(c) ? c : null;
}

function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL ?? "https://tiblogics.com").replace(/\/$/, "");
}

export function referralLink(code: string): string {
  return `${siteUrl()}/r/${code}`;
}

/**
 * The same mailbox, however it is written: lower case, "+tag" dropped, and
 * for Gmail the dots too (j.doe+x@googlemail.com = jdoe@gmail.com).
 */
export function emailIdentity(email: string | null | undefined): string {
  const e = (email ?? "").trim().toLowerCase();
  const at = e.lastIndexOf("@");
  if (at < 1) return e;
  let local = e.slice(0, at).split("+")[0];
  let domain = e.slice(at + 1);
  if (domain === "googlemail.com") domain = "gmail.com";
  if (domain === "gmail.com") local = local.replace(/\./g, "");
  return `${local}@${domain}`;
}

// ── Codes ───────────────────────────────────────────────────────────────────

const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";
function newCode(len = 8): string {
  const b = randomBytes(len);
  let s = "";
  for (let i = 0; i < len; i++) s += ALPHABET[b[i] % ALPHABET.length];
  return s;
}

export async function getOrCreateCode(studentId: string): Promise<string> {
  await ensureReferralTables();
  const hit = await prisma.learnReferralCode.findUnique({ where: { studentId } });
  if (hit) return hit.code;
  for (let i = 0; i < 6; i++) {
    try {
      const row = await prisma.learnReferralCode.create({ data: { studentId, code: newCode() } });
      return row.code;
    } catch (err) {
      if ((err as { code?: string })?.code !== "P2002") throw err;
      const again = await prisma.learnReferralCode.findUnique({ where: { studentId } });
      if (again) return again.code; // created concurrently
    }
  }
  throw new Error("Could not allocate a referral code");
}

export async function codeOwner(code: string) {
  if (!CODE_RE.test(code)) return null;
  await ensureReferralTables();
  return prisma.learnReferralCode.findUnique({ where: { code } });
}

export function codeFromCookieHeader(cookieHeader: string | null | undefined): string | null {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(";")) {
    const i = part.indexOf("=");
    if (i < 0) continue;
    if (part.slice(0, i).trim() === REF_COOKIE) {
      const v = decodeURIComponent(part.slice(i + 1).trim());
      return CODE_RE.test(v) ? v : null;
    }
  }
  return null;
}

// ── Events (link visits, share clicks) ─────────────────────────────────────

export function visitorHash(ip: string, ua: string, day = new Date().toISOString().slice(0, 10)): string {
  const salt = process.env.GROWTH_CLICK_SALT || process.env.NEXTAUTH_SECRET || "tib-ref";
  return createHash("sha256").update(`${salt}|ref|${day}|${ip}|${ua}`).digest("hex").slice(0, 32);
}

export async function recordReferralEvent(code: string, kind: "visit" | `share:${string}`, hash: string, channel?: string | null) {
  try {
    await ensureReferralTables();
    const day = new Date().toISOString().slice(0, 10);
    await prisma.learnReferralEvent.createMany({
      data: [{ code, kind, channel: channel ?? null, visitorHash: hash, day }],
      skipDuplicates: true,
    });
  } catch (err) {
    console.error("[learn/referrals] event", err instanceof Error ? err.message : err);
  }
}

// ── Sign-up ────────────────────────────────────────────────────────────────

/**
 * Called right after a learner account is created. Ties it to the referrer
 * from the cookie, if any. Never throws; costs nothing without the cookie.
 */
export async function recordReferralSignup(opts: { studentId: string; email: string; cookieHeader: string | null | undefined }): Promise<void> {
  try {
    const code = codeFromCookieHeader(opts.cookieHeader);
    if (!code) return;
    const owner = await codeOwner(code);
    if (!owner || owner.studentId === opts.studentId) return;
    const referrer = await prisma.student.findUnique({ where: { id: owner.studentId }, select: { email: true } });
    if (!referrer) return;
    const self = emailIdentity(referrer.email) === emailIdentity(opts.email);
    await prisma.learnReferral.createMany({
      data: [{
        code,
        referrerStudentId: owner.studentId,
        referredStudentId: opts.studentId,
        status: self ? "rejected" : "signed_up",
        reason: self ? "Self-referral: same email as the referrer" : null,
      }],
      skipDuplicates: true,
    });
  } catch (err) {
    console.error("[learn/referrals] signup", err instanceof Error ? err.message : err);
  }
}

/** Stripe coupon for a referred learner's first checkout, when configured. */
export async function referralCouponFor(studentId: string): Promise<string | null> {
  const coupon = referralCouponId();
  if (!coupon) return null;
  try {
    await ensureReferralTables();
    const r = await prisma.learnReferral.findUnique({ where: { referredStudentId: studentId }, select: { status: true } });
    return r?.status === "signed_up" ? coupon : null;
  } catch {
    return null;
  }
}

// ── Payment ────────────────────────────────────────────────────────────────

const ADMIN_EMAIL = () => process.env.ADMIN_NOTIFY_EMAIL || process.env.TIWE_EMAIL || process.env.TITAN_SMTP_USER || "info@tiblogics.com";

/**
 * Called from the Stripe webhook once a referred learner's payment settled
 * (subscription checkout or a track purchase). Idempotent: one reward per
 * referred person, whatever Stripe retries. Never throws.
 */
export async function recordReferralPayment(opts: {
  studentId: string;
  kind: "subscription" | "track";
  amountCents?: number | null;
  payerEmail?: string | null;
  customerId?: string | null;
}): Promise<void> {
  try {
    await ensureReferralTables();
    const ref = await prisma.learnReferral.findUnique({ where: { referredStudentId: opts.studentId } });
    if (!ref || ref.status === "rejected") return;
    if (await prisma.learnReferralReward.findUnique({ where: { referralId: ref.id }, select: { id: true } })) return;

    const referrer = await prisma.student.findUnique({ where: { id: ref.referrerStudentId }, select: { email: true, name: true } });
    if (!referrer) return;
    const refSub = await prisma.learnSubscription.findUnique({ where: { studentId: ref.referrerStudentId }, select: { stripeCustomerId: true } }).catch(() => null);
    let reason: string | null = null;
    if (opts.payerEmail && emailIdentity(opts.payerEmail) === emailIdentity(referrer.email)) reason = "Self-referral: paid with the referrer's email";
    else if (opts.customerId && refSub?.stripeCustomerId && opts.customerId === refSub.stripeCustomerId) reason = "Self-referral: paid with the referrer's Stripe customer";
    if (reason) {
      await prisma.learnReferral.update({ where: { id: ref.id }, data: { status: "rejected", reason } });
      return;
    }

    await prisma.learnReferral.update({
      where: { id: ref.id },
      data: { status: "paid", paidAt: new Date(), payKind: opts.kind, amountCents: Number.isInteger(opts.amountCents) ? opts.amountCents : null },
    });
    const monthStart = new Date();
    monthStart.setUTCDate(1);
    monthStart.setUTCHours(0, 0, 0, 0);
    const thisMonth = await prisma.learnReferralReward.count({
      where: { referrerStudentId: ref.referrerStudentId, createdAt: { gte: monthStart }, status: { notIn: ["rejected", "capped"] } },
    });
    const capped = thisMonth >= monthlyCap();
    const res = await prisma.learnReferralReward.createMany({
      data: [{
        referralId: ref.id,
        referrerStudentId: ref.referrerStudentId,
        referredStudentId: opts.studentId,
        status: capped ? "capped" : "pending",
        note: capped ? `Over the monthly cap of ${monthlyCap()} reward${monthlyCap() === 1 ? "" : "s"} for this referrer.` : null,
      }],
      skipDuplicates: true,
    });
    if (res.count > 0) notifyOwner(referrer.email, capped).catch(() => {});
  } catch (err) {
    console.error("[learn/referrals] payment", err instanceof Error ? err.message : err);
  }
}

async function notifyOwner(referrerEmail: string, capped: boolean) {
  const url = `${siteUrl()}/admin_pro/growth/acquire/referrals`;
  await mailTransport().sendMail({
    from: MAIL_FROM,
    to: ADMIN_EMAIL(),
    subject: `Referral reward to review: ${referrerEmail}`,
    html: `<div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#0D1B2A">
<p style="font-size:15px;margin:0 0 12px">A learner referred by <strong>${escapeHtml(referrerEmail)}</strong> just paid for ARFA · AI Academy.</p>
<p style="font-size:14px;color:#3A4A5C;margin:0 0 16px">${capped ? "This referrer is over the monthly cap, so the reward is held for you to decide." : "A free month for the referrer is waiting for your approval."}</p>
<a href="${escapeHtml(url)}" style="display:inline-block;background:#B8500A;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:700;font-size:14px">Review referral rewards</a></div>`,
  });
}

// ── Owner decisions ─────────────────────────────────────────────────────────

export class RewardError extends Error {}

/**
 * Grants the reward. Claims the row first so a double click cannot grant it
 * twice. Returns the final status and a note for the owner.
 */
export async function approveReward(id: string, by: string): Promise<{ status: string; note: string }> {
  await ensureReferralTables();
  const claimed = await prisma.learnReferralReward.updateMany({ where: { id, status: { in: ["pending", "capped"] } }, data: { status: "processing" } });
  if (claimed.count === 0) throw new RewardError("This reward was already decided.");
  const reward = await prisma.learnReferralReward.findUniqueOrThrow({ where: { id } });
  try {
    const now = new Date();
    const sub = await prisma.learnSubscription.findUnique({ where: { studentId: reward.referrerStudentId } });
    let status: string;
    let grant: string;
    let note: string;
    if (sub && sub.stripeSubscriptionId && ["active", "trialing", "past_due"].includes(sub.status)) {
      status = "credit_due";
      grant = "manual_credit";
      note = "Pays through Stripe: apply a one-month credit to their subscription in the Stripe dashboard, then mark it applied.";
    } else if (sub?.status === "comped" && sub.plan !== "referral") {
      status = "applied";
      grant = "none_needed";
      note = "Already has unlimited free access; nothing to extend.";
    } else {
      const base = sub?.status === "comped" && sub.plan === "referral" && sub.currentPeriodEnd && sub.currentPeriodEnd > now ? sub.currentPeriodEnd : now;
      const end = new Date(base.getTime() + REWARD_DAYS * 86_400_000);
      await prisma.learnSubscription.upsert({
        where: { studentId: reward.referrerStudentId },
        create: { studentId: reward.referrerStudentId, status: "comped", plan: "referral", currentPeriodEnd: end },
        update: { status: "comped", plan: "referral", currentPeriodEnd: end, graceUntil: null, cancelAtPeriodEnd: false },
      });
      status = "applied";
      grant = "comp_extension";
      note = `Free access to every track until ${end.toISOString().slice(0, 10)}.`;
    }
    await prisma.learnReferralReward.update({ where: { id }, data: { status, grant, note, decidedAt: now, decidedBy: by.slice(0, 200) } });
    if (grant !== "none_needed") emailReferrer(reward.referrerStudentId, grant).catch((err) => console.error("[learn/referrals] reward email", err));
    return { status, note };
  } catch (err) {
    // Release the claim so the owner can try again.
    await prisma.learnReferralReward.update({ where: { id }, data: { status: "pending" } }).catch(() => {});
    throw err;
  }
}

export async function rejectReward(id: string, by: string, note?: string | null) {
  await ensureReferralTables();
  const r = await prisma.learnReferralReward.updateMany({
    where: { id, status: { in: ["pending", "capped", "credit_due"] } },
    data: { status: "rejected", note: note?.trim().slice(0, 500) || "Rejected by the owner.", decidedAt: new Date(), decidedBy: by.slice(0, 200) },
  });
  if (r.count === 0) throw new RewardError("This reward was already decided.");
}

export async function markCreditApplied(id: string, by: string) {
  await ensureReferralTables();
  const r = await prisma.learnReferralReward.updateMany({
    where: { id, status: "credit_due" },
    data: { status: "applied", note: "One-month credit applied in Stripe.", decidedAt: new Date(), decidedBy: by.slice(0, 200) },
  });
  if (r.count === 0) throw new RewardError("Only a credit that is due can be marked applied.");
}

async function emailReferrer(studentId: string, grant: string) {
  const s = await prisma.student.findUnique({ where: { id: studentId }, select: { email: true, name: true, locale: true } });
  if (!s) return;
  const t = translatorFor(learnLocale(isLocale(s.locale) ? s.locale : "en"));
  const first = escapeHtml(s.name.split(" ")[0] || s.name);
  const body = grant === "manual_credit" ? t("referrals.email.credit") : t("referrals.email.comp", { days: REWARD_DAYS });
  // Learner-facing: sent from the ARFA mailbox (arfa_edu@tiblogics.com).
  await arfaMailer.emails.send({
    to: s.email,
    subject: t("referrals.email.subject"),
    html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#0D1B2A">
<p style="font-size:16px;margin:0 0 12px">${escapeHtml(t("referrals.email.hi", { name: "__N__" })).replace("__N__", first)}</p>
<p style="font-size:15px;line-height:1.6;margin:0 0 16px">${escapeHtml(body)}</p>
<a href="${escapeHtml(`${siteUrl()}/learn/referrals`)}" style="display:inline-block;background:#B8500A;color:#fff;text-decoration:none;padding:11px 20px;border-radius:8px;font-weight:700;font-size:14px">${escapeHtml(t("referrals.email.cta"))}</a>
<p style="font-size:12px;color:#5A6E84;margin:24px 0 0">${escapeHtml(t("referrals.email.footer"))}</p></div>`,
  });
}

// ── Stats ──────────────────────────────────────────────────────────────────

export interface LearnerReferralStats {
  code: string;
  link: string;
  visits: number;
  shares: number;
  signups: number;
  paid: number;
  rewardsEarned: number;
  rewardsPending: number;
  couponActive: boolean;
}

export async function learnerStats(studentId: string): Promise<LearnerReferralStats> {
  const code = await getOrCreateCode(studentId);
  const [visits, shares, refs, rewards] = await Promise.all([
    prisma.learnReferralEvent.count({ where: { code, kind: "visit" } }),
    prisma.learnReferralEvent.count({ where: { code, kind: { startsWith: "share:" } } }),
    prisma.learnReferral.findMany({ where: { referrerStudentId: studentId }, select: { status: true } }),
    prisma.learnReferralReward.findMany({ where: { referrerStudentId: studentId }, select: { status: true } }),
  ]);
  return {
    code,
    link: referralLink(code),
    visits,
    shares,
    signups: refs.filter((r) => r.status !== "rejected").length,
    paid: refs.filter((r) => r.status === "paid").length,
    rewardsEarned: rewards.filter((r) => r.status === "applied" || r.status === "credit_due").length,
    rewardsPending: rewards.filter((r) => r.status === "pending" || r.status === "capped" || r.status === "processing").length,
    couponActive: !!referralCouponId(),
  };
}

export interface AdminRewardRow {
  id: string;
  status: string;
  grant: string | null;
  note: string | null;
  createdAt: string;
  decidedAt: string | null;
  referrer: { id: string; email: string; name: string };
  referred: { id: string; email: string; name: string };
  payKind: string | null;
  amountCents: number | null;
}

export async function adminReferralOverview() {
  await ensureReferralTables();
  const [codes, visits, shares, refs, rewards] = await Promise.all([
    prisma.learnReferralCode.count(),
    prisma.learnReferralEvent.count({ where: { kind: "visit" } }),
    prisma.learnReferralEvent.count({ where: { kind: { startsWith: "share:" } } }),
    prisma.learnReferral.findMany({ orderBy: { createdAt: "desc" }, take: 2000 }),
    prisma.learnReferralReward.findMany({ orderBy: { createdAt: "desc" }, take: 500 }),
  ]);
  const ids = new Set<string>();
  for (const r of refs) ids.add(r.referrerStudentId).add(r.referredStudentId);
  for (const r of rewards) ids.add(r.referrerStudentId).add(r.referredStudentId);
  const students = await prisma.student.findMany({ where: { id: { in: [...ids] } }, select: { id: true, email: true, name: true } });
  const who = new Map(students.map((s) => [s.id, s]));
  const person = (id: string) => who.get(id) ?? { id, email: "(deleted account)", name: "" };
  const refById = new Map(refs.map((r) => [r.id, r]));

  const rows: AdminRewardRow[] = rewards.map((w) => {
    const ref = refById.get(w.referralId);
    return {
      id: w.id,
      status: w.status,
      grant: w.grant,
      note: w.note,
      createdAt: w.createdAt.toISOString(),
      decidedAt: w.decidedAt?.toISOString() ?? null,
      referrer: person(w.referrerStudentId),
      referred: person(w.referredStudentId),
      payKind: ref?.payKind ?? null,
      amountCents: ref?.amountCents ?? null,
    };
  });

  const top = new Map<string, { signups: number; paid: number }>();
  for (const r of refs) {
    if (r.status === "rejected") continue;
    const t = top.get(r.referrerStudentId) ?? { signups: 0, paid: 0 };
    t.signups++;
    if (r.status === "paid") t.paid++;
    top.set(r.referrerStudentId, t);
  }
  return {
    totals: {
      links: codes,
      visits,
      shares,
      signups: refs.filter((r) => r.status !== "rejected").length,
      paid: refs.filter((r) => r.status === "paid").length,
      rejected: refs.filter((r) => r.status === "rejected").length,
      pending: rewards.filter((r) => r.status === "pending" || r.status === "capped").length,
      creditDue: rewards.filter((r) => r.status === "credit_due").length,
      granted: rewards.filter((r) => r.status === "applied").length,
    },
    rewards: rows,
    rejectedSignups: refs
      .filter((r) => r.status === "rejected")
      .slice(0, 50)
      .map((r) => ({ id: r.id, reason: r.reason, createdAt: r.createdAt.toISOString(), referrer: person(r.referrerStudentId), referred: person(r.referredStudentId) })),
    top: [...top.entries()]
      .map(([id, v]) => ({ ...person(id), ...v }))
      .sort((a, b) => b.paid - a.paid || b.signups - a.signups)
      .slice(0, 10),
    cap: monthlyCap(),
    couponId: referralCouponId(),
  };
}
