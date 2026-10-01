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
    <div className="mx-auto max-w-[1400px] space-y-5">
      <PageHeader
        title="Content calendar"
        subtitle="Drag a post to another day to reschedule it (it keeps its time). Approved posts publish automatically where tokens are set; the rest turn Ready to post with copy and a deep link."
      />
      <GrowthTabs />
      <CalendarClient
        audiences={settings.audiences.map((a) => ({ id: a.id, name: a.name, timezone: a.timezone, language: a.language }))}
        configured={configured}
      />
    </div>
  );
}
