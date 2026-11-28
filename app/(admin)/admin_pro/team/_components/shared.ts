// Client-safe types and constants shared by the Team & Roles pages.
import type { RoleDef } from "@/lib/admin/permissions";

export interface TeamViewer {
  isOwner: boolean;
  isAdmin: boolean;
  permissions: string[];
  collaboratorId: string | null;
  email: string;
  canManage: boolean;
}

export type RoleWithMembers = RoleDef & { members: Array<{ id: string; name: string; email: string }> };

export const TEAM_TABS = [
  { label: "Members", href: "/admin_pro/team" },
  { label: "Roles", href: "/admin_pro/team/roles" },
  { label: "Activity", href: "/admin_pro/team/activity" },
];
