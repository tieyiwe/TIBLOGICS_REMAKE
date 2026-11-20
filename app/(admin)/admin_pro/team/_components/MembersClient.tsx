"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Activity, Copy, Crown, LogOut, Mail, RotateCcw, Shield, Trash2, UserCheck, UserPlus, UserX, Users } from "lucide-react";
import {
  Avatar,
  Badge,
  Button,
  DataTable,
  Drawer,
  EmptyState,
  Notice,
  PageHeader,
  SearchInput,
  Segmented,
  Select,
  Toolbar,
  useConfirm,
  useToast,
  type BadgeTone,
  type Column,
} from "@/components/admin/ui";
import { ADMIN_ROLE_ID, can, effectiveAccess, levelOf, PRESET_ROLES, type Access } from "@/lib/admin/permissions";
import type { MemberView } from "@/lib/admin/team/service";
import { AccessGrid, overridesFor } from "./AccessGrid";
import { TEAM_TABS, type RoleWithMembers, type TeamViewer } from "./shared";
import { ago, dt } from "../../learn/learners/_components/format";

export type MemberRow = MemberView & { owner: boolean; signins: number; lastActive: string | null };

const STATUS: Record<string, { label: string; tone: BadgeTone }> = {
  active: { label: "Active", tone: "success" },
  invited: { label: "Invited", tone: "info" },
  expired: { label: "Invite expired", tone: "warn" },
  deactivated: { label: "Deactivated", tone: "neutral" },
};

export async function teamFetch(url: string, init?: RequestInit): Promise<Record<string, unknown>> {
  const res = await fetch(url, {
    ...init,
    headers: init?.body ? { "Content-Type": "application/json", ...(init?.headers ?? {}) } : init?.headers,
  });
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : `Request failed (${res.status})`);
  return data;
}

/** What the viewer may hand out (the server checks the same). */
export function grantChecker(viewer: TeamViewer) {
  return (key: string) => {
    if (viewer.isOwner) return true;
    if (key === "team:manage") return false;
    return can(viewer, key);
  };
}

export function assignableRoles(roles: RoleWithMembers[], viewer: TeamViewer) {
  const ok = grantChecker(viewer);
  return roles.filter((r) => {
    if (viewer.isOwner) return true;
    if (r.admin) return false;
    if (levelOf(r.access, "team") === "manage") return false;
    return Object.entries(r.access.levels).every(([k, l]) => l === "none" || ok(`${k}:${l}`)) && r.access.caps.every((c) => ok(c));
  });
}

