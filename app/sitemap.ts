import type { MetadataRoute } from "next";
import prisma from "@/lib/prisma";
import { ensureLearnEditColumns } from "@/lib/learn/admin/columns";
import { ensureAcquireTables } from "@/lib/growth/acquire/db";
import { articleAlternates, articleLanguages, articleUrl } from "@/lib/seo/articles";
import { absUrl } from "@/lib/seo/site";
import { loadTrackSources } from "@/lib/i18n/sources/learn";
import { learnAlternates, learnLangPath, tracksReadyInFrench } from "@/lib/seo/learn-lang";

// The sitemap lists every public, indexable URL: the static pages, every
// live or coming-soon ARFA track, published store products and collections,
// published AI Times articles (with hreflang alternates for their ?lang=
// translations), published events, and published lead magnets and landing
// pages that are not flagged noindex. ARFA pages also list their French URL
// (?lang=fr, lib/seo/learn-lang.ts) with hreflang, once a track's French
// translation is ready. Private, noindex and confirmation pages
// are left out (see app/robots.ts).
//
// Rendered on request so a newly published item appears at once (it is a
// few cheap queries). Well under the 50,000-URL limit; split with
// generateSitemaps if it ever gets close.
export const dynamic = "force-dynamic";

type Entry = MetadataRoute.Sitemap[number];

const STATIC: Array<[path: string, priority: number, freq: Entry["changeFrequency"]]> = [
  ["/", 1.0, "weekly"],
  ["/services", 0.9, "monthly"],
  ["/learning-box", 0.95, "weekly"],
  ["/ai-times", 0.9, "daily"],
  ["/tools", 0.8, "monthly"],
  ["/tools/scanner", 0.8, "monthly"],
  ["/tools/toolkit-live", 0.8, "monthly"],
  ["/tools/automation-blueprint", 0.75, "monthly"],
  ["/tools/readiness-monitor", 0.75, "monthly"],
  ["/tools/calculator", 0.7, "monthly"],
  ["/store", 0.8, "weekly"],
  ["/events", 0.8, "weekly"],
  ["/about", 0.7, "monthly"],
  ["/about/facts", 0.8, "monthly"],
  ["/book", 0.8, "monthly"],
  ["/contact", 0.6, "yearly"],
  ["/services/get-started", 0.6, "monthly"],
  ["/products", 0.6, "monthly"],
  ["/accessibility", 0.3, "yearly"],
  ["/privacy", 0.3, "yearly"],
  ["/privacy/agr", 0.3, "yearly"],
  ["/tilo-vision-scholarship", 0.6, "monthly"],
  ["/terms", 0.3, "yearly"],
  ["/training-terms", 0.2, "yearly"],
];

/**
 * Next writes sitemap URLs into the XML as given, without escaping, so an
 * "&" in an image URL (Unsplash query strings) made the whole sitemap
 * invalid XML. Escape it here.
 */
