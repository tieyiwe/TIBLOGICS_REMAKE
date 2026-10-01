import { requireGrowthAdminPage } from "@/lib/growth/content-auth";
import { getGrowthSettings } from "@/lib/growth/settings";
import { acquireAvailable, campaignProducts } from "@/lib/growth/campaigns";
import GrowthTabs from "../../_components/GrowthTabs";
import { PageHeader } from "../../_components/ui";
import CampaignWizard from "./CampaignWizard";

export const dynamic = "force-dynamic";

export default async function NewCampaignPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireGrowthAdminPage();
  const sp = await searchParams;
  const [settings, products] = await Promise.all([getGrowthSettings(), campaignProducts()]);
  const channel = typeof sp.channel === "string" ? sp.channel.slice(0, 20) : null;
  return (
    <div className="mx-auto max-w-[1300px] space-y-5">
      <PageHeader
        breadcrumb={[{ label: "Growth", href: "/admin_pro/growth" }, { label: "Campaigns", href: "/admin_pro/growth/campaigns" }, { label: "New" }]}
        title="Campaign Copilot"
        subtitle="Tell it the goal. It plans the channels, cadence, outreach targets and KPIs, then creates every asset as a draft for you to approve."
      />
      <GrowthTabs />
      <CampaignWizard
        products={products.map((p) => ({ key: p.key, type: p.type, title: p.title, summary: p.summary, price: p.price }))}
        audiences={settings.audiences.map((a) => ({ id: a.id, name: a.name, language: a.language }))}
        defaultLanguage={settings.defaultLanguage}
        acquire={acquireAvailable()}
        initialChannel={channel}
      />
    </div>
  );
}
