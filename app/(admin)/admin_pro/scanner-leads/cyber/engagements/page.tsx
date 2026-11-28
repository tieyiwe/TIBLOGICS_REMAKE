import { requireAdminPage } from "../../../_lib/admin-page-auth";
import { canCyber } from "@/lib/cyber/access";
import CyberNav, { NoAccess } from "../CyberNav";
import EngagementsClient from "./EngagementsClient";

export const dynamic = "force-dynamic";

export default async function EngagementsPage() {
  const session = await requireAdminPage();
  return (
    <div className="space-y-6">
      <CyberNav current="/admin_pro/scanner-leads/cyber/engagements" title="Engagements" intro="The client's written authorisation for active testing: who authorised it, which domains, and for how long. Active tests and pen-test tools run only on hosts inside an active engagement. Every action is recorded in the audit log." />
      {canCyber(session) ? <EngagementsClient /> : <NoAccess />}
    </div>
  );
}
