import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { jsonBody } from "@/lib/growth/content-auth";
import { requireAcquireAdmin } from "@/lib/growth/acquire/admin";
import { localizeContent } from "@/lib/growth/acquire/i18n";
import { AcquireError, ensureTrackedLink, setPageStatus, updatePage } from "@/lib/growth/acquire/store";
import { normalizePage } from "@/lib/growth/acquire/types";

// One landing page: read, save edits (sections, CTA, noindex), publish,
// tracked link, pre-translate, delete.
export const maxDuration = 120;

type Ctx = { params: Promise<{ id: string }> };

function fail(err: unknown) {
  if (err instanceof AcquireError) return NextResponse.json({ error: err.message }, { status: err.status });
  console.error("[acquire/page]", err);
  return NextResponse.json({ error: "Something went wrong. Try again." }, { status: 500 });
}

export async function GET(req: NextRequest, { params }: Ctx) {
  const denied = await requireAcquireAdmin(req);
  if (denied) return denied;
  const { id } = await params;
  const p = await prisma.acquirePage.findUnique({ where: { id } });
  if (!p) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ page: { ...p, content: normalizePage(p.content) } });
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const denied = await requireAcquireAdmin(req);
  if (denied) return denied;
  const { id } = await params;
  const b = await jsonBody(req);
  if (!b) return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  try {
    const p = await updatePage(id, b);
    return NextResponse.json({ page: { ...p, content: normalizePage(p.content) } });
  } catch (err) {
    return fail(err);
  }
}

export async function POST(req: NextRequest, { params }: Ctx) {
  const denied = await requireAcquireAdmin(req);
  if (denied) return denied;
  const { id } = await params;
  const b = await jsonBody(req);
  try {
    switch (b?.action) {
      case "publish":
      case "unpublish": {
        const p = await setPageStatus(id, b.action === "publish");
        return NextResponse.json({ status: p.status });
      }
      case "link":
        return NextResponse.json(await ensureTrackedLink("page", id));
      case "translate": {
        const p = await prisma.acquirePage.findUnique({ where: { id } });
        if (!p) return NextResponse.json({ error: "Not found" }, { status: 404 });
        if (p.language !== "en") return NextResponse.json({ error: "Only English pages are translated automatically." }, { status: 400 });
        const content = normalizePage(p.content);
        const out = await Promise.all((["fr", "sw"] as const).map((l) => localizeContent(`acquire:page:${p.id}`, "en", content, l, "wait")));
        return NextResponse.json({ ready: out.filter((o) => !o.pending).map((o) => o.locale) });
      }
      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (err) {
    return fail(err);
  }
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const denied = await requireAcquireAdmin(req);
  if (denied) return denied;
  const { id } = await params;
  await prisma.acquirePage.deleteMany({ where: { id } });
  return NextResponse.json({ ok: true });
}
