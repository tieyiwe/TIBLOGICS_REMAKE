import { NextRequest, NextResponse } from "next/server";
import { jsonBody, requireGrowthAdmin } from "@/lib/growth/content-auth";
import { createPost, listPosts, PostError } from "@/lib/growth/content/posts";
import { LinkError } from "@/lib/growth/links";
import { POST_STATUSES } from "@/lib/growth/content/platforms";

export async function GET(req: NextRequest) {
  const denied = await requireGrowthAdmin();
  if (denied) return denied;
  const q = req.nextUrl.searchParams;
  const d = (v: string | null) => (v && !Number.isNaN(Date.parse(v)) ? new Date(v) : undefined);
  const status = (q.get("status") ?? "").split(",").filter((s) => (POST_STATUSES as readonly string[]).includes(s));
  const posts = await listPosts({ from: d(q.get("from")), to: d(q.get("to")), status });
  return NextResponse.json({ posts });
}

export async function POST(req: NextRequest) {
  const denied = await requireGrowthAdmin();
  if (denied) return denied;
  const b = await jsonBody(req);
  if (!b) return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  try {
    return NextResponse.json({ post: await createPost(b) }, { status: 201 });
  } catch (err) {
    if (err instanceof PostError) return NextResponse.json({ error: err.message }, { status: err.status });
    if (err instanceof LinkError) return NextResponse.json({ error: err.message }, { status: 422 });
    throw err;
  }
}
