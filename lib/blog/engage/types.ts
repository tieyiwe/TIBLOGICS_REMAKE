// Reader engagement under AI Times articles (lib/blog/engage): comments with
// one level of replies, "helpful" votes on comments, reports, and one
// reaction per reader per article. Shared types and limits, safe to import in
// the browser.

export const REACTIONS = ["insightful", "surprising", "skeptical", "inspiring"] as const;
export type ReactionKind = (typeof REACTIONS)[number];
export const REACTION_EMOJI: Record<ReactionKind, string> = { insightful: "💡", surprising: "🤯", skeptical: "🤔", inspiring: "🚀" };

/**
 * unconfirmed  a guest's comment waiting for the email link (never shown)
 * pending      held for staff: links or phone numbers, or reported 3 times
 * published    shown
 * hidden       hidden by staff
 * deleted      removed by its author (kept so replies keep their thread)
 */
export const COMMENT_STATUSES = ["unconfirmed", "pending", "published", "hidden", "deleted"] as const;
export type CommentStatus = (typeof COMMENT_STATUSES)[number];
export type AuthorKind = "guest" | "learner" | "staff";

export const BODY_MIN = 2;
export const BODY_MAX = 2000;
export const NAME_MIN = 2;
export const NAME_MAX = 60;
/** Reports from different readers that take a comment off the page until staff look. */
export const REPORTS_TO_HOLD = 3;

/** A comment as the article page shows it. Never carries an email address. */
export interface PublicComment {
  id: string;
  parentId: string | null;
  name: string;
  kind: AuthorKind;
  /** Staff comment by the article's author. */
  isAuthor: boolean;
  body: string;
  createdAt: string;
  helpful: number;
  pinned: boolean;
  /** "published", or the viewer's own comment waiting for review. "deleted" only as a placeholder with replies. */
  status: "published" | "pending" | "deleted";
  /** The viewer voted it helpful. */
  voted: boolean;
  /** The viewer wrote it (can delete it). */
  mine: boolean;
}

export type ViewerKind = "anon" | "verified" | "learner" | "staff";

export interface EngageViewer {
  kind: ViewerKind;
  name: string | null;
  /** Staff with AI Times manage access: pin and hide right on the page. */
  canModerate: boolean;
}

export interface EngageData {
  comments: PublicComment[];
  /** Published comments, replies included. */
  total: number;
  reactions: { counts: Record<ReactionKind, number>; mine: ReactionKind | null };
  viewer: EngageViewer;
}

/** A comment in the admin list. */
export interface AdminComment {
  id: string;
  postSlug: string;
  postTitle: string | null;
  parentId: string | null;
  name: string;
  email: string | null;
  kind: AuthorKind;
  body: string;
  locale: string;
  status: CommentStatus;
  heldReason: string | null;
  pinned: boolean;
  helpful: number;
  reports: number;
  createdAt: string;
  blocked: boolean;
}

export const isReaction = (v: unknown): v is ReactionKind => typeof v === "string" && (REACTIONS as readonly string[]).includes(v);
