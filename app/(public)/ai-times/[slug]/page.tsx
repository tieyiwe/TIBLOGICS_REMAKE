import { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import fs from "fs";
import path from "path";
import BlogPostClient from "./BlogPostClient";
import { getLocale, getT } from "@/lib/i18n/server";
import { cachedPostSummaries, localizedPost, postMetaFor } from "@/lib/i18n/sources/blog";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { fitTitle, pageMetadata, plain } from "@/lib/seo/meta";
import JsonLd from "@/components/seo/JsonLd";
import { breadcrumbNode, type JsonLdNode } from "@/lib/seo/jsonld";
import { LOGO_URL, ORG_ID, SITE_NAME, WEBSITE_ID } from "@/lib/seo/site";
import { articleAlternates, articleLanguages, articleUrl, authorNode } from "@/lib/seo/articles";
import { cachedPublicData } from "@/lib/cache/public-data";

export const revalidate = 3600;

export async function generateStaticParams() {
  try {
    const { prisma } = await import("@/lib/prisma");
    const posts = await prisma.blogPost.findMany({
      where: { published: true },
      select: { slug: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return posts.map((p) => ({ slug: p.slug }));
  } catch {
    return [];
  }
}

/** A published article, cached in process until a post changes (lib/cache/public-data.ts). */
function articlePost(prisma: typeof import("@/lib/prisma").prisma, slug: string) {
  return cachedPublicData("blog", `article:${slug}`, () =>
    prisma.blogPost.findFirst({
      where: { slug, published: true },
      select: {
        id: true, slug: true, title: true, excerpt: true, content: true, coverImage: true, coverEmoji: true,
        coverGradient: true, category: true, author: true, readingTime: true, aiGenerated: true, sourceUrl: true,
        sourceTitle: true, viewCount: true, createdAt: true, updatedAt: true, tags: true,
      },
    }),
  );
}

// Canonical origin, whatever host served the request.
const SITE_URL = "https://tiblogics.com";
const FALLBACK_IMAGE = `${SITE_URL}/opengraph-image?v=3`;

const CATEGORY_OG_FALLBACK: Record<string, string> = {
  "breaking":     "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&h=630&q=80",
  "ai-business":  "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=1200&h=630&q=80",
  "tips":         "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=1200&h=630&q=80",
  "tools":        "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&h=630&q=80",
  "case-studies": "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&h=630&q=80",
  "industry":     "https://images.unsplash.com/photo-1779509742657-97f3e5c76f4f?auto=format&fit=crop&w=1200&h=630&q=80",
};

function toOgImage(coverImage: string | null, category?: string | null): string {
  const fallback = CATEGORY_OG_FALLBACK[category ?? ""] ?? FALLBACK_IMAGE;

  if (!coverImage) return fallback;
  try {
    const url = new URL(coverImage);
    if (url.hostname === "images.unsplash.com") {
      url.searchParams.set("auto", "format");
      url.searchParams.set("fit", "crop");
      url.searchParams.set("w", "1200");
      url.searchParams.set("h", "630");
      url.searchParams.set("q", "80");
      return url.toString();
    }
    if (url.hostname === "source.unsplash.com") {
      // source.unsplash.com/{id} or source.unsplash.com/{id}/{w}x{h}
      const id = url.pathname.split("/").filter(Boolean)[0];
      return `https://source.unsplash.com/${id}/1200x630`;
    }
    // Any other valid external URL — use as-is
    return coverImage;
  } catch {
    if (coverImage.startsWith("/")) {
      // Only serve local files actually deployed in /public
      try {
        const filePath = path.join(process.cwd(), "public", coverImage);
        if (fs.existsSync(filePath)) return `${SITE_URL}${coverImage}`;
      } catch { /* fall through */ }
    }
    return fallback;
  }
}

// Each language version has its own URL (?lang=fr, ?lang=sw: the article's
// language buttons), so each is its own canonical, and they point at each
// other with hreflang. Only languages whose translation is ready are listed;
// without ?lang= the page is the English article's URL.
export async function generateMetadata(
  { params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ lang?: string }> }
): Promise<Metadata> {
  const t = await getT();
  const { slug } = await params;
  const { lang } = await searchParams;
  const { prisma } = await import("@/lib/prisma");
  // findFirst with published, not findUnique: an unpublished (e.g. retracted)
  // article must not keep its title and summary in search metadata.
  // undefined = the database failed (not the same as "no such article").
  // The same cached row as the page (one read for both).
  const post = await articlePost(prisma, slug).catch(() => undefined);
  // A real 404 for crawlers that get blocking metadata (next.config.js).
  if (post === null) notFound();
  if (!post) return { title: t("pages.aiTimes.meta.title") };

  try {
    const siteLocale = await getLocale();
    const langs = (await articleLanguages([slug])).get(slug) ?? ["en"];
    const asked = isLocale(lang) && lang !== "en" && langs.includes(lang) ? lang : null;
    const locale: Locale = asked ?? siteLocale;

    // Translated title and summary when the cache already has them; never
    // waits on the model, so crawlers get an answer straight away.
    const meta = await postMetaFor(post, locale);
    const ogImage = toOgImage(post.coverImage, post.category);

    const base = pageMetadata({
      path: articleUrl(slug, asked ?? "en"),
      locale,
      title: fitTitle([`${meta.title} | AI Times`, meta.title]),
      absoluteTitle: true,
      description: meta.excerpt,
      type: "article",
      image: { url: ogImage, width: 1200, height: 630, alt: meta.title },
      keywords: post.tags,
      article: {
        publishedTime: post.createdAt.toISOString(),
        modifiedTime: post.updatedAt.toISOString(),
        authors: [post.author],
        section: post.category,
        tags: post.tags,
      },
    });
    return {
      ...base,
      alternates: { ...base.alternates, languages: langs.length > 1 ? articleAlternates(slug, langs) : undefined },
      authors: [{ name: post.author }],
    };
  } catch {
    return { title: t("pages.aiTimes.meta.title") };
  }
}

export default async function BlogPostPage(
  { params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ lang?: string }> }
) {
  const { slug } = await params;
  // The article's own language buttons set ?lang= and switch only the article;
  // the rest of the page stays in the visitor's site language.
  const { lang } = await searchParams;

  const siteLocale = await getLocale();
  const locale = isLocale(lang) ? lang : siteLocale;

  let jsonLd: JsonLdNode[] | null = null;
  // The article itself, server-rendered so crawlers and AI engines that do
  // not run JavaScript read the full text (the client used to fetch it).
  let initialPost: Parameters<typeof BlogPostClient>[0]["initialPost"] = null;
  let heroCoverUrl: string | null = null;
  // The article in the visitor's language, when it is not English.
  let translation: { title: string; excerpt: string; content: string } | null = null;
  let pending = false;
  let relatedTitles: Record<string, string> = {};
  let postLookupRan = false;
  try {
    const { prisma } = await import("@/lib/prisma");
    const post = await articlePost(prisma, slug);
    postLookupRan = true;
    if (post && locale !== "en") {
      // Cached translation, or English plus a notice while one is made.
      const localizedResult = await localizedPost(post, locale);
      translation = localizedResult.value;
      pending = localizedResult.pending;

      // Titles for the "more from this category" cards, from the cache only.
      const related = await prisma.blogPost.findMany({
        where: { published: true, category: post.category, NOT: { slug } },
        orderBy: { createdAt: "desc" },
        take: 4,
        select: { slug: true },
      });
      const summaries = await cachedPostSummaries(locale, related.map((r) => r.slug));
      relatedTitles = Object.fromEntries(Object.entries(summaries).map(([k, v]) => [k, v.title]));
    }
    if (post) {
      heroCoverUrl = post.coverImage ?? null;
      const ogImage = toOgImage(post.coverImage, post.category);
      initialPost = {
        ...post,
        coverImage: post.coverImage ?? undefined,
        sourceUrl: post.sourceUrl ?? undefined,
        sourceTitle: post.sourceTitle ?? undefined,
        createdAt: post.createdAt.toISOString(),
      };
      const shown = translation && !pending ? translation : post;
      const url = articleUrl(slug, locale === "en" || !lang ? "en" : locale);
      const text = plain(shown.content);
      jsonLd = [
        {
          "@type": "BlogPosting",
          "@id": `${url}#article`,
          headline: shown.title.slice(0, 110),
          description: plain(shown.excerpt).slice(0, 300),
          image: [ogImage],
          datePublished: post.createdAt.toISOString(),
          dateModified: post.updatedAt.toISOString(),
          inLanguage: translation && !pending ? locale : "en",
          url,
          mainEntityOfPage: { "@type": "WebPage", "@id": url },
          author: authorNode(post.author),
          publisher: { "@type": "Organization", "@id": ORG_ID, name: SITE_NAME, logo: { "@type": "ImageObject", url: LOGO_URL } },
          articleSection: post.category,
          keywords: post.tags.join(", "),
          wordCount: text ? text.split(/\s+/).length : undefined,
          isPartOf: { "@type": "Blog", "@id": `${SITE_URL}/ai-times#blog`, name: "AI Times by TIBLOGICS", url: `${SITE_URL}/ai-times`, publisher: { "@id": ORG_ID }, isPartOf: { "@id": WEBSITE_ID } },
          ...(post.sourceUrl ? { citation: post.sourceUrl } : {}),
        },
        breadcrumbNode([
          { name: "Home", path: "/" },
          { name: "AI Times", path: "/ai-times" },
          { name: shown.title, path: `/ai-times/${slug}` },
        ]),
      ];
    }
  } catch { /* non-blocking */ }

  // Missing or unpublished: a real 404. This page used to render its shell
  // with a 200 whatever the post's state, so a retracted article kept its
  // title and summary in the structured data for search engines to index.
  // Only when the lookup actually ran and found nothing — a database error
  // above leaves jsonLd null too, and should not be reported as "not found".
  if (!jsonLd && postLookupRan) notFound();

  return (
    <>
      {/* Preload the hero cover image so the browser fetches it before JS executes,
          directly improving LCP on mobile. Next.js hoists <link> tags to <head>. */}
      {heroCoverUrl && (
        <link
          rel="preload"
          as="image"
          href={heroCoverUrl}
          fetchPriority="high"
        />
      )}
      {jsonLd && <JsonLd data={jsonLd} />}
      <Suspense fallback={null}>
        <BlogPostClient initialPost={initialPost} translation={pending ? null : translation} pending={pending} relatedTitles={relatedTitles} articleLocale={locale} />
      </Suspense>
    </>
  );
}
