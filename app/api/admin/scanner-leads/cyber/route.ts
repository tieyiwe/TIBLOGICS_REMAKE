import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { staffAiLimit } from "@/lib/rate-limit";
import { auditFromRequest } from "@/lib/admin/audit";
import { cyberGuard } from "@/lib/cyber/access";
import { ensureCyberTables } from "@/lib/cyber/db";
import { engagementFor } from "@/lib/cyber/engagement";
import { failStale, startScan } from "@/lib/cyber/run";
import { checkTargetUrl } from "@/lib/ssrf";

// Cyber scans. GET: the latest 100. POST { url, deep, engagementId?, company?, contactName? }:
// start one (it runs in the background; poll GET /cyber/<id>). A deep scan
// (exposed files, input tests) needs an active engagement covering the host.

const Body = z.object({
  url: z.string().trim().min(3).max(500),
  deep: z.boolean().optional(),
  engagementId: z.string().max(40).nullish(),
  company: z.string().trim().max(160).optional(),
  contactName: z.string().trim().max(120).optional(),
});

export async function GET(req: Request) {
  const g = await cyberGuard(req);
  if (g.denied) return g.denied;
  await ensureCyberTables();
  await failStale().catch(() => {});
  const rows = await prisma.$queryRawUnsafe(`SELECT "id","createdAt","createdBy","url","domain","status","progress","deep","company","score","grade","counts","finishedAt","sharedAt" FROM "CyberScan" ORDER BY "createdAt" DESC LIMIT 100`);
  return NextResponse.json({ scans: rows });
}

export async function POST(req: Request) {
  const g = await cyberGuard(req);
  if (g.denied) return g.denied;
  const limited = await staffAiLimit("cyber-scan", 30);
  if (limited) return limited;
  const b = Body.safeParse(await req.json().catch(() => null));
  if (!b.success) return NextResponse.json({ error: "Enter a website address." }, { status: 400 });
  const checked = await checkTargetUrl(b.data.url);
  if (!checked.ok) return NextResponse.json({ error: "That address cannot be scanned (not public, or not a website)." }, { status: 400 });
  let engagementId: string | null = null;
  if (b.data.deep) {
    const eng = await engagementFor(checked.url.hostname, b.data.engagementId ?? null);
    if (!eng) return NextResponse.json({ error: `No active engagement covers ${checked.url.hostname}. Active tests need the owner's written authorisation: add an engagement first, or run a passive scan.` }, { status: 403 });
    engagementId = eng.id;
  }
  const r = await startScan({ url: checked.url.toString(), deep: !!b.data.deep, engagementId, company: b.data.company, contactName: b.data.contactName, by: g.email });
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.status });
  await auditFromRequest(b.data.deep ? "cyber.scan.deep" : "cyber.scan", { type: "cyber_scan", id: r.id, label: checked.url.hostname }, { engagementId });
  return NextResponse.json({ id: r.id });
}
