import { NextRequest, NextResponse } from "next/server";
import { engageData, publishedPost } from "@/lib/blog/engage/db";
import { readerHash, viewerOf, READER_COOKIE } from "@/lib/blog/engage/identity";

export const dynamic = "force-dynamic";

// Comments, reactions and who is viewing, for the discussion under an
// article. Public; never returns an email address. The reader's own comments
// waiting for review are included for them only.
export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await publishedPost(slug).catch(() => null);
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });
  try {
    const viewer = await viewerOf(req);
    const rid = req.cookies.get(READER_COOKIE)?.value;
    const data = await engageData(slug, post.author, viewer, rid && /^[A-Za-z0-9_-]{22,40}$/.test(rid) ? readerHash(rid) : null);
    return NextResponse.json(data, { headers: { "Cache-Control": "private, no-store" } });
  } catch (err) {
    console.error("[GET engage]", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  }
}
