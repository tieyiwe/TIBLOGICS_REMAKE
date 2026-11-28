// Article engagement: storage and queries (comments, helpful votes, reports,
// reactions, confirmed guest commenters). See ./identity.ts for who may do
// what, ./text.ts for the text rules.
//
// Tables (runtime DDL, this project has no migrations; mirrored in
// prisma/schema.prisma and created by /api/cron/db-prepare):
//   ArticleComment, ArticleCommentVote, ArticleCommentReport,
//   ArticleReaction, ArticleCommenter
import { randomUUID } from "crypto";
import prisma from "@/lib/prisma";
import { cachedPublicData } from "@/lib/cache/public-data";
import {
  REACTIONS,
  REPORTS_TO_HOLD,
  type AdminComment,
  type AuthorKind,
  type CommentStatus,
  type EngageData,
  type PublicComment,
  type ReactionKind,
} from "./types";
import type { Viewer } from "./identity";

const STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS "ArticleComment" (
    "id" TEXT NOT NULL,
    "postSlug" TEXT NOT NULL,
    "parentId" TEXT,
    "authorKind" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "authorEmail" TEXT,
    "studentId" TEXT,
    "staffId" TEXT,
    "body" TEXT NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'en',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "heldReason" TEXT,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "helpfulCount" INTEGER NOT NULL DEFAULT 0,
    "reportCount" INTEGER NOT NULL DEFAULT 0,
    "notifyReplies" BOOLEAN NOT NULL DEFAULT false,
    "ipHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publishedAt" TIMESTAMP(3),
    "moderatedAt" TIMESTAMP(3),
    "moderatedBy" TEXT,
    CONSTRAINT "ArticleComment_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE INDEX IF NOT EXISTS "ArticleComment_postSlug_status_idx" ON "ArticleComment"("postSlug", "status")`,
  `CREATE INDEX IF NOT EXISTS "ArticleComment_status_createdAt_idx" ON "ArticleComment"("status", "createdAt")`,
  `CREATE INDEX IF NOT EXISTS "ArticleComment_parentId_idx" ON "ArticleComment"("parentId")`,
  `CREATE INDEX IF NOT EXISTS "ArticleComment_authorEmail_idx" ON "ArticleComment"("authorEmail")`,
  `CREATE TABLE IF NOT EXISTS "ArticleCommentVote" (
    "commentId" TEXT NOT NULL,
    "voterHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ArticleCommentVote_pkey" PRIMARY KEY ("commentId", "voterHash")
  )`,
  `CREATE TABLE IF NOT EXISTS "ArticleCommentReport" (
    "commentId" TEXT NOT NULL,
    "reporterHash" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ArticleCommentReport_pkey" PRIMARY KEY ("commentId", "reporterHash")
  )`,
  `CREATE TABLE IF NOT EXISTS "ArticleReaction" (
    "postSlug" TEXT NOT NULL,
    "voterHash" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ArticleReaction_pkey" PRIMARY KEY ("postSlug", "voterHash")
  )`,
  `CREATE INDEX IF NOT EXISTS "ArticleReaction_postSlug_idx" ON "ArticleReaction"("postSlug")`,
  `CREATE TABLE IF NOT EXISTS "ArticleCommenter" (
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "verifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "blocked" BOOLEAN NOT NULL DEFAULT false,
    "unsubscribed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastCommentAt" TIMESTAMP(3),
    CONSTRAINT "ArticleCommenter_pkey" PRIMARY KEY ("email")
  )`,
];

let ready: Promise<void> | null = null;

/** Creates the tables once per process. */
export function ensureEngageTables(): Promise<void> {
  ready ??= (async () => {
    for (const sql of STATEMENTS) await prisma.$executeRawUnsafe(sql);
  })().catch((err) => {
    ready = null;
    throw err;
  });
  return ready;
}

/** The article, if it is published. */
export async function publishedPost(slug: string) {
  if (!/^[a-z0-9-]{1,200}$/.test(slug)) return null;
  return prisma.blogPost.findFirst({ where: { slug, published: true }, select: { slug: true, title: true, author: true } });
}

