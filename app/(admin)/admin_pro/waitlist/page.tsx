import prisma from "@/lib/prisma";
import { requireAdminPage } from "../_lib/admin-page-auth";
import WaitlistClient from "./WaitlistClient";

// Per-request and session-scoped: never cached or prerendered.
export const dynamic = "force-dynamic";

/**
 * Product waitlist, rendered on the server.
 *
 * This was a client component that showed a skeleton until a useEffect fetch
 * of /api/waitlist returned. The list now arrives with the page. The API route
 * stays for any other consumer and applies the same staff-only rule.
 */
export default async function WaitlistPage() {
  await requireAdminPage();

  const rows = await prisma.waitlistEntry
    .findMany({
      orderBy: { createdAt: "desc" },
      // Grows with every sign-up; newest first, capped like the admin APIs.
      take: 1000,
      select: { id: true, email: true, product: true, createdAt: true },
    })
    .catch((err) => {
      console.error("[admin/waitlist page]", err);
      return [];
    });

  return (
    <WaitlistClient
      entries={rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }))}
    />
  );
}
