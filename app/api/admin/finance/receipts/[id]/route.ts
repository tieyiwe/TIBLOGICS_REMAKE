import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requirePermission } from "@/lib/require-admin";
import { ensureFinanceTables } from "@/lib/admin/command-center/db";
import { PERM_FINANCE } from "@/lib/admin/command-center/permissions";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

const SAFE = new Set(["application/pdf", "image/png", "image/jpeg", "image/webp"]);

/** Serves a stored receipt to Finance staff only. Never cached by shared caches. */
export async function GET(req: NextRequest, { params }: Ctx) {
  const denied = await requirePermission(PERM_FINANCE);
  if (denied) return denied;
  const { id } = await params;
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(id)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await ensureFinanceTables();
  const r = await prisma.finReceipt.findUnique({ where: { id } });
  if (!r || !SAFE.has(r.mime)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  // Images open in the browser; PDFs (which can carry scripts) download.
  const inline = r.mime.startsWith("image/") && req.nextUrl.searchParams.get("download") !== "1";
  const name = r.filename.replace(/["\\\r\n]/g, "");
  return new NextResponse(new Uint8Array(r.data), {
    headers: {
      "Content-Type": r.mime,
      "Content-Length": String(r.data.length),
      "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="${name}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; sandbox",
    },
  });
}
