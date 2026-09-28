import { requireAdminPage } from "../../_lib/admin-page-auth";
import { getActiveProjects } from "@/lib/admin/projects";
import KanbanClient, { type Project } from "./KanbanClient";

// Per-request and session-scoped: never cached or prerendered.
export const dynamic = "force-dynamic";

/** Command Center kanban, rendered on the server (was fetched on mount). */
export default async function KanbanPage() {
  await requireAdminPage();
  return <KanbanClient initialProjects={await getActiveProjects<Project>()} />;
}