const isAuthorName = (staffName: string, author: string) => {
  const a = author.trim().toLowerCase();
  const s = staffName.trim().toLowerCase();
  return s.length >= 3 && (a === s || a.startsWith(`${s} `));
};

/** Everything the article page shows under the article, for this viewer. */
export async function engageData(slug: string, postAuthor: string, viewer: Viewer, voterHash: string | null): Promise<EngageData> {
  await ensureEngageTables();
  const own =
    viewer.kind === "learner" ? { studentId: viewer.studentId } : viewer.kind === "verified" ? { authorEmail: viewer.email, authorKind: "guest" } : null;
  const rows = await prisma.articleComment.findMany({
    where: {
      postSlug: slug,
      OR: [{ status: { in: ["published", "deleted"] } }, ...(own ? [{ status: "pending", ...own }] : [])],
    },
    orderBy: { createdAt: "asc" },
    take: 500,
  });
  const ids = rows.map((r) => r.id);
  const [votes, reactions, mine] = await Promise.all([
    voterHash && ids.length ? prisma.articleCommentVote.findMany({ where: { voterHash, commentId: { in: ids } }, select: { commentId: true } }) : [],
    prisma.articleReaction.groupBy({ by: ["kind"], where: { postSlug: slug }, _count: { _all: true } }),
    voterHash ? prisma.articleReaction.findUnique({ where: { postSlug_voterHash: { postSlug: slug, voterHash } }, select: { kind: true } }) : null,
  ]);
  const voted = new Set(votes.map((v) => v.commentId));
  const isMine = (r: (typeof rows)[number]) =>
    (viewer.kind === "learner" && r.studentId === viewer.studentId) ||
    (viewer.kind === "verified" && r.authorKind === "guest" && r.authorEmail === viewer.email) ||
    (viewer.kind === "staff" && r.authorKind === "staff" && r.staffId === viewer.staffId);
  // A removed comment stays only as a placeholder above its replies.
  const liveParents = new Set(rows.filter((r) => r.parentId && r.status === "published").map((r) => r.parentId));
  const comments: PublicComment[] = rows
    .filter((r) => r.status !== "deleted" || (!r.parentId && liveParents.has(r.id)))
    .map((r) => {
      const isAuthor = r.authorKind === "staff" && isAuthorName(r.authorName, postAuthor);
      return {
      id: r.id,
      parentId: r.parentId,
      // The article's author signs with the byline's full name.
      name: r.status === "deleted" ? "" : isAuthor ? postAuthor : r.authorName,
      kind: r.authorKind as AuthorKind,
      isAuthor,
      body: r.status === "deleted" ? "" : r.body,
      createdAt: r.createdAt.toISOString(),
      helpful: r.helpfulCount,
      pinned: r.pinned,
      status: r.status as PublicComment["status"],
      voted: voted.has(r.id),
      mine: r.status !== "deleted" && isMine(r),
      };
    });
  const counts = Object.fromEntries(REACTIONS.map((k) => [k, 0])) as Record<ReactionKind, number>;
  for (const r of reactions) if ((REACTIONS as readonly string[]).includes(r.kind)) counts[r.kind as ReactionKind] = r._count._all;
  return {
    comments,
    total: rows.filter((r) => r.status === "published").length,
    reactions: { counts, mine: (mine?.kind as ReactionKind | undefined) ?? null },
    viewer: {
      kind: viewer.kind,
      name: viewer.kind === "anon" ? null : viewer.name,
      canModerate: viewer.kind === "staff" && viewer.canModerate,
    },
  };
}

export interface NewComment {
  postSlug: string;
  parentId: string | null;
  authorKind: AuthorKind;
  authorName: string;
  authorEmail: string | null;
  studentId: string | null;
  staffId: string | null;
  body: string;
  locale: string;
  status: "unconfirmed" | "pending" | "published";
  heldReason: string | null;
  notifyReplies: boolean;
  ipHash: string | null;
}

/** The top-level comment a reply belongs under (replies to replies join the same thread), or null if not replyable. */
export async function threadRoot(postSlug: string, parentId: string): Promise<string | null> {
  const p = await prisma.articleComment.findUnique({ where: { id: parentId }, select: { id: true, postSlug: true, parentId: true, status: true } });
  if (!p || p.postSlug !== postSlug || p.status !== "published") return null;
  if (!p.parentId) return p.id;
  const root = await prisma.articleComment.findUnique({ where: { id: p.parentId }, select: { id: true, status: true } });
  return root && (root.status === "published" || root.status === "deleted") ? root.id : null;
}

