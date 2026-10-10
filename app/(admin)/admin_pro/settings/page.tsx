import { redirect } from "next/navigation";
import { can } from "@/lib/admin/permissions";
import { requireAdminPage } from "../_lib/admin-page-auth";
import SettingsClient from "./SettingsClient";

// Session-scoped.
export const dynamic = "force-dynamic";

/**
 * Settings: booking, notifications, integrations and the owner account. Needs
 * the "settings" permission (Team & Roles; owner and admins always). Team
 * access moved to /admin_pro/team.
 */
export default async function SettingsPage() {
  const session = await requireAdminPage();
  if (!can(session.user, "settings")) redirect("/admin_pro/no-access");
  return <SettingsClient />;
}
