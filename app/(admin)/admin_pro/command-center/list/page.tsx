import { requireAdminPage } from "../../_lib/admin-page-auth";
import { getActiveProjects } from "@/lib/admin/projects";
import ListClient, { type Project } from "./ListClient";

// Per-request and session-scoped: never cached or prerendered.
export const dynamic = "force-dynamic";

/** Command Center list, rendered on the server (was fetched on mount). */
export default async function ListPage() {
  await requireAdminPage();
  return <ListClient initialProjects={await getActiveProjects<Project>()} />;
}