export async function createComment(c: NewComment) {
  await ensureEngageTables();
  // Guests who never opened their link: gone after a week.
  await prisma.articleComment.deleteMany({ where: { status: "unconfirmed", createdAt: { lt: new Date(Date.now() - 7 * 86_400_000) } } }).catch(() => {});
  return prisma.articleComment.create({
    data: { id: randomUUID(), ...c, publishedAt: c.status === "published" ? new Date() : null },
  });
}

export async function commenterState(email: string) {
  await ensureEngageTables();
  return prisma.articleCommenter.findUnique({ where: { email } });
}

/** Records (or refreshes) a confirmed commenter. */
export async function touchCommenter(email: string, name: string, notify?: boolean) {
  await prisma.articleCommenter.upsert({
    where: { email },
    create: { email, name, lastCommentAt: new Date() },
    update: { name, lastCommentAt: new Date(), ...(notify ? { unsubscribed: false } : {}) },
  });
}

/**
 * The guest opened their link: the comment goes up (or to staff if held).
 * Returns the comment, or null if the link no longer matches anything.
 */
export async function confirmComment(id: string, email: string) {
  await ensureEngageTables();
  const c = await prisma.articleComment.findUnique({ where: { id } });
  if (!c || c.authorEmail !== email) return null;
  if (c.status !== "unconfirmed") return { comment: c, changed: false };
  const status: CommentStatus = c.heldReason ? "pending" : "published";
  const updated = await prisma.articleComment.update({
    where: { id },
    data: { status, publishedAt: status === "published" ? new Date() : null },
  });
  return { comment: updated, changed: true };
}

/** Toggles the reader's "helpful" vote. Returns the new count and state, or null if the comment cannot be voted on. */
export async function toggleHelpful(commentId: string, voterHash: string): Promise<{ helpful: number; voted: boolean } | null> {
  await ensureEngageTables();
  const c = await prisma.articleComment.findUnique({ where: { id: commentId }, select: { status: true } });
  if (!c || c.status !== "published") return null;
  return prisma.$transaction(async (tx) => {
    const removed = await tx.articleCommentVote.deleteMany({ where: { commentId, voterHash } });
    if (removed.count === 0) await tx.articleCommentVote.create({ data: { commentId, voterHash } });
    const helpful = await tx.articleCommentVote.count({ where: { commentId } });
    await tx.articleComment.update({ where: { id: commentId }, data: { helpfulCount: helpful } });
    return { helpful, voted: removed.count === 0 };
  });
}

/** One report per reader. Returns whether the comment is now held for staff, or null if it cannot be reported. */
export async function reportComment(commentId: string, reporterHash: string, reason: string): Promise<{ held: boolean; isNew: boolean } | null> {
  await ensureEngageTables();
  const c = await prisma.articleComment.findUnique({ where: { id: commentId }, select: { status: true, authorKind: true } });
  if (!c || c.status !== "published") return null;
  const inserted = await prisma.$executeRaw`
    INSERT INTO "ArticleCommentReport" ("commentId", "reporterHash", "reason") VALUES (${commentId}, ${reporterHash}, ${reason})
    ON CONFLICT DO NOTHING`;
  if (inserted === 0) return { held: false, isNew: false };
  const reports = await prisma.articleCommentReport.count({ where: { commentId } });
  // Staff comments are never taken down by reports; staff see the reports.
  const hold = reports >= REPORTS_TO_HOLD && c.authorKind !== "staff";
  await prisma.articleComment.update({
    where: { id: commentId },
    data: { reportCount: reports, ...(hold ? { status: "pending", heldReason: "reports" } : {}) },
  });
  return { held: hold, isNew: true };
}

