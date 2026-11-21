import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cyberGuard } from "@/lib/cyber/access";
import { ensureCyberTables, type ScanRow } from "@/lib/cyber/db";
import { cyberPdf } from "@/lib/cyber/pdf";
import type { CyberResult } from "@/lib/cyber/types";

export const maxDuration = 30;

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await cyberGuard(req);
  if (g.denied) return g.denied;
  const { id } = await params;
  if (!/^[a-z0-9]{10,40}$/.test(id)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await ensureCyberTables();
  const row = (await prisma.$queryRawUnsafe<ScanRow[]>(`SELECT * FROM "CyberScan" WHERE "id" = $1`, id))[0];
  if (!row?.result || row.status !== "done") return NextResponse.json({ error: "Not ready" }, { status: 404 });
  const r = row.result as CyberResult;
  const pdf = await cyberPdf(r, { company: row.company });
  return new NextResponse(new Uint8Array(pdf), {
    headers: { "content-type": "application/pdf", "content-disposition": `attachment; filename="TIBLOGICS-security-report-${r.domain.replace(/[^a-z0-9.-]/gi, "-")}.pdf"`, "cache-control": "private, no-store" },
  });
}
