import { Metadata } from "next";
import BlogPostClient from "./BlogPostClient";

const SITE_URL = (process.env.NEXTAUTH_URL || "https://tiblogics.com").replace(/\/$/, "");
const FALLBACK_IMAGE = `${SITE_URL}/og-image.png`;

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
    return coverImage.startsWith("/") ? `${SITE_URL}${coverImage}` : FALLBACK_IMAGE;
  }
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  try {
    const { slug } = await params;
    const { prisma } = await import("@/lib/prisma");
    const post = await prisma.blogPost.findUnique({
      where: { slug },
      select: {
        title: true,
        excerpt: true,
        coverImage: true,
        tags: true,
        author: true,
        category: true,
        createdAt: true,
      },
    });

    if (!post) return { title: "Post Not Found | AI Times" };

    const pageUrl = `${SITE_URL}/ai-times/${slug}`;
    const ogImage = toOgImage(post.coverImage);
    const description = post.excerpt.slice(0, 200);

    return {
      title: `${post.title} | AI Times by TIBLOGICS`,
      description,
      keywords: post.tags,
      alternates: { canonical: pageUrl },
      authors: [{ name: post.author }],
      openGraph: {
        title: post.title,
        description,
        type: "article",
        url: pageUrl,
        siteName: "AI Times | TIBLOGICS",
        publishedTime: post.createdAt.toISOString(),
        authors: [post.author],
        section: post.category,
        tags: post.tags,
        images: [
          {
            url: ogImage,
            width: 1200,
            height: 630,
            alt: post.title,
            type: "image/jpeg",
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: post.title,
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
      <BlogPostClient preloadedTranslations={preloadedTranslations} />
    </>
  );
}