/** Sets or clears the reader's reaction. Returns the counts. */
export async function setReaction(postSlug: string, voterHash: string, kind: ReactionKind | null): Promise<Record<ReactionKind, number>> {
  await ensureEngageTables();
  if (kind) {
    await prisma.articleReaction.upsert({
      where: { postSlug_voterHash: { postSlug, voterHash } },
      create: { postSlug, voterHash, kind },
      update: { kind },
    });
  } else {
    await prisma.articleReaction.deleteMany({ where: { postSlug, voterHash } });
  }
  const rows = await prisma.articleReaction.groupBy({ by: ["kind"], where: { postSlug }, _count: { _all: true } });
  const counts = Object.fromEntries(REACTIONS.map((k) => [k, 0])) as Record<ReactionKind, number>;
  for (const r of rows) if ((REACTIONS as readonly string[]).includes(r.kind)) counts[r.kind as ReactionKind] = r._count._all;
  return counts;
}

/** The author removes their own comment. */
export async function deleteOwnComment(id: string, viewer: Viewer): Promise<boolean> {
  await ensureEngageTables();
  const c = await prisma.articleComment.findUnique({ where: { id } });
  if (!c || c.status === "deleted" || c.status === "hidden") return false;
  const mine =
    (viewer.kind === "learner" && c.studentId === viewer.studentId) ||
    (viewer.kind === "verified" && c.authorKind === "guest" && c.authorEmail === viewer.email) ||
    (viewer.kind === "staff" && c.authorKind === "staff" && c.staffId === viewer.staffId);
  if (!mine) return false;
  await prisma.articleComment.update({ where: { id }, data: { status: "deleted", pinned: false } });
  return true;
}

/** Published comment counts per article, for the AI Times listing. */
export function commentCounts(): Promise<Record<string, number>> {
  // No table creation here: the listing also renders at build time. Before
  // the tables exist there are simply no counts.
  return cachedPublicData("engage", "counts", async () => {
    const [{ ok }] = await prisma.$queryRaw<Array<{ ok: boolean }>>`SELECT to_regclass('public."ArticleComment"') IS NOT NULL AS ok`;
    if (!ok) return {};
    const rows = await prisma.articleComment.groupBy({ by: ["postSlug"], where: { status: "published" }, _count: { _all: true } });
    return Object.fromEntries(rows.map((r) => [r.postSlug, r._count._all]));
  });
}

/** Published comments on one article (for the page's structured data). */
export async function commentCount(slug: string): Promise<number> {
  return (await commentCounts().catch(() => ({}) as Record<string, number>))[slug] ?? 0;
}

// ── Staff ────────────────────────────────────────────────────────────────

export type AdminTab = "review" | "published" | "hidden" | "reported";

export async function adminCounts(): Promise<Record<AdminTab, number>> {
  await ensureEngageTables();
  const [review, published, hidden, reported] = await Promise.all([
    prisma.articleComment.count({ where: { status: "pending" } }),
    prisma.articleComment.count({ where: { status: "published" } }),
    prisma.articleComment.count({ where: { status: "hidden" } }),
    prisma.articleComment.count({ where: { status: "published", reportCount: { gt: 0 } } }),
  ]);
  return { review, published, hidden, reported };
}

export async function adminList(tab: AdminTab): Promise<AdminComment[]> {
  await ensureEngageTables();
  const where =
    tab === "review" ? { status: "pending" } : tab === "hidden" ? { status: "hidden" } : tab === "reported" ? { status: "published", reportCount: { gt: 0 } } : { status: "published" };
  const rows = await prisma.articleComment.findMany({
    where,
    orderBy: tab === "reported" ? [{ reportCount: "desc" }, { createdAt: "desc" }] : { createdAt: "desc" },
    take: 200,
  });
  const slugs = [...new Set(rows.map((r) => r.postSlug))];
  const emails = [...new Set(rows.map((r) => r.authorEmail).filter((e): e is string => !!e))];
  const [posts, people] = await Promise.all([
    prisma.blogPost.findMany({ where: { slug: { in: slugs } }, select: { slug: true, title: true } }),
    emails.length ? prisma.articleCommenter.findMany({ where: { email: { in: emails } }, select: { email: true, blocked: true } }) : [],
  ]);
  const title = new Map(posts.map((p) => [p.slug, p.title]));
  const blocked = new Set(people.filter((p) => p.blocked).map((p) => p.email));
  return rows.map((r) => ({
    id: r.id,
    postSlug: r.postSlug,
    postTitle: title.get(r.postSlug) ?? null,
    parentId: r.parentId,
    name: r.authorName,
    email: r.authorEmail,
    kind: r.authorKind as AuthorKind,
    body: r.body,
    locale: r.locale,
    status: r.status as CommentStatus,
    heldReason: r.heldReason,
    pinned: r.pinned,
    helpful: r.helpfulCount,
    reports: r.reportCount,
    createdAt: r.createdAt.toISOString(),
    blocked: !!r.authorEmail && blocked.has(r.authorEmail),
  }));
}

