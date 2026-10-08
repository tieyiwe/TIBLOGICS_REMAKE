// Data requests for one learner (GDPR / PIPEDA):
//   exportLearnerData  a JSON document of everything ARFA holds on them
//                      (never password hashes or tokens);
//   deleteLearner      anonymises the account. Financial records (the
//                      subscription, track purchases) and issued certificate
//                      verification records are kept, with personal data
//                      stripped; personal content is removed.
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import type { Session } from "next-auth";
import prisma from "@/lib/prisma";
import { OWNER_EMAIL } from "@/lib/auth";
import { audit } from "@/lib/admin/audit";
import { ensureAccountTables } from "./db";
import { emailHash, readAccountState } from "./index";
import { ActionError, type ActionResult } from "./actions";
import { ensureCommsTables } from "@/lib/learn/inbox/db";

/** Rows from a table created at runtime that may not exist on this database. */
async function optionalRows(table: string, column: string, id: string): Promise<unknown[]> {
  try {
    const exists = await prisma.$queryRaw<Array<{ t: string | null }>>`SELECT to_regclass(${`"${table}"`})::text AS t`;
    if (!exists[0]?.t) return [];
    return await prisma.$queryRawUnsafe<unknown[]>(`SELECT * FROM "${table}" WHERE "${column}" = $1 LIMIT 5000`, id);
  } catch (err) {
    console.error(`[privacy] read ${table}`, err);
    return [];
  }
}

export async function exportLearnerData(id: string) {
  const student = await prisma.student.findUnique({
    where: { id },
    select: {
      id: true, email: true, name: true, createdAt: true, updatedAt: true, locale: true, emailVerified: true,
      accessibilityMode: true, leaderboardOptIn: true, lastLoginAt: true,
    },
  });
  if (!student) return null;
  await ensureAccountTables().catch(() => {});
  await ensureCommsTables().catch(() => {});
  const state = await readAccountState(id);
  const [
    subscription, purchases, progress, micro, quizzes, exams, capstones, labs, certificates, points, reviewCards,
    reflections, drafts, portfolio,
  ] = await Promise.all([
    prisma.learnSubscription.findUnique({
      where: { studentId: id },
      select: { status: true, plan: true, createdAt: true, updatedAt: true, currentPeriodEnd: true, cancelAtPeriodEnd: true, graceUntil: true },
    }),
    prisma.trackPurchase.findMany({ where: { studentId: id }, select: { trackId: true, amountCents: true, currency: true, createdAt: true } }).catch(() => []),
    prisma.lessonProgress.findMany({ where: { studentId: id } }),
    prisma.microCheckAttempt.findMany({ where: { studentId: id } }),
    prisma.quizAttempt.findMany({ where: { studentId: id } }),
    prisma.finalExamSession.findMany({ where: { studentId: id } }),
    prisma.capstoneSubmission.findMany({ where: { studentId: id } }),
    prisma.labAttempt.findMany({ where: { studentId: id } }),
    prisma.learnCertificate.findMany({ where: { studentId: id } }),
    prisma.pointsLedger.findMany({ where: { studentId: id } }),
    prisma.reviewCard.findMany({ where: { studentId: id } }).catch(() => []),
    prisma.lessonReflection.findMany({ where: { studentId: id } }).catch(() => []),
    prisma.learnerDraft.findMany({ where: { studentId: id } }).catch(() => []),
    prisma.portfolioSettings.findUnique({ where: { studentId: id } }).catch(() => null),
  ]);
  const [logins, threads, messages, recipients, reminders, community, posts] = await Promise.all([
    optionalRows("LoginEvent", "studentId", id),
    optionalRows("InboxThread", "studentId", id),
    optionalRows("InboxMessage", "studentId", id),
    optionalRows("CommsRecipient", "studentId", id),
    optionalRows("StudyReminderPref", "studentId", id),
    optionalRows("CommunityThread", "authorId", id),
    optionalRows("CommunityPost", "authorId", id),
  ]);
  const tutor = await optionalRows("TutorThread", "studentId", id);
  return {
    exportedAt: new Date().toISOString(),
    format: "ARFA learner data export, version 1",
    note: "Everything ARFA (AI Readiness For All, the TIBLOGICS AI Academy) holds on this account. Passwords and security tokens are never exported. Tutor conversations are listed by thread only.",
    profile: student,
    account: {
      status: state.status,
      suspendedUntil: state.suspendedUntil,
      marketingOptOut: state.marketingOptOut,
    },
    subscription,
    purchases,
    learning: { lessonsCompleted: progress, microChecks: micro, quizzes, finalExams: exams, capstones, labs, points, reviewCards },
    certificates,
    writing: { reflections, drafts, portfolio },
    community: { threads: community, posts },
    inbox: { threads, messages },
    communicationsReceived: (recipients as Array<Record<string, unknown>>).map((r) => ({
      campaignId: r.campaignId, status: r.status, sentAt: r.sentAt, emailed: r.emailed,
    })),
    studyReminders: reminders,
    signIns: logins,
    tutorThreads: (tutor as Array<Record<string, unknown>>).map((t) => ({ id: t.id, createdAt: t.createdAt, updatedAt: t.updatedAt })),
  };
}

