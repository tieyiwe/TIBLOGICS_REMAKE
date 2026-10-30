import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit } from "@/lib/rate-limit";
import { csrfGuard } from "@/lib/learn/account-status/admin-auth";
import { clientIp } from "@/lib/growth/acquire/security";
import { publishedPost, setReaction } from "@/lib/blog/engage/db";
import { readerHash, readerId, setReaderCookie } from "@/lib/blog/engage/identity";
import { REACTIONS } from "@/lib/blog/engage/types";

export const dynamic = "force-dynamic";

const Body = z.object({ kind: z.enum(REACTIONS).nullable() });

// One reaction per reader per article (an anonymous browser id, stored as a
// keyed hash). null clears it. JSON from this site only, rate limited.
export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const csrf = csrfGuard(req);
  if (csrf) return csrf;
  if (!(await checkRateLimit(`article-react:${clientIp(req)}`, 120, 3_600_000))) {
    return NextResponse.json({ error: "Too many" }, { status: 429 });
  }
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Bad request" }, { status: 400 });
  const { slug } = await params;
  const post = await publishedPost(slug).catch(() => null);
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const rid = readerId(req);
  try {
    const counts = await setReaction(slug, readerHash(rid.id), parsed.data.kind);
    const res = NextResponse.json({ counts, mine: parsed.data.kind });
    if (rid.fresh) setReaderCookie(res, rid.id);
    return res;
  } catch (err) {
    console.error("[POST react]", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  }
}
