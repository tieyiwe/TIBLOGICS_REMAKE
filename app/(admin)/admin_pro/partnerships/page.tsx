import prisma from "@/lib/prisma";
import { requireAdminPage } from "../_lib/admin-page-auth";
import PartnershipsClient from "./PartnershipsClient";

// Per-request and session-scoped: never cached or prerendered.
export const dynamic = "force-dynamic";

/** Partnership applications, rendered on the server (was fetched on mount). */
export default async function PartnershipsPage() {
  await requireAdminPage();
  const rows = await prisma.partnershipApplication
    .findMany({ orderBy: { createdAt: "desc" }, take: 500 })
    .catch((err) => {
      console.error("[admin/partnerships page]", err);
      return [];
    });
  return (
    <PartnershipsClient
      apps={rows.map((r) => ({
        id: r.id,
        businessName: r.businessName,
        contactName: r.contactName,
        email: r.email,
        phone: r.phone,
        website: r.website ?? undefined,
        address: r.address ?? undefined,
        description: r.description,
        createdAt: r.createdAt.toISOString(),
      }))}
    />
  );
}
