import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { resolveCoverImage } from "@/lib/blog-images";

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 80);
}

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
      const terms = search.trim().split(/\s+/).filter(Boolean);
      // Every term must appear somewhere in the post (AND across terms, OR across fields)
      where.AND = terms.map(term => ({
        OR: [
          { title:   { contains: term, mode: "insensitive" } },
          { excerpt: { contains: term, mode: "insensitive" } },
          { content: { contains: term, mode: "insensitive" } },
          { author:  { contains: term, mode: "insensitive" } },
          { tags:    { has: term.toLowerCase() } },
        ],
      }));
    }

    const [posts, total] = await Promise.all([
      prisma.blogPost.findMany({
        where,
        orderBy: { createdAt: "desc" },
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
  const unauth = await requireAdmin();
  if (unauth) return unauth;

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
        coverImage: body.coverImage ?? resolveCoverImage(body.title, category, body.tags ?? []),
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
