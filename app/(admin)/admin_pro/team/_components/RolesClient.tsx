"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Copy, Lock, Pencil, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { Avatar, Badge, Button, Card, Drawer, Notice, PageHeader, Select, useConfirm, useToast } from "@/components/admin/ui";
import { CAPABILITIES, FEATURES, levelOf, OWNER_ONLY, type Access } from "@/lib/admin/permissions";
import { AccessGrid } from "./AccessGrid";
import { assignableRoles, grantChecker, teamFetch } from "./MembersClient";
import { TEAM_TABS, type RoleWithMembers, type TeamViewer } from "./shared";

type Editing = { id: string | null; name: string; description: string; access: Access };

function summary(a: Access): string {
  const manage = FEATURES.filter((f) => levelOf(a, f.key) === "manage").length;
  const view = FEATURES.filter((f) => levelOf(a, f.key) === "view").length;
  const parts = [];
  if (manage) parts.push(`${manage} manage`);
  if (view) parts.push(`${view} view`);
  if (a.caps.length) parts.push(`${a.caps.length} capabilit${a.caps.length === 1 ? "y" : "ies"}`);
  return parts.join(" · ") || "No access";
}

export default function RolesClient({ roles, viewer }: { roles: RoleWithMembers[]; viewer: TeamViewer }) {
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const [editing, setEditing] = useState<Editing | null>(null);
  const [viewing, setViewing] = useState<RoleWithMembers | null>(null);
  const [busy, setBusy] = useState(false);
  const [removing, setRemoving] = useState<RoleWithMembers | null>(null);
  const [reassign, setReassign] = useState("");
  const allowed = grantChecker(viewer);
  const targets = assignableRoles(roles, viewer);

  const save = async () => {
    if (!editing) return;
    setBusy(true);
    try {
      const body = JSON.stringify({ name: editing.name, description: editing.description, levels: editing.access.levels, caps: editing.access.caps });
      if (editing.id) await teamFetch(`/api/admin/team/roles/${editing.id}`, { method: "PATCH", body });
      else await teamFetch("/api/admin/team/roles", { method: "POST", body });
      toast.success(editing.id ? "Role saved. Everyone with it gets the change at once." : "Role created");
      setEditing(null);
      router.refresh();
    } catch (err) {
      toast.error("Role not saved", err instanceof Error ? err.message : undefined);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (r: RoleWithMembers) => {
    if (r.members.length) {
      setRemoving(r);
      setReassign(targets.find((t) => t.id !== r.id && !t.admin)?.id ?? "");
      return;
    }
    if (!(await confirm({ title: `Delete the role "${r.name}"?`, body: "Nobody has this role. This cannot be undone.", confirmLabel: "Delete role" }))) return;
    try {
      await teamFetch(`/api/admin/team/roles/${r.id}`, { method: "DELETE" });
      toast.success("Role deleted");
      router.refresh();
    } catch (err) {
      toast.error("Role not deleted", err instanceof Error ? err.message : undefined);
    }
  };

  const confirmRemove = async () => {
    if (!removing || !reassign) return;
    setBusy(true);
    try {
      await teamFetch(`/api/admin/team/roles/${removing.id}?reassign=${encodeURIComponent(reassign)}`, { method: "DELETE" });
      toast.success("Role deleted and its members moved");
      setRemoving(null);
      router.refresh();
    } catch (err) {
      toast.error("Role not deleted", err instanceof Error ? err.message : undefined);
    } finally {
      setBusy(false);
    }
  };

  const presets = roles.filter((r) => r.preset);
  const customs = roles.filter((r) => !r.preset);

  const card = (r: RoleWithMembers) => {
    const editable = viewer.canManage && !r.preset && (viewer.isOwner || levelOf(r.access, "team") !== "manage");
    const canDup = viewer.canManage && !r.admin && targets.some((t) => t.id === r.id);
    return (
      <li key={r.id} className="flex flex-col rounded-[var(--a-radius-card)] border border-[var(--a-border)] bg-[var(--a-surface)] p-4 shadow-[var(--a-shadow-card)]">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="flex items-center gap-2 font-dm text-[15px] font-bold text-[var(--a-ink)]">
              {r.name}
              {r.preset ? <Badge tone="neutral">Preset</Badge> : <Badge tone="info">Custom</Badge>}
            </h3>
            <p className="mt-1 font-dm text-[12.5px] leading-snug text-[var(--a-ink-3)]">{r.description || "No description"}</p>
          </div>
        </div>
        <p className="mt-3 font-dm text-[12.5px] font-semibold text-[var(--a-ink-2)]">{r.admin ? "Everything except owner-only items" : summary(r.access)}</p>
        <div className="mt-3 flex min-h-[28px] items-center gap-1.5">
          {r.members.slice(0, 6).map((m) => (
            <Link key={m.id} href={`/admin_pro/team?member=${m.id}`} title={`${m.name} (${m.email})`}>
              <Avatar name={m.name} seed={m.email} size={26} title={m.name} />
            </Link>
          ))}
          <span className="font-dm text-[12.5px] text-[var(--a-ink-3)]">
            {r.members.length === 0 ? "Nobody yet" : r.members.length > 6 ? `+${r.members.length - 6} more` : `${r.members.length} member${r.members.length === 1 ? "" : "s"}`}
          </span>
        </div>
        <div className="mt-4 flex flex-wrap gap-2 border-t border-[var(--a-border)] pt-3">
          <Button size="sm" variant="ghost" onClick={() => setViewing(r)}>
            View access
          </Button>
          {editable ? (
            <Button size="sm" variant="secondary" icon={Pencil} onClick={() => setEditing({ id: r.id, name: r.name, description: r.description, access: { levels: { ...r.access.levels }, caps: [...r.access.caps] } })}>
              Edit
            </Button>
          ) : null}
          {canDup ? (
            <Button
              size="sm"
              variant="secondary"
              icon={Copy}
              onClick={() => setEditing({ id: null, name: `${r.name} copy`, description: r.description, access: { levels: { ...r.access.levels }, caps: [...r.access.caps] } })}
            >
              Duplicate
            </Button>
          ) : null}
          {editable ? (
            <Button size="sm" variant="ghost" icon={Trash2} onClick={() => remove(r)} aria-label={`Delete ${r.name}`}>
              Delete
            </Button>
          ) : null}
        </div>
      </li>
    );
  };

  return (
    <div>
      <PageHeader
        title="Team & Roles"
        subtitle="A role is a set of access you give to several people at once. Change a role and everyone with it changes at once."
        tabs={TEAM_TABS}
        activeTab="/admin_pro/team/roles"
        actions={
          viewer.canManage ? (
            <Button variant="primary" icon={Plus} onClick={() => setEditing({ id: null, name: "", description: "", access: { levels: {}, caps: [] } })}>
              New role
            </Button>
          ) : null
        }
      />

      <div className="space-y-8">
        <section>
          <h2 className="mb-3 font-syne text-[17px] font-bold text-[var(--a-ink)]">Custom roles</h2>
          {customs.length ? (
            <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{customs.map(card)}</ul>
          ) : (
            <p className="rounded-[var(--a-radius-card)] border border-dashed border-[var(--a-border-strong)] p-5 font-dm text-[13.5px] text-[var(--a-ink-3)]">
              No custom roles yet. Duplicate a preset below or create one from scratch.
            </p>
          )}
        </section>
        <section>
          <h2 className="mb-3 font-syne text-[17px] font-bold text-[var(--a-ink)]">Preset roles</h2>
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{presets.map(card)}</ul>
        </section>
        <Card title="Owner only" icon={Lock}>
          <p className="mb-3 font-dm text-[13px] text-[var(--a-ink-3)]">These stay with the owner (Super Admin) and cannot be given to anyone, not even an Admin.</p>
          <ul className="grid gap-2 sm:grid-cols-2">
            {OWNER_ONLY.map((o) => (
              <li key={o.key} className="flex items-center gap-2 font-dm text-[13.5px] text-[var(--a-ink-2)]">
                <ShieldCheck size={15} className="text-[var(--a-orange-text)]" aria-hidden /> {o.label}
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Drawer
        open={!!editing}
        onClose={() => setEditing(null)}
        width={680}
        title={editing?.id ? `Edit role` : "New role"}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button variant="primary" loading={busy} disabled={!editing || editing.name.trim().length < 2} onClick={save}>
              {editing?.id ? "Save role" : "Create role"}
            </Button>
          </div>
        }
      >
        {editing ? (
          <div className="space-y-5">
            <div>
              <label htmlFor="role-name" className="mb-1 block font-dm text-[11px] font-semibold uppercase tracking-[.08em] text-[var(--a-ink-3)]">
                Name
              </label>
              <input
                id="role-name"
                value={editing.name}
                maxLength={60}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                className="h-10 w-full rounded-[var(--a-radius-control)] border border-[var(--a-border-strong)] px-3 font-dm text-[14px] text-[var(--a-ink)] focus:border-[var(--a-blue)] focus:outline-none focus:ring-2 focus:ring-[var(--a-blue)]/20"
              />
            </div>
            <div>
              <label htmlFor="role-desc" className="mb-1 block font-dm text-[11px] font-semibold uppercase tracking-[.08em] text-[var(--a-ink-3)]">
                Description
              </label>
              <textarea
                id="role-desc"
                rows={2}
                maxLength={300}
                value={editing.description}
                onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                className="w-full rounded-[var(--a-radius-control)] border border-[var(--a-border-strong)] px-3 py-2 font-dm text-[13.5px] text-[var(--a-ink)] focus:border-[var(--a-blue)] focus:outline-none focus:ring-2 focus:ring-[var(--a-blue)]/20"
              />
            </div>
            {editing.id ? (
              <Notice tone="info">
                {roles.find((r) => r.id === editing.id)?.members.length ?? 0} member(s) have this role. Saving applies the change to them on their next click.
              </Notice>
            ) : null}
            <AccessGrid idPrefix="role" value={editing.access} onChange={(access) => setEditing({ ...editing, access })} allowed={allowed} />
          </div>
        ) : null}
      </Drawer>

      <Drawer open={!!viewing} onClose={() => setViewing(null)} width={640} title={viewing ? viewing.name : ""}>
        {viewing ? (
          <div className="space-y-5">
            <p className="font-dm text-[13.5px] text-[var(--a-ink-2)]">{viewing.description}</p>
            <section>
              <h3 className="mb-2 font-syne text-[16px] font-bold text-[var(--a-ink)]">Who has this role</h3>
              {viewing.members.length ? (
                <ul className="space-y-2">
                  {viewing.members.map((m) => (
                    <li key={m.id}>
                      <Link href={`/admin_pro/team?member=${m.id}`} className="flex items-center gap-2 font-dm text-[13.5px] text-[var(--a-ink)] hover:underline">
                        <Avatar name={m.name} seed={m.email} size={24} /> {m.name} <span className="text-[var(--a-ink-3)]">{m.email}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="font-dm text-[13px] text-[var(--a-ink-3)]">Nobody yet.</p>
              )}
            </section>
            {viewing.admin ? (
              <Notice tone="info">Admins can open everything except the owner-only items. Only the owner can make someone an Admin.</Notice>
            ) : (
              <AccessGrid idPrefix="view" value={viewing.access} />
            )}
          </div>
        ) : null}
      </Drawer>

      <Drawer
        open={!!removing}
        onClose={() => setRemoving(null)}
        title={removing ? `Delete "${removing.name}"` : ""}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setRemoving(null)}>
              Cancel
            </Button>
            <Button variant="danger" loading={busy} disabled={!reassign} onClick={confirmRemove}>
              Move members and delete
            </Button>
          </div>
        }
      >
        {removing ? (
          <div className="space-y-4">
            <p className="font-dm text-[13.5px] text-[var(--a-ink-2)]">
              {removing.members.length} member{removing.members.length === 1 ? " has" : "s have"} this role. Choose the role they move to. Their own overrides are kept.
            </p>
            <Select value={reassign} onChange={(e) => setReassign(e.target.value)} label="Move members to" className="w-full">
              {targets
                .filter((t) => t.id !== removing.id)
                .map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
            </Select>
          </div>
        ) : null}
      </Drawer>
      <p className="mt-6 font-dm text-[12px] text-[var(--a-ink-3)]">
        {FEATURES.length} features and {CAPABILITIES.length} sensitive capabilities. Changes are recorded in the audit log.
      </p>
    </div>
  );
}
