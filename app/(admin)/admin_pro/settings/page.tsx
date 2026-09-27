import prisma from "@/lib/prisma";
import { requireAdminPage } from "../_lib/admin-page-auth";
import SettingsClient from "./SettingsClient";

// Session-scoped — the roster depends on who is asking.
export const dynamic = "force-dynamic";

/**
 * Settings admin — server-rendered initial read.
 *
 * The only thing this page ever fetched on mount was the team roster and the
 * collaborator activity feed (the Team Access panel's useEffect). Those two
 * reads now happen here; every write still goes through
 * /api/admin/collaborators*.
 */
export default async function SettingsPage() {
  // Staff check first — same rule as requireAdmin() on the API routes.
  const session = await requireAdminPage();

  // The roster and the audit trail are admin-only, not merely staff-only:
  // /api/admin/collaborators adds an explicit `isAdmin` gate on top of
  // requireAdmin(), so reading it here has to apply that gate too. A plain
  // collaborator gets empty lists, exactly as the 403 left them with before.
  const canSeeTeam = session.user?.isAdmin === true;

  // A database outage leaves each list empty rather than throwing a 500 —
  // the rest of the settings screen is local state and still works.
  const rawCollaborators = canSeeTeam
    ? await prisma.collaborator
        .findMany({
          orderBy: { createdAt: "desc" },
          // passwordHash is deliberately never selected.
          select: {
            id: true, name: true, email: true, role: true,
            permissions: true, isAdmin: true, active: true,
            inviteToken: true, lastLoginAt: true, createdAt: true,
          },
        })
        .catch((err) => {
          console.error("[admin/settings page] collaborators", err);
          return [];
        })
    : [];

  const rawLogs = canSeeTeam
    ? await prisma.collaboratorActivityLog
        .findMany({
          orderBy: { createdAt: "desc" },
          take: 50,
          include: {
            collaborator: { select: { name: true, email: true, role: true } },
          },
        })
        .catch((err) => {
          console.error("[admin/settings page] activity", err);
          return [];
        })
    : [];

  return (
    <SettingsClient
      collaborators={rawCollaborators.map((c) => ({
        id: c.id,
        name: c.name,
        email: c.email,
        role: c.role,
        permissions: c.permissions,
        isAdmin: c.isAdmin,
        active: c.active,
        lastLoginAt: c.lastLoginAt ? c.lastLoginAt.toISOString() : null,
        inviteToken: c.inviteToken,
        createdAt: c.createdAt.toISOString(),
      }))}
      activityLogs={rawLogs.map((l) => ({
        id: l.id,
        action: l.action,
        resource: l.resource,
        details: l.details,
        ip: l.ip,
        createdAt: l.createdAt.toISOString(),
        collaborator: {
          name: l.collaborator.name,
          email: l.collaborator.email,
          role: l.collaborator.role,
        },
      }))}
    />
  );
}
