// Learner notifications: short notices from the ARFA team ("New track
// released", "We got your message") shown at /learn/inbox?tab=notifications
// and counted in the nav bell next to unread Inbox conversations.
//
//   LearnerNotification  one notice for one learner (title, body, optional
//                        link button); readAt null = unread.
//
// Notification campaigns reuse the communications engine (CommsCampaign with
// format = "notification"; the extra columns are added here). Created at
// runtime once per process; mirrors prisma/schema.prisma. Raw SQL so the
// feature never depends on a regenerated Prisma client.
import { randomUUID } from "crypto";
import prisma from "@/lib/prisma";
import { ensureCommsTables } from "./db";

const STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS "LearnerNotification" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "campaignId" TEXT,
    "kind" TEXT NOT NULL DEFAULT 'service',
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL DEFAULT '',
    "linkUrl" TEXT,
    "linkLabel" TEXT,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LearnerNotification_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE INDEX IF NOT EXISTS "LearnerNotification_studentId_createdAt_idx" ON "LearnerNotification"("studentId", "createdAt")`,
  `CREATE INDEX IF NOT EXISTS "LearnerNotification_studentId_readAt_idx" ON "LearnerNotification"("studentId", "readAt")`,
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'LearnerNotification_studentId_fkey') THEN
      ALTER TABLE "LearnerNotification" ADD CONSTRAINT "LearnerNotification_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
  END $$`,
  // Notification campaigns (communications center).
  `ALTER TABLE "CommsCampaign" ADD COLUMN IF NOT EXISTS "format" TEXT NOT NULL DEFAULT 'message'`,
  `ALTER TABLE "CommsCampaign" ADD COLUMN IF NOT EXISTS "linkUrl" TEXT`,
  `ALTER TABLE "CommsCampaign" ADD COLUMN IF NOT EXISTS "linkLabel" TEXT`,
  `ALTER TABLE "CommsCampaign" ADD COLUMN IF NOT EXISTS "linkLabelFr" TEXT`,
];

let ready: Promise<void> | null = null;

export function ensureNotificationTables(): Promise<void> {
  ready ??= (async () => {
    await ensureCommsTables();
    for (const sql of STATEMENTS) await prisma.$executeRawUnsafe(sql);
  })().catch((err) => {
    ready = null;
    throw err;
  });
  return ready;
}

export const NOTIF_TITLE_MAX = 140;
export const NOTIF_BODY_MAX = 1000;
export const NOTIF_LINK_LABEL_MAX = 40;

/**
 * A link button target: a same-site path ("/learn/track/x") or an https URL.
 * Anything else (javascript:, data:, protocol-relative "//host") is refused.
 */
export function safeLink(raw: string | null | undefined): string | null {
  const v = (raw ?? "").trim();
  if (!v || v.length > 500 || /[\s"'<>\\]/.test(v)) return null;
  if (/^\/(?![/\\])/.test(v)) return v;
  try {
    const u = new URL(v);
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : null;
  } catch {
    return null;
  }
}

export interface NotificationRow {
  id: string;
  studentId: string;
  campaignId: string | null;
  kind: string;
  title: string;
  body: string;
  linkUrl: string | null;
  linkLabel: string | null;
  readAt: Date | null;
  createdAt: Date;
}

export async function createNotification(n: {
  studentId: string;
  title: string;
  body?: string;
  linkUrl?: string | null;
  linkLabel?: string | null;
  kind?: string;
  campaignId?: string | null;
}): Promise<string> {
  await ensureNotificationTables();
  const id = randomUUID();
  await prisma.$executeRaw`
    INSERT INTO "LearnerNotification" ("id", "studentId", "campaignId", "kind", "title", "body", "linkUrl", "linkLabel", "createdAt")
    VALUES (${id}, ${n.studentId}, ${n.campaignId ?? null}, ${n.kind ?? "service"}, ${n.title.slice(0, NOTIF_TITLE_MAX)},
            ${(n.body ?? "").slice(0, NOTIF_BODY_MAX * 2)}, ${safeLink(n.linkUrl)}, ${n.linkLabel ? n.linkLabel.slice(0, NOTIF_LINK_LABEL_MAX) : null}, now())`;
  return id;
}

export async function listNotifications(studentId: string, limit = 100): Promise<NotificationRow[]> {
  await ensureNotificationTables();
  return prisma.$queryRaw<NotificationRow[]>`
    SELECT * FROM "LearnerNotification" WHERE "studentId" = ${studentId} ORDER BY "createdAt" DESC LIMIT ${limit}`;
}

/** Unread notices for the bell. Never throws. */
export async function unreadNotifications(studentId: string): Promise<number> {
  try {
    await ensureNotificationTables();
    const r = await prisma.$queryRaw<Array<{ n: bigint | number }>>`
      SELECT count(*) AS n FROM "LearnerNotification" WHERE "studentId" = ${studentId} AND "readAt" IS NULL`;
    return Number(r[0]?.n ?? 0);
  } catch (err) {
    console.error("[notifications] unread", err);
    return 0;
  }
}

/** Mark one (own) notice read, or all of them with id = null. Returns rows changed. */
export async function markNotificationsRead(studentId: string, id: string | null): Promise<number> {
  await ensureNotificationTables();
  return id
    ? prisma.$executeRaw`UPDATE "LearnerNotification" SET "readAt" = now() WHERE "studentId" = ${studentId} AND "id" = ${id} AND "readAt" IS NULL`
    : prisma.$executeRaw`UPDATE "LearnerNotification" SET "readAt" = now() WHERE "studentId" = ${studentId} AND "readAt" IS NULL`;
}

/** Notification fields of a campaign (null for an ordinary message campaign). */
export async function campaignFormat(campaignId: string): Promise<{ format: string; linkUrl: string | null; linkLabel: string | null; linkLabelFr: string | null }> {
  await ensureNotificationTables();
  const r = await prisma.$queryRaw<Array<{ format: string; linkUrl: string | null; linkLabel: string | null; linkLabelFr: string | null }>>`
    SELECT "format", "linkUrl", "linkLabel", "linkLabelFr" FROM "CommsCampaign" WHERE "id" = ${campaignId}`;
  return r[0] ?? { format: "message", linkUrl: null, linkLabel: null, linkLabelFr: null };
}

export async function setCampaignFormat(campaignId: string, f: { format: string; linkUrl: string | null; linkLabel: string | null; linkLabelFr: string | null }) {
  await ensureNotificationTables();
  await prisma.$executeRaw`
    UPDATE "CommsCampaign" SET "format" = ${f.format}, "linkUrl" = ${f.linkUrl}, "linkLabel" = ${f.linkLabel}, "linkLabelFr" = ${f.linkLabelFr}
    WHERE "id" = ${campaignId}`;
}
