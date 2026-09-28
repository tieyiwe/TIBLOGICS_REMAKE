import { requireAdminPage } from "../_lib/admin-page-auth";
import { getActiveProjects } from "@/lib/admin/projects";
import CommandCenterClient, { type Project } from "./CommandCenterClient";

// Per-request and session-scoped: never cached or prerendered.
export const dynamic = "force-dynamic";

/** Command Center overview, rendered on the server (was fetched on mount). */
export default async function CommandCenterPage() {
  await requireAdminPage();
  return <CommandCenterClient initialProjects={await getActiveProjects<Project>()} />;
}
