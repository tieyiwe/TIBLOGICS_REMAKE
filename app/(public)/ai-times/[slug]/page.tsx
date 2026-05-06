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

export default function BlogPostPage() {
  return <BlogPostClient />;
}
