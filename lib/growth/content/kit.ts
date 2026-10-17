import { randomBytes } from "crypto";
import prisma from "@/lib/prisma";
import { runClaude } from "@/lib/claude";
import { escapeHtml } from "@/lib/require-admin";
import { ensureGrowthTables } from "../db";
import { getCatalogItem, TYPE_LABEL, type CatalogItem } from "../catalog";
import { brandBrief, findAudience, getGrowthSettings, type GrowthSettingsData } from "../settings";
import { createLink, shortUrl } from "../links";
import { PLATFORM_INFO, PLATFORMS, type Language } from "./platforms";
import { normalizeKit, type KitContent } from "./kit-types";
import { checkKit as checkKitRules } from "./claims";
import { addDays, slotOnDay, ymdIn } from "./times";

// Product marketing kits: one Sonnet call turns a catalog item into
// positioning, pains/benefits, hero copy, 10 social posts, a 3-email launch
// sequence, 3 ads, a reel script and a 2-week calendar. The model may only
// use the item's facts and the brand's approved proof points; everything it
// returns is checked (checkKit) and shown with warnings, and stays editable.

export class KitError extends Error {}

/** Pulls the JSON object out of a model reply (tolerates code fences and prose). */
export function extractJson(text: string): unknown {
  const t = text.replace(/```(?:json)?/gi, "");
  const a = t.indexOf("{");
  const b = t.lastIndexOf("}");
  if (a < 0 || b <= a) throw new KitError("The model did not return JSON.");
  try {
    return JSON.parse(t.slice(a, b + 1));
  } catch {
    throw new KitError("The model returned malformed JSON. Try again.");
  }
}

function platformGuides(): string {
  return PLATFORMS.map((p) => {
    const i = PLATFORM_INFO[p];
    return `- ${p} (${i.label}): ${i.guide} Hashtags: ${i.hashtags[0]}-${i.hashtags[1]}. Max ${i.maxChars} characters in total.`;
  }).join("\n");
}

const KIT_RULES = `You write product marketing kits for a small AI company. Return ONE JSON object and nothing else.

Hard rules:
- Every claim about the product must come from PRODUCT FACTS; every claim about the brand from the approved proof points. Do not invent statistics, percentages, prices, discounts, deadlines, dates, client names, testimonials, results, awards or features. If you do not have a number, write without one.
- Never use a banned claim, even reworded.
- Never write URLs or "link in bio" placeholders inside post text: the tracked link is added automatically after the text. Instagram captions may say "link in bio".
- Hashtags go in the "hashtags" arrays, without "#", never inside the text.

JSON shape:
{
  "positioning": "one sentence: who it is for, what it does, why it is different",
  "pains": ["3-5 audience pains in their words"],
  "benefits": ["3-5 concrete benefits tied to the facts"],
  "hero": {"headline": "<= 10 words", "subheadline": "<= 30 words", "bullets": ["3 short bullets"], "cta": "button text"},
  "posts": [{"platform": "linkedin|x|facebook|instagram|whatsapp", "text": "...", "hashtags": ["..."]}],
  "emails": [{"subject": "...", "preview": "preview text", "body": "plain text, short paragraphs separated by blank lines, greeting without a name", "cta": "button text"}],
  "ads": [{"network": "meta|google|linkedin", "headline": "...", "primaryText": "...", "description": "...", "cta": "..."}],
  "video": {"title": "...", "hook": "first 3 seconds", "script": "30-60 second reel script with timing cues like [0-3s]", "onScreenText": ["short overlays"], "cta": "...", "durationSeconds": 45},
  "calendar": [{"day": 1, "channel": "linkedin|x|facebook|instagram|whatsapp|email", "ref": 0, "note": "why this day"}]
}

Counts: exactly 10 posts (2 linkedin, 2 x, 2 facebook, 2 instagram, 2 whatsapp); exactly 3 emails (1: launch/announce, 2: value and objection handling, 3: last reminder); exactly 3 ads (one meta: primaryText <= 125 chars, headline <= 40, description <= 30; one google: headline <= 30 chars, primaryText = a second headline <= 30, description <= 90; one linkedin: primaryText <= 150, headline <= 70). The calendar covers 14 days: every post appears once (channel = its platform, ref = its index in posts), every email once (channel "email", ref = 0..2); spread them out, at most 2 items per day.

Platform guidance:
${platformGuides()}`;

function productBlock(item: CatalogItem, settings: GrowthSettingsData): string {
  return [
    `PRODUCT: ${item.title} (${TYPE_LABEL[item.type]})`,
    item.price ? `PRICE: ${item.price}` : "",
    `PRODUCT FACTS (the only product claims allowed):\n${item.facts.map((f) => `- ${f}`).join("\n")}`,
    `Landing page: ${item.url}`,
    settings.proofPoints.length ? "" : "Reminder: no approved proof points exist, so cite no results.",
    "Write the kit now as JSON.",
  ]
    .filter(Boolean)
    .join("\n\n");
}

// ── Claim checks (lib/growth/content/claims.ts, shared with the editor) ─────

export function checkKit(k: KitContent, facts: string[], settings: GrowthSettingsData): string[] {
  return checkKitRules(k, facts, settings);
}

// ── Generate ────────────────────────────────────────────────────────────────

function kitSlug(title: string, lang: Language): string {
  const base = title.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40).replace(/-+$/, "");
  return `${base || "kit"}-${lang}-${randomBytes(2).toString("hex")}`;
}

export async function generateKit(opts: { productKey: string; language: Language; audienceId?: string | null }) {
  const item = await getCatalogItem(opts.productKey);
  if (!item) throw new KitError("That product is no longer in the catalog.");
  const settings = await getGrowthSettings();
  const audience = findAudience(settings, opts.audienceId) ?? null;
  const system = `${KIT_RULES}\n\n${brandBrief(settings, audience, opts.language)}`;
  const { text, stopReason } = await runClaude("growth-kit", {
    system,
    messages: [{ role: "user", content: productBlock(item, settings) }],
    meta: { ref: `growth-kit:${item.key}` },
  });
  if (stopReason === "max_tokens") throw new KitError("The kit was cut off before it finished. Try again.");
  const content = normalizeKit(extractJson(text));
  if (content.posts.length === 0) throw new KitError("The model returned no posts. Try again.");
  const warnings = checkKit(content, item.facts, settings);

  await ensureGrowthTables();
  return prisma.growthKit.create({
    data: {
      slug: kitSlug(item.title, opts.language),
      productKey: item.key,
      productType: item.type,
      productTitle: item.title.slice(0, 300),
      productUrl: item.url,
      language: opts.language,
      audienceId: audience?.id ?? null,
      content: JSON.parse(JSON.stringify(content)),
      warnings,
    },
  });
}

/** Saves an edited kit and re-runs the checks. */
export async function updateKit(id: string, raw: unknown) {
  await ensureGrowthTables();
  const kit = await prisma.growthKit.findUnique({ where: { id } });
  if (!kit) return null;
  const prev = normalizeKit(kit.content);
  const content = normalizeKit(raw);
  content.newsletterCampaignIds = prev.newsletterCampaignIds; // not editable from the browser
  const item = await getCatalogItem(kit.productKey);
  const settings = await getGrowthSettings();
  const warnings = checkKit(content, item?.facts ?? [], settings);
  return prisma.growthKit.update({ where: { id }, data: { content: JSON.parse(JSON.stringify(content)), warnings } });
}

// ── Queue posts ─────────────────────────────────────────────────────────────

/**
 * Turns the kit's posts into draft queue items, each with its own tracked
 * link, placed on the kit's 2-week calendar at the platform's best time in
 * the audience's zone. Idempotent: a post already queued is skipped.
 */
export async function queueKitPosts(kitId: string, startYmd?: string) {
  await ensureGrowthTables();
  const kit = await prisma.growthKit.findUnique({ where: { id: kitId } });
  if (!kit) throw new KitError("Kit not found.");
  const content = normalizeKit(kit.content);
  const settings = await getGrowthSettings();
  const tz = findAudience(settings, kit.audienceId)?.timezone ?? "America/New_York";
  const start = startYmd && /^\d{4}-\d{2}-\d{2}$/.test(startYmd) ? startYmd : addDays(ymdIn(new Date(), tz), 1);

  const existing = new Set(
    (await prisma.growthPost.findMany({ where: { kitId }, select: { sourceKey: true } })).map((p) => p.sourceKey),
  );
  const perDay = new Map<string, number>();
  let created = 0;
  for (let i = 0; i < content.posts.length; i++) {
    const sourceKey = `kit:${kitId}:post:${i}`;
    if (existing.has(sourceKey)) continue;
    const p = content.posts[i];
    const entry = content.calendar.find((c) => c.channel === p.platform && c.ref === i);
    const day = addDays(start, (entry?.day ?? Math.min(14, Math.floor((i * 14) / Math.max(1, content.posts.length)) + 1)) - 1);
    const n = perDay.get(`${day}:${p.platform}`) ?? 0;
    perDay.set(`${day}:${p.platform}`, n + 1);
    let at = slotOnDay(p.platform, tz, day, n);
    if (at.getTime() < Date.now() + 15 * 60_000) at = slotOnDay(p.platform, tz, addDays(day, 1), n);

    const link = await createLink({
      targetUrl: kit.productUrl || "/",
      utmSource: p.platform,
      utmMedium: "social",
      utmCampaign: kit.slug,
      utmContent: `post-${i + 1}`,
      label: `${kit.productTitle}: ${PLATFORM_INFO[p.platform].label} post ${i + 1}`,
      kitId,
    });
    try {
      await prisma.growthPost.create({
        data: {
          kitId,
          source: "kit",
          sourceKey,
          platform: p.platform,
          language: kit.language,
          body: p.text,
          hashtags: p.hashtags,
          linkCode: link.code,
          status: "draft",
          scheduledAt: at,
          ...(p.image ? { image: JSON.parse(JSON.stringify(p.image)) } : {}),
        },
      });
      created++;
    } catch (err) {
      if ((err as { code?: string })?.code !== "P2002") throw err; // queued concurrently
    }
  }
  return { created, total: content.posts.length };
}

// ── Newsletter ──────────────────────────────────────────────────────────────

function emailHtml(body: string, cta: string, url: string): string {
  const paras = body
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p style="margin:0 0 16px;line-height:1.6">${escapeHtml(p).replace(/\n/g, "<br>")}</p>`)
    .join("\n");
  const button = `<p style="margin:24px 0"><a href="${escapeHtml(url)}" style="display:inline-block;background:#F47C20;color:#ffffff;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:600">${escapeHtml(cta || "Learn more")}</a></p>`;
  return `${paras}\n${button}`;
}