export type AdminAction = "approve" | "hide" | "pin" | "unpin" | "delete" | "block" | "unblock";

/**
 * Applies a staff action. Returns the comment as it was before (for the reply
 * email on approval), or null if it does not exist.
 */
export async function adminAct(id: string, action: AdminAction, by: string) {
  await ensureEngageTables();
  const c = await prisma.articleComment.findUnique({ where: { id } });
  if (!c) return null;
  const stamp = { moderatedAt: new Date(), moderatedBy: by.slice(0, 120) };
  switch (action) {
    case "approve":
      await prisma.articleComment.update({
        where: { id },
        data: { status: "published", heldReason: null, publishedAt: c.publishedAt ?? new Date(), ...stamp },
      });
      // Reports that led to the hold are settled.
      if (c.heldReason === "reports") {
        await prisma.articleCommentReport.deleteMany({ where: { commentId: id } });
        await prisma.articleComment.update({ where: { id }, data: { reportCount: 0 } });
      }
      break;
    case "hide":
      await prisma.articleComment.update({ where: { id }, data: { status: "hidden", pinned: false, ...stamp } });
      break;
    case "pin":
    case "unpin":
      if (action === "pin" && (c.parentId || c.status !== "published")) return { ...c, refused: true as const };
      await prisma.articleComment.update({ where: { id }, data: { pinned: action === "pin", ...stamp } });
      break;
    case "delete": {
      // Gone for good, with its replies and their votes and reports.
      const ids = [id, ...(await prisma.articleComment.findMany({ where: { parentId: id }, select: { id: true } })).map((r) => r.id)];
      await prisma.$transaction([
        prisma.articleCommentVote.deleteMany({ where: { commentId: { in: ids } } }),
        prisma.articleCommentReport.deleteMany({ where: { commentId: { in: ids } } }),
        prisma.articleComment.deleteMany({ where: { id: { in: ids } } }),
      ]);
      break;
    }
    case "block":
    case "unblock":
      if (!c.authorEmail || c.authorKind === "staff") return { ...c, refused: true as const };
      await prisma.articleCommenter.upsert({
        where: { email: c.authorEmail },
        create: { email: c.authorEmail, name: c.authorName, blocked: action === "block" },
        update: { blocked: action === "block" },
      });
      // Blocking takes everything they posted off the site.
      if (action === "block") {
        await prisma.articleComment.updateMany({
          where: { authorEmail: c.authorEmail, status: { in: ["published", "pending", "unconfirmed"] } },
          data: { status: "hidden", pinned: false, ...stamp },
        });
      }
      break;
  }
  return { ...c, refused: false as const };
}

/** Whether replies on a comment should be emailed to its author. */
export async function replyRecipient(parentId: string) {
  const p = await prisma.articleComment.findUnique({
    where: { id: parentId },
    select: { id: true, authorEmail: true, authorName: true, notifyReplies: true, locale: true, status: true, postSlug: true },
  });
  if (!p || !p.authorEmail || !p.notifyReplies || p.status !== "published") return null;
  const who = await prisma.articleCommenter.findUnique({ where: { email: p.authorEmail }, select: { unsubscribed: true, blocked: true } });
  if (who?.unsubscribed || who?.blocked) return null;
  return p;
}

export async function unsubscribeCommenter(email: string): Promise<void> {
  await ensureEngageTables();
  await prisma.articleCommenter.upsert({
    where: { email },
    create: { email, name: email.split("@")[0].slice(0, 60), unsubscribed: true },
    update: { unsubscribed: true },
  });
}
