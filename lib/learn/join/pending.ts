import prisma from "@/lib/prisma";
import { z } from "zod";
import { joinPath, type JoinChoice } from "./choice";

// The plan a learner chose on the one-page join flow, kept until they pay.
//
//  - "Finish your enrolment" card on /learn/subscribe and the dashboard.
//  - The welcome email. A learner who creates an account on the join page
//    does not get the plain welcome at once (welcomeDeferred): the payment
//    confirmation (webhook or success redirect) sends the purchase-aware one,
//    or, without a payment after about an hour, the cart-reminders cron sends
//    the "finish your enrolment" version. welcomeSentAt is claimed atomically,
//    so exactly one of them goes out.
//  - Existing learners who chose a plan on the join page and left get one
//    "finish your enrolment" reminder (reminderSentAt).
//
// This project has no migrations: the table is created here, once per
// process; the statements match the PendingEnrollment model at the end of
// prisma/schema.prisma. Keep the two in step.

const STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS "PendingEnrollment" (
    "studentId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "trackSlug" TEXT,
    "seats" INTEGER,
    "company" TEXT,
    "promoCode" TEXT,
    "welcomeDeferred" BOOLEAN NOT NULL DEFAULT false,
    "welcomeSentAt" TIMESTAMP(3),
    "reminderSentAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PendingEnrollment_pkey" PRIMARY KEY ("studentId")
  )`,
  `CREATE INDEX IF NOT EXISTS "PendingEnrollment_completedAt_updatedAt_idx" ON "PendingEnrollment"("completedAt", "updatedAt")`,
];

let ready: Promise<void> | null = null;

export function ensurePendingEnrollmentTable(): Promise<void> {
  ready ??= (async () => {
    for (const sql of STATEMENTS) await prisma.$executeRawUnsafe(sql);
  })().catch((err) => {
    ready = null;
    throw err;
  });
  return ready;
}

const Slug = z.string().trim().regex(/^[a-z0-9][a-z0-9-]{0,63}$/);

/** A choice from a request body. The server re-prices everything at checkout. */
export const ChoiceSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("track"), slug: Slug }),
  z.object({ kind: z.literal("monthly"), track: Slug.nullish() }),
  z.object({ kind: z.literal("team"), seats: z.number().int().min(1).max(500), company: z.string().trim().max(80).nullish() }),
]);

export type PendingRow = {
  studentId: string;
  kind: string;
  trackSlug: string | null;
  seats: number | null;
  company: string | null;
  promoCode: string | null;
  welcomeDeferred: boolean;
  welcomeSentAt: Date | null;
  reminderSentAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export function choiceOf(row: Pick<PendingRow, "kind" | "trackSlug" | "seats" | "company">): JoinChoice | null {
  if (row.kind === "track" && row.trackSlug) return { kind: "track", slug: row.trackSlug };
  if (row.kind === "monthly") return { kind: "monthly", track: row.trackSlug };
  if (row.kind === "team") return { kind: "team", seats: row.seats ?? 0, company: row.company };
  return null;
}

/**
 * Saves (or replaces) the learner's choice. deferWelcome is only ever turned
 * on, never off: a learner whose welcome is waiting keeps waiting for it.
 * Never throws.
 */
export async function savePendingChoice(
  studentId: string,
  choice: JoinChoice,
  opts: { deferWelcome?: boolean; promoCode?: string | null } = {},
): Promise<void> {
  try {
    await ensurePendingEnrollmentTable();
    const data = {
      kind: choice.kind,
      trackSlug: choice.kind === "track" ? choice.slug : choice.kind === "monthly" ? choice.track ?? null : null,
      seats: choice.kind === "team" ? choice.seats : null,
      company: choice.kind === "team" ? choice.company?.slice(0, 80) || null : null,
      promoCode: opts.promoCode ?? null,
      updatedAt: new Date(),
    };
    await prisma.pendingEnrollment.upsert({
      where: { studentId },
      create: { studentId, ...data, welcomeDeferred: !!opts.deferWelcome },
      update: { ...data, completedAt: null, ...(opts.deferWelcome ? { welcomeDeferred: true } : {}) },
    });
  } catch (err) {
    console.error("[learn/join] save choice", err);
  }
}

/** The learner's unfinished choice, or null. Never throws. */
export async function getPendingChoice(studentId: string): Promise<PendingRow | null> {
  try {
    await ensurePendingEnrollmentTable();
    const row = await prisma.pendingEnrollment.findUnique({ where: { studentId } });
    return row && !row.completedAt ? row : null;
  } catch (err) {
    console.error("[learn/join] read choice", err);
    return null;
  }
}

/** Learner dismissed the card ("not now"): the choice is closed without a purchase. */
export async function dismissPendingChoice(studentId: string): Promise<void> {
  await ensurePendingEnrollmentTable().catch(() => {});
  await prisma.pendingEnrollment.updateMany({ where: { studentId, completedAt: null }, data: { completedAt: new Date() } }).catch(() => {});
}

export type CompletedPurchase = { kind: "track"; trackId: string } | { kind: "monthly"; track?: string | null } | { kind: "team" };

/**
 * A payment was confirmed (webhook or success redirect, in either order):
 * closes the pending choice and, when this learner's welcome was deferred,
 * sends the purchase-aware welcome. Idempotent and never throws: the welcome
 * goes out at most once, whoever gets here first.
 */
export async function completePendingEnrollment(studentId: string, purchase: CompletedPurchase): Promise<void> {
  try {
    await ensurePendingEnrollmentTable();
    const row = await prisma.pendingEnrollment.findUnique({ where: { studentId } });
    if (!row) return;
    if (!row.completedAt) {
      await prisma.pendingEnrollment.updateMany({ where: { studentId, completedAt: null }, data: { completedAt: new Date() } });
    }
    if (!row.welcomeDeferred || row.welcomeSentAt) return;
    const claimed = await prisma.pendingEnrollment.updateMany({
      where: { studentId, welcomeDeferred: true, welcomeSentAt: null },
      data: { welcomeSentAt: new Date() },
    });
    if (!claimed.count) return;
    await sendPurchased(studentId, purchase, row.trackSlug);
  } catch (err) {
    console.error("[learn/join] complete", err);
  }
}

async function trackInfo(where: { id: string } | { slug: string }) {
  const track = await prisma.learnTrack
    .findUnique({ where, select: { id: true, slug: true, title: true, titleFr: true } })
    .catch(() => null);
  if (!track) return null;
  const first = await prisma.lesson
    .findFirst({
      where: { module: { trackId: track.id } },
      orderBy: [{ module: { sortOrder: "asc" } }, { sortOrder: "asc" }],
      select: { id: true },
    })
    .catch(() => null);
  return { ...track, firstLessonId: first?.id ?? null };
}

async function sendPurchased(studentId: string, purchase: CompletedPurchase, chosenSlug: string | null) {
  const student = await prisma.student.findUnique({ where: { id: studentId }, select: { email: true, name: true, locale: true } });
  if (!student) return;
  const { sendJoinWelcomeEmail } = await import("@/lib/learn/emails");
  if (purchase.kind === "team") {
    await sendJoinWelcomeEmail({ ...student, state: { kind: "purchased", product: "team" } });
    return;
  }
  const slug = purchase.kind === "monthly" ? purchase.track ?? chosenSlug : null;
  const track = purchase.kind === "track" ? await trackInfo({ id: purchase.trackId }) : slug ? await trackInfo({ slug }) : null;
  await sendJoinWelcomeEmail({
    ...student,
    state: {
      kind: "purchased",
      product: purchase.kind,
      track: track ? { slug: track.slug, title: (student.locale === "fr" && track.titleFr) || track.title, firstLessonId: track.firstLessonId } : null,
    },
  });
}

const HOUR = 60 * 60 * 1000;

/**
 * Cart-reminders cron (hourly). For choices left unpaid for about an hour:
 *  - a deferred welcome goes out as the "finish your enrolment" welcome
 *    (or the purchased one, when access arrived by another route);
 *  - other learners get one "finish your enrolment" reminder.
 * Choices older than 7 days are left alone. Never throws.
 */
export async function sweepPendingEnrollments(now = new Date()): Promise<{ checked: number; welcomes: number; reminders: number; completed: number }> {
  const out = { checked: 0, welcomes: 0, reminders: 0, completed: 0 };
  try {
    await ensurePendingEnrollmentTable();
    const rows = await prisma.pendingEnrollment.findMany({
      where: {
        completedAt: null,
        updatedAt: { lt: new Date(now.getTime() - HOUR), gt: new Date(now.getTime() - 7 * 24 * HOUR) },
        OR: [{ welcomeDeferred: true, welcomeSentAt: null }, { reminderSentAt: null }],
      },
      orderBy: { updatedAt: "asc" },
      take: 100,
    });
    out.checked = rows.length;
    if (!rows.length) return out;
    const { getAccess } = await import("@/lib/learn/session");
    const { sendJoinWelcomeEmail } = await import("@/lib/learn/emails");
    for (const row of rows) {
      try {
        const student = await prisma.student.findUnique({ where: { id: row.studentId }, select: { email: true, name: true, locale: true } });
        if (!student) {
          await prisma.pendingEnrollment.delete({ where: { studentId: row.studentId } }).catch(() => {});
          continue;
        }
        const choice = choiceOf(row);
        // Paid by another route (subscribe page, webhook before this row):
        // close it, and send the purchased welcome if it is still owed.
        const access = await getAccess(row.studentId);
        const track = row.trackSlug ? await trackInfo({ slug: row.trackSlug }) : null;
        const done =
          (choice?.kind === "track" && track && (access.all || access.purchased.includes(track.id))) ||
          (choice?.kind === "monthly" && access.all) ||
          (choice?.kind === "team" && access.entitlement.team?.role === "owner");
        if (done || !choice) {
          const purchase: CompletedPurchase =
            choice?.kind === "track" && track ? { kind: "track", trackId: track.id } : choice?.kind === "team" ? { kind: "team" } : { kind: "monthly", track: row.trackSlug };
          await completePendingEnrollment(row.studentId, purchase);
          out.completed++;
          continue;
        }
        const pending = {
          kind: "pending" as const,
          choice,
          track: track ? { slug: track.slug, title: (student.locale === "fr" && track.titleFr) || track.title } : null,
          resumePath: joinPath(choice, { code: row.promoCode }),
        };
        if (row.welcomeDeferred && !row.welcomeSentAt) {
          const claimed = await prisma.pendingEnrollment.updateMany({
            where: { studentId: row.studentId, welcomeSentAt: null, completedAt: null },
            data: { welcomeSentAt: new Date(), reminderSentAt: new Date() },
          });
          if (!claimed.count) continue;
          await sendJoinWelcomeEmail({ ...student, state: pending });
          out.welcomes++;
        } else if (!row.reminderSentAt) {
          const claimed = await prisma.pendingEnrollment.updateMany({
            where: { studentId: row.studentId, reminderSentAt: null, completedAt: null },
            data: { reminderSentAt: new Date() },
          });
          if (!claimed.count) continue;
          await sendJoinWelcomeEmail({ ...student, state: { ...pending, reminderOnly: true } });
          out.reminders++;
        }
      } catch (err) {
        console.error("[learn/join] sweep row", row.studentId, err);
      }
    }
  } catch (err) {
    console.error("[learn/join] sweep", err);
  }
  return out;
}
