import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireGrowth, requireSender } from "@/lib/growth/outreach/auth";
import { suppress, suppressionValue } from "@/lib/growth/outreach/suppression";

export const dynamic = "force-dynamic";

export async function GET() {
  const deny = await requireGrowth();
  if (deny) return deny;
  const rows = await prisma.outreachSuppression.findMany({ orderBy: { createdAt: "desc" }, take: 2000 });
  return NextResponse.json({ entries: rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })) });
}

/** Add addresses or "@domain" entries (one per line) as do-not-contact. */
export async function POST(req: NextRequest) {
  const deny = await requireGrowth();
  if (deny) return deny;
  const b = (await req.json().catch(() => null)) as { values?: unknown; note?: unknown } | null;
  const values = typeof b?.values === "string" ? b.values.split(/[\s,;]+/).filter(Boolean).slice(0, 500) : [];
  let added = 0;
  const invalid: string[] = [];
  for (const v of values) {
    if (await suppress(v, "do_not_contact", "admin", typeof b?.note === "string" ? b.note.slice(0, 200) : undefined)) added++;
    else invalid.push(v);
  }
  return NextResponse.json({ added, invalid });
}

/**
 * Remove an entry. Unsubscribes and complaints can never be removed here:
 * only the person can opt back in (express consent), never the sender.
 */
export async function DELETE(req: NextRequest) {
  const deny = await requireSender();
  if (deny) return deny;
  const v = suppressionValue(req.nextUrl.searchParams.get("value") ?? "");
  if (!v) return NextResponse.json({ error: "value required" }, { status: 400 });
  const row = await prisma.outreachSuppression.findUnique({ where: { value: v } });
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (row.reason === "unsubscribe" || row.reason === "complaint") {
    return NextResponse.json({ error: "Unsubscribes cannot be removed by the sender" }, { status: 403 });
  }
  await prisma.outreachSuppression.delete({ where: { value: v } });
  return NextResponse.json({ ok: true });
}
