import prisma from "@/lib/prisma";
import { requireAdminPage } from "../../_lib/admin-page-auth";
import RexClient from "./RexClient";

// Lead data is per-request and session-scoped — never cached or prerendered.
export const dynamic = "force-dynamic";

/**
 * Rex agent console — server-rendered initial read.
 *
 * Replaces the pair of useEffect fetches (/api/admin/agents/leads and
 * /api/admin/agents/messages) that used to run on mount. Triage, notes, delete,
 * mark-read and the chat all still go through their existing API routes.
 */
export default async function RexPage() {
  // Leads carry contact names, emails and phone numbers, so this page applies
  // the same staff-only rule as requireAdmin() does on /api/admin/agents/*.
  await requireAdminPage();

  // Mirrors `GET /api/admin/agents/leads?assignedTo=rex` and
  // `GET /api/admin/agents/messages?toAgent=rex&unread=true`. Each read is
  // caught separately so a database outage renders an empty board, not a 500.
  const [rawLeads, rawMessages] = await Promise.all([
    prisma.agentLead
      .findMany({ where: { assignedTo: "rex" }, orderBy: { createdAt: "desc" } })
      .catch((err) => {
        console.error("[admin/agents/rex page] leads", err);
        return [];
      }),
    prisma.agentMessage
      .findMany({
        where: { toAgent: "rex", read: false },
        orderBy: { createdAt: "desc" },
        take: 50,
      })
      .catch((err) => {
        console.error("[admin/agents/rex page] messages", err);
        return [];
      }),
  ]);

  // Serialised to the JSON shape the client component already expects, so its
  // optional fields and date formatting are unchanged.
  const leads = rawLeads.map((l) => ({
    id: l.id,
    companyName: l.companyName,
    contactName: l.contactName ?? undefined,
    email: l.email ?? undefined,
    phone: l.phone ?? undefined,
    website: l.website ?? undefined,
    location: l.location ?? undefined,
    industry: l.industry ?? undefined,
    description: l.description ?? undefined,
    notes: l.notes ?? undefined,
    status: l.status,
    source: l.source,
    fromAgent: l.fromAgent,
    callStatus: l.callStatus ?? undefined,
    callSid: l.callSid ?? undefined,
    contactedAt: l.contactedAt ? l.contactedAt.toISOString() : undefined,
    transferredAt: l.transferredAt ? l.transferredAt.toISOString() : undefined,
    createdAt: l.createdAt.toISOString(),
  }));

  const messages = rawMessages.map((m) => ({
    id: m.id,
    fromAgent: m.fromAgent,
    type: m.type,
    subject: m.subject ?? undefined,
    // payload is a Json column; the client reads leadIds / leads off it.
    payload: (m.payload ?? {}) as {
      leadIds?: string[];
      leads?: { companyName: string }[];
    },
    read: m.read,
    createdAt: m.createdAt.toISOString(),
  }));

  return <RexClient initialLeads={leads} initialMessages={messages} />;
}
