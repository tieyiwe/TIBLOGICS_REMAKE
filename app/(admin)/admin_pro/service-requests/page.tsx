import prisma from "@/lib/prisma";
import { requireAdminPage } from "../_lib/admin-page-auth";
import ServiceRequestsClient from "./ServiceRequestsClient";

// Per-request and session-scoped: never cached or prerendered.
export const dynamic = "force-dynamic";

/** Service requests: the first page of results is rendered with the page. */
export default async function ServiceRequestsPage() {
  await requireAdminPage();
  const rows = await prisma.serviceRequest
    .findMany({ orderBy: { createdAt: "desc" }, take: 100 })
    .catch((err) => {
      console.error("[admin/service-requests page]", err);
      return [];
    });
  return <ServiceRequestsClient initial={rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }))} />;
}