export default function MembersClient({
  rows,
  roles,
  viewer,
  initialMember,
}: {
  rows: MemberRow[];
  roles: RoleWithMembers[];
  viewer: TeamViewer;
  initialMember: string | null;
}) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [openId, setOpenId] = useState<string | null>(initialMember);
  const [inviting, setInviting] = useState(false);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: rows.length, active: 0, invited: 0, deactivated: 0 };
    for (const r of rows) c[r.status === "expired" ? "invited" : r.status] = (c[r.status === "expired" ? "invited" : r.status] ?? 0) + 1;
    return c;
  }, [rows]);

  const shown = rows.filter((r) => {
    if (status !== "all" && (r.status === "expired" ? "invited" : r.status) !== status) return false;
    const s = q.trim().toLowerCase();
    return !s || r.name.toLowerCase().includes(s) || r.email.toLowerCase().includes(s) || r.roleName.toLowerCase().includes(s);
  });
  const open = rows.find((r) => r.id === openId) ?? null;

  const columns: Column<MemberRow>[] = [
    {
      key: "member",
      header: "Member",
      primary: true,
      render: (r) => (
        <span className="flex min-w-0 items-center gap-3">
          <Avatar name={r.name} seed={r.email} size={32} />
          <span className="min-w-0">
            <span className="flex items-center gap-1.5 font-semibold text-[var(--a-ink)]">
              <span className="truncate">{r.name}</span>
              {r.owner ? <Crown size={13} className="shrink-0 text-[var(--a-orange-text)]" aria-label="Owner" /> : null}
            </span>
            <span className="block truncate text-[12.5px] text-[var(--a-ink-3)]">{r.email}</span>
          </span>
        </span>
      ),
    },
    {
      key: "role",
      header: "Role",
      render: (r) => (
        <span className="flex flex-wrap items-center gap-1.5">
          <Badge tone={r.owner ? "orange" : r.isAdmin ? "info" : "neutral"}>{r.roleName}</Badge>
          {r.grants.length + r.revokes.length > 0 ? (
            <Badge tone="warn" title={[...r.grants.map((g) => `+ ${g}`), ...r.revokes.map((x) => `- ${x}`)].join("\n")}>
              {r.grants.length ? `+${r.grants.length}` : ""}
              {r.grants.length && r.revokes.length ? " " : ""}
              {r.revokes.length ? `-${r.revokes.length}` : ""} override{r.grants.length + r.revokes.length === 1 ? "" : "s"}
            </Badge>
          ) : null}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (r) => (r.owner ? <Badge tone="orange">Locked</Badge> : <Badge tone={STATUS[r.status].tone} dot>{STATUS[r.status].label}</Badge>),
    },
    { key: "last", header: "Last active", render: (r) => <span className="tabular-nums" title={r.lastActive ? dt(r.lastActive) : undefined}>{ago(r.lastActive)}</span> },
    { key: "signins", header: "Sign-ins", align: "right", hideOnMobile: true, render: (r) => <span className="tabular-nums">{r.signins}</span> },
  ];

  return (
    <div>
      <PageHeader
        title="Team & Roles"
        subtitle="Invite staff, give each person a role, add or remove access to single features, and see what everyone does."
        tabs={TEAM_TABS}
        activeTab="/admin_pro/team"
        actions={
          viewer.canManage ? (
            <Button variant="primary" icon={UserPlus} onClick={() => setInviting(true)}>
              Invite people
            </Button>
          ) : null
        }
      />

      <Toolbar className="mb-4">
        <SearchInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email or role" label="Search team" className="basis-full sm:basis-auto" />
        <Segmented
          ariaLabel="Status"
          size="sm"
          value={status}
          onChange={setStatus}
          options={[
            { value: "all", label: "All", count: counts.all },
            { value: "active", label: "Active", count: counts.active },
            { value: "invited", label: "Invited", count: counts.invited },
            { value: "deactivated", label: "Deactivated", count: counts.deactivated },
          ]}
        />
      </Toolbar>

      <DataTable
        caption="Team members"
        columns={columns}
        rows={shown}
        rowKey={(r) => r.id}
        onRowClick={(r) => setOpenId(r.id)}
        empty={
          <EmptyState
            icon={Users}
            title={rows.length > 1 ? "No one matches" : "No team members yet"}
            body={rows.length > 1 ? "Try another search or status." : "Invite your first staff member and choose what they can open."}
            action={viewer.canManage && rows.length <= 1 ? <Button variant="primary" icon={UserPlus} onClick={() => setInviting(true)}>Invite people</Button> : undefined}
          />
        }
      />

      <MemberDrawer member={open} roles={roles} viewer={viewer} onClose={() => setOpenId(null)} />
      <InviteDrawer open={inviting} roles={roles} viewer={viewer} onClose={() => setInviting(false)} />
    </div>
  );
}

// ── Member drawer ──────────────────────────────────────────────────────────

