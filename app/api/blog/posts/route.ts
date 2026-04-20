import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 80);
}

const CATEGORY_COVER: Record<string, string> = {
  "breaking":     "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=800&q=80",
  "ai-business":  "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=800&q=80",
  "tips":         "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=800&q=80",
  "tools":        "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80",
  "case-studies": "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80",
  "industry":     "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=800&q=80",
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const featured = searchParams.get("featured");
  const limit = parseInt(searchParams.get("limit") ?? "20");
  const page = parseInt(searchParams.get("page") ?? "1");
  const search = searchParams.get("search");

  try {
    const where: Record<string, unknown> = { published: true };
    if (category && category !== "all") where.category = category;
    if (featured === "true") where.featured = true;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { excerpt: { contains: search, mode: "insensitive" } },
        { tags: { has: search.toLowerCase() } },
      ];
    }

    const [posts, total] = await Promise.all([
      prisma.blogPost.findMany({
        where,
        orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
        take: limit,
        skip: (page - 1) * limit,
      }),
      prisma.blogPost.count({ where }),
    ]);

    return NextResponse.json({ posts, total, page, pages: Math.ceil(total / limit) });
  } catch {
    return NextResponse.json({ posts: [], total: 0, page: 1, pages: 0 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const baseSlug = slugify(body.title);
    let slug = baseSlug;
    let i = 1;
    while (await prisma.blogPost.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${i++}`;
    }

    const category = body.category ?? "industry";
    const post = await prisma.blogPost.create({
      data: {
        slug,
        title: body.title,
        excerpt: body.excerpt,
        content: body.content,
        category,
        tags: body.tags ?? [],
        coverEmoji: body.coverEmoji ?? "🤖",
        coverGradient: body.coverGradient ?? "from-[#1B3A6B] to-[#2251A3]",
        coverImage: body.coverImage ?? CATEGORY_COVER[category] ?? CATEGORY_COVER["industry"],
        author: body.author ?? "Echelon AI",
        readingTime: body.readingTime ?? Math.ceil(body.content.split(" ").length / 200),
        featured: body.featured ?? false,
        published: body.published ?? true,
        aiGenerated: body.aiGenerated ?? false,
        sourceUrl: body.sourceUrl,
        sourceTitle: body.sourceTitle,
      },
    });

    return NextResponse.json({ post }, { status: 201 });
  } catch (err) {
    console.error("Blog POST error:", err);
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
  }
}
