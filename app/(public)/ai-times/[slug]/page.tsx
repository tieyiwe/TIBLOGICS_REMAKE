import { Metadata } from "next";
import { Suspense } from "react";
import fs from "fs";
import path from "path";
import Anthropic from "@anthropic-ai/sdk";
import BlogPostClient from "./BlogPostClient";

const SITE_URL = (process.env.NEXTAUTH_URL || "https://tiblogics.com").replace(/\/$/, "");
const FALLBACK_IMAGE = `${SITE_URL}/og-image.png`;

const LOCALE_MAP: Record<string, string> = { en: "en_US", fr: "fr_FR", sw: "sw_KE" };
const LANG_LABEL: Record<string, string> = { fr: "Français", sw: "Kiswahili" };
const LANG_NAMES: Record<string, string> = { fr: "French", sw: "Swahili" };

// Translate only title+excerpt for OG metadata. Uses a separate DB key (tx-meta:)
// so it doesn't collide with the full article translation cache (tx:).
async function translateMeta(
  prisma: import("@prisma/client").PrismaClient,
  slug: string,
  lang: "fr" | "sw",
  title: string,
  excerpt: string
): Promise<{ title: string; excerpt: string }> {
  const metaKey = `tx-meta:${slug}:${lang}`;

  // Check meta-only cache first
  try {
    const cached = await prisma.adminSettings.findUnique({ where: { key: metaKey } });
    if (cached?.value) {
      const parsed = JSON.parse(cached.value);
      if (parsed.title && parsed.excerpt) return parsed;
    }
  } catch { /* cache miss */ }

  const langName = LANG_NAMES[lang];
  const prompt = `Translate the title and excerpt below into ${langName}.
Return ONLY a raw JSON object with exactly two keys: "title" and "excerpt". No markdown, no explanation.

TITLE: ${title}

EXCERPT: ${excerpt.slice(0, 300)}`;

  const haiku = new Anthropic().messages;
  const response = await haiku.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 512,
    messages: [{ role: "user", content: prompt }],
  });

  const raw = response.content[0].type === "text" ? response.content[0].text.trim() : "";
  const jsonStr = raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "");
  const tx: { title?: string; excerpt?: string } = JSON.parse(jsonStr);

  if (!tx.title || !tx.excerpt) throw new Error("incomplete translation");

  // Cache so the next social crawl for this slug+lang is instant
  prisma.adminSettings.upsert({
    where: { key: metaKey },
    create: { key: metaKey, value: JSON.stringify(tx) },
    update: { value: JSON.stringify(tx) },
  }).catch(() => {});

  return { title: tx.title, excerpt: tx.excerpt };
}

function toOgImage(coverImage: string | null): string {
  if (!coverImage) return FALLBACK_IMAGE;
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
    return coverImage;
  } catch {
    if (coverImage.startsWith("/")) {
      // Only serve local files that are actually deployed in /public
      try {
        const filePath = path.join(process.cwd(), "public", coverImage);
        if (fs.existsSync(filePath)) return `${SITE_URL}${coverImage}`;
      } catch { /* fall through */ }
      return FALLBACK_IMAGE;
    }
    return FALLBACK_IMAGE;
  }
}

export async function generateMetadata(
  { params, searchParams }: {
    params: Promise<{ slug: string }>;
    searchParams: Promise<Record<string, string>>;
  }
): Promise<Metadata> {
  try {
    const { slug } = await params;
    const sp = await searchParams;
    const lang = (["fr", "sw"].includes(sp?.lang) ? sp.lang : "en") as "en" | "fr" | "sw";

    const { prisma } = await import("@/lib/prisma");
    const [post, txCache] = await Promise.all([
      prisma.blogPost.findUnique({
        where: { slug },
        select: { title: true, excerpt: true, coverImage: true, tags: true, author: true, category: true, createdAt: true },
      }),
      lang !== "en"
        ? prisma.adminSettings.findUnique({ where: { key: `tx:${slug}:${lang}` } })
        : Promise.resolve(null),
    ]);

    if (!post) return { title: "Post Not Found | AI Times" };

    // Use translated title/description if available and language is not English
    let title = post.title;
    let description = post.excerpt.slice(0, 200);
    if (lang !== "en") {
      if (txCache?.value) {
        // Full article translation already cached — use it
        try {
          const tx = JSON.parse(txCache.value);
          if (tx.title) title = tx.title;
          if (tx.excerpt) description = tx.excerpt.slice(0, 200);
        } catch { /* fall back to English */ }
      } else {
        // No cache yet — generate a quick title+excerpt translation so social previews
        // show the correct language even before any human has visited the page.
        try {
          const meta = await translateMeta(prisma, slug, lang as "fr" | "sw", post.title, post.excerpt);
          title = meta.title;
          description = meta.excerpt.slice(0, 200);
        } catch { /* fall back to English title/description */ }
      }
    }

    const pageUrl = lang === "en"
      ? `${SITE_URL}/ai-times/${slug}`
      : `${SITE_URL}/ai-times/${slug}?lang=${lang}`;
    const canonicalUrl = `${SITE_URL}/ai-times/${slug}`; // canonical always points to English
    const ogImage = toOgImage(post.coverImage);
    const locale = LOCALE_MAP[lang] ?? "en_US";
    const siteName = lang !== "en"
      ? `AI Times | TIBLOGICS (${LANG_LABEL[lang]})`
      : "AI Times | TIBLOGICS";

    return {
      title: `${title} | AI Times by TIBLOGICS`,
      description,
      keywords: post.tags,
      alternates: {
        canonical: canonicalUrl,
        languages: {
          "en": `${SITE_URL}/ai-times/${slug}`,
          "fr": `${SITE_URL}/ai-times/${slug}?lang=fr`,
          "sw": `${SITE_URL}/ai-times/${slug}?lang=sw`,
        },
      },
      authors: [{ name: post.author }],
      openGraph: {
        title,
        description,
        type: "article",
        url: pageUrl,
        siteName,
        locale,
        publishedTime: post.createdAt.toISOString(),
        authors: [post.author],
        section: post.category,
        tags: post.tags,
        images: [{ url: ogImage, width: 1200, height: 630, alt: title, type: "image/jpeg" }],
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
    return { title: "AI Times | TIBLOGICS" };
  }
}

export default async function BlogPostPage(
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const SITE_URL_LOCAL = (process.env.NEXTAUTH_URL || "https://tiblogics.com").replace(/\/$/, "");

  let jsonLd: object | null = null;
  let heroCoverUrl: string | null = null;
  let preloadedTranslations: Record<string, { title: string; excerpt: string; content: string }> = {};
  try {
    const { prisma } = await import("@/lib/prisma");
    const [post, frCache, swCache] = await Promise.all([
      prisma.blogPost.findUnique({
        where: { slug },
        select: { title: true, excerpt: true, coverImage: true, author: true, createdAt: true, updatedAt: true, tags: true },
      }),
      prisma.adminSettings.findUnique({ where: { key: `tx:${slug}:fr` } }),
      prisma.adminSettings.findUnique({ where: { key: `tx:${slug}:sw` } }),
    ]);
    if (frCache?.value) preloadedTranslations.fr = JSON.parse(frCache.value);
    if (swCache?.value) preloadedTranslations.sw = JSON.parse(swCache.value);
    if (post) {
      heroCoverUrl = post.coverImage ?? null;
      const ogImage = toOgImage(post.coverImage);
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
        <BlogPostClient preloadedTranslations={preloadedTranslations} />
      </Suspense>
    </>
  );
}