/** Runs one cleanup statement on a table that may not exist. Never throws. */
async function scrub(table: string, sql: string, id: string, done: string[]) {
  try {
    const exists = await prisma.$queryRaw<Array<{ t: string | null }>>`SELECT to_regclass(${`"${table}"`})::text AS t`;
    if (!exists[0]?.t) return;
    const n = await prisma.$executeRawUnsafe(sql, id);
    if (n) done.push(`${table}: ${n}`);
  } catch (err) {
    console.error(`[privacy] scrub ${table}`, err);
  }
}

export async function deleteLearner(
  session: Session,
  id: string,
  opts: { confirmEmail: string; reason: string; blockEmail: boolean },
): Promise<ActionResult> {
  const s = await prisma.student.findUnique({ where: { id }, select: { id: true, email: true, name: true } });
  if (!s) throw new ActionError(404, "Learner not found");
  if (s.email.toLowerCase() === OWNER_EMAIL.toLowerCase()) throw new ActionError(409, "The owner's own learner account cannot be deleted.");
  if (opts.confirmEmail.trim().toLowerCase() !== s.email.toLowerCase()) {
    throw new ActionError(400, "Type the learner's email exactly to confirm.");
  }
  const state = await readAccountState(id);
  if (state.status === "deleted") throw new ActionError(409, "This account is already deleted.");

  const originalHash = emailHash(s.email);
  const anonEmail = `deleted+${id}@deleted.arfa.invalid`;
  const done: string[] = [];

  if (opts.blockEmail) {
    await ensureAccountTables();
    await prisma.learnerBlockedEmail.upsert({
      where: { emailHash: originalHash },
      create: { emailHash: originalHash, studentId: id, reason: opts.reason || "Deleted and blocked", createdBy: session.user.email },
      update: { studentId: id, reason: opts.reason || "Deleted and blocked", createdBy: session.user.email },
    });
  }

  // 1. The account itself: no name, no reachable email, no usable password.
  await prisma.student.update({
    where: { id },
    data: {
      email: anonEmail,
      name: "Deleted learner",
      passwordHash: await bcrypt.hash(randomBytes(32).toString("hex"), 12),
      emailVerified: null,
      verifyToken: null,
      resetToken: null,
      resetTokenExpires: null,
      leaderboardOptIn: false,
      accessibilityMode: false,
    },
  });
  // 2. Certificates stay verifiable (track, date, score) without the name.
  const certs = await prisma.learnCertificate.updateMany({ where: { studentId: id }, data: { recipientName: "Name removed at the holder's request" } });
  if (certs.count) done.push(`LearnCertificate (name removed): ${certs.count}`);

  // 3. Personal content and personal settings.
  // AI-Empowered Youth: the parent's email and dashboard link go too.
  await scrub("Student", `UPDATE "Student" SET "parentEmail" = NULL, "parentToken" = NULL, "parentBoardsOptIn" = false WHERE "id" = $1 AND ("parentEmail" IS NOT NULL OR "parentToken" IS NOT NULL)`, id, done);
  await scrub("YouthParentDigest", `DELETE FROM "YouthParentDigest" WHERE "studentId" = $1`, id, done);
  await scrub("YouthGuardian", `DELETE FROM "YouthGuardian" WHERE "studentId" = $1`, id, done);
  await scrub("YouthEncouragement", `DELETE FROM "YouthEncouragement" WHERE "studentId" = $1`, id, done);
  await scrub("YouthPauseAlert", `DELETE FROM "YouthPauseAlert" WHERE "studentId" = $1`, id, done);
  // A sponsorship stays as a payment record, without the child's details.
  await scrub("YouthSponsorship", `UPDATE "YouthSponsorship" SET "childFirstName" = 'Removed', "childEmail" = 'removed', "note" = NULL, "parentEmail" = NULL WHERE "childStudentId" = $1`, id, done);
  await scrub("LessonReflection", `DELETE FROM "LessonReflection" WHERE "studentId" = $1`, id, done);
  await scrub("LearnerDraft", `DELETE FROM "LearnerDraft" WHERE "studentId" = $1`, id, done);
  await scrub("PortfolioSettings", `DELETE FROM "PortfolioSettings" WHERE "studentId" = $1`, id, done);
  await scrub("LoginEvent", `DELETE FROM "LoginEvent" WHERE "studentId" = $1`, id, done);
  await scrub("TutorMessage", `DELETE FROM "TutorMessage" WHERE "threadId" IN (SELECT "id" FROM "TutorThread" WHERE "studentId" = $1)`, id, done);
  await scrub("TutorThread", `DELETE FROM "TutorThread" WHERE "studentId" = $1`, id, done);
  await scrub("TutorProfile", `DELETE FROM "TutorProfile" WHERE "studentId" = $1`, id, done);
  await scrub("CommunityProfile", `DELETE FROM "CommunityProfile" WHERE "studentId" = $1`, id, done);
  await scrub("CommunityThread", `UPDATE "CommunityThread" SET "title" = 'Removed', "bodyMd" = '[Removed at the author''s request]' WHERE "authorId" = $1`, id, done);
  await scrub("CommunityPost", `UPDATE "CommunityPost" SET "bodyMd" = '[Removed at the author''s request]' WHERE "authorId" = $1`, id, done);
  await scrub("ExpertSessionQuestion", `UPDATE "ExpertSessionQuestion" SET "body" = '[Removed at the author''s request]', "hidden" = true WHERE "authorId" = $1`, id, done);
  await scrub("StudyReminderPref", `DELETE FROM "StudyReminderPref" WHERE "studentId" = $1`, id, done);
  await scrub("ToolkitProfile", `DELETE FROM "ToolkitProfile" WHERE "studentId" = $1`, id, done);
  await scrub("InboxThread", `DELETE FROM "InboxThread" WHERE "studentId" = $1`, id, done);
  await scrub("LearnerNote", `DELETE FROM "LearnerNote" WHERE "studentId" = $1`, id, done);
  await scrub("CommsRecipient", `UPDATE "CommsRecipient" SET "email" = '${anonEmail}' WHERE "studentId" = $1`, id, done);
  await scrub("TeamMember", `UPDATE "TeamMember" SET "email" = '${anonEmail}' WHERE "studentId" = $1`, id, done);
  // Open Badges credentials carry the holder's name unhashed and are public
  // by default (/badges/[id]); hide them like the certificate name above.
  await scrub("SkillBadgeAward", `UPDATE "SkillBadgeAward" SET "isPublic" = false WHERE "studentId" = $1`, id, done);
  // A direct message stored "Name <email>" as its audience label, and the
  // comms.send / comms.schedule audit entry copied it into its meta.
  await scrub("AdminAuditLog", `UPDATE "AdminAuditLog" SET "meta" = jsonb_set("meta", '{audience}', '"One learner (deleted)"') WHERE "targetType" = 'campaign' AND "meta"->'audience' IS NOT NULL AND "targetId" IN (SELECT "id" FROM "CommsCampaign" WHERE "audience"->>'type' = 'one' AND "audience"->>'studentId' = $1)`, id, done);
  await scrub("CommsCampaign", `UPDATE "CommsCampaign" SET "audienceLabel" = 'One learner (deleted)' WHERE "audience"->>'type' = 'one' AND "audience"->>'studentId' = $1`, id, done);
  // Earlier audit entries named the learner by email (label, and the old and
  // new address of an email change in meta).
  await scrub("AdminAuditLog", `UPDATE "AdminAuditLog" SET "targetLabel" = 'Deleted learner', "meta" = "meta" - 'from' - 'to' WHERE "targetType" = 'learner' AND "targetId" = $1`, id, done);

  // 4. Marked deleted: every session ends, sign-in refused.
  await ensureAccountTables();
  await prisma.learnerAccount.upsert({
    where: { studentId: id },
    create: { studentId: id, status: "deleted", deletedAt: new Date(), statusReason: opts.reason || null, statusChangedAt: new Date(), statusChangedBy: session.user.email, sessionVersion: 1, updatedAt: new Date() },
    update: { status: "deleted", deletedAt: new Date(), statusReason: opts.reason || null, statusChangedAt: new Date(), statusChangedBy: session.user.email, sessionVersion: state.sessionVersion + 1, tags: [], mustChangePassword: false, suspendedUntil: null, updatedAt: new Date() },
  });

  await audit(session, "learner.delete", { type: "learner", id, label: "Deleted learner" }, {
    reason: opts.reason || null,
    emailHash: originalHash,
    blockedEmail: opts.blockEmail,
    kept: ["subscription", "track purchases", "certificate verification records (name removed)", "learning records (anonymous)"],
    removed: done,
  });
  // Team & Roles: the owner hears about every learner deletion.
  void import("@/lib/admin/team/alerts")
    .then(({ sendOwnerAlert }) =>
      sendOwnerAlert("learner_delete", `${session.user.name || session.user.email} deleted a learner account.`, [
        ["By", session.user.email],
        ["Learner id", id],
        ["Reason", opts.reason || null],
        ["Email blocked", opts.blockEmail ? "yes" : "no"],
      ]),
    )
    .catch(() => {});
  return { ok: true, message: "Account deleted and anonymised. Financial and certificate records were kept without personal data." };
}
