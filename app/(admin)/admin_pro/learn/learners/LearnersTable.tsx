"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogOut, MessageSquare, PauseCircle, PlayCircle, Tag, TagsIcon, Trash2, X } from "lucide-react";
import { Badge, Button, DataTable, Segmented, type BadgeTone, type Column } from "@/components/admin/ui";
import { useToast } from "@/components/admin/ui";
import { Dialog } from "./_components/Dialog";
import { TextArea, TextField, postJson } from "./_components/fields";
import { ago, avatarHue, day, initials } from "./_components/format";

// The Learners table with row selection and bulk actions (owner or admin):
// message, suspend, lift suspension, sign out everywhere, add or remove a tag.

export interface Row {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  locale: string;
  emailVerified: boolean;
  planLabels: string[];
  planStatus: string;
  tracksStarted: string[];
  progress: number;
  placement: Array<{ track: string; done: boolean; summary: string }>;
  lastLoginAt: string | null;
  logins30: number;
  xp: number;
  certificates: number;
  accountStatus: string;
  suspendedUntil: string | null;
  tags: string[];
  /** AI-Empowered Youth: age band and parent consent (learners who gave a birth year). */
  youth?: { band: "explorer" | "builder" | "adult"; consent: string } | null;
}

const BAND_LABEL: Record<string, string> = { explorer: "Explorer 10-13", builder: "Builder 14-17", adult: "Adult" };
const CONSENT: Record<string, { label: string; tone: BadgeTone }> = {
  granted: { label: "Parent confirmed", tone: "success" },
  pending: { label: "Waiting for parent", tone: "warn" },
  revoked: { label: "Parent revoked", tone: "danger" },
  not_needed: { label: "Parent informed", tone: "info" },
  none: { label: "No parent", tone: "neutral" },
};

const PLAN_TONE: Record<string, BadgeTone> = { active: "success", trial: "info", lifetime: "success", "past due": "warn", cancelled: "danger", none: "neutral" };
const LANG: Record<string, string> = { en: "EN", fr: "FR", sw: "SW" };

type Bulk = null | "suspend" | "addTag" | "removeTag" | "unsuspend" | "signOutEverywhere" | "delete";

