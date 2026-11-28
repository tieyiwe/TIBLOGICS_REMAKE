import prisma from "@/lib/prisma";
import { PageHeader } from "@/components/admin/ui";
import { requireAdminPage } from "../../_lib/admin-page-auth";
import { LEARN_TABS } from "../tabs";
import { signatory } from "@/lib/learn/cert/render";
import CertificateDesigns from "./CertificateDesigns";

export const dynamic = "force-dynamic";

// Every track's certificate with a sample name, to check the design and the
// wording before learners receive them (lib/learn/cert/render.tsx).
export default async function CertificateDesignsPage() {
  await requireAdminPage();
  const tracks = await prisma.learnTrack.findMany({
    orderBy: { sortOrder: "asc" },
    select: { id: true, title: true, certificateName: true, status: true, level: true, levelEnd: true, tagline: true, accentColor: true },
  });
  const issued = await prisma.learnCertificate.count().catch(() => 0);
  return (
    <div className="space-y-5">
      <PageHeader
        title="Certificate designs"
        subtitle={`One certificate per track, in the track's colour. ${issued} issued so far. Check the wording and design here; learners confirm their name before theirs is sent.`}
        breadcrumb={[{ label: "ARFA · AI Academy", href: "/admin_pro/learn" }, { label: "Certificates" }]}
        tabs={LEARN_TABS}
        activeTab="/admin_pro/learn/certificates"
      />
      <CertificateDesigns tracks={tracks} signatory={signatory()} />
    </div>
  );
}
