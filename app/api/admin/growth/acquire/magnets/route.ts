import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { ClaudeRefusal } from "@/lib/claude";
import { jsonBody } from "@/lib/growth/content-auth";
import { isLanguage } from "@/lib/growth/content/platforms";
import { actor, requireAcquireAdmin } from "@/lib/growth/acquire/admin";
import { draftMagnet, DraftError } from "@/lib/growth/acquire/ai";
import { AcquireError, createMagnet } from "@/lib/growth/acquire/store";
import { statsFor } from "@/lib/growth/acquire/stats";
import { MAGNET_TYPES, type MagnetType } from "@/lib/growth/acquire/types";

// Lead magnets: list with stats, and create (AI draft or blank).
export const maxDuration = 180;

export async function GET(req: NextRequest) {
  const denied = await requireAcquireAdmin(req);
  if (denied) return denied;
  const rows = await prisma.acquireMagnet.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
  const stats = await statsFor("magnet", rows);
  return NextResponse.json({
    magnets: rows.map((m) => ({ id: m.id, slug: m.slug, type: m.type, title: m.title, status: m.status, language: m.language, updatedAt: m.updatedAt, stats: stats.get(m.id) })),
  });
}

export async function POST(req: NextRequest) {
  const denied = await requireAcquireAdmin(req);
  if (denied) return denied;
  const b = await jsonBody(req);
  const type = MAGNET_TYPES.includes(b?.type as MagnetType) ? (b!.type as MagnetType) : null;
  if (!type) return NextResponse.json({ error: "Pick a magnet type." }, { status: 400 });
  const language = isLanguage(b?.language) ? b.language : "en";
  const productKey = typeof b?.productKey === "string" && b.productKey ? b.productKey.slice(0, 200) : null;
  const topic = typeof b?.topic === "string" ? b.topic.trim().slice(0, 400) : "";
  const audienceId = typeof b?.audienceId === "string" ? b.audienceId.slice(0, 60) : null;
  try {
    if (b?.mode === "blank") {
      const m = await createMagnet({ type, title: topic || "New lead magnet", language, productKey, content: { headline: topic } });
      return NextResponse.json({ magnet: { id: m.id }, warnings: [] }, { status: 201 });
    }
    if (!(await checkRateLimit(`acquire-draft:${await actor()}`, 30, 3_600_000))) {
      return NextResponse.json({ error: "Too many drafts this hour. Try again later." }, { status: 429 });
    }
    const draft = await draftMagnet({ type, topic, productKey, language, audienceId });
    const m = await createMagnet({ type, title: draft.title, language, productKey, content: draft.content });
    return NextResponse.json({ magnet: { id: m.id }, warnings: draft.warnings }, { status: 201 });
  } catch (err) {
    if (err instanceof DraftError || err instanceof AcquireError) return NextResponse.json({ error: err.message }, { status: 422 });
    if (err instanceof ClaudeRefusal) return NextResponse.json({ error: "The model declined to write this. Change the topic." }, { status: 422 });
    console.error("[acquire/magnets] create", err);
    return NextResponse.json({ error: "Could not draft the magnet. Try again." }, { status: 502 });
  }
}
