import { cache } from "react";
import prisma from "@/lib/prisma";
import { OWNER_EMAIL } from "@/lib/auth";

/**
 * The site owner's own learner account (OWNER_EMAIL). Nobody else can hold
 * it: sign-up refuses the address and the account is only created by the
 * owner's sign-in with the admin password (lib/auth.ts, lib/learn/signup.ts).
 *
 * It goes through every track to check it, so it is never stopped by the
 * paywall (lib/learn/session.ts), by "finish the lessons first" on quizzes,
 * labs and the final exam, by exam attempt limits and cooldowns, by the
 * per-learner daily AI allowance, or by the no-skip rule on videos.
 * Certificates are not given away: they still need the real passes.
 */
export const isOwnerStudent = cache(async (studentId: string | null | undefined): Promise<boolean> => {
  if (!studentId) return false;
  const row = await prisma.student.findUnique({ where: { id: studentId }, select: { email: true } }).catch(() => null);
  return !!row && row.email.toLowerCase() === OWNER_EMAIL.toLowerCase();
});
