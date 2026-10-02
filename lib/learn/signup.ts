import bcrypt from "bcryptjs";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { sendStudentWelcomeEmail } from "@/lib/learn/emails";
import { getLocale } from "@/lib/i18n/server";
import { isLocale, learnLocale } from "@/lib/i18n/config";
import { sendSignupNotification } from "@/lib/learn/admin/signup-notify";
import { OWNER_EMAIL } from "@/lib/auth";
import { recordAttribution } from "@/lib/growth/attribution";
import { recordReferralSignup } from "@/lib/learn/referrals/service";
import { isEmailBlocked } from "@/lib/learn/account-status";
import type { T } from "@/lib/i18n/server";

// Creating a learner account with a password: the sign-up form
// (app/api/learn/auth/signup) and the one-page join flow
// (app/api/learn/join/account) share this, so both get the same checks
// (owner address, blocked addresses, taken addresses) and the same side
// effects (attribution, referral, owner notification).

export const AccountFields = {
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(200),
  locale: z.string().optional(),
};

export const FIELD_ERROR: Record<string, string> = {
  name: "learn.api.nameRequired",
  email: "learn.api.invalidEmail",
  password: "learn.api.passwordShort",
};

/** Track slug and same-site ?next path, from the body or the signup page's URL. */
export function signupSource(body: { track?: string | null; next?: string | null }, referer: string | null) {
  let track = body.track ?? null;
  let next = body.next ?? null;
  if (!track && !next && referer) {
    try {
      const u = new URL(referer);
      track = u.searchParams.get("track");
      next = u.searchParams.get("next");
    } catch { /* ignore */ }
  }
  return {
    track: track && /^[a-z0-9][a-z0-9-]{0,79}$/i.test(track) ? track : null,
    next: next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") ? next.slice(0, 200) : null,
  };
}

export type CreateAccountResult =
  | { ok: true; student: { id: string; email: string; name: string; createdAt: Date }; locale: string }
  | { ok: false; status: number; error: string; code?: "exists" | "blocked" };

/**
 * Creates the account. `welcome: false` leaves the welcome email to the
 * caller (the join flow sends a purchase-aware one later). Throws only on a
 * database failure.
 */
export async function createLearnerAccount(
  input: { name: string; email: string; password: string; locale?: string },
  ctx: { t: T; cookieHeader: string | null; referer: string | null; source: { track?: string | null; next?: string | null }; welcome: boolean },
): Promise<CreateAccountResult> {
  const { name, email, password } = input;
  const { t } = ctx;
  // The language the learner signed up in: saved on the account so emails
  // and other devices use it. ARFA runs in English and French only: a Swahili
  // choice on the public site becomes English for the learner account.
  const locale = learnLocale(isLocale(input.locale) ? input.locale : await getLocale());

  // The owner's learner account is always entitled (lib/learn/session.ts,
  // by email) and sign-up does not verify addresses, so a self-service
  // sign-up with the owner's email would hand a stranger free access to
  // every track. That account is created only by the owner's own sign-in
  // with the admin password (lib/auth.ts). Same answer as a taken address.
  if (email === OWNER_EMAIL.toLowerCase()) {
    return { ok: false, status: 409, error: t("learn.api.emailExists"), code: "exists" };
  }
  // A blocked learner cannot open a new account with the same address.
  if (await isEmailBlocked(email)) {
    return { ok: false, status: 403, error: t("authStatus.signupBlocked"), code: "blocked" };
  }
  const existing = await prisma.student.findUnique({ where: { email }, select: { id: true } });
  if (existing) return { ok: false, status: 409, error: t("learn.api.emailExists"), code: "exists" };

  const passwordHash = await bcrypt.hash(password, 12);
  let student: { id: string; email: string; name: string; createdAt: Date };
  try {
    student = await prisma.student.create({
      data: { name, email, passwordHash, locale },
      select: { id: true, email: true, name: true, createdAt: true },
    });
  } catch (err) {
    // Two submits racing on the same address: the unique index decides.
    if ((err as { code?: string })?.code === "P2002") {
      return { ok: false, status: 409, error: t("learn.api.emailExists"), code: "exists" };
    }
    throw err;
  }

  // Campaign attribution (Growth): no-op without the UTM cookie, never throws.
  await recordAttribution({ kind: "learn_signup", refId: student.id, cookieHeader: ctx.cookieHeader });
  // Learning Box referral (60-day cookie from /r/[code]): no-op without it, never throws.
  await recordReferralSignup({ studentId: student.id, email: student.email, cookieHeader: ctx.cookieHeader });

  // Tell the owner (ADMIN_NOTIFY_EMAIL). Fire and forget: never blocks or
  // fails the sign-up.
  sendSignupNotification({
    studentId: student.id,
    name: student.name,
    email: student.email,
    locale,
    createdAt: student.createdAt,
    ...signupSource(ctx.source, ctx.referer),
  }).catch((err) => console.error("[learn/signup] owner notification", err));

  if (ctx.welcome) {
    sendStudentWelcomeEmail({ email: student.email, name: student.name, locale })
      .catch((err) => console.error("[learn/signup] welcome email", err));
  }

  return { ok: true, student, locale };
}
