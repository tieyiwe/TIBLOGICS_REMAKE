import { requireCcPage } from "@/lib/admin/command-center/guard";
import { ccShellData } from "@/lib/admin/command-center/page-data";
import { PERM_COMMAND_CENTER } from "@/lib/admin/command-center/permissions";
import CalendarClient from "./CalendarClient";

export const dynamic = "force-dynamic";

/** Calendar of task due dates and milestones. */
export default async function CalendarPage() {
  const staff = await requireCcPage(PERM_COMMAND_CENTER);
  return <CalendarClient shell={await ccShellData(staff)} />;
}
