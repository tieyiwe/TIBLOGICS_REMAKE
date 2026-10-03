import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { cookies, headers } from "next/headers";
import prisma from "@/lib/prisma";
import { LOCALE_COOKIE, isLocale, learnLocale } from "@/lib/i18n/config";
import { choiceFromJoinUrl } from "@/lib/learn/join/choice";

// "Continue with Google" for Learn. Google has already verified the address,
// so it signs into the learner account with that email, creating one on the
// first visit. It only ever produces a LEARNER session: staff keep signing in
// with their password at /admin_pro/login.

/** Request cookies/headers, or null outside a request (never throws). */
async function safeCookies() {
  try {
    return await cookies();
  } catch {
    return null;
  }
}
async function safeHeaders() {
  try {
    return await headers();
  } catch {
    return null;
  }
}

export function googleLoginEnabled(): boolean {
  return !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export interface GoogleProfileLike {
  email?: string | null;
  email_verified?: boolean | null;
  name?: string | null;
  given_name?: string | null;
}

/** The learner for a verified Google profile, created on first sign-in. Null when the profile is unusable. */
export async function studentForGoogle(profile: GoogleProfileLike | undefined) {
  const email = profile?.email?.toLowerCase().trim();
  if (!email || profile?.email_verified !== true) return null;

  const existing = await prisma.student.findUnique({ where: { email } });
  if (existing) {
    // Google proved the address, so an unverified account is verified now.
    // Sign-up does not verify addresses, so an unverified account may have
    // been opened by someone else with this address ("pre-hijacking"): its
    // password is replaced with a random one and its sessions are ended, so
    // only the Google owner keeps access ("Forgot password" sets a new one).
    if (!existing.emailVerified) {
      const claimed = await prisma.student
        .updateMany({
          where: { id: existing.id, emailVerified: null },
          data: {
            emailVerified: new Date(),
            passwordHash: await bcrypt.hash(randomBytes(32).toString("hex"), 12),
            resetToken: null,
            resetTokenExpires: null,
          },
        })
        .catch(() => ({ count: 0 }));
      if (claimed.count) {
        await import("@/lib/learn/account-status/db")
          .then(({ ensureAccountTables }) => ensureAccountTables())
          .then(() =>
            prisma.learnerAccount.upsert({
              where: { studentId: existing.id },
              create: { studentId: existing.id, sessionVersion: 1, updatedAt: new Date() },
              update: { sessionVersion: { increment: 1 }, updatedAt: new Date() },
            }),
          )
          .catch((err) => console.error("[learn/google] session reset", err));
      }
    }
    return { student: existing, created: false };
  }

  const jar = await safeCookies();
  const chosen = jar?.get(LOCALE_COOKIE)?.value;
  const locale = learnLocale(isLocale(chosen) ? chosen : "en");
  const name = (profile?.name || profile?.given_name || email.split("@")[0]).trim().slice(0, 100);

  const student = await prisma.student.create({
    data: {
      email,
      name,
      locale,
      emailVerified: new Date(),
      // No password yet: a random one nobody knows. "Forgot password" sets a
      // real one if the learner ever wants to sign in without Google.
      passwordHash: await bcrypt.hash(randomBytes(32).toString("hex"), 12),
    },
  });

  // Same side effects as a form sign-up; none of them may block the sign-in.
  const hdrs = await safeHeaders();
  void import("@/lib/learn/admin/signup-notify")
    .then(({ sendSignupNotification }) =>
      sendSignupNotification({
        studentId: student.id,
        name: student.name,
        email: student.email,
        locale,
        createdAt: student.createdAt,
        referer: "Signed up with Google",
      }),
    )
    .catch((err) => console.error("[learn/google] owner notification", err));
  // Started from the one-page join flow (/learning-box/join)? NextAuth keeps
  // the callbackUrl in a cookie for the OAuth round trip; when it points at
  // the join page, the plan chosen there is saved and the welcome waits for
  // the payment (purchase-aware) or the cart-reminders cron (finish your
  // enrolment), as for a password sign-up on that page.
  const joinChoice = choiceFromJoinUrl(
    jar?.get("__Secure-next-auth.callback-url")?.value ?? jar?.get("next-auth.callback-url")?.value ?? null,
  );
  if (joinChoice) {
    await import("@/lib/learn/join/pending")
      .then(({ savePendingChoice }) => savePendingChoice(student.id, joinChoice, { deferWelcome: true }))
      .catch((err) => console.error("[learn/google] join choice", err));
  } else {
    void import("@/lib/learn/emails")
      .then(({ sendStudentWelcomeEmail }) => sendStudentWelcomeEmail({ email: student.email, name: student.name, locale }))
      .catch((err) => console.error("[learn/google] welcome email", err));
  }
  void import("@/lib/growth/attribution")
    .then(({ recordAttribution }) =>
      recordAttribution({ kind: "learn_signup", refId: student.id, cookieHeader: hdrs?.get("cookie") }),
    )
    .catch(() => {});
  void import("@/lib/learn/referrals/service")
    .then(({ recordReferralSignup }) => recordReferralSignup({ studentId: student.id, email: student.email, cookieHeader: hdrs?.get("cookie") }))
    .catch(() => {});

  return { student, created: true };
}

/** Sign-in bookkeeping shared with the password flow. Never throws. */
export async function recordGoogleLogin(studentId: string) {
  await prisma.student.update({ where: { id: studentId }, data: { lastLoginAt: new Date() } }).catch(() => {});
  const hdrs = await safeHeaders();
  await import("@/lib/learn/logins")
    .then(({ recordLoginEvent }) => recordLoginEvent({ studentId, headers: hdrs ?? undefined, method: "google" }))
    .catch(() => {});
}
