import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auditFromRequest } from "@/lib/admin/audit";
import { cyberGuard } from "@/lib/cyber/access";
import { ensureCyberTables, type ScanRow } from "@/lib/cyber/db";

// One scan: status while it runs, the full result when done. DELETE removes it.

const ID = /^[a-z0-9]{10,40}$/;

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await cyberGuard(req);
  if (g.denied) return g.denied;
  const { id } = await params;
  if (!ID.test(id)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await ensureCyberTables();
  const row = (await prisma.$queryRawUnsafe<ScanRow[]>(`SELECT * FROM "CyberScan" WHERE "id" = $1`, id))[0];
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(row, { headers: { "Cache-Control": "no-store" } });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await cyberGuard(req);
  if (g.denied) return g.denied;
  const { id } = await params;
  if (!ID.test(id)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await ensureCyberTables();
  const n = await prisma.$executeRawUnsafe(`DELETE FROM "CyberScan" WHERE "id" = $1 AND "status" <> 'running'`, id);
  if (n) await auditFromRequest("cyber.scan.delete", { type: "cyber_scan", id });
  return NextResponse.json({ ok: n === 1 });
}
