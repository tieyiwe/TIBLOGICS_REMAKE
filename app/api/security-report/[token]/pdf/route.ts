import { clientIp } from "@/lib/client-ip";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { ensureCyberTables, type ScanRow } from "@/lib/cyber/db";
import { cyberPdf } from "@/lib/cyber/pdf";
import type { CyberResult } from "@/lib/cyber/types";

// The PDF behind a shared security report link (30 days from sharing).
export const maxDuration = 30;

export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const ip = clientIp(req.headers);
  if (!(await checkRateLimit(`security-report:${ip}`, 30, 3_600_000))) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  const { token } = await params;
  if (!/^[A-Za-z0-9_-]{20,40}$/.test(token)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await ensureCyberTables();
  const row = (await prisma.$queryRawUnsafe<ScanRow[]>(`SELECT * FROM "CyberScan" WHERE "token" = $1 AND "sharedAt" > now() - interval '30 days' AND "status" = 'done'`, token))[0];
  if (!row?.result) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const r = row.result as CyberResult;
  return new NextResponse(new Uint8Array(await cyberPdf(r, { company: row.company })), {
    headers: { "content-type": "application/pdf", "content-disposition": `attachment; filename="TIBLOGICS-security-report-${r.domain.replace(/[^a-z0-9.-]/gi, "-")}.pdf"`, "cache-control": "private, no-store", "x-robots-tag": "noindex" },
  });
}
