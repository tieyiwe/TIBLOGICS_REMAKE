import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { staffAiLimit } from "@/lib/rate-limit";
import { auditFromRequest } from "@/lib/admin/audit";
import { cyberGuard } from "@/lib/cyber/access";
import { ensureCyberTables, type ScanRow } from "@/lib/cyber/db";
import { sendCyberReport } from "@/lib/cyber/email";

export const maxDuration = 60;

const Body = z.object({ to: z.string().trim().email().max(254), name: z.string().trim().max(120).optional(), note: z.string().trim().min(1).max(4000) });

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await cyberGuard(req);
  if (g.denied) return g.denied;
  const limited = await staffAiLimit("cyber-send", 40);
  if (limited) return limited;
  const { id } = await params;
  if (!/^[a-z0-9]{10,40}$/.test(id)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const b = Body.safeParse(await req.json().catch(() => null));
  if (!b.success) return NextResponse.json({ error: "Check the email address and the note." }, { status: 400 });
  await ensureCyberTables();
  const row = (await prisma.$queryRawUnsafe<ScanRow[]>(`SELECT * FROM "CyberScan" WHERE "id" = $1`, id))[0];
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const r = await sendCyberReport(row, { to: b.data.to, name: b.data.name, note: b.data.note, sender: { name: g.name, email: g.email } });
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.status });
  await auditFromRequest("cyber.report.send", { type: "cyber_scan", id, label: row.domain }, { to: b.data.to });
  return NextResponse.json({ ok: true });
}
