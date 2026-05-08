import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    // Find all posts grouped by normalised title (lowercase, stripped punctuation)
    const allPosts = await prisma.blogPost.findMany({
      select: { id: true, title: true, content: true, createdAt: true, aiGenerated: true },
      orderBy: { createdAt: "asc" },
    });

    const seen = new Map<string, { id: string; contentLen: number; aiGenerated: boolean }>();
    const toDelete: string[] = [];

    for (const post of allPosts) {
      const key = post.title.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim().replace(/\s+/g, " ").slice(0, 60);
      const existing = seen.get(key);
      if (!existing) {
        seen.set(key, { id: post.id, contentLen: post.content.length, aiGenerated: post.aiGenerated });
      } else {
        // Never delete a manually-written article (aiGenerated: false) — always keep it
        if (!post.aiGenerated && existing.aiGenerated) {
          // New post is manual, existing is AI — delete existing
          toDelete.push(existing.id);
          seen.set(key, { id: post.id, contentLen: post.content.length, aiGenerated: post.aiGenerated });
        } else if (post.aiGenerated && !existing.aiGenerated) {
          // New post is AI, existing is manual — delete new
          toDelete.push(post.id);
        } else {
          // Both same type — keep the one with more content
          if (post.content.length > existing.contentLen) {
            toDelete.push(existing.id);
            seen.set(key, { id: post.id, contentLen: post.content.length, aiGenerated: post.aiGenerated });
          } else {
            toDelete.push(post.id);
          }
        }
      }
    }

    if (toDelete.length === 0) {
      return NextResponse.json({ message: "No duplicates found", removed: 0 });
    }

    await prisma.blogPost.deleteMany({ where: { id: { in: toDelete } } });

    return NextResponse.json({ message: `Removed ${toDelete.length} duplicate posts`, removed: toDelete.length });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
