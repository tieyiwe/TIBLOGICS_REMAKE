import { randomBytes } from "crypto";
import type { AcquireMagnet, AcquirePage } from "@prisma/client";
import prisma from "@/lib/prisma";
import { createLink, checkTarget, shortUrl } from "../links";
import { getGrowthSettings } from "../settings";
import { ensureAcquireTables } from "./db";
import {
  isLang,
  magnetProblems,
  MAGNET_TYPES,
  normalizeMagnet,
  normalizePage,
  pageProblems,
  SLUG_RE,
  slugify,
  type MagnetType,
  type PageContent,
} from "./types";

// Storage for lead magnets and landing pages. Slugs are the public URL
// (/free/[slug], /lp/[slug]) and the utm_campaign ("magnet-<slug>",
// "lp-<slug>") every capture and conversion is attributed to.

export class AcquireError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

export const campaignFor = (refType: "magnet" | "page", slug: string) => `${refType === "magnet" ? "magnet" : "lp"}-${slug}`.slice(0, 100);
export const publicPath = (refType: "magnet" | "page", slug: string) => (refType === "magnet" ? `/free/${slug}` : `/lp/${slug}`);

async function uniqueSlug(table: "magnet" | "page", base: string, exceptId?: string): Promise<string> {
  const root = slugify(base) || (table === "magnet" ? "free-guide" : "offer");
  for (let i = 0; i < 8; i++) {
    const slug = i === 0 ? root : `${root.slice(0, 40)}-${randomBytes(2).toString("hex")}`;
    const hit =
      table === "magnet"
        ? await prisma.acquireMagnet.findUnique({ where: { slug }, select: { id: true } })
        : await prisma.acquirePage.findUnique({ where: { slug }, select: { id: true } });
    if (!hit || hit.id === exceptId) return slug;
  }
  throw new AcquireError("Could not find a free URL for this page; change the title.");
}

function cleanSlug(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const s = slugify(v, 64);
  return SLUG_RE.test(s) ? s : null;
}

// ── Magnets ─────────────────────────────────────────────────────────────────

export async function createMagnet(input: { type: MagnetType; title: string; language: string; productKey?: string | null; content: unknown }) {
  await ensureAcquireTables();
  if (!MAGNET_TYPES.includes(input.type)) throw new AcquireError("Pick a magnet type.");
  const title = input.title.trim().slice(0, 160) || "Lead magnet";
  return prisma.acquireMagnet.create({
    data: {
      slug: await uniqueSlug("magnet", title),
      type: input.type,
      title,
      language: isLang(input.language) ? input.language : "en",
      productKey: input.productKey || null,
      content: JSON.parse(JSON.stringify(normalizeMagnet(input.content))),
    },
  });
}

export async function updateMagnet(id: string, patch: Record<string, unknown>) {
  await ensureAcquireTables();
  const m = await prisma.acquireMagnet.findUnique({ where: { id } });
  if (!m) throw new AcquireError("Not found", 404);
  const data: Record<string, unknown> = {};
  if (typeof patch.title === "string" && patch.title.trim()) data.title = patch.title.trim().slice(0, 160);
  if (patch.slug !== undefined) {
    const s = cleanSlug(patch.slug);
    if (!s) throw new AcquireError("The URL slug must be 2 to 64 lowercase letters, digits or dashes.");
    if (s !== m.slug) {
      if (m.status === "published") throw new AcquireError("Unpublish before changing the URL of a live magnet.");
      data.slug = await uniqueSlug("magnet", s, id);
      if (data.slug !== s) throw new AcquireError("That URL is taken.");
      data.linkCode = null; // the old tracked link points at the old URL
    }
  }
  if (patch.language !== undefined && isLang(patch.language)) data.language = patch.language;
  if (patch.productKey !== undefined) data.productKey = typeof patch.productKey === "string" && patch.productKey ? patch.productKey.slice(0, 200) : null;
  if (typeof patch.noindex === "boolean") data.noindex = patch.noindex;
  if (patch.content !== undefined) {
    const c = normalizeMagnet(patch.content);
    if (m.type === "templates") {
      c.templates = c.templates.filter((t) => checkTarget(t.href).ok);
    }
    data.content = JSON.parse(JSON.stringify(c));
  }
  return prisma.acquireMagnet.update({ where: { id }, data });
}

export async function setMagnetStatus(id: string, publish: boolean) {
  await ensureAcquireTables();
  const m = await prisma.acquireMagnet.findUnique({ where: { id } });
  if (!m) throw new AcquireError("Not found", 404);
  if (publish) {
    const problems = magnetProblems(m.type as MagnetType, normalizeMagnet(m.content));
    if (problems.length) throw new AcquireError(`Fix before publishing: ${problems.join(" ")}`);
  }
  return prisma.acquireMagnet.update({
    where: { id },
    data: { status: publish ? "published" : "draft", publishedAt: publish ? (m.publishedAt ?? new Date()) : m.publishedAt },
  });
}

