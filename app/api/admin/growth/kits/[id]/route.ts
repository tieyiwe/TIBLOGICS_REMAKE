import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { jsonBody, requireGrowthAdmin } from "@/lib/growth/content-auth";
import { updateKit } from "@/lib/growth/content/kit";
import { normalizeKit } from "@/lib/growth/content/kit-types";
import { listPosts } from "@/lib/growth/content/posts";
import { getCatalogItem } from "@/lib/growth/catalog";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const denied = await requireGrowthAdmin();
  if (denied) return denied;
  const { id } = await params;
  const kit = await prisma.growthKit.findUnique({ where: { id } });
  if (!kit) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const [posts, item] = await Promise.all([listPosts({ kitId: id }), getCatalogItem(kit.productKey)]);
  return NextResponse.json({ kit: { ...kit, content: normalizeKit(kit.content) }, posts, facts: item?.facts ?? [] });
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const denied = await requireGrowthAdmin();
  if (denied) return denied;
  const { id } = await params;
  const b = await jsonBody(req);
  if (!b?.content || JSON.stringify(b.content).length > 200_000) return NextResponse.json({ error: "Invalid kit" }, { status: 400 });
  const kit = await updateKit(id, b.content);
  if (!kit) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ kit: { ...kit, content: normalizeKit(kit.content) } });
}

/** Deletes the kit and its unpublished queue items; links and click history stay. */
export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const denied = await requireGrowthAdmin();
  if (denied) return denied;
  const { id } = await params;
  await prisma.growthPost.deleteMany({ where: { kitId: id, status: { in: ["draft", "rejected", "ready", "failed", "scheduled"] } } });
  await prisma.growthKit.deleteMany({ where: { id } });
  return NextResponse.json({ ok: true });
}
