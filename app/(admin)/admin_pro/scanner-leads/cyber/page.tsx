import { requireAdminPage } from "../../_lib/admin-page-auth";
import { canCyber } from "@/lib/cyber/access";
import CyberNav, { NoAccess } from "./CyberNav";
import CyberHome from "./CyberHome";

export const dynamic = "force-dynamic";

export default async function CyberPage() {
  const session = await requireAdminPage();
  return (
    <div className="space-y-6">
      <CyberNav current="/admin_pro/scanner-leads/cyber" title="Cyber scan" intro="A full security assessment of a website: encryption, browser protections, cookies, email spoofing, DNS, software and known vulnerabilities, subdomains and, with the client's authorisation, exposed files and active input tests. Each finding comes with a tip, step-by-step fixes and copy-paste configuration." />
      {canCyber(session) ? <CyberHome /> : <NoAccess />}
    </div>
  );
}
