import { requireGrowthAdminPage } from "@/lib/growth/content-auth";
import { getGrowthSettings } from "@/lib/growth/settings";
import { configuredPlatforms } from "@/lib/growth/content/publish";
import GrowthTabs from "../_components/GrowthTabs";
import { PageHeader } from "../_components/ui";
import CalendarClient from "./CalendarClient";

export const dynamic = "force-dynamic";

export default async function GrowthCalendarPage() {
  await requireGrowthAdminPage();
  const settings = await getGrowthSettings();
  const configured = configuredPlatforms();
  return (
    <div className="space-y-5 max-w-[1400px]">
      <GrowthTabs />
      <PageHeader
        title="Content calendar"
        subtitle="Drag a post to another day to reschedule it (it keeps its time). Approve a draft to schedule it: platforms with API tokens publish automatically every 15 minutes; the others turn “Ready to post” with a copy button and a deep link."
      />
      <CalendarClient
        audiences={settings.audiences.map((a) => ({ id: a.id, name: a.name, timezone: a.timezone, language: a.language }))}
        configured={configured}
      />
    </div>
  );
}