function MemberDrawer({ member, roles, viewer, onClose }: { member: MemberRow | null; roles: RoleWithMembers[]; viewer: TeamViewer; onClose: () => void }) {
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const [roleId, setRoleId] = useState("");
  const [desired, setDesired] = useState<Access | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [recent, setRecent] = useState<Array<{ id: string; at: string; summary: string; success: boolean }> | null>(null);

  const role = roles.find((r) => r.id === roleId) ?? null;
  const memberRole = member ? roles.find((r) => r.id === member.roleId) ?? null : null;

  useEffect(() => {
    if (!member || member.owner) {
      setDesired(null);
      return;
    }
    const r = roles.find((x) => x.id === member.roleId);
    setRoleId(member.roleId);
    setDesired(r ? effectiveAccess(r.access, member.grants, member.revokes) : null);
  }, [member, roles]);

  useEffect(() => {
    setRecent(null);
    if (!member) return;
    let live = true;
    teamFetch(`/api/admin/team/activity?person=${encodeURIComponent(member.email)}`)
      .then((d) => live && setRecent(((d.rows as Array<{ id: string; at: string; summary: string; success: boolean }>) ?? []).slice(0, 8)))
      .catch(() => live && setRecent([]));
    return () => {
      live = false;
    };
  }, [member]);

  const changeRole = (id: string) => {
    setRoleId(id);
    const r = roles.find((x) => x.id === id);
    // Switching role keeps the person's overrides on top of the new role.
    if (r && member) setDesired(effectiveAccess(r.access, member.grants, member.revokes));
  };

  const run = useCallback(
    async (key: string, fn: () => Promise<unknown>, ok: string) => {
      setBusy(key);
      try {
        await fn();
        toast.success(ok);
        router.refresh();
      } catch (err) {
        toast.error("Not changed", err instanceof Error ? err.message : undefined);
      } finally {
        setBusy(null);
      }
    },
    [router, toast],
  );

  if (!member) return null;
  const base = `/api/admin/team/members/${member.id}`;
  const st = STATUS[member.status];
  const editable = member.editable;
  const overrides = role && desired && !role.admin ? overridesFor(role.access, desired) : { grants: [], revokes: [] };
  const dirty =
    !!member &&
    (roleId !== member.roleId || overrides.grants.join() !== [...member.grants].sort().join() || overrides.revokes.join() !== [...member.revokes].sort().join());
  const roleChoices = assignableRoles(roles, viewer);
  if (memberRole && !roleChoices.some((r) => r.id === memberRole.id)) roleChoices.unshift(memberRole);

  const save = () =>
    run("save", () => teamFetch(base, { method: "PATCH", body: JSON.stringify({ roleId, grants: overrides.grants, revokes: overrides.revokes }) }), "Access saved. It applies on their next click.");

  return (
    <Drawer
      open
      onClose={onClose}
      width={640}
      title={
        <span className="flex min-w-0 items-center gap-3">
          <Avatar name={member.name} seed={member.email} size={36} />
          <span className="min-w-0">
            <span className="block truncate">{member.name}</span>
            <span className="block truncate font-dm text-[12.5px] font-normal text-[var(--a-ink-3)]">{member.email}</span>
          </span>
        </span>
      }
      footer={
        editable && !member.owner ? (
          <div className="flex flex-wrap items-center justify-end gap-2">
            {dirty ? <span className="mr-auto font-dm text-[12.5px] text-[var(--a-warn)]">Unsaved changes</span> : null}
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
            <Button variant="primary" disabled={!dirty} loading={busy === "save"} onClick={save}>
              Save access
            </Button>
          </div>
        ) : undefined
      }
    >
      <div className="space-y-6 p-4 sm:p-5">
        {member.owner ? (
          <Notice tone="info" title="Super Admin (owner)">
            The owner has every permission, including the owner-only ones (Admins, security, log retention). This account is locked: nobody can edit,
            demote or deactivate it.
          </Notice>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={st.tone} dot>
                {st.label}
              </Badge>
              {member.isAdmin ? <Badge tone="info">Admin</Badge> : null}
              <span className="font-dm text-[12.5px] text-[var(--a-ink-3)]">
                {member.status === "invited" || member.status === "expired"
                  ? `Invited by ${member.invitedBy}${member.inviteExpires ? `, link ${member.status === "expired" ? "expired" : "expires"} ${dt(member.inviteExpires)}` : ""}`
                  : `Last active ${ago(member.lastActive)} · ${member.signins} sign-in${member.signins === 1 ? "" : "s"}`}
              </span>
            </div>
            {!editable ? (
              <Notice tone="info">
                {member.isAdmin
                  ? "Only the owner can change an Admin."
                  : viewer.collaboratorId === member.id
                    ? "This is you. Ask the owner to change your own access."
                    : viewer.canManage
                      ? "Only the owner can change someone who manages the team."
                      : "You can see this person's access but not change it."}
              </Notice>
            ) : null}

            {member.inviteNote ? (
              <p className="rounded-[var(--a-radius-control)] bg-[var(--a-surface-2)] px-3 py-2 font-dm text-[13px] text-[var(--a-ink-2)]">
                <span className="font-semibold">Invite note:</span> {member.inviteNote}
              </p>
            ) : null}

            <section className="space-y-2">
              <label htmlFor="member-role" className="block font-dm text-[11px] font-semibold uppercase tracking-[.08em] text-[var(--a-ink-3)]">
                Role
              </label>
              <Select id="member-role" value={roleId} disabled={!editable} onChange={(e) => changeRole(e.target.value)} className="w-full sm:w-auto">
                {roleChoices.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                    {r.preset ? "" : " (custom)"}
                  </option>
                ))}
              </Select>
              {role ? <p className="font-dm text-[12.5px] text-[var(--a-ink-3)]">{role.description}</p> : null}
            </section>

            {role?.admin ? (
              <Notice tone="info">Admins can open everything except the owner-only items, so there is nothing to add or remove here.</Notice>
            ) : desired && role ? (
              <section className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-syne text-[16px] font-bold text-[var(--a-ink)]">Access</h3>
                  {editable && (overrides.grants.length || overrides.revokes.length) ? (
                    <Button size="sm" variant="ghost" icon={RotateCcw} onClick={() => setDesired({ ...role.access, levels: { ...role.access.levels }, caps: [...role.access.caps] })}>
                      Reset to role
                    </Button>
                  ) : null}
                </div>
                <p className="font-dm text-[12.5px] text-[var(--a-ink-3)]">
                  Change a feature to give or take away access for this person only. &ldquo;Added&rdquo; and &ldquo;Removed&rdquo; mark where they differ from the role.
                </p>
                <AccessGrid idPrefix="member" value={desired} base={role.access} onChange={editable ? setDesired : undefined} allowed={grantChecker(viewer)} />
              </section>
            ) : null}

            {editable ? (
              <section className="space-y-2 border-t border-[var(--a-border)] pt-5">
                <h3 className="font-syne text-[16px] font-bold text-[var(--a-ink)]">Account</h3>
                <div className="flex flex-wrap gap-2">
                  {member.status === "invited" || member.status === "expired" ? (
                    <>
                      <Button
                        variant="secondary"
                        icon={Mail}
                        loading={busy === "resend"}
                        onClick={() => run("resend", () => teamFetch(`${base}/invite`, { method: "POST", body: JSON.stringify({ expiryDays: 7 }) }), "Invitation sent again")}
                      >
                        Resend invite
                      </Button>
                      <Button
                        variant="danger"
                        icon={UserX}
                        loading={busy === "revoke"}
                        onClick={async () => {
                          if (!(await confirm({ title: `Withdraw ${member.name}'s invitation?`, body: "The link stops working and they are removed from the list.", confirmLabel: "Withdraw", danger: true }))) return;
                          await run("revoke", () => teamFetch(`${base}/invite`, { method: "DELETE" }), "Invitation withdrawn");
                          onClose();
                        }}
                      >
                        Withdraw invite
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="secondary"
                        icon={Mail}
                        loading={busy === "reset"}
                        onClick={() => run("reset", () => teamFetch(`${base}/invite`, { method: "POST", body: "{}" }), "Password reset link sent")}
                      >
                        Send password reset
                      </Button>
                      <Button
                        variant="secondary"
                        icon={LogOut}
                        loading={busy === "signout"}
                        onClick={async () => {
                          if (!(await confirm({ title: `Sign ${member.name} out everywhere?`, body: "Every open session ends on its next click. They can sign in again.", confirmLabel: "Sign out", danger: false }))) return;
                          await run("signout", () => teamFetch(`${base}/signout`, { method: "POST", body: "{}" }), "Signed out everywhere");
                        }}
                      >
                        Sign out everywhere
                      </Button>
                    </>
                  )}
                  {member.status === "deactivated" ? (
                    <Button variant="secondary" icon={UserCheck} loading={busy === "active"} onClick={() => run("active", () => teamFetch(base, { method: "PATCH", body: JSON.stringify({ active: true }) }), "Reactivated")}>
                      Reactivate
                    </Button>
                  ) : member.status === "active" ? (
                    <Button
                      variant="danger"
                      icon={UserX}
                      loading={busy === "active"}
                      onClick={async () => {
                        if (!(await confirm({ title: `Deactivate ${member.name}?`, body: "They are signed out at once and cannot sign in until you reactivate them. Their history is kept.", confirmLabel: "Deactivate", danger: true }))) return;
                        await run("active", () => teamFetch(base, { method: "PATCH", body: JSON.stringify({ active: false }) }), "Deactivated");
                      }}
                    >
                      Deactivate
                    </Button>
                  ) : null}
                  <Button
                    variant="ghost"
                    icon={Trash2}
                    loading={busy === "delete"}
                    onClick={async () => {
                      if (!(await confirm({ title: `Remove ${member.name} from the team?`, body: "Their account is deleted. Activity logs and audit entries are kept.", confirmLabel: "Remove", danger: true, typeToConfirm: "REMOVE" }))) return;
                      await run("delete", () => teamFetch(base, { method: "DELETE" }), "Removed from the team");
                      onClose();
                    }}
                  >
                    Remove
                  </Button>
                </div>
              </section>
            ) : null}
          </>
        )}

        <section className="space-y-2 border-t border-[var(--a-border)] pt-5">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-syne text-[16px] font-bold text-[var(--a-ink)]">Recent activity</h3>
            <Link href={`/admin_pro/team/activity?person=${encodeURIComponent(member.email)}`} className="inline-flex items-center gap-1 font-dm text-[13px] font-semibold text-[var(--a-blue)] hover:underline">
              <Activity size={14} aria-hidden /> Full timeline
            </Link>
          </div>
          {recent === null ? (
            <p className="font-dm text-[13px] text-[var(--a-ink-3)]">Loading</p>
          ) : recent.length === 0 ? (
            <p className="font-dm text-[13px] text-[var(--a-ink-3)]">Nothing recorded yet.</p>
          ) : (
            <ul className="space-y-1.5">
              {recent.map((e) => (
                <li key={e.id} className="flex gap-3 font-dm text-[13px]">
                  <span className="w-24 shrink-0 tabular-nums text-[var(--a-ink-3)]">{ago(e.at)}</span>
                  <span className={e.success ? "min-w-0 break-words text-[var(--a-ink-2)]" : "min-w-0 break-words text-[var(--a-danger)]"}>{e.summary}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </Drawer>
  );
}

// ── Invite drawer ──────────────────────────────────────────────────────────

function InviteDrawer({ open, roles, viewer, onClose }: { open: boolean; roles: RoleWithMembers[]; viewer: TeamViewer; onClose: () => void }) {
  const router = useRouter();
  const toast = useToast();
  const choices = assignableRoles(roles, viewer);
  const firstRole = choices.find((r) => r.id !== ADMIN_ROLE_ID && r.id !== "custom") ?? choices[0];
  const [emails, setEmails] = useState("");
  const [name, setName] = useState("");
  const [roleId, setRoleId] = useState(firstRole?.id ?? "custom");
  const [custom, setCustom] = useState(false);
  const [desired, setDesired] = useState<Access | null>(null);
  const [note, setNote] = useState("");
  const [days, setDays] = useState("7");
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<Array<{ email: string; ok: boolean; error?: string; inviteUrl?: string }> | null>(null);

  const role = roles.find((r) => r.id === roleId) ?? PRESET_ROLES.find((r) => r.id === roleId) ?? null;
  const list = emails
    .split(/[\s,;]+/)
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  useEffect(() => {
    if (!open) return;
    setResults(null);
  }, [open]);

  const reset = () => {
    setEmails("");
    setName("");
    setNote("");
    setCustom(false);
    setDesired(null);
    setResults(null);
  };

  const submit = async () => {
    if (!role || list.length === 0) return;
    setBusy(true);
    try {
      const ov = custom && desired && !role.admin ? overridesFor(role.access, desired) : { grants: [], revokes: [] };
      const d = await teamFetch("/api/admin/team/members", {
        method: "POST",
        body: JSON.stringify({ emails: list, name: list.length === 1 && name.trim() ? name.trim() : undefined, roleId, ...ov, note, expiryDays: Number(days) }),
      }).catch((err) => {
        throw err;
      });
      const res = (d.results as Array<{ email: string; ok: boolean; error?: string; inviteUrl?: string }>) ?? [];
      setResults(res);
      const sent = res.filter((r) => r.ok).length;
      if (sent) toast.success(`${sent} invitation${sent === 1 ? "" : "s"} sent`);
      router.refresh();
    } catch (err) {
      toast.error("Invitations not sent", err instanceof Error ? err.message : undefined);
    } finally {
      setBusy(false);
    }
  };

  const field = "w-full rounded-[var(--a-radius-control)] border border-[var(--a-border-strong)] bg-[var(--a-surface)] px-3 py-2 font-dm text-[13.5px] text-[var(--a-ink)] focus:border-[var(--a-blue)] focus:outline-none focus:ring-2 focus:ring-[var(--a-blue)]/20";
  const lbl = "mb-1 block font-dm text-[11px] font-semibold uppercase tracking-[.08em] text-[var(--a-ink-3)]";

  return (
    <Drawer
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      width={640}
      title="Invite people"
      footer={
        results ? (
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={reset}>
              Invite more
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                reset();
                onClose();
              }}
            >
              Done
            </Button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-end gap-2">
            <span className="mr-auto font-dm text-[12.5px] text-[var(--a-ink-3)]">{list.length ? `${list.length} address${list.length === 1 ? "" : "es"}` : ""}</span>
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" icon={Mail} loading={busy} disabled={!list.length || !role} onClick={submit}>
              Send invitation{list.length === 1 ? "" : "s"}
            </Button>
          </div>
        )
      }
    >
      {results ? (
        <div className="space-y-3 p-4 sm:p-5">
          {results.map((r) => (
            <div key={r.email} className="rounded-[var(--a-radius-control)] border border-[var(--a-border)] p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="break-all font-dm text-[13.5px] font-semibold text-[var(--a-ink)]">{r.email}</span>
                <Badge tone={r.ok ? "success" : "danger"}>{r.ok ? "Invited" : r.error ?? "Not invited"}</Badge>
              </div>
              {r.inviteUrl ? (
                <button
                  type="button"
                  className="mt-2 inline-flex items-center gap-1 font-dm text-[12.5px] font-semibold text-[var(--a-blue)] hover:underline"
                  onClick={() => {
                    void navigator.clipboard?.writeText(r.inviteUrl!).then(() => toast.info("Invitation link copied"));
                  }}
                >
                  <Copy size={13} aria-hidden /> Copy invitation link
                </button>
              ) : null}
            </div>
          ))}
          <p className="font-dm text-[12.5px] text-[var(--a-ink-3)]">Each link works once. They choose their own password when they accept.</p>
        </div>
      ) : (
        <div className="space-y-5 p-4 sm:p-5">
          <div>
            <label htmlFor="inv-emails" className={lbl}>
              Email addresses
            </label>
            <textarea id="inv-emails" rows={3} value={emails} onChange={(e) => setEmails(e.target.value)} placeholder="amina@example.com, jean@example.com" className={field} />
            <p className="mt-1 font-dm text-[12px] text-[var(--a-ink-3)]">Separate several addresses with commas or new lines (up to 50).</p>
          </div>
          {list.length <= 1 ? (
            <div>
              <label htmlFor="inv-name-admin" className={lbl}>
                Name (optional)
              </label>
              <input id="inv-name-admin" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} className={field} placeholder="They can change it when they accept" />
            </div>
          ) : null}
          <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
            <div>
              <label htmlFor="inv-role" className={lbl}>
                Role
              </label>
              <Select
                id="inv-role"
                value={roleId}
                onChange={(e) => {
                  setRoleId(e.target.value);
                  setDesired(null);
                  setCustom(false);
                }}
                className="w-full"
              >
                {choices.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                    {r.preset ? "" : " (custom)"}
                  </option>
                ))}
              </Select>
              {role ? <p className="mt-1 font-dm text-[12.5px] text-[var(--a-ink-3)]">{role.description}</p> : null}
            </div>
            <div>
              <label htmlFor="inv-days" className={lbl}>
                Link expires in
              </label>
              <Select id="inv-days" value={days} onChange={(e) => setDays(e.target.value)} className="w-full">
                {["1", "3", "7", "14", "30"].map((d) => (
                  <option key={d} value={d}>
                    {d} day{d === "1" ? "" : "s"}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          {role && !role.admin ? (
            <div className="space-y-2">
              <label className="flex items-center gap-2 font-dm text-[13.5px] text-[var(--a-ink)]">
                <input
                  type="checkbox"
                  checked={custom}
                  onChange={(e) => {
                    setCustom(e.target.checked);
                    if (e.target.checked && !desired) setDesired({ levels: { ...role.access.levels }, caps: [...role.access.caps] });
                  }}
                  className="h-4 w-4 accent-[var(--a-navy)]"
                />
                Adjust access for {list.length > 1 ? "these people" : "this person"} (add or remove single features)
              </label>
              {custom && desired ? <AccessGrid idPrefix="invite" value={desired} base={role.access} onChange={setDesired} allowed={grantChecker(viewer)} /> : null}
            </div>
          ) : role?.admin ? (
            <Notice tone="warn" title="Admin">
              Admins can do everything except the owner-only items, including managing other staff. Only invite people you trust fully.
            </Notice>
          ) : null}
          <div>
            <label htmlFor="inv-note" className={lbl}>
              Personal note (optional)
            </label>
            <textarea id="inv-note" rows={3} maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} className={field} placeholder="Welcome aboard! You will help with..." />
          </div>
          <p className="flex items-start gap-2 font-dm text-[12.5px] text-[var(--a-ink-3)]">
            <Shield size={14} className="mt-0.5 shrink-0" aria-hidden /> The invitation comes from the main TIBLOGICS address with a single-use link.
          </p>
        </div>
      )}
    </Drawer>
  );
}
