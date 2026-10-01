import prisma from "@/lib/prisma";

// Creates the team tables (Team, TeamMember, TeamAssignment) if they are
// missing, once per process, the same way lib/learn/method/db.ts does. This
// project has no migrations: the statements mirror the models at the end of
// prisma/schema.prisma, made idempotent. Keep the two in step.
//
// The models have no Prisma relations (so they never edit Student or the
// other shared models); the foreign keys live here. Members and assignments
// go when their team, learner or track is deleted. Team.ownerStudentId has no
// foreign key on purpose: deleting an account must not silently drop a paid
// team record that Stripe still bills.
//
// Two helper tables have no Prisma model on purpose (prisma/schema.prisma is
// shared; these are read with raw SQL in ./plan.ts and ./claims.ts):
//   TeamInvitePlan  what an invitation carries until it is accepted: the
//                   invitee's name, role, the tracks to assign (with a due
//                   date) and the language of the email. One row per seat row.
//   TeamEmailClaim  claim-before-send keys for team emails (weekly digest),
//                   so a retried or overlapping cron run never sends twice.

const STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS "Team" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ownerStudentId" TEXT NOT NULL,
    "seats" INTEGER NOT NULL DEFAULT 5,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "seatPriceCents" INTEGER,
    "comped" BOOLEAN NOT NULL DEFAULT false,
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "stripeCheckoutSessionId" TEXT,
    "currentPeriodEnd" TIMESTAMP(3),
    "graceUntil" TIMESTAMP(3),
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "settings" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE TABLE IF NOT EXISTS "TeamMember" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "studentId" TEXT,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "status" TEXT NOT NULL DEFAULT 'invited',
    "inviteTokenHash" TEXT,
    "inviteExpiresAt" TIMESTAMP(3),
    "invitedById" TEXT,
    "invitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "joinedAt" TIMESTAMP(3),
    "removedAt" TIMESTAMP(3),
    CONSTRAINT "TeamMember_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE TABLE IF NOT EXISTS "TeamAssignment" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "trackId" TEXT NOT NULL,
    "dueAt" TIMESTAMP(3),
    "assignedById" TEXT,
    "lastRemindedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TeamAssignment_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE TABLE IF NOT EXISTS "TeamInvitePlan" (
    "memberId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "name" TEXT,
    "role" TEXT NOT NULL DEFAULT 'member',
    "trackIds" JSONB NOT NULL DEFAULT '[]',
    "dueAt" TIMESTAMP(3),
    "locale" TEXT,
    "source" TEXT NOT NULL DEFAULT 'invite',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TeamInvitePlan_pkey" PRIMARY KEY ("memberId")
  )`,
  `CREATE TABLE IF NOT EXISTS "TeamEmailClaim" (
    "key" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TeamEmailClaim_pkey" PRIMARY KEY ("key")
  )`,
  `CREATE INDEX IF NOT EXISTS "TeamInvitePlan_teamId_idx" ON "TeamInvitePlan"("teamId")`,
  `CREATE INDEX IF NOT EXISTS "TeamEmailClaim_teamId_idx" ON "TeamEmailClaim"("teamId")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Team_stripeSubscriptionId_key" ON "Team"("stripeSubscriptionId")`,
  `CREATE INDEX IF NOT EXISTS "Team_ownerStudentId_idx" ON "Team"("ownerStudentId")`,
  `CREATE INDEX IF NOT EXISTS "Team_status_idx" ON "Team"("status")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "TeamMember_teamId_email_key" ON "TeamMember"("teamId", "email")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "TeamMember_inviteTokenHash_key" ON "TeamMember"("inviteTokenHash")`,
  `CREATE INDEX IF NOT EXISTS "TeamMember_studentId_idx" ON "TeamMember"("studentId")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "TeamAssignment_teamId_studentId_trackId_key" ON "TeamAssignment"("teamId", "studentId", "trackId")`,
  `CREATE INDEX IF NOT EXISTS "TeamAssignment_studentId_idx" ON "TeamAssignment"("studentId")`,
  ...[
    ["TeamMember_teamId_fkey", `ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE`],
    ["TeamMember_studentId_fkey", `ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE`],
    ["TeamAssignment_teamId_fkey", `ALTER TABLE "TeamAssignment" ADD CONSTRAINT "TeamAssignment_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE`],
    ["TeamAssignment_studentId_fkey", `ALTER TABLE "TeamAssignment" ADD CONSTRAINT "TeamAssignment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE`],
    ["TeamInvitePlan_memberId_fkey", `ALTER TABLE "TeamInvitePlan" ADD CONSTRAINT "TeamInvitePlan_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "TeamMember"("id") ON DELETE CASCADE ON UPDATE CASCADE`],
    ["TeamEmailClaim_teamId_fkey", `ALTER TABLE "TeamEmailClaim" ADD CONSTRAINT "TeamEmailClaim_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE`],
    ["TeamAssignment_trackId_fkey", `ALTER TABLE "TeamAssignment" ADD CONSTRAINT "TeamAssignment_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "LearnTrack"("id") ON DELETE CASCADE ON UPDATE CASCADE`],
  ].map(
    ([name, sql]) =>
      `DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '${name}') THEN ${sql}; END IF;
      END $$`,
  ),
];

let ready: Promise<void> | null = null;

/** Throws if the tables cannot be created; callers decide how to degrade. */
export function ensureTeamTables(): Promise<void> {
  ready ??= (async () => {
    for (const sql of STATEMENTS) await prisma.$executeRawUnsafe(sql);
  })().catch((err) => {
    ready = null;
    throw err;
  });
  return ready;
}

/** Same, but never throws: returns false when the tables are unavailable. */
export async function teamTablesReady(): Promise<boolean> {
  try {
    await ensureTeamTables();
    return true;
  } catch (err) {
    console.error("[learn/team] tables", err);
    return false;
  }
}
