import { rolesWithUsage } from "@/lib/admin/team/service";
import { requireTeamPage } from "../_components/data";
import RolesClient from "../_components/RolesClient";

export const dynamic = "force-dynamic";

// Roles: the presets (read-only, can be duplicated) and custom roles
// (create, edit, duplicate, delete with reassignment), with who holds each.
export default async function TeamRolesPage() {
  const { viewer } = await requireTeamPage();
  const roles = await rolesWithUsage();
  return <RolesClient roles={roles} viewer={viewer} />;
}
