import { requireAdminPage } from "../_lib/admin-page-auth";
import { getContacts } from "@/lib/admin/contacts";
import ContactsClient from "./ContactsClient";

// Per-request and session-scoped: never cached or prerendered.
export const dynamic = "force-dynamic";

/**
 * Contacts from every channel, rendered on the server.
 *
 * Was a client component that fetched /api/contacts on mount. Both now call
 * getContacts(), so the page and the API cannot disagree.
 */
export default async function ContactsPage() {
  await requireAdminPage();
  const rows = await getContacts().catch((err) => {
    console.error("[admin/contacts page]", err);
    return [];
  });
  return <ContactsClient contacts={rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }))} />;
}
