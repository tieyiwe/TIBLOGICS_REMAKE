import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import BlogPostClient from "./BlogPostClient";

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  try {
    const { slug } = await params;
    const post = await prisma.blogPost.findUnique({
      where: { slug },
      select: { title: true, excerpt: true, coverImage: true, coverEmoji: true, tags: true },
    });

    if (!post) return { title: "Post Not Found | AI Times" };

    const images = post.coverImage
      ? [{ url: post.coverImage, width: 800, height: 450, alt: post.title }]
      : [];

    return {
      title: `${post.title} | AI Times by TIBLOGICS`,
      description: post.excerpt,
      keywords: post.tags,
      openGraph: {
        title: post.title,
        description: post.excerpt,
        type: "article",
        siteName: "AI Times | TIBLOGICS",
        images,
      },
      twitter: {
        card: post.coverImage ? "summary_large_image" : "summary",
        title: post.title,
        description: post.excerpt,
        images: post.coverImage ? [post.coverImage] : [],
      },
    };
  } catch {
    return { title: "AI Times | TIBLOGICS" };
  }
}

export default function BlogPostPage() {
  return <BlogPostClient />;
}
