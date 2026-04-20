import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import BlogPostClient from "./BlogPostClient";

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const post = await prisma.blogPost.findUnique({
      where: { slug: params.slug },
      select: { title: true, excerpt: true, coverImage: true, coverEmoji: true, tags: true },
    });

    if (!post) return { title: "Post Not Found | The Smart Room" };

    const images = post.coverImage
      ? [{ url: post.coverImage, width: 800, height: 450, alt: post.title }]
      : [];

    return {
      title: `${post.title} | The Smart Room by TIBLOGICS`,
      description: post.excerpt,
      keywords: post.tags,
      openGraph: {
        title: post.title,
        description: post.excerpt,
        type: "article",
        siteName: "The Smart Room | TIBLOGICS",
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
    return { title: "The Smart Room | TIBLOGICS" };
  }
}

export default function BlogPostPage() {
  return <BlogPostClient />;
}
