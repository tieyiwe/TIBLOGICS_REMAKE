import { requireGrowthAdminPage } from "@/lib/growth/content-auth";
import { adminReferralOverview } from "@/lib/learn/referrals/service";
import { EmptyState, PageHeader } from "@/components/admin/ui";
import AcquireNav from "../_components/AcquireNav";
import ReferralsClient from "./ReferralsClient";

export const dynamic = "force-dynamic";

export default async function ReferralsAdminPage() {
  await requireGrowthAdminPage();
  const data = await adminReferralOverview().catch((err) => {
    console.error("[admin/acquire/referrals]", err);
    return null;
  });
  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <AcquireNav counts={{ "/admin_pro/growth/acquire/referrals": data?.totals.pending || undefined }} />
      {data ? (
        <ReferralsClient data={data} />
      ) : (
        <>
          <PageHeader title="Referrals" className="!mb-0" />
          <EmptyState title="Referral data is unavailable" body="The database did not answer. Reload in a minute." />
        </>
      )}
    </div>
  );
}
