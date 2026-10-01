import type { GrowthPost } from "@prisma/client";
import prisma from "@/lib/prisma";
import { ensureGrowthTables } from "../db";
import { createLink, shortUrl } from "../links";
import { findAudience, getGrowthSettings } from "../settings";
import { cleanHashtag } from "./kit-types";
import { composePost, deepLink, isLanguage, isPlatform, PLATFORM_INFO, type Platform } from "./platforms";
import { configuredPlatforms } from "./publish";
import { suggestSlots } from "./times";

// The post queue: list, create, edit and move posts through
//   draft → scheduled (approved, with a time) → publishing → published
//                     ↘ ready (no API/tokens: post by hand, then "mark posted")
//   failed → (retry) scheduled;  draft → rejected.
// Every transition is a conditional update on the current status, so an edit
// can never race the cron's claim of a post that is being published.

export interface PostView {
  id: string;
  kitId: string | null;
  source: string;
  platform: Platform;
  language: string;
  body: string;
  hashtags: string[];
  status: string;
  scheduledAt: string | null;
  publishedAt: string | null;
  externalUrl: string | null;
  error: string | null;
  linkCode: string | null;
  shortUrl: string | null;
  text: string;
  chars: number;
  maxChars: number;
  deepLink: string;
  autoPublish: boolean;
}

export function toView(p: GrowthPost, configured = configuredPlatforms()): PostView {
  const platform = isPlatform(p.platform) ? p.platform : "linkedin";
  const url = p.linkCode ? shortUrl(p.linkCode) : null;
  const hashtags = Array.isArray(p.hashtags) ? (p.hashtags as unknown[]).filter((h): h is string => typeof h === "string") : [];
  const text = composePost({ platform, body: p.body, hashtags, shortUrl: url });
  return {
    id: p.id,
    kitId: p.kitId,
    source: p.source,
    platform,
    language: p.language,
    body: p.body,
    hashtags,
    status: p.status,
    scheduledAt: p.scheduledAt?.toISOString() ?? null,
    publishedAt: p.publishedAt?.toISOString() ?? null,
    externalUrl: p.externalUrl,
    error: p.error,
    linkCode: p.linkCode,
    shortUrl: url,
    text,
    chars: text.length,
    maxChars: PLATFORM_INFO[platform].maxChars,
    deepLink: deepLink(platform, text, url),
    autoPublish: PLATFORM_INFO[platform].api && configured[platform],
  };
}

export async function listPosts(opts: { from?: Date; to?: Date; status?: string[]; kitId?: string; limit?: number }) {
  await ensureGrowthTables();
  const range = opts.from || opts.to ? { gte: opts.from, lt: opts.to } : undefined;
  const rows = await prisma.growthPost.findMany({
    where: {
      ...(opts.status?.length ? { status: { in: opts.status } } : {}),
      ...(opts.kitId ? { kitId: opts.kitId } : {}),
      ...(range ? { OR: [{ scheduledAt: range }, { scheduledAt: null, createdAt: range }] } : {}),
    },
    orderBy: [{ scheduledAt: { sort: "asc", nulls: "last" } }, { createdAt: "desc" }],
    take: Math.min(opts.limit ?? 500, 1000),
  });
  const configured = configuredPlatforms();
  return rows.map((r) => toView(r, configured));
}

export class PostError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

const tagsFrom = (v: unknown) =>
  (Array.isArray(v) ? v : typeof v === "string" ? v.split(/[\s,]+/) : [])
    .map((h) => (typeof h === "string" ? cleanHashtag(h) : ""))
    .filter(Boolean)
    .slice(0, 30);

function parseDate(v: unknown): Date | null | undefined {
  if (v === null) return null;
  if (typeof v !== "string" || !v) return undefined;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) throw new PostError("Invalid date.");
  if (d.getTime() > Date.now() + 366 * 86_400_000) throw new PostError("That date is more than a year away.");
  return d;
}

/** A manual post (with an optional tracked link). */
export async function createPost(b: Record<string, unknown>) {
  await ensureGrowthTables();
  if (!isPlatform(b.platform)) throw new PostError("Choose a platform.");
  const body = typeof b.body === "string" ? b.body.trim().slice(0, 5000) : "";
  if (!body) throw new PostError("Write the post first.");
  let linkCode: string | null = null;
  if (typeof b.targetUrl === "string" && b.targetUrl.trim()) {
    const link = await createLink({
      targetUrl: b.targetUrl,
      utmSource: b.platform,
      utmMedium: "social",
      utmCampaign: typeof b.campaign === "string" && b.campaign.trim() ? b.campaign : "manual",
      label: `Manual ${PLATFORM_INFO[b.platform].label} post`,
    });
    linkCode = link.code;
  }
  const scheduledAt = parseDate(b.scheduledAt) ?? null;
  const p = await prisma.growthPost.create({
    data: {
      source: "manual",
      platform: b.platform,
      language: isLanguage(b.language) ? b.language : "en",
      body,
      hashtags: tagsFrom(b.hashtags),
      linkCode,
      status: "draft",
      scheduledAt,
    },
  });
  return toView(p);
}

