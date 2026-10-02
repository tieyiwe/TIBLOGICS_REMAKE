import { z } from "zod";

// Server-side check of the permissions array sent when inviting or editing a
// collaborator. The settings screen only offers known keys, but the API took
// any array, so a non-owner admin could hand out "*" (everything, which is
// what admin means) and get round the rule that only the Owner grants admin.
const Perm = z.string().regex(/^(\*|[a-z][a-z_]{1,39})$/);
const Perms = z.array(Perm).max(40);

/** The cleaned permissions, or null when invalid. "*" only when `allowAll`. */
export function validPermissions(input: unknown, allowAll: boolean): string[] | null {
  const parsed = Perms.safeParse(input);
  if (!parsed.success) return null;
  if (!allowAll && parsed.data.includes("*")) return null;
  return [...new Set(parsed.data)];
}
