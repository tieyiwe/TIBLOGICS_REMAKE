import { requireAdminPage } from "../../_lib/admin-page-auth";
import { getActiveProjects } from "@/lib/admin/projects";
import TimelineClient, { type Project } from "./TimelineClient";

// Per-request and session-scoped: never cached or prerendered.
export const dynamic = "force-dynamic";

/** Command Center timeline, rendered on the server (was fetched on mount). */
export default async function TimelinePage() {
  await requireAdminPage();
  return <TimelineClient initialProjects={await getActiveProjects<Project>()} />;
}