const EDITABLE = ["draft", "scheduled", "ready", "failed", "rejected"];

export type PostAction = "approve" | "unschedule" | "mark-posted" | "reject" | "retry" | "restore";

/** Edits and status changes. Returns the updated post. */
export async function updatePost(id: string, b: Record<string, unknown>) {
  await ensureGrowthTables();
  const post = await prisma.growthPost.findUnique({ where: { id } });
  if (!post) throw new PostError("Post not found.", 404);

  const data: Record<string, unknown> = {};
  const wantsEdit = b.body !== undefined || b.hashtags !== undefined || b.platform !== undefined || b.scheduledAt !== undefined;
  if (wantsEdit && !EDITABLE.includes(post.status)) throw new PostError(`A ${post.status} post cannot be edited.`, 409);
  if (b.body !== undefined) {
    const body = typeof b.body === "string" ? b.body.trim().slice(0, 5000) : "";
    if (!body) throw new PostError("The post cannot be empty.");
    data.body = body;
  }
  if (b.hashtags !== undefined) data.hashtags = tagsFrom(b.hashtags);
  if (b.platform !== undefined) {
    if (!isPlatform(b.platform)) throw new PostError("Unknown platform.");
    data.platform = b.platform;
  }
  const when = parseDate(b.scheduledAt);
  if (when !== undefined) data.scheduledAt = when;

  let from = EDITABLE;
  const action = b.action as PostAction | undefined;
  const next = { ...post, ...data } as GrowthPost;
  const platform = isPlatform(next.platform) ? next.platform : "linkedin";

  switch (action) {
    case undefined:
      // Moving a scheduled post into the past would publish it at once: refuse.
      if (post.status === "scheduled" && when && when.getTime() < Date.now() - 60_000) {
        throw new PostError("Pick a time in the future, or unschedule the post first.");
      }
      break;
    case "approve":
    case "retry": {
      from = action === "retry" ? ["failed"] : ["draft", "ready", "failed", "rejected"];
      let at = next.scheduledAt;
      if (!at || at.getTime() < Date.now() + 60_000) {
        if (action === "retry") at = new Date();
        else {
          const settings = await getGrowthSettings();
          const kit = next.kitId ? await prisma.growthKit.findUnique({ where: { id: next.kitId }, select: { audienceId: true } }) : null;
          const tz = findAudience(settings, kit?.audienceId)?.timezone ?? settings.audiences.find((a) => a.language === next.language)?.timezone ?? "America/New_York";
          at = suggestSlots(platform, tz, new Date(), 1)[0] ?? new Date(Date.now() + 3_600_000);
        }
      }
      const len = composePost({ platform, body: next.body, hashtags: next.hashtags, shortUrl: next.linkCode ? shortUrl(next.linkCode) : null }).length;
      if (len > PLATFORM_INFO[platform].maxChars) {
        throw new PostError(`This post is ${len} characters; ${PLATFORM_INFO[platform].label} allows ${PLATFORM_INFO[platform].maxChars}. Shorten it first.`);
      }
      Object.assign(data, { status: "scheduled", scheduledAt: at, error: null, claimedAt: null });
      break;
    }
    case "unschedule":
      from = ["scheduled", "ready"];
      data.status = "draft";
      break;
    case "mark-posted": {
      from = ["draft", "scheduled", "ready", "failed"];
      let ext: string | null = null;
      if (typeof b.externalUrl === "string" && b.externalUrl.trim()) {
        try {
          const u = new URL(b.externalUrl.trim());
          if (u.protocol === "https:") ext = u.toString().slice(0, 500);
        } catch { /* ignore */ }
      }
      Object.assign(data, { status: "published", publishedAt: new Date(), externalUrl: ext, error: null });
      break;
    }
    case "reject":
      from = ["draft", "ready", "failed"];
      data.status = "rejected";
      break;
    case "restore":
      from = ["rejected"];
      data.status = "draft";
      break;
    default:
      throw new PostError("Unknown action.");
  }

  const res = await prisma.growthPost.updateMany({ where: { id, status: { in: from } }, data });
  if (res.count !== 1) throw new PostError("The post changed meanwhile (it may be publishing). Reload and try again.", 409);
  return toView((await prisma.growthPost.findUnique({ where: { id } }))!);
}

export async function deletePost(id: string) {
  await ensureGrowthTables();
  const res = await prisma.growthPost.deleteMany({ where: { id, status: { notIn: ["publishing"] } } });
  if (res.count !== 1) throw new PostError("Post not found or being published.", 404);
}

export async function statusCounts(): Promise<Record<string, number>> {
  await ensureGrowthTables();
  const rows = await prisma.growthPost.groupBy({ by: ["status"], _count: { _all: true } });
  return Object.fromEntries(rows.map((r) => [r.status, r._count._all]));
}
