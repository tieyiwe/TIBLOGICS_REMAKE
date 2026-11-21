import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { requireAdminPage } from "../../../_lib/admin-page-auth";
import { canCyber } from "@/lib/cyber/access";
import { ensureCyberTables, type ScanRow } from "@/lib/cyber/db";
import type { CyberResult } from "@/lib/cyber/types";
import CyberNav, { NoAccess } from "../CyberNav";
import ScanClient from "./ScanClient";

export const dynamic = "force-dynamic";

export default async function CyberScanPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdminPage();
  const { id } = await params;
  if (!/^[a-z0-9]{10,40}$/.test(id)) notFound();
  const nav = <CyberNav current="" title="Cyber scan" intro="Assessment report" />;
  if (!canCyber(session)) return <div className="space-y-6">{nav}<NoAccess /></div>;
  await ensureCyberTables();
  const row = (await prisma.$queryRawUnsafe<ScanRow[]>(`SELECT * FROM "CyberScan" WHERE "id" = $1`, id))[0];
  if (!row) notFound();
  // The previous finished scan of the same domain, to show what changed.
  const prev = (await prisma.$queryRawUnsafe<Array<{ createdAt: Date; result: CyberResult }>>(
    `SELECT "createdAt", "result" FROM "CyberScan" WHERE "domain" = $1 AND "status" = 'done' AND "createdAt" < $2 ORDER BY "createdAt" DESC LIMIT 1`,
    row.domain, row.createdAt,
  ))[0];
  const previous = prev ? { date: prev.createdAt.toISOString(), findings: prev.result.findings.map((f) => ({ id: f.id, title: f.title, severity: f.severity })) } : null;
  const site = (process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL ?? "").replace(/\/$/, "");
  return (
    <div className="space-y-6">
      {nav}
      <ScanClient initial={JSON.parse(JSON.stringify(row))} previous={previous} senderName={session.user?.name ?? "The TIBLOGICS team"} site={site} />
    </div>
  );
}
