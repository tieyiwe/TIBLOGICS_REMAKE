import prisma from "@/lib/prisma";
import { requireGrowthPage } from "@/lib/growth/outreach/auth";
import { serializeLead, syncSources } from "@/lib/growth/outreach/leads";
import { ensureDefaultSequence } from "@/lib/growth/outreach/sequences";
import LeadsClient from "./LeadsClient";

// Per-request and session-scoped: never cached or prerendered.
export const dynamic = "force-dynamic";

export const metadata = { title: "Leads · Growth" };

/** Clicks on each lead's tracked outreach link over the last 30 days (warm-lead signal). */
async function clicksByLead(): Promise<Record<string, number>> {
  try {
    const enrolls = await prisma.outreachEnrollment.findMany({ where: { linkCode: { not: null } }, select: { leadId: true, linkCode: true }, take: 5000 });
    if (!enrolls.length) return {};
    const byCode = new Map(enrolls.map((e) => [e.linkCode as string, e.leadId]));
    const rows = await prisma.$queryRaw<{ linkCode: string; n: bigint }[]>`
      SELECT "linkCode", COUNT(*)::bigint AS n FROM "GrowthClick"
      WHERE "createdAt" >= ${new Date(Date.now() - 30 * 86_400_000)} AND "linkCode" = ANY(${[...byCode.keys()]}::text[])
      GROUP BY "linkCode"`;
    const out: Record<string, number> = {};
    for (const r of rows) {
      const id = byCode.get(r.linkCode);
      if (id) out[id] = (out[id] ?? 0) + Number(r.n);
    }
    return out;
  } catch {
    return {}; // click tables may not exist yet
  }
}

export default async function GrowthLeadsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { canSend } = await requireGrowthPage();
  // New Aria leads and Prospects appear without a manual sync.
  await syncSources().catch((err) => console.error("[growth/leads] sync", err));
  await ensureDefaultSequence().catch(() => {});
  const [leads, sequences, clicks] = await Promise.all([
    prisma.growthLead.findMany({ orderBy: { updatedAt: "desc" }, take: 5000 }),
    prisma.outreachSequence.findMany({ where: { status: { not: "archived" } }, orderBy: { createdAt: "asc" }, select: { id: true, name: true, status: true } }),
    clicksByLead(),
  ]);
  const open = (await searchParams).open;
  const initialOpen = typeof open === "string" && leads.some((l) => l.id === open) ? open : null;
  return <LeadsClient initialLeads={leads.map(serializeLead)} sequences={sequences} canSend={canSend} clicks={clicks} initialOpen={initialOpen} />;
}
