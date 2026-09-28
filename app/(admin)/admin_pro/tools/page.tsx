import { requireAdminPage } from "../_lib/admin-page-auth";
import { getToolUsage } from "@/lib/admin/metrics";
import ToolsClient from "./ToolsClient";

// Per-request and session-scoped: never cached or prerendered.
export const dynamic = "force-dynamic";

// Was a client component rendering "Mock Data": 48 scans, 91 calculator uses,
// a 4.2-minute average advisor session, none of it recorded anywhere. It now
// shows real usage from ToolUsage and the scanner's real funnel.
export default async function ToolsPage() {
  await requireAdminPage();
  const data = await getToolUsage();
  return <ToolsClient data={data} />;
}