const xml = (u: string) =>
  u
    .replace(/&(?!amp;|lt;|gt;|quot;|apos;)/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

/** Absolute https image URLs only (sitemaps reject relative ones). */
const images = (list: Array<string | null | undefined>) => {
  const out = list
    .filter((x): x is string => !!x)
    .map((x) => (x.startsWith("/") ? absUrl(x) : x))
    .filter((x) => /^https:\/\//.test(x))
    .map(xml);
  return out.length ? out.slice(0, 5) : undefined;
};

const latest = (dates: Date[]) => (dates.length ? new Date(Math.max(...dates.map((d) => d.getTime()))) : undefined);

async function safe<T>(p: Promise<T>, fallback: T): Promise<T> {
  try {
    return await p;
  } catch (err) {
    console.error("[sitemap]", err);
    return fallback;
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await Promise.all([ensureLearnEditColumns().catch(() => {}), ensureAcquireTables().catch(() => {})]);
  const [tracks, products, collections, posts, events, magnets, pages] = await Promise.all([
    safe(
      prisma.learnTrack.findMany({
        where: { status: { in: ["live", "coming_soon"] } },
        orderBy: { sortOrder: "asc" },
        select: { slug: true, status: true, updatedAt: true, heroImage: true },
      }),
      [],
    ),
    safe(
      prisma.product.findMany({
        where: { published: true },
        orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
        select: { slug: true, updatedAt: true, images: true, featured: true },
      }),
      [],
    ),
    safe(prisma.collection.findMany({ where: { published: true }, select: { slug: true, updatedAt: true, image: true } }), []),
    safe(
      prisma.blogPost.findMany({
        where: { published: true },
        orderBy: { createdAt: "desc" },
        take: 5000,
        select: { slug: true, updatedAt: true, featured: true, coverImage: true },
      }),
      [],
    ),
    safe(prisma.event.findMany({ where: { published: true }, select: { slug: true, updatedAt: true, featured: true, coverImage: true } }), []),
    safe(prisma.acquireMagnet.findMany({ where: { status: "published", noindex: false }, select: { slug: true, updatedAt: true } }), []),
    safe(prisma.acquirePage.findMany({ where: { status: "published", noindex: false }, select: { slug: true, updatedAt: true } }), []),
  ]);

  // Section pages change when their items do.
  const sectionDate: Record<string, Date | undefined> = {
    "/learning-box": latest(tracks.map((t) => t.updatedAt)),
    "/store": latest(products.map((p) => p.updatedAt)),
    "/ai-times": latest(posts.map((p) => p.updatedAt)),
    "/events": latest(events.map((e) => e.updatedAt)),
  };

  const out: MetadataRoute.Sitemap = STATIC.map(([path, priority, changeFrequency]) => ({
    url: absUrl(path),
    lastModified: sectionDate[path],
    changeFrequency,
    priority,
  }));

  // The catalog page is translated in full; each track once its French text is cached.
  const languages = (path: string) => Object.fromEntries(Object.entries(learnAlternates(path)).map(([k, v]) => [k, absUrl(v)]));
  const box = out.find((e) => e.url === absUrl("/learning-box"));
  if (box) {
    box.alternates = { languages: languages("/learning-box") };
    out.push({ ...box, url: absUrl(learnLangPath("/learning-box", "fr")), priority: 0.85, alternates: { languages: languages("/learning-box") } });
  }
  const french = await safe(
    loadTrackSources({ slug: { in: tracks.map((t) => t.slug) } }).then(tracksReadyInFrench),
    new Set<string>(),
  );
  for (const t of tracks) {
    const path = `/learning-box/${t.slug}`;
    const entry: Entry = {
      url: absUrl(path),
      lastModified: t.updatedAt,
      changeFrequency: "monthly",
      priority: t.status === "live" ? 0.9 : 0.6,
      images: images([t.heroImage]),
    };
    out.push(entry);
    if (french.has(t.slug)) {
      entry.alternates = { languages: languages(path) };
      out.push({ ...entry, url: absUrl(learnLangPath(path, "fr")), priority: t.status === "live" ? 0.8 : 0.5, alternates: { languages: languages(path) } });
    }
  }

  for (const p of products) {
    out.push({ url: absUrl(`/store/${p.slug}`), lastModified: p.updatedAt, changeFrequency: "weekly", priority: p.featured ? 0.8 : 0.7, images: images(p.images) });
  }
  for (const c of collections) {
    out.push({ url: absUrl(`/store/collections/${c.slug}`), lastModified: c.updatedAt, changeFrequency: "weekly", priority: 0.6, images: images([c.image]) });
  }

  // Articles: each translation has its own URL (?lang=), listed as
  // alternates so search engines show the right language.
  const langs = await safe(articleLanguages(posts.map((p) => p.slug)), new Map());
  for (const p of posts) {
    const l = langs.get(p.slug) ?? ["en"];
    out.push({
      url: articleUrl(p.slug),
      lastModified: p.updatedAt,
      changeFrequency: "weekly",
      priority: p.featured ? 0.8 : 0.7,
      images: images([p.coverImage]),
      alternates: l.length > 1 ? { languages: articleAlternates(p.slug, l) } : undefined,
    });
  }

  for (const e of events) {
    out.push({ url: absUrl(`/events/${e.slug}`), lastModified: e.updatedAt, changeFrequency: "weekly", priority: e.featured ? 0.8 : 0.7, images: images([e.coverImage]) });
  }
  for (const m of magnets) out.push({ url: absUrl(`/free/${m.slug}`), lastModified: m.updatedAt, changeFrequency: "monthly", priority: 0.6 });
  for (const p of pages) out.push({ url: absUrl(`/lp/${p.slug}`), lastModified: p.updatedAt, changeFrequency: "monthly", priority: 0.5 });

  // Page URLs and hreflang links are written unescaped too (slugs come from
  // the database).
  for (const e of out) {
    e.url = xml(e.url);
    const langs = e.alternates?.languages as Record<string, string> | undefined;
    if (langs) for (const k of Object.keys(langs)) langs[k] = xml(langs[k]);
  }
  return out;
}
