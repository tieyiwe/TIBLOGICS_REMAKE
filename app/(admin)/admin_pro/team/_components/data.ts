import { redirect } from "next/navigation";
import type { Session } from "next-auth";
import { can } from "@/lib/admin/permissions";
import { requireAdminPage } from "../../_lib/admin-page-auth";
import type { TeamViewer } from "./shared";

/** Team & Roles pages: the "team" permission (owner and admins always). */
export async function requireTeamPage(): Promise<{ session: Session; viewer: TeamViewer }> {
  const session = await requireAdminPage();
  if (!can(session.user, "team")) redirect("/admin_pro/no-access?need=team");
  const u = session.user;
  return {
    session,
    viewer: {
      isOwner: !!u.isOwner,
      isAdmin: !!u.isAdmin,
      permissions: u.permissions ?? [],
      collaboratorId: u.collaboratorId ?? null,
      email: u.email,
      canManage: can(u, "team:manage"),
    },
  };
}