export function LearnersTable({ rows, headers, canManage }: { rows: Row[]; headers: Record<string, React.ReactNode>; canManage: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [bulk, setBulk] = useState<Bulk>(null);
  const [reason, setReason] = useState("");
  const [length, setLength] = useState("7");
  const [tag, setTag] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [busy, setBusy] = useState(false);

  const ids = [...sel];

  async function run() {
    if (!bulk) return;
    setBusy(true);
    try {
      const body: Record<string, unknown> = { action: bulk, ids };
      if (bulk === "suspend") {
        body.reason = reason;
        body.until = length === "open" ? null : new Date(Date.now() + Number(length) * 86_400_000).toISOString();
      }
      if (bulk === "addTag" || bulk === "removeTag") body.tag = tag;
      if (bulk === "delete") {
        body.confirm = confirmText;
        body.reason = reason;
      }
      const r = await postJson<{ done: number; failed: Array<{ id: string; error: string }> }>("/api/admin/learn/learners/bulk", body);
      if (r.failed.length) toast.error(`${r.done} done, ${r.failed.length} not changed`, r.failed[0]?.error);
      else toast.success(`${r.done} learner${r.done === 1 ? "" : "s"} ${bulk === "delete" ? "deleted" : "updated"}`);
      setBulk(null);
      setReason("");
      setTag("");
      setConfirmText("");
      setSel(new Set());
      router.refresh();
    } catch (err) {
      toast.error("Bulk action failed", err instanceof Error ? err.message : undefined);
    } finally {
      setBusy(false);
    }
  }

  const columns: Column<Row>[] = [
    {
      key: "name",
      header: headers.name,
      primary: true,
      render: (r) => (
        <span className="flex min-w-[220px] max-w-[300px] items-center gap-3">
          <span
            aria-hidden
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] font-dm text-[11.5px] font-bold text-white"
            style={{ background: `hsl(${avatarHue(r.id)} 45% 40%)` }}
          >
            {initials(r.name)}
          </span>
          <span className="min-w-0">
            <Link href={`/admin_pro/learn/learners/${r.id}`} className="block truncate font-semibold text-[var(--a-ink)] hover:text-[var(--a-blue)] hover:underline">
              {r.name}
            </Link>
            <span className="block truncate text-[12px] font-normal text-[var(--a-ink-3)]">
              {r.email}
              {!r.emailVerified ? <span title="Email not verified"> · unverified</span> : null}
            </span>
          </span>
        </span>
      ),
    },
    {
      key: "account",
      header: "Account",
      render: (r) => (
        <span className="flex flex-wrap items-center gap-1">
          {r.accountStatus === "suspended" ? (
            <Badge tone="warn" dot title={r.suspendedUntil ? `Until ${day(r.suspendedUntil)}` : "Until lifted"}>Suspended</Badge>
          ) : r.accountStatus === "blocked" ? (
            <Badge tone="danger" dot>Blocked</Badge>
          ) : r.accountStatus === "deleted" ? (
            <Badge tone="neutral" dot>Deleted</Badge>
          ) : (
            <Badge tone="success" dot>Active</Badge>
          )}
          {r.tags.map((t) => (
            <Badge key={t} tone="orange">#{t}</Badge>
          ))}
          {r.youth && <Badge tone="info" title="Age band (from the birth year)">{BAND_LABEL[r.youth.band] ?? r.youth.band}</Badge>}
          {r.youth && r.youth.band !== "adult" && (
            <Badge tone={CONSENT[r.youth.consent]?.tone ?? "neutral"}>{CONSENT[r.youth.consent]?.label ?? r.youth.consent}</Badge>
          )}
        </span>
      ),
    },
    { key: "created", header: headers.created, render: (r) => <span className="whitespace-nowrap">{day(r.createdAt)}</span> },
    { key: "lang", header: "Lang", render: (r) => LANG[r.locale] ?? r.locale, hideOnMobile: true },
    {
      key: "plan",
      header: "Plan",
      render: (r) => (
        <span className="flex flex-col items-start gap-1">
          <Badge tone={PLAN_TONE[r.planStatus] ?? "neutral"}>{r.planStatus === "none" ? "None" : r.planStatus.replace(/^\w/, (c) => c.toUpperCase())}</Badge>
          <span className="max-w-[200px] truncate text-[12px] text-[var(--a-ink-3)]" title={r.planLabels.join(", ")}>{r.planLabels.join(" · ")}</span>
        </span>
      ),
    },
    {
      key: "tracks",
      header: "Tracks started",
      hideOnMobile: true,
      render: (r) => (r.tracksStarted.length ? <span className="line-clamp-2 max-w-[220px]">{r.tracksStarted.join(", ")}</span> : <span className="text-[var(--a-ink-3)]">None</span>),
    },
    {
      key: "progress",
      header: headers.progress,
      align: "right",
      render: (r) =>
        r.tracksStarted.length ? (
          <span className="inline-flex items-center gap-2">
            <span className="hidden h-1.5 w-14 overflow-hidden rounded-full bg-[var(--a-surface-2)] lg:inline-block" aria-hidden>
              <span className="block h-full rounded-full bg-[var(--a-success)]" style={{ width: `${r.progress}%` }} />
            </span>
            <span className="font-semibold tabular-nums text-[var(--a-ink)]">{r.progress}%</span>
          </span>
        ) : (
          <span className="text-[var(--a-ink-3)]">None</span>
        ),
    },
    {
      key: "placement",
      header: "Placement check",
      hideOnMobile: true,
      render: (r) =>
        r.placement.length === 0 ? (
          <span className="text-[var(--a-ink-3)]">None</span>
        ) : (
          <span className="block text-[12px]">
            {r.placement.map((p) => (
              <span key={p.track} className="block">
                <span className={p.done ? "font-semibold text-[var(--a-success)]" : "text-[var(--a-ink-3)]"}>{p.done ? "Yes" : "No"}</span> · {p.track}
                {p.summary ? <span className="text-[var(--a-ink-3)]"> ({p.summary})</span> : null}
              </span>
            ))}
          </span>
        ),
    },
    { key: "lastLogin", header: headers.lastLogin, render: (r) => <span className="whitespace-nowrap" title={r.lastLoginAt ?? ""}>{ago(r.lastLoginAt)}</span> },
    { key: "logins", header: headers.logins, align: "right", render: (r) => <span className="tabular-nums">{r.logins30}</span> },
    { key: "xp", header: headers.xp, align: "right", render: (r) => <span className="tabular-nums">{r.xp.toLocaleString("en")}</span> },
    { key: "certs", header: headers.certs, align: "right", render: (r) => <span className="tabular-nums">{r.certificates}</span> },
  ];

  return (
    <div className="relative">
      <DataTable
        caption="Learners"
        columns={columns}
        rows={rows}
        rowKey={(r) => r.id}
        selected={sel}
        onSelectionChange={canManage ? setSel : undefined}
        className="[&_table]:min-w-[1320px]"
      />

      {canManage && sel.size > 0 ? (
        <div
          role="region"
          aria-label="Bulk actions"
          className="a-anim-pop sticky bottom-4 z-30 mx-auto mt-4 flex w-fit max-w-full flex-wrap items-center gap-2 rounded-[14px] border border-[var(--a-navy)] bg-[var(--a-navy-deep)] px-3 py-2 text-white shadow-[var(--a-shadow-pop)]"
        >
          <span className="px-1 font-dm text-[13px] font-semibold tabular-nums">{sel.size} selected</span>
          <span className="mx-1 h-5 w-px bg-white/20" aria-hidden />
          <Link
            href={`/admin_pro/communications/new?ids=${ids.join(",")}`}
            className="inline-flex h-8 items-center gap-1.5 rounded-[10px] bg-[var(--a-orange-text)] px-3 font-dm text-[13px] font-semibold text-white hover:bg-[#9c4408]"
          >
            <MessageSquare size={14} aria-hidden /> Message
          </Link>
          {(
            [
              ["suspend", "Suspend", PauseCircle],
              ["unsuspend", "Lift suspension", PlayCircle],
              ["addTag", "Add tag", Tag],
              ["removeTag", "Remove tag", TagsIcon],
              ["signOutEverywhere", "Sign out", LogOut],
            ] as const
          ).map(([k, label, Icon]) => (
            <button
              key={k}
              type="button"
              onClick={() => setBulk(k)}
              className="inline-flex h-8 items-center gap-1.5 rounded-[10px] px-2.5 font-dm text-[13px] font-semibold text-white/90 hover:bg-white/10 hover:text-white"
            >
              <Icon size={14} aria-hidden /> {label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setBulk("delete")}
            className="inline-flex h-8 items-center gap-1.5 rounded-[10px] px-2.5 font-dm text-[13px] font-semibold text-[#FCA5A5] hover:bg-[#B91C1C]/30 hover:text-white"
          >
            <Trash2 size={14} aria-hidden /> Delete
          </button>
          <button type="button" aria-label="Clear selection" onClick={() => setSel(new Set())} className="ml-1 rounded-[8px] p-1.5 text-white/70 hover:bg-white/10 hover:text-white">
            <X size={15} aria-hidden />
          </button>
        </div>
      ) : null}

      <Dialog
        open={!!bulk}
        onClose={() => setBulk(null)}
        title={
          bulk === "suspend" ? `Suspend ${sel.size} learner${sel.size === 1 ? "" : "s"}` :
          bulk === "unsuspend" ? `Lift suspension for ${sel.size}` :
          bulk === "addTag" ? `Tag ${sel.size} learner${sel.size === 1 ? "" : "s"}` :
          bulk === "removeTag" ? `Remove a tag from ${sel.size}` :
          bulk === "delete" ? `Delete ${sel.size} learner account${sel.size === 1 ? "" : "s"}` :
          `Sign out ${sel.size} learner${sel.size === 1 ? "" : "s"} everywhere`
        }
        icon={bulk === "delete" ? Trash2 : bulk === "suspend" ? PauseCircle : bulk === "unsuspend" ? PlayCircle : bulk === "signOutEverywhere" ? LogOut : Tag}
        tone={bulk === "delete" ? "danger" : bulk === "suspend" ? "warn" : "default"}
        description={
          bulk === "delete" ? "Each account is deleted and anonymised: name, email and personal content are removed; payments and certificate records are kept without personal data. The email address is freed, so the person can sign up again as a new learner. This cannot be undone." :
          bulk === "suspend" ? "They are signed out at once and see your reason when they try to sign in. Each one is recorded in the audit log." :
          bulk === "signOutEverywhere" ? "Ends every session on every device for the selected learners." :
          bulk === "unsuspend" ? "Selected learners who are suspended can sign in again." :
          "Tags are private to staff. Use them to filter and to message a group."
        }
        footer={
          <>
            <Button variant="ghost" onClick={() => setBulk(null)}>Cancel</Button>
            <Button
              variant={bulk === "suspend" || bulk === "delete" ? "danger" : "primary"}
              loading={busy}
              disabled={(bulk === "suspend" && !reason.trim()) || ((bulk === "addTag" || bulk === "removeTag") && !tag.trim()) || (bulk === "delete" && confirmText !== "DELETE")}
              onClick={run}
            >
              {bulk === "delete" ? `Delete ${sel.size}` : `Apply to ${sel.size}`}
            </Button>
          </>
        }
      >
        {bulk === "suspend" ? (
          <div className="space-y-4">
            <Segmented
              ariaLabel="Suspension length"
              value={length}
              onChange={setLength}
              options={[{ value: "1", label: "1 day" }, { value: "7", label: "7 days" }, { value: "30", label: "30 days" }, { value: "open", label: "Until lifted" }]}
            />
            <TextArea label="Reason (shown to the learners)" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={1000} />
          </div>
        ) : null}
        {bulk === "delete" ? (
          <div className="space-y-4">
            <TextArea label="Reason (optional, kept in the audit log)" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={1000} />
            <TextField label='Type DELETE to confirm' value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder="DELETE" autoComplete="off" />
          </div>
        ) : null}
        {bulk === "addTag" || bulk === "removeTag" ? (
          <TextField label="Tag" value={tag} onChange={(e) => setTag(e.target.value)} maxLength={32} placeholder="for example: scholarship" />
        ) : null}
      </Dialog>
    </div>
  );
}
