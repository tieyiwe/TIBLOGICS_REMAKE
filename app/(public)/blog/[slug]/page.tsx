import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import BlogPostClient from "./BlogPostClient";

const SITE_URL = "https://tiblogics.com";
const FALLBACK_IMAGE = `${SITE_URL}/og-image.png`;

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  try {
    const { slug } = await params;
    const post = await prisma.blogPost.findUnique({
      where: { slug },
      select: {
        title: true,
        excerpt: true,
        coverImage: true,
        tags: true,
        author: true,
        createdAt: true,
      },
    });

    if (!post) return { title: "Post Not Found | AI Times" };

    const pageUrl = `${SITE_URL}/blog/${slug}`;
    const ogImage = post.coverImage ?? FALLBACK_IMAGE;

    return {
      title: `${post.title} | AI Times by TIBLOGICS`,
      description: post.excerpt,
      keywords: post.tags,
      alternates: { canonical: pageUrl },
      authors: [{ name: post.author }],
      openGraph: {
        title: post.title,
        description: post.excerpt,
        type: "article",
        url: pageUrl,
        siteName: "AI Times | TIBLOGICS",
        publishedTime: post.createdAt.toISOString(),
        authors: [post.author],
        images: [{ url: ogImage, width: 800, height: 450, alt: post.title }],
      },
      twitter: {
        card: "summary_large_image",
        title: post.title,
        description: post.excerpt,
        images: [ogImage],
        creator: "@tiblogics",
      },
    };
  } catch {
    return { title: "AI Times | TIBLOGICS" };
  }
}

export default function BlogPostPage() {
  return <BlogPostClient />;
}
