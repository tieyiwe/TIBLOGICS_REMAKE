import { getServerSession, type Session } from "next-auth";
import { authOptions } from "@/lib/auth";

// Free access to the paid tools for the site owner, so they can try every
// flow without paying themselves. Only an owner or admin may grant it; a
// collaborator with the "tools" permission can see subscribers but cannot
// hand out paid products.

/** Status given to a complimentary Toolkit Live subscription. */
export const COMP_STATUS = "comped";

export async function ownerSession(): Promise<Session | null> {
  let session: Session | null = null;
  try {
    session = await getServerSession(authOptions);
  } catch {
    return null;
  }
  const u = session?.user;
  if (!u || u.studentId) return null;
  return u.isOwner || u.isAdmin ? session : null;
}
