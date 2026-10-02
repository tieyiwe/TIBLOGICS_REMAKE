import { redirect } from "next/navigation";
import { requireCcPage } from "@/lib/admin/command-center/guard";
import { PERM_COMMAND_CENTER } from "@/lib/admin/command-center/permissions";

export const dynamic = "force-dynamic";

/** Old Command Center view, kept so bookmarks work: now a view of Projects. */
export default async function LegacyView() {
  await requireCcPage(PERM_COMMAND_CENTER);
  redirect("/admin_pro/command-center?view=timeline");
}
