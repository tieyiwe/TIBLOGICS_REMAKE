import prisma from "@/lib/prisma";
import { requireAdminPage } from "../_lib/admin-page-auth";
import ProspectsClient from "./ProspectsClient";

// Pipeline data is per-request and session-scoped — never cached or prerendered.
export const dynamic = "force-dynamic";

type ActivityEntry = { type: "note" | "status" | "created"; text: string; date: string };

/**
 * Prospects admin — server-rendered initial read.
 *
 * Mirrors `GET /api/admin/prospects?archived=false`, which the page used to call
 * from a useEffect on mount. The archive view is still fetched client-side when
 * the toggle is flipped, and every write keeps going through
 * /api/admin/prospects/[id].
 */
export default async function ProspectsPage() {
  // Prospects hold contact details and deal values, so this page applies the
  // same staff-only rule requireAdmin() applies to the API route.
  await requireAdminPage();

  // A database outage renders an empty pipeline rather than a 500.
  const rows = await prisma.prospect
    .findMany({ where: { archived: false }, orderBy: { createdAt: "desc" } })
    .catch((err) => {
      console.error("[admin/prospects page] prospects", err);
      return [];
    });

  // Serialised to the JSON shape the client component already expects.
  const prospects = rows.map((p) => ({
    id: p.id,
    name: p.name,
    business: p.business,
    industry: p.industry,
    source: p.source,
    budget: p.budget,
    status: p.status,
    suggestedSolutions: p.suggestedSolutions,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    email: p.email,
    phone: p.phone,
    notes: p.notes,
    mainChallenge: p.mainChallenge,
    estimatedValue: p.estimatedValue,
    followUpDate: p.followUpDate ? p.followUpDate.toISOString() : null,
    // conversationLog is a Json column; the detail panel reads it as a list of
    // activity entries, exactly as it arrived over JSON before.
    conversationLog: (p.conversationLog ?? null) as ActivityEntry[] | null,
    archived: p.archived,
  }));

  return <ProspectsClient initialProspects={prospects} />;
}
