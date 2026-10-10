// Reviews and testimonials: storage. Real reviews only, from people TIBLOGICS
// invited (signed links, lib/reviews/token.ts) or received elsewhere and added
// by staff with a note saying where. Staff approve or hide; nobody edits the
// words. Only approved reviews with the reviewer's consent are ever shown.
//
// Tables (runtime DDL, this project has no migrations; mirrored in
// prisma/schema.prisma and created by /api/cron/db-prepare):
//   Testimonial   one row per review; emails stored lower case (CHECK), one
//                 review per (email, source) (unique index)
//   ReviewInvite  one row per invited (email, source): never invite twice
import { randomUUID } from "crypto";
import prisma from "@/lib/prisma";
import { cachedPublicData, invalidatePublicData } from "@/lib/cache/public-data";
import { firstNameOf, logSafe, type AdminReview, type PublicReview, type ReviewSource, type ReviewStatus } from "./types";

const STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS "Testimonial" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "company" TEXT,
    "quote" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "source" TEXT NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'en',
    "email" TEXT NOT NULL,
    "consentPublish" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "addedByStaff" BOOLEAN NOT NULL DEFAULT false,
    "staffNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    CONSTRAINT "Testimonial_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Testimonial_email_lower_check" CHECK ("email" = lower("email")),
    CONSTRAINT "Testimonial_rating_check" CHECK ("rating" BETWEEN 1 AND 5)
  )`,
  // One review per person and source. Emails are stored lower case (CHECK
  // above), so this is the rule on (lower(email), source).
  `CREATE UNIQUE INDEX IF NOT EXISTS "Testimonial_email_source_key" ON "Testimonial"("email", "source")`,
  `CREATE INDEX IF NOT EXISTS "Testimonial_status_source_idx" ON "Testimonial"("status", "source")`,
  `CREATE TABLE IF NOT EXISTS "ReviewInvite" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'en',
    "via" TEXT NOT NULL,
    "refId" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ReviewInvite_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ReviewInvite_email_lower_check" CHECK ("email" = lower("email"))
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "ReviewInvite_email_source_key" ON "ReviewInvite"("email", "source")`,
];

let ready: Promise<void> | null = null;

/** Creates the tables once per process. */
export function ensureReviewTables(): Promise<void> {
  ready ??= (async () => {
    for (const sql of STATEMENTS) await prisma.$executeRawUnsafe(sql);
  })().catch((err) => {
    ready = null;
    throw err;
  });
  return ready;
}

export const normEmail = (e: string) => e.trim().toLowerCase();

interface Row {
  id: string;
  name: string;
  role: string;
  company: string | null;
  quote: string;
  rating: number;
  source: ReviewSource;
  locale: string;
  email: string;
  consentPublish: boolean;
  status: ReviewStatus;
  featured: boolean;
  addedByStaff: boolean;
  staffNote: string | null;
  createdAt: Date;
  approvedAt: Date | null;
  approvedBy: string | null;
}

const toAdmin = (r: Row): AdminReview => ({
  ...r,
  rating: Number(r.rating),
  createdAt: r.createdAt.toISOString(),
  approvedAt: r.approvedAt ? r.approvedAt.toISOString() : null,
});

// ── Staff ────────────────────────────────────────────────────────────────

export async function listReviews(status: ReviewStatus): Promise<AdminReview[]> {
  await ensureReviewTables();
  const rows = await prisma.$queryRawUnsafe<Row[]>(
    `SELECT * FROM "Testimonial" WHERE "status" = $1 ORDER BY "featured" DESC, COALESCE("approvedAt", "createdAt") DESC LIMIT 500`,
    status,
  );
  return rows.map(toAdmin);
}

export async function reviewCounts(): Promise<Record<ReviewStatus, number>> {
  await ensureReviewTables();
  const rows = await prisma.$queryRawUnsafe<Array<{ status: string; n: number }>>(
    `SELECT "status", COUNT(*)::int AS n FROM "Testimonial" GROUP BY "status"`,
  );
  const out: Record<ReviewStatus, number> = { pending: 0, approved: 0, hidden: 0 };
  for (const r of rows) if (r.status in out) out[r.status as ReviewStatus] = Number(r.n);
  return out;
}

export async function getReview(id: string): Promise<AdminReview | null> {
  await ensureReviewTables();
  const rows = await prisma.$queryRawUnsafe<Row[]>(`SELECT * FROM "Testimonial" WHERE "id" = $1`, id);
  return rows[0] ? toAdmin(rows[0]) : null;
}

export async function reviewExists(email: string, source: ReviewSource): Promise<boolean> {
  await ensureReviewTables();
  const rows = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
    `SELECT "id" FROM "Testimonial" WHERE "email" = $1 AND "source" = $2 LIMIT 1`,
    normEmail(email),
    source,
  );
  return rows.length > 0;
}

export class DuplicateReviewError extends Error {
  constructor() {
    super("duplicate");
  }
}

export interface NewReview {
  name: string;
  role: string;
  company: string | null;
  quote: string;
  rating: number;
  source: ReviewSource;
  locale: string;
  email: string;
  consentPublish: boolean;
  addedByStaff: boolean;
  staffNote: string | null;
}

/** Inserts a pending review. Throws DuplicateReviewError on a second review for the same email and source. */
export async function createReview(r: NewReview): Promise<string> {
  await ensureReviewTables();
  const id = randomUUID();
  const rows = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
    `INSERT INTO "Testimonial" ("id","name","role","company","quote","rating","source","locale","email","consentPublish","status","addedByStaff","staffNote")
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'pending',$11,$12)
     ON CONFLICT ("email","source") DO NOTHING RETURNING "id"`,
    id, r.name, r.role, r.company, r.quote, r.rating, r.source, r.locale, normEmail(r.email), r.consentPublish, r.addedByStaff, r.staffNote,
  );
  if (!rows[0]) throw new DuplicateReviewError();
  return id;
}

export type ReviewAction = "approve" | "hide" | "feature" | "unfeature";

export class ReviewActionError extends Error {
  constructor(message: string, public status = 409) {
    super(message);
  }
}

/** Approve, hide, feature or unfeature. Never touches the reviewer's words. */
export async function applyReviewAction(id: string, action: ReviewAction, actor: string): Promise<AdminReview> {
  const r = await getReview(id);
  if (!r) throw new ReviewActionError("Review not found", 404);
  if (action === "approve") {
    if (!r.consentPublish) throw new ReviewActionError("The reviewer did not agree to publication, so this review stays private.");
    await prisma.$executeRawUnsafe(
      `UPDATE "Testimonial" SET "status" = 'approved', "approvedAt" = CURRENT_TIMESTAMP, "approvedBy" = $2 WHERE "id" = $1`,
      id, actor.slice(0, 200),
    );
  } else if (action === "hide") {
    await prisma.$executeRawUnsafe(`UPDATE "Testimonial" SET "status" = 'hidden', "featured" = false WHERE "id" = $1`, id);
  } else {
    if (action === "feature" && r.status !== "approved") throw new ReviewActionError("Approve the review before featuring it.");
    await prisma.$executeRawUnsafe(`UPDATE "Testimonial" SET "featured" = $2 WHERE "id" = $1`, id, action === "feature");
  }
  // The write itself drops the cache (lib/cache/public-data.ts watches the
  // table); this makes it explicit and immediate on every instance.
  invalidatePublicData("reviews");
  return (await getReview(id))!;
}

// ── Public ───────────────────────────────────────────────────────────────

export type ReviewScope = "site" | "arfa";

export interface PublicReviewSet {
  items: PublicReview[];
  /** All approved, published reviews in the scope (not only those shown). */
  count: number;
  average: number;
}

const SHOWN = 6;

/**
 * Approved reviews whose author agreed to publication: the home page shows
 * clients (every source but ARFA), the Learning Box shows ARFA learners.
 * Featured first, then the most recently approved. Cached; any write to
 * Testimonial drops the cache.
 */
export async function publicReviews(scope: ReviewScope): Promise<PublicReviewSet> {
  try {
    // Errors are not cached: a failed read shows nothing now and retries next time.
    return await cachedPublicData("reviews", `public:${scope}`, async () => {
      await ensureReviewTables();
      const where = `"status" = 'approved' AND "consentPublish" = true AND "source" ${scope === "arfa" ? "= 'arfa'" : "<> 'arfa'"}`;
      const [rows, agg] = await Promise.all([
        prisma.$queryRawUnsafe<Row[]>(
          `SELECT "id","name","role","company","quote","rating","source","locale","approvedAt" FROM "Testimonial" WHERE ${where}
           ORDER BY "featured" DESC, "approvedAt" DESC NULLS LAST LIMIT ${SHOWN}`,
        ),
        prisma.$queryRawUnsafe<Array<{ n: number; avg: number | null }>>(
          `SELECT COUNT(*)::int AS n, AVG("rating")::float AS avg FROM "Testimonial" WHERE ${where}`,
        ),
      ]);
      return {
        items: rows.map((r) => ({
          id: r.id,
          firstName: firstNameOf(r.name),
          role: r.role,
          company: r.company,
          quote: r.quote,
          rating: Number(r.rating),
          source: r.source,
          locale: r.locale,
          approvedAt: (r.approvedAt ?? new Date()).toISOString(),
        })),
        count: Number(agg[0]?.n ?? 0),
        average: Number(agg[0]?.avg ?? 0),
      };
    });
  } catch (err) {
    console.error("[reviews] public read failed", logSafe(err));
    return { items: [], count: 0, average: 0 };
  }
}

// ── Invites ──────────────────────────────────────────────────────────────

export interface InviteRecord {
  email: string;
  source: ReviewSource;
  name: string;
  locale: string;
  via: string;
  createdAt: Date;
}

export async function findInvite(email: string, source: ReviewSource): Promise<InviteRecord | null> {
  await ensureReviewTables();
  const rows = await prisma.$queryRawUnsafe<InviteRecord[]>(
    `SELECT "email","source","name","locale","via","createdAt" FROM "ReviewInvite" WHERE "email" = $1 AND "source" = $2`,
    normEmail(email),
    source,
  );
  return rows[0] ?? null;
}

/**
 * Claims the one invite for (email, source). True when this call claimed it,
 * false when that person was already invited (or already left a review).
 * Callers send the email after claiming and release the claim if sending fails.
 */
export async function claimInvite(i: { email: string; name: string; source: ReviewSource; locale: string; via: string; refId?: string | null; createdBy?: string | null }): Promise<boolean> {
  await ensureReviewTables();
  if (await reviewExists(i.email, i.source)) return false;
  const rows = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
    `INSERT INTO "ReviewInvite" ("id","email","source","name","locale","via","refId","createdBy") VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     ON CONFLICT ("email","source") DO NOTHING RETURNING "id"`,
    randomUUID(), normEmail(i.email), i.source, i.name.slice(0, 120), i.locale, i.via, i.refId ?? null, i.createdBy ?? null,
  );
  return rows.length > 0;
}

/** Undo a claim whose email could not be sent, so a later attempt can try again. */
export async function releaseInvite(email: string, source: ReviewSource): Promise<void> {
  await prisma.$executeRawUnsafe(`DELETE FROM "ReviewInvite" WHERE "email" = $1 AND "source" = $2`, normEmail(email), source).catch(() => {});
}
