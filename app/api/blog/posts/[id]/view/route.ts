import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { clientIp } from "@/lib/geo";

// POST: one view of a published article (its slug). Sent by the article page
// once it has loaded.
//
// Raw SQL on purpose: through the ORM, BlogPost's @updatedAt would be set too,
// and an UPDATE touching more than the counter empties the public caches of
// the blog and its translations (lib/cache/public-data.ts), changes the
// article's "modified" date for search engines, and clears the 404 check
// (lib/seo/exists.ts). This statement sets only "viewCount".

const SEEN_MS = 30 * 60_000;
const MAX_SEEN = 20_000;
/** Address and article pairs counted recently: a reload or a bot loop counts once. */
const seen = new Map<string, number>();

function firstView(key: string): boolean {
  const now = Date.now();
  const at = seen.get(key);
  if (at && now - at < SEEN_MS) return false;
  if (seen.size >= MAX_SEEN) {
    for (const [k, t] of seen) if (now - t >= SEEN_MS) seen.delete(k);
    if (seen.size >= MAX_SEEN) seen.clear();
  }
  seen.set(key, now);
  return true;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: slug } = await params;
  if (!slug || slug.length > 200) return NextResponse.json({ ok: false }, { status: 400 });
  if (!firstView(`${clientIp(req.headers) ?? "unknown"}|${slug}`)) return NextResponse.json({ ok: true });
  try {
    await prisma.$executeRaw`UPDATE "BlogPost" SET "viewCount" = "viewCount" + 1 WHERE "slug" = ${slug} AND "published" = true`;
  } catch {
    // A missed view is not worth an error page.
  }
  return NextResponse.json({ ok: true });
}
