import { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import fs from "fs";
import path from "path";
import BlogPostClient from "./BlogPostClient";
import { getLocale, getT } from "@/lib/i18n/server";
import { cachedPostSummaries, localizedPost, postMetaFor } from "@/lib/i18n/sources/blog";
import { isLocale } from "@/lib/i18n/config";

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

const SITE_URL = (process.env.NEXTAUTH_URL || "https://tiblogics.com").replace(/\/$/, "");
const FALLBACK_IMAGE = `${SITE_URL}/og-image.png`;

const LOCALE_MAP: Record<string, string> = { en: "en_US", fr: "fr_FR", sw: "sw_KE" };

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

// No searchParams here, deliberately: the language comes from the visitor's
// setting (cookie or browser), not a query string. The canonical URL is the
// same for every language.
export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const t = await getT();
  try {
    const { slug } = await params;
    const locale = await getLocale();

    const { prisma } = await import("@/lib/prisma");
    // findFirst with published, not findUnique: an unpublished (e.g. retracted)
    // article must not keep its title and summary in search metadata.
    const post = await prisma.blogPost.findFirst({
      where: { slug, published: true },
      select: { slug: true, title: true, excerpt: true, content: true, coverImage: true, tags: true, author: true, category: true, createdAt: true },
    });

    if (!post) return { title: t("pages.article.metaNotFound") };

    // Translated title and summary when the cache already has them; never
    // waits on the model, so crawlers get an answer straight away.
    const meta = await postMetaFor(post, locale);
    const title = meta.title;
    const description = meta.excerpt.slice(0, 200);

    const canonicalUrl = `${SITE_URL}/ai-times/${slug}`;
    const ogImage = toOgImage(post.coverImage, post.category);

    return {
      title: t("pages.article.metaTitle", { title }),
      description,
      keywords: post.tags,
      alternates: { canonical: canonicalUrl },
      authors: [{ name: post.author }],
      openGraph: {
        title,
        description,
        type: "article",
        url: canonicalUrl,
        siteName: "AI Times | TIBLOGICS",
        locale: LOCALE_MAP[locale] ?? "en_US",
        publishedTime: post.createdAt.toISOString(),
        authors: [post.author],
        section: post.category,
        tags: post.tags,
        images: [{ url: ogImage, width: 1200, height: 630, alt: title, type: ogImage.toLowerCase().includes(".png") ? "image/png" : "image/jpeg" }],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [ogImage],
        creator: "@tiblogics",
        site: "@tiblogics",
      },
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
  const SITE_URL_LOCAL = (process.env.NEXTAUTH_URL || "https://tiblogics.com").replace(/\/$/, "");

  const siteLocale = await getLocale();
  const locale = isLocale(lang) ? lang : siteLocale;

  let jsonLd: object | null = null;
  let heroCoverUrl: string | null = null;
  // The article in the visitor's language, when it is not English.
  let translation: { title: string; excerpt: string; content: string } | null = null;
  let pending = false;
  let relatedTitles: Record<string, string> = {};
  let postLookupRan = false;
  try {
    const { prisma } = await import("@/lib/prisma");
    const post = await prisma.blogPost.findFirst({
      where: { slug, published: true },
      select: { slug: true, title: true, excerpt: true, content: true, coverImage: true, category: true, author: true, createdAt: true, updatedAt: true, tags: true },
    });
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
      jsonLd = {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": post.title,
        "description": post.excerpt.slice(0, 200),
        "image": ogImage,
        "datePublished": post.createdAt.toISOString(),
        "dateModified": post.updatedAt.toISOString(),
        "url": `${SITE_URL_LOCAL}/ai-times/${slug}`,
        "author": { "@type": "Person", "name": post.author, "url": SITE_URL_LOCAL },
        "publisher": {
          "@type": "Organization",
          "name": "TIBLOGICS",
          "url": SITE_URL_LOCAL,
          "logo": { "@type": "ImageObject", "url": `${SITE_URL_LOCAL}/logo.png` },
        },
        "keywords": post.tags.join(", "),
        "mainEntityOfPage": { "@type": "WebPage", "@id": `${SITE_URL_LOCAL}/ai-times/${slug}` },
        "isPartOf": { "@type": "Blog", "name": "AI Times by TIBLOGICS", "url": `${SITE_URL_LOCAL}/ai-times` },
      };
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
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <Suspense fallback={null}>
        <BlogPostClient translation={pending ? null : translation} pending={pending} relatedTitles={relatedTitles} articleLocale={locale} />
      </Suspense>
    </>
  );
}
