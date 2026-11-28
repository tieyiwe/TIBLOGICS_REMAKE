// Staff access to reviews: the "contacts" area (Sales & Growth). Reading
// needs "contacts", any change needs "contacts:manage". proxy.ts applies the
// same rule first (lib/admin/access-map.ts); every route checks again here.
import { getServerSession, type Session } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { requirePermission } from "@/lib/require-admin";

export const REVIEWS_PERMISSION = "contacts";

export async function reviewsStaff(level: "view" | "manage"): Promise<{ session: Session; error: null } | { session: null; error: NextResponse }> {
  const error = await requirePermission(level === "manage" ? `${REVIEWS_PERMISSION}:manage` : REVIEWS_PERMISSION);
  if (error) return { session: null, error };
  const session = await getServerSession(authOptions).catch(() => null);
  if (!session) return { session: null, error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  return { session, error: null };
}

/** Who approved: the staff member's name, else their email (staff only ever see this). */
export const actorLabel = (s: Session) => s.user?.name || s.user?.email || "staff";