/**
 * Creates the kit's launch emails as DRAFT newsletter campaigns (the owner
 * reviews and sends them from /admin_pro/newsletter). Each email links
 * through its own tracked link (utm_medium=email). Created once per kit.
 */
export async function kitToNewsletter(kitId: string) {
  await ensureGrowthTables();
  const kit = await prisma.growthKit.findUnique({ where: { id: kitId } });
  if (!kit) throw new KitError("Kit not found.");
  const content = normalizeKit(kit.content);
  if (content.newsletterCampaignIds?.length) {
    const still = await prisma.newsletterCampaign.findMany({ where: { id: { in: content.newsletterCampaignIds } }, select: { id: true } });
    if (still.length) return { created: 0, campaignIds: still.map((c) => c.id) };
  }
  if (content.emails.length === 0) throw new KitError("This kit has no emails.");
  const ids: string[] = [];
  for (let i = 0; i < content.emails.length; i++) {
    const e = content.emails[i];
    const link = await createLink({
      targetUrl: kit.productUrl || "/",
      utmSource: "newsletter",
      utmMedium: "email",
      utmCampaign: kit.slug,
      utmContent: `email-${i + 1}`,
      label: `${kit.productTitle}: launch email ${i + 1}`,
      kitId,
    });
    const c = await prisma.newsletterCampaign.create({
      data: {
        title: `${kit.productTitle}: launch email ${i + 1} of ${content.emails.length}`.slice(0, 300),
        subject: e.subject.slice(0, 300),
        previewText: e.preview.slice(0, 200) || null,
        contentHtml: emailHtml(e.body, e.cta, shortUrl(link.code)),
        category: "growth",
        status: "DRAFT",
        sentBy: "Growth",
      },
    });
    ids.push(c.id);
  }
  content.newsletterCampaignIds = ids;
  await prisma.growthKit.update({ where: { id: kitId }, data: { content: JSON.parse(JSON.stringify(content)) } });
  return { created: ids.length, campaignIds: ids };
}
