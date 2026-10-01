import { NextRequest, NextResponse } from "next/server";
import { jsonBody, requireGrowthAdmin } from "@/lib/growth/content-auth";
import { bulkUpdatePosts, type PostAction } from "@/lib/growth/content/posts";

const ACTIONS: PostAction[] = ["approve", "unschedule", "reject", "restore"];

/** Bulk approve (or unschedule / reject / restore) posts by id. */
export async function POST(req: NextRequest) {
  const denied = await requireGrowthAdmin();
  if (denied) return denied;
  const b = await jsonBody(req);
  const ids = Array.isArray(b?.ids) ? b.ids.filter((x): x is string => typeof x === "string").slice(0, 200) : [];
  const action = b?.action as PostAction;
  if (!ids.length || !ACTIONS.includes(action)) return NextResponse.json({ error: "Choose posts and an action." }, { status: 400 });
  const r = await bulkUpdatePosts(ids, action);
  return NextResponse.json({ updated: r.ok.length, posts: r.ok, failed: r.failed });
}
