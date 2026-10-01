import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { jsonBody } from "@/lib/growth/content-auth";
import { requireAcquireAdmin } from "@/lib/growth/acquire/admin";
import { localizeContent } from "@/lib/growth/acquire/i18n";
import { AcquireError, ensureTrackedLink, setMagnetStatus, updateMagnet } from "@/lib/growth/acquire/store";
import { normalizeMagnet } from "@/lib/growth/acquire/types";

// One lead magnet: read, save edits, publish/unpublish, tracked link,
// pre-translate (FR/SW), delete.
export const maxDuration = 120;

type Ctx = { params: Promise<{ id: string }> };

function fail(err: unknown) {
  if (err instanceof AcquireError) return NextResponse.json({ error: err.message }, { status: err.status });
  console.error("[acquire/magnet]", err);
  return NextResponse.json({ error: "Something went wrong. Try again." }, { status: 500 });
}

export async function GET(req: NextRequest, { params }: Ctx) {
  const denied = await requireAcquireAdmin(req);
  if (denied) return denied;
  const { id } = await params;
  const m = await prisma.acquireMagnet.findUnique({ where: { id } });
  if (!m) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ magnet: { ...m, content: normalizeMagnet(m.content) } });
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const denied = await requireAcquireAdmin(req);
  if (denied) return denied;
  const { id } = await params;
  const b = await jsonBody(req);
  if (!b) return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  try {
    const m = await updateMagnet(id, b);
    return NextResponse.json({ magnet: { ...m, content: normalizeMagnet(m.content) } });
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
        const m = await setMagnetStatus(id, b.action === "publish");
        return NextResponse.json({ status: m.status });
      }
      case "link":
        return NextResponse.json(await ensureTrackedLink("magnet", id));
      case "translate": {
        const m = await prisma.acquireMagnet.findUnique({ where: { id } });
        if (!m) return NextResponse.json({ error: "Not found" }, { status: 404 });
        if (m.language !== "en") return NextResponse.json({ error: "Only English magnets are translated automatically." }, { status: 400 });
        const content = normalizeMagnet(m.content);
        const out = await Promise.all((["fr", "sw"] as const).map((l) => localizeContent(`acquire:magnet:${m.id}`, "en", content, l, "wait")));
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
  // Captures, subscribers and leads it created stay: they are people's consent records.
  await prisma.acquireMagnet.deleteMany({ where: { id } });
  return NextResponse.json({ ok: true });
}
