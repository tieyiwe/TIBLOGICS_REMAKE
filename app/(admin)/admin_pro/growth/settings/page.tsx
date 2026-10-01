import { requireGrowthAdminPage } from "@/lib/growth/content-auth";
import { getGrowthSettings } from "@/lib/growth/settings";
import GrowthTabs from "../_components/GrowthTabs";
import { PageHeader } from "../_components/ui";
import SettingsForm from "./SettingsForm";

export const dynamic = "force-dynamic";

export default async function GrowthSettingsPage() {
  await requireGrowthAdminPage();
  const settings = await getGrowthSettings();
  return (
    <div className="space-y-5 max-w-[1100px]">
      <GrowthTabs />
      <PageHeader
        title="Brand voice & audiences"
        subtitle="Every kit and auto-drafted post is written against these. Proof points are the only brand-level facts the AI may cite; banned claims are flagged wherever they appear."
      />
      <SettingsForm initial={settings} />
    </div>
  );
}
