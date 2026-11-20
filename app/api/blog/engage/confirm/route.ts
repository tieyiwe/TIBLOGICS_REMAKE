import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit } from "@/lib/rate-limit";
import { csrfGuard } from "@/lib/learn/account-status/admin-auth";
import { clientIp } from "@/lib/growth/acquire/security";
import { commenterState, confirmComment, publishedPost, touchCommenter } from "@/lib/blog/engage/db";
import { setCommenterCookie, verifyToken } from "@/lib/blog/engage/identity";
import { afterSaved, subscribeFromComment } from "@/lib/blog/engage/notify";

export const dynamic = "force-dynamic";

const Body = z.object({ t: z.string().min(20).max(1500) });

// A guest pressed "Publish my comment" on the article their email link opened
// (?confirm=TOKEN). The signed token names the comment and the email; the
// comment goes up (or to staff if held) and this browser is remembered, so
// their next comments need no email.
export async function POST(req: NextRequest) {
  const csrf = csrfGuard(req);
  if (csrf) return csrf;
  if (!(await checkRateLimit(`comment-confirm:${clientIp(req)}`, 20, 3_600_000))) {
    return NextResponse.json({ status: "error" }, { status: 429 });
  }
  const parsed = Body.safeParse(await req.json().catch(() => null));
  const data = parsed.success ? verifyToken<{ c?: unknown; e?: unknown; nl?: unknown }>("confirm", parsed.data.t) : null;
  if (!data || typeof data.c !== "string" || typeof data.e !== "string") return NextResponse.json({ status: "expired" }, { status: 410 });
  const email = data.e;
  const known = await commenterState(email).catch(() => null);
  if (known?.blocked) return NextResponse.json({ status: "expired" }, { status: 410 });
  const result = await confirmComment(data.c, email).catch(() => null);
  if (!result) return NextResponse.json({ status: "expired" }, { status: 410 });
  const c = result.comment;
  if (c.status !== "published" && c.status !== "pending") return NextResponse.json({ status: "expired" }, { status: 410 });
  if (result.changed) {
    await touchCommenter(email, c.authorName, c.notifyReplies).catch(() => {});
    if (data.nl === 1) await subscribeFromComment(email, c.authorName).catch(() => {});
    const post = await publishedPost(c.postSlug).catch(() => null);
    if (post) afterSaved(c, post.title, { alertOwner: true });
  }
  const res = NextResponse.json({ status: c.status, id: c.id });
  setCommenterCookie(res, { email, name: c.authorName });
  return res;
}
