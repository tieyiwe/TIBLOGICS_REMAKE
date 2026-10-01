import prisma from "@/lib/prisma";
import { requireGrowthPage } from "@/lib/growth/outreach/auth";
import { serializeLead, syncSources } from "@/lib/growth/outreach/leads";
import { ensureDefaultSequence } from "@/lib/growth/outreach/sequences";
import LeadsClient from "./LeadsClient";

// Per-request and session-scoped: never cached or prerendered.
export const dynamic = "force-dynamic";

export const metadata = { title: "Leads · Growth" };

export default async function GrowthLeadsPage() {
  const { canSend } = await requireGrowthPage();
  // New Aria leads and Prospects appear without a manual sync.
  await syncSources().catch((err) => console.error("[growth/leads] sync", err));
  await ensureDefaultSequence().catch(() => {});
  const [leads, sequences] = await Promise.all([
    prisma.growthLead.findMany({ orderBy: { updatedAt: "desc" }, take: 5000 }),
    prisma.outreachSequence.findMany({ where: { status: { not: "archived" } }, orderBy: { createdAt: "asc" }, select: { id: true, name: true, status: true } }),
  ]);
  return <LeadsClient initialLeads={leads.map(serializeLead)} sequences={sequences} canSend={canSend} />;
}