export async function getPublishedMagnet(slug: string): Promise<AcquireMagnet | null> {
  if (!SLUG_RE.test(slug)) return null;
  try {
    await ensureAcquireTables();
    const m = await prisma.acquireMagnet.findUnique({ where: { slug } });
    return m && m.status === "published" ? m : null;
  } catch (err) {
    console.error("[acquire] magnet", err);
    return null;
  }
}

// ── Landing pages ──────────────────────────────────────────────────────────

/** Proof points may only be the brand's approved ones; CTA links must pass the redirect checks. */
export async function sanitizePageContent(raw: unknown): Promise<PageContent> {
  const c = normalizePage(raw);
  const approved = new Set((await getGrowthSettings()).proofPoints);
  for (const s of c.sections) if (s.type === "proof") s.items = s.items.filter((p) => approved.has(p));
  if (c.cta.href && !checkTarget(c.cta.href).ok) c.cta.href = "";
  return c;
}

export async function createPage(input: { title: string; language: string; productKey?: string | null; kitId?: string | null; content: unknown }) {
  await ensureAcquireTables();
  const title = input.title.trim().slice(0, 160) || "Landing page";
  return prisma.acquirePage.create({
    data: {
      slug: await uniqueSlug("page", title),
      title,
      language: isLang(input.language) ? input.language : "en",
      productKey: input.productKey || null,
      kitId: input.kitId || null,
      content: JSON.parse(JSON.stringify(await sanitizePageContent(input.content))),
    },
  });
}

export async function updatePage(id: string, patch: Record<string, unknown>) {
  await ensureAcquireTables();
  const p = await prisma.acquirePage.findUnique({ where: { id } });
  if (!p) throw new AcquireError("Not found", 404);
  const data: Record<string, unknown> = {};
  if (typeof patch.title === "string" && patch.title.trim()) data.title = patch.title.trim().slice(0, 160);
  if (patch.slug !== undefined) {
    const s = cleanSlug(patch.slug);
    if (!s) throw new AcquireError("The URL slug must be 2 to 64 lowercase letters, digits or dashes.");
    if (s !== p.slug) {
      if (p.status === "published") throw new AcquireError("Unpublish before changing the URL of a live page.");
      data.slug = await uniqueSlug("page", s, id);
      if (data.slug !== s) throw new AcquireError("That URL is taken.");
      data.linkCode = null; // the old tracked link points at the old URL
    }
  }
  if (patch.language !== undefined && isLang(patch.language)) data.language = patch.language;
  if (patch.productKey !== undefined) data.productKey = typeof patch.productKey === "string" && patch.productKey ? patch.productKey.slice(0, 200) : null;
  if (typeof patch.noindex === "boolean") data.noindex = patch.noindex;
  if (patch.content !== undefined) data.content = JSON.parse(JSON.stringify(await sanitizePageContent(patch.content)));
  return prisma.acquirePage.update({ where: { id }, data });
}

export async function setPageStatus(id: string, publish: boolean) {
  await ensureAcquireTables();
  const p = await prisma.acquirePage.findUnique({ where: { id } });
  if (!p) throw new AcquireError("Not found", 404);
  if (publish) {
    const problems = pageProblems(normalizePage(p.content));
    if (problems.length) throw new AcquireError(`Fix before publishing: ${problems.join(" ")}`);
  }
  return prisma.acquirePage.update({
    where: { id },
    data: { status: publish ? "published" : "draft", publishedAt: publish ? (p.publishedAt ?? new Date()) : p.publishedAt },
  });
}

export async function getPublishedPage(slug: string): Promise<AcquirePage | null> {
  if (!SLUG_RE.test(slug)) return null;
  try {
    await ensureAcquireTables();
    const p = await prisma.acquirePage.findUnique({ where: { slug } });
    return p && p.status === "published" ? p : null;
  } catch (err) {
    console.error("[acquire] page", err);
    return null;
  }
}

// ── Tracked share link (/go/[code]) ────────────────────────────────────────

/** One tracked link per magnet or page, created on demand, shown in Links & attribution. */
export async function ensureTrackedLink(refType: "magnet" | "page", id: string): Promise<{ code: string; url: string }> {
  await ensureAcquireTables();
  const row =
    refType === "magnet"
      ? await prisma.acquireMagnet.findUnique({ where: { id }, select: { slug: true, title: true, linkCode: true } })
      : await prisma.acquirePage.findUnique({ where: { id }, select: { slug: true, title: true, linkCode: true } });
  if (!row) throw new AcquireError("Not found", 404);
  if (row.linkCode) return { code: row.linkCode, url: shortUrl(row.linkCode) };
  const link = await createLink({
    targetUrl: publicPath(refType, row.slug),
    utmSource: "share",
    utmMedium: refType === "magnet" ? "lead-magnet" : "landing",
    utmCampaign: campaignFor(refType, row.slug),
    label: `${refType === "magnet" ? "Lead magnet" : "Landing page"}: ${row.title}`,
  });
  if (refType === "magnet") await prisma.acquireMagnet.update({ where: { id }, data: { linkCode: link.code } });
  else await prisma.acquirePage.update({ where: { id }, data: { linkCode: link.code } });
  return { code: link.code, url: shortUrl(link.code) };
}
