import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { auditFromRequest } from "@/lib/admin/audit";
import { cyberGuard } from "@/lib/cyber/access";
import { ensureCyberTables } from "@/lib/cyber/db";
import { shareUrl } from "@/lib/cyber/email";

// Turn the private report link on or off. Off by default: a report lists a
// site's weaknesses. The link works for 30 days from sharing.

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await cyberGuard(req);
  if (g.denied) return g.denied;
  const { id } = await params;
  if (!/^[a-z0-9]{10,40}$/.test(id)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const b = z.object({ on: z.boolean() }).safeParse(await req.json().catch(() => null));
  if (!b.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });
  await ensureCyberTables();
  const rows = await prisma.$queryRawUnsafe<Array<{ token: string }>>(
    `UPDATE "CyberScan" SET "sharedAt" = ${b.data.on ? "now()" : "NULL"} WHERE "id" = $1 AND "status" = 'done' RETURNING "token"`,
    id,
  );
  if (!rows[0]) return NextResponse.json({ error: "Not found or not finished" }, { status: 404 });
  await auditFromRequest(b.data.on ? "cyber.share.on" : "cyber.share.off", { type: "cyber_scan", id });
  return NextResponse.json({ ok: true, url: b.data.on ? shareUrl(rows[0].token) : null });
}
