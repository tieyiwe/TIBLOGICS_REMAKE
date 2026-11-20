// Permission keys used by the Command Center (projects) and Finance.
//
// The owner and admins always pass (requirePermission treats isAdmin / "*" as
// everything). A collaborator needs the key in their permissions array. The
// Team & Roles screen reads this list to offer the keys in its grid.

export const PERM_COMMAND_CENTER = "command_center";
export const PERM_FINANCE = "finance";

export const COMMAND_CENTER_PERMISSIONS = [
  {
    key: PERM_COMMAND_CENTER,
    label: "Command Center",
    description: "Projects, tasks, milestones, notes, updates, time tracking and My work.",
  },
  {
    key: PERM_FINANCE,
    label: "Finance",
    description: "Income, expenses, receipts, budgets, P&L, tax summaries and CSV exports. Includes per-project finance.",
  },
] as const;

export const COMMAND_CENTER_PERMISSION_KEYS: string[] = COMMAND_CENTER_PERMISSIONS.map((p) => p.key);

type Viewer = { isAdmin?: boolean; isOwner?: boolean; permissions?: string[] | null } | null | undefined;

/** Same rule as requirePermission, for code that already holds the session user. */
export function hasPermission(user: Viewer, key: string): boolean {
  if (!user) return false;
  if (user.isOwner || user.isAdmin) return true;
  const perms = user.permissions ?? [];
  return perms.includes("*") || perms.includes(key);
}
