import { requireGrowthAdminPage } from "@/lib/growth/content-auth";
import { getLinkReport } from "@/lib/growth/reports";
import { siteUrl } from "@/lib/growth/links";
import GrowthTabs from "../_components/GrowthTabs";
import { PageHeader } from "../_components/ui";
import LinksClient from "./LinksClient";

export const dynamic = "force-dynamic";

const RANGES = [7, 30, 90, 365];

export default async function GrowthLinksPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireGrowthAdminPage();
  const n = Number((await searchParams).days);
  const days = RANGES.includes(n) ? n : 30;
  const report = await getLinkReport(days);
  return (
    <div className="space-y-5 max-w-[1400px]">
      <GrowthTabs />
      <PageHeader
        title="Links & attribution"
        subtitle="Clicks on tracked links, and the sign-ups, purchases and bookings that followed within 30 days (first-party cookie, no personal data). Revenue counts only paid records."
      />
      <LinksClient report={report} days={days} ranges={RANGES} site={siteUrl()} />
    </div>
  );
}
