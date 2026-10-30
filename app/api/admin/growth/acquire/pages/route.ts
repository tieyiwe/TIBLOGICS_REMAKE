import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { ClaudeRefusal } from "@/lib/claude";
import { jsonBody } from "@/lib/growth/content-auth";
import { ensureGrowthTables } from "@/lib/growth/db";
import { isLanguage } from "@/lib/growth/content/platforms";
import { getCatalogItem } from "@/lib/growth/catalog";
import { actor, requireAcquireAdmin } from "@/lib/growth/acquire/admin";
import { ctaFor, draftPage, DraftError, pageFromKit } from "@/lib/growth/acquire/ai";
import { AcquireError, createPage } from "@/lib/growth/acquire/store";
import { statsFor } from "@/lib/growth/acquire/stats";
import { blankSection } from "@/lib/growth/acquire/types";

// Campaign landing pages: list with stats, and create from a content kit
// (no model call), with an AI draft for a product, or blank.
export const maxDuration = 180;

export async function GET(req: NextRequest) {
  const denied = await requireAcquireAdmin(req);
  if (denied) return denied;
  const rows = await prisma.acquirePage.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
  const stats = await statsFor("page", rows);
  return NextResponse.json({
    pages: rows.map((p) => ({ id: p.id, slug: p.slug, title: p.title, status: p.status, language: p.language, noindex: p.noindex, updatedAt: p.updatedAt, stats: stats.get(p.id) })),
  });
}

export async function POST(req: NextRequest) {
  const denied = await requireAcquireAdmin(req);
  if (denied) return denied;
  const b = await jsonBody(req);
  const language = isLanguage(b?.language) ? b.language : "en";
  const productKey = typeof b?.productKey === "string" && b.productKey ? b.productKey.slice(0, 200) : null;
  try {
    if (b?.mode === "kit") {
      await ensureGrowthTables();
      const kit = typeof b.kitId === "string" ? await prisma.growthKit.findUnique({ where: { id: b.kitId } }) : null;
      if (!kit) return NextResponse.json({ error: "Pick a content kit." }, { status: 400 });
      const content = await pageFromKit(kit);
      const p = await createPage({ title: `${kit.productTitle} (${kit.language.toUpperCase()})`, language: kit.language, productKey: kit.productKey, kitId: kit.id, content });
      return NextResponse.json({ page: { id: p.id }, warnings: [] }, { status: 201 });
    }
    if (b?.mode === "blank") {
      const item = productKey ? await getCatalogItem(productKey) : null;
      const hero = blankSection("hero", 0);
      hero.title = item?.title ?? "";
      const content = { sections: [hero, blankSection("benefits", 1), blankSection("faq", 2), blankSection("form", 3)], cta: ctaFor(item), description: item?.summary ?? "" };
      const p = await createPage({ title: item?.title ?? "New landing page", language, productKey, content });
      return NextResponse.json({ page: { id: p.id }, warnings: [] }, { status: 201 });
    }
    if (!(await checkRateLimit(`acquire-draft:${await actor()}`, 30, 3_600_000))) {
      return NextResponse.json({ error: "Too many drafts this hour. Try again later." }, { status: 429 });
    }
    const goal = typeof b?.goal === "string" ? b.goal.trim().slice(0, 400) : "";
    const audienceId = typeof b?.audienceId === "string" ? b.audienceId.slice(0, 60) : null;
    const draft = await draftPage({ productKey, goal, language, audienceId });
    const p = await createPage({ title: draft.title, language, productKey, content: draft.content });
    return NextResponse.json({ page: { id: p.id }, warnings: draft.warnings }, { status: 201 });
  } catch (err) {
    if (err instanceof DraftError || err instanceof AcquireError) return NextResponse.json({ error: err.message }, { status: 422 });
    if (err instanceof ClaudeRefusal) return NextResponse.json({ error: "The model declined to write this. Change the goal." }, { status: 422 });
    console.error("[acquire/pages] create", err);
    return NextResponse.json({ error: "Could not create the page. Try again." }, { status: 502 });
  }
}
