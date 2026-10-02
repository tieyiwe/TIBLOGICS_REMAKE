import { OWNER_EMAIL } from "@/lib/auth";
import { listMembers, rolesWithUsage } from "@/lib/admin/team/service";
import { footprintSummary } from "@/lib/admin/team/footprint";
import { requireTeamPage } from "./_components/data";
import MembersClient, { type MemberRow } from "./_components/MembersClient";

export const dynamic = "force-dynamic";

// Team & Roles: who is on the staff, their role, extra or removed access,
// status and footprint. The owner row (Super Admin) is shown first and is
// locked. Every change goes through /api/admin/team/* (lib/admin/team).
export default async function TeamPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { session, viewer } = await requireTeamPage();
  const sp = await searchParams;
  const [members, roles, summary] = await Promise.all([listMembers(session.user), rolesWithUsage(), footprintSummary()]);
  const fp = (email: string) => summary.get(email.toLowerCase());
  const owner = fp(OWNER_EMAIL);
  const rows: MemberRow[] = [
    {
      id: "owner",
      name: process.env.ADMIN_NAME ?? "Tieyiwe",
      email: OWNER_EMAIL,
      roleId: "owner",
      roleName: "Super Admin",
      isAdmin: true,
      status: "active",
      grants: [],
      revokes: [],
      inviteNote: null,
      invitedBy: "",
      inviteExpires: null,
      lastLoginAt: owner?.lastSignin?.toISOString() ?? null,
      createdAt: "",
      permissions: ["*"],
      editable: false,
      owner: true,
      signins: owner?.signins ?? 0,
      lastActive: owner?.lastActive?.toISOString() ?? null,
    },
    ...members.map((m) => {
      const f = fp(m.email);
      return { ...m, owner: false, signins: f?.signins ?? 0, lastActive: f?.lastActive?.toISOString() ?? m.lastLoginAt };
    }),
  ];
  const member = typeof sp.member === "string" ? sp.member : null;
  return <MembersClient rows={rows} roles={roles} viewer={viewer} initialMember={member} />;
}
