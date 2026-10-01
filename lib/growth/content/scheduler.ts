import prisma from "@/lib/prisma";
import { ensureGrowthTables } from "../db";
import { shortUrl } from "../links";
import { composePost, isPlatform, PLATFORM_INFO } from "./platforms";
import { platformConfigured, publishTo, type PublishImage } from "./publish";
import { normalizeCard } from "../cards/spec";
import { signedCardUrl } from "../cards/sign";
import { runRepurpose, type RepurposeReport } from "./repurpose";

// The growth cron (app/api/cron/growth, every 15 minutes):
//   1. Due scheduled posts are CLAIMED (status scheduled → publishing, one
//      conditional UPDATE) before anything goes out, so overlapping runs can
//      never publish the same post twice. A platform with tokens publishes;
//      one without (Instagram, WhatsApp, or unset tokens) becomes "ready to
//      post" for the owner to post by hand.
//   2. A claim older than STALE_MINUTES (a run that died mid-publish) is
//      marked failed, never retried automatically: the post may have gone out.
//   3. Repurpose automation drafts posts for new content (drafts only).

const STALE_MINUTES = 15;
const MAX_PER_RUN = 20;

export interface PublishReport {
  due: number;
  published: number;
  ready: number;
  failed: number;
  skipped: number;
  staleFailed: number;
}

export async function publishDuePosts(now = new Date()): Promise<PublishReport> {
  await ensureGrowthTables();
  const report: PublishReport = { due: 0, published: 0, ready: 0, failed: 0, skipped: 0, staleFailed: 0 };

  const stale = await prisma.growthPost.updateMany({
    where: { status: "publishing", claimedAt: { lt: new Date(now.getTime() - STALE_MINUTES * 60_000) } },
    data: { status: "failed", error: "Publishing was interrupted. Check the platform before retrying, the post may have gone out." },
  });
  report.staleFailed = stale.count;

  const due = await prisma.growthPost.findMany({
    where: { status: "scheduled", scheduledAt: { lte: now } },
    orderBy: { scheduledAt: "asc" },
    take: MAX_PER_RUN,
  });
  report.due = due.length;

  for (const post of due) {
    // Claim before publishing: only the run whose update matched owns it.
    const claim = await prisma.growthPost.updateMany({
      where: { id: post.id, status: "scheduled" },
      data: { status: "publishing", claimedAt: new Date(), attempts: { increment: 1 } },
    });
    if (claim.count !== 1) {
      report.skipped++;
      continue;
    }
    if (!isPlatform(post.platform)) {
      await prisma.growthPost.update({ where: { id: post.id }, data: { status: "failed", error: `Unknown platform ${post.platform}` } });
      report.failed++;
      continue;
    }
    if (!PLATFORM_INFO[post.platform].api || !platformConfigured(post.platform)) {
      await prisma.growthPost.update({ where: { id: post.id }, data: { status: "ready", error: null } });
      report.ready++;
      continue;
    }
    const text = composePost({ platform: post.platform, body: post.body, hashtags: post.hashtags, shortUrl: post.linkCode ? shortUrl(post.linkCode) : null });
    if (text.length > PLATFORM_INFO[post.platform].maxChars) {
      await prisma.growthPost.update({
        where: { id: post.id },
        data: { status: "failed", error: `Too long for ${PLATFORM_INFO[post.platform].label}: ${text.length}/${PLATFORM_INFO[post.platform].maxChars} characters.` },
      });
      report.failed++;
      continue;
    }
    const card = normalizeCard(post.image);
    const image: PublishImage | null = card && (post.platform === "linkedin" || post.platform === "facebook")
      ? { url: signedCardUrl(post.id, 0), png: async () => (await import("../cards/render")).renderCardPng(card, 0) }
      : null;
    const res = await publishTo(post.platform, text, image);
    if (res.success) {
      await prisma.growthPost.update({
        where: { id: post.id },
        data: { status: "published", publishedAt: new Date(), externalUrl: res.url ?? null, error: null },
      });
      report.published++;
    } else {
      await prisma.growthPost.update({ where: { id: post.id }, data: { status: "failed", error: (res.error ?? "Publishing failed").slice(0, 1000) } });
      report.failed++;
    }
  }
  return report;
}

export async function runGrowthCron(opts?: { repurpose?: boolean }): Promise<{ publish: PublishReport; repurpose: RepurposeReport | null; errors: string[] }> {
  const errors: string[] = [];
  const publish = await publishDuePosts();
  let repurpose: RepurposeReport | null = null;
  if (opts?.repurpose !== false && process.env.GROWTH_REPURPOSE !== "off") {
    try {
      repurpose = await runRepurpose();
      errors.push(...repurpose.errors);
    } catch (err) {
      errors.push(`repurpose: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  return { publish, repurpose, errors };
}
