import { NextRequest, NextResponse } from "next/server";
import { jsonBody, requireGrowthAdmin, requireGrowthPublish } from "@/lib/growth/content-auth";
import { deletePost, PostError, updatePost } from "@/lib/growth/content/posts";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const denied = await requireGrowthAdmin();
  if (denied) return denied;
  const { id } = await params;
  const b = await jsonBody(req);
  if (!b) return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  if (b.action === "approve") {
    const noPublish = await requireGrowthPublish();
    if (noPublish) return noPublish;
  }
  try {
    return NextResponse.json({ post: await updatePost(id, b) });
  } catch (err) {
    if (err instanceof PostError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const denied = await requireGrowthAdmin();
  if (denied) return denied;
  const { id } = await params;
  try {
    await deletePost(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof PostError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
