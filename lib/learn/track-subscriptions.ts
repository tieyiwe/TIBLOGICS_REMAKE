import type Stripe from "stripe";
import prisma from "@/lib/prisma";
import { SEPARATE_MONTHLY_SLUGS } from "./track-monthly";
import { YOUTH_SLUGS } from "./youth";

// One track on its own monthly plan (lib/learn/track-monthly.ts): the
// subscriptions, and which tracks the all-tracks plan leaves out.
//
// Tables (runtime DDL, also in prisma/schema.prisma and dbprep):
//   TrackSubscription                 one row per Stripe subscription
//   LearnSubscription.allTracksLegacy the all-tracks plan still includes the
//                                     separately sold tracks (subscribers from
//                                     before the split, marked once)

const SPLIT_KEY = "learn.track-monthly.split";

let ready: Promise<void> | null = null;
export function ensureTrackSubscriptionTables(): Promise<void> {
  ready ??= (async () => {
    await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "TrackSubscription" (
      "id" TEXT PRIMARY KEY,
      "studentId" TEXT NOT NULL REFERENCES "Student"("id") ON DELETE CASCADE,
      "trackId" TEXT NOT NULL,
      "stripeSubscriptionId" TEXT NOT NULL UNIQUE,
      "stripeCustomerId" TEXT,
      "status" TEXT NOT NULL,
      "currentPeriodEnd" TIMESTAMP(3),
      "graceUntil" TIMESTAMP(3),
      "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "TrackSubscription_studentId_idx" ON "TrackSubscription" ("studentId")`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "LearnSubscription" ADD COLUMN IF NOT EXISTS "allTracksLegacy" BOOLEAN NOT NULL DEFAULT false`);
    // Once per database: everyone already on the all-tracks plan keeps the
    // tracks that are now sold separately.
    const done = await prisma.adminSettings.findUnique({ where: { key: SPLIT_KEY } }).catch(() => null);
    if (!done) {
      const n = await prisma.$executeRawUnsafe(
        `UPDATE "LearnSubscription" SET "allTracksLegacy" = true WHERE "status" IN ('active','trialing','past_due') AND "plan" IN ('monthly','annual')`,
      );
      await prisma.adminSettings.upsert({
        where: { key: SPLIT_KEY },
        create: { key: SPLIT_KEY, value: JSON.stringify({ at: new Date().toISOString(), grandfathered: n }) },
        update: {},
      });
    }
  })().catch((err) => {
    ready = null;
    throw err;
  });
  return ready;
}

// Track ids of the separately sold tracks (slugs are fixed in code).
let idsCache: { at: number; ids: string[] } | null = null;
export async function separateMonthlyTrackIds(): Promise<string[]> {
  if (idsCache && Date.now() - idsCache.at < 300_000) return idsCache.ids;
  const rows = await prisma.learnTrack.findMany({ where: { slug: { in: SEPARATE_MONTHLY_SLUGS } }, select: { id: true } }).catch(() => null);
  if (!rows) return idsCache?.ids ?? [];
  idsCache = { at: Date.now(), ids: rows.map((r) => r.id) };
  return idsCache.ids;
}

// The AI-Empowered Youth lanes (lib/learn/youth.ts), by id.
let youthCache: { at: number; ids: string[] } | null = null;
export async function youthTrackIds(): Promise<string[]> {
  if (youthCache && Date.now() - youthCache.at < 300_000) return youthCache.ids;
  const rows = await prisma.learnTrack.findMany({ where: { slug: { in: [...YOUTH_SLUGS] } }, select: { id: true } }).catch(() => null);
  if (!rows) return youthCache?.ids ?? [];
  youthCache = { at: Date.now(), ids: rows.map((r) => r.id) };
  return youthCache.ids;
}

/** One youth lane owned or subscribed opens the other lane too. */
export function withYouthCompanions(ids: string[], youth: string[]): string[] {
  return ids.some((id) => youth.includes(id)) ? [...new Set([...ids, ...youth])] : ids;
}

/** Tracks open through their own monthly plan: active, trialing, or past due inside the 7-day grace. */
export async function subscribedTrackIds(studentId: string): Promise<string[]> {
  await ensureTrackSubscriptionTables().catch(() => {});
  const rows = await prisma.trackSubscription
    .findMany({ where: { studentId, status: { in: ["active", "trialing", "past_due"] } }, select: { trackId: true, status: true, graceUntil: true } })
    .catch(() => []);
  const now = Date.now();
  return [...new Set(rows.filter((r) => r.status !== "past_due" || (r.graceUntil && r.graceUntil.getTime() > now)).map((r) => r.trackId))];
}

/** Webhook: create or update the row for a track's monthly subscription. */
export async function upsertTrackSubscription(sub: Stripe.Subscription, ids?: { studentId?: string | null; trackId?: string | null }): Promise<void> {
  const studentId = ids?.studentId || sub.metadata?.studentId;
  const trackId = ids?.trackId || sub.metadata?.trackId;
  if (!studentId || !trackId) return;
  await ensureTrackSubscriptionTables();
  // First payment not settled: nothing granted (as for the all-tracks plan).
  if (sub.status === "incomplete") return;
  const raw = sub.status;
  const status = raw === "active" || raw === "trialing" || raw === "past_due" ? raw : raw === "canceled" || raw === "incomplete_expired" || raw === "unpaid" ? "canceled" : "past_due";
  const prev = await prisma.trackSubscription.findUnique({ where: { stripeSubscriptionId: sub.id } }).catch(() => null);
  const graceUntil =
    status === "past_due" ? (prev?.status === "past_due" && prev.graceUntil ? prev.graceUntil : new Date(Date.now() + 7 * 86_400_000)) : null;
  const periodEnd = (sub as unknown as { current_period_end?: number }).current_period_end;
  const data = {
    studentId,
    trackId,
    // A sponsor's plan is the sponsor's customer, not the young person's.
    stripeCustomerId: sub.metadata?.product === "youth-sponsor" ? null : typeof sub.customer === "string" ? sub.customer : sub.customer?.id ?? null,
    status,
    currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
    graceUntil,
    cancelAtPeriodEnd: !!sub.cancel_at_period_end,
    updatedAt: new Date(),
  };
  await prisma.trackSubscription.upsert({
    where: { stripeSubscriptionId: sub.id },
    create: { id: crypto.randomUUID(), stripeSubscriptionId: sub.id, ...data },
    update: data,
  });
}

/** Webhook: a renewal failed. Starts the 7-day grace once. */
export async function markTrackSubscriptionPastDue(subscriptionId: string): Promise<void> {
  await ensureTrackSubscriptionTables().catch(() => {});
  const row = await prisma.trackSubscription.findUnique({ where: { stripeSubscriptionId: subscriptionId } }).catch(() => null);
  if (!row || row.status === "canceled") return;
  if (row.status === "past_due" && row.graceUntil) return;
  await prisma.trackSubscription.update({
    where: { id: row.id },
    data: { status: "past_due", graceUntil: new Date(Date.now() + 7 * 86_400_000), updatedAt: new Date() },
  });
}

/** A Stripe customer id for the billing portal, from the learner's track plans. */
export async function trackSubscriptionCustomer(studentId: string): Promise<string | null> {
  await ensureTrackSubscriptionTables().catch(() => {});
  const [row, student] = await Promise.all([
    prisma.trackSubscription
      .findFirst({ where: { studentId, stripeCustomerId: { not: null } }, orderBy: { updatedAt: "desc" }, select: { stripeCustomerId: true } })
      .catch(() => null),
    prisma.student.findUnique({ where: { id: studentId }, select: { email: true } }).catch(() => null),
  ]);
  const customerId = row?.stripeCustomerId ?? null;
  if (!customerId) return null;
  // A sponsored young person's plan is billed to the SPONSOR's customer: it
  // must never open the sponsor's billing portal (cards, invoices, address)
  // or bill the young person's own checkouts. Only a customer with this
  // learner's own email is theirs.
  const stripe = (await import("@/lib/stripe")).default;
  const customer = await stripe.customers.retrieve(customerId).catch(() => null);
  const email = customer && !("deleted" in customer && customer.deleted) ? (customer as { email?: string | null }).email : null;
  return email && student?.email && email.trim().toLowerCase() === student.email.trim().toLowerCase() ? customerId : null;
}
