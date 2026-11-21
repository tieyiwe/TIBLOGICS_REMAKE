import { requireAdminPage } from "../../../_lib/admin-page-auth";
import { canCyber } from "@/lib/cyber/access";
import CyberNav, { NoAccess } from "../CyberNav";
import ToolsClient from "./ToolsClient";

export const dynamic = "force-dynamic";

export default async function ToolsPage() {
  const session = await requireAdminPage();
  return (
    <div className="space-y-6">
      <CyberNav current="/admin_pro/scanner-leads/cyber/tools" title="Pen-test tools" intro="Manual checks for authorised engagements: inspect any request, test CORS, probe paths, test a parameter for reflection. DNS/email and TLS lookups work on any public domain. Every active use is audited." />
      {canCyber(session) ? <ToolsClient /> : <NoAccess />}
    </div>
  );
}
