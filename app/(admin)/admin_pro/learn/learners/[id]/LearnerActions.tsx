"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type ElementType } from "react";
import {
  BadgeCheck, Ban, CalendarPlus, Check, ChevronDown, Copy, Download, Gift, KeyRound, LogOut, Mail, MailPlus,
  MessageSquare, PauseCircle, PlayCircle, ShieldOff, Trash2, Undo2, UserCog,
} from "lucide-react";
import { Button, Drawer, Segmented, useToast } from "@/components/admin/ui";
import { cn } from "@/lib/utils";
import { Dialog } from "../_components/Dialog";
import { TextArea, TextField, inputCls, postJson } from "../_components/fields";
import { MessageComposer, type ComposerContext } from "../../../communications/_components/MessageComposer";

// Admin actions on one learner (owner or admin). Every action confirms in a
// dialog, most take a reason, and each one is audited server-side
// (app/api/admin/learn/learners/[id]/actions).

export interface LearnerSummary {
  id: string;
  name: string;
  email: string;
  locale: string;
  status: "active" | "suspended" | "blocked" | "deleted";
  emailVerified: boolean;
  comped: boolean;
  compTimed: boolean;
  paidStripe: boolean;
  isOwnerAccount: boolean;
}

export type ActionKind =
  | "suspend" | "unsuspend" | "block" | "unblock" | "resetLink" | "tempPassword" | "markVerified" | "changeEmail"
  | "signOutEverywhere" | "grantComp" | "revokeComp" | "extendAccess" | "delete";

function useAction(learnerId: string) {
  const router = useRouter();
  const toast = useToast();
  return useCallback(
    async (body: Record<string, unknown>) => {
      const r = await postJson<{ message: string; secret?: string }>(`/api/admin/learn/learners/${learnerId}/actions`, body);
      toast.success(r.message);
      router.refresh();
      return r;
    },
    [learnerId, router, toast],
  );
}

// ── The dialog for each action ─────────────────────────────────────────────

const META: Record<ActionKind, { title: string; icon: ElementType; tone: "default" | "warn" | "danger"; confirm: string; variant: "primary" | "danger" }> = {
  suspend: { title: "Suspend account", icon: PauseCircle, tone: "warn", confirm: "Suspend", variant: "danger" },
  unsuspend: { title: "Lift the suspension", icon: PlayCircle, tone: "default", confirm: "Lift suspension", variant: "primary" },
  block: { title: "Block account", icon: Ban, tone: "danger", confirm: "Block learner", variant: "danger" },
  unblock: { title: "Unblock account", icon: Undo2, tone: "default", confirm: "Unblock", variant: "primary" },
  resetLink: { title: "Send a password reset link", icon: Mail, tone: "default", confirm: "Send link", variant: "primary" },
  tempPassword: { title: "Set a temporary password", icon: KeyRound, tone: "warn", confirm: "Set temporary password", variant: "primary" },
  markVerified: { title: "Mark email as verified", icon: BadgeCheck, tone: "default", confirm: "Mark verified", variant: "primary" },
  changeEmail: { title: "Change email", icon: MailPlus, tone: "warn", confirm: "Change email", variant: "primary" },
  signOutEverywhere: { title: "Sign out everywhere", icon: LogOut, tone: "warn", confirm: "Sign out all devices", variant: "primary" },
  grantComp: { title: "Grant free access", icon: Gift, tone: "default", confirm: "Grant access", variant: "primary" },
  revokeComp: { title: "Revoke free access", icon: ShieldOff, tone: "danger", confirm: "Revoke access", variant: "danger" },
  extendAccess: { title: "Extend access", icon: CalendarPlus, tone: "default", confirm: "Extend access", variant: "primary" },
  delete: { title: "Delete account", icon: Trash2, tone: "danger", confirm: "Delete permanently", variant: "danger" },
};

const isoDay = (d: Date) => d.toISOString().slice(0, 10);

export function ActionDialog({ kind, learner, onClose }: { kind: ActionKind | null; learner: LearnerSummary; onClose: () => void }) {
  const run = useAction(learner.id);
  const [reason, setReason] = useState("");
  const [length, setLength] = useState("7");
  const [until, setUntil] = useState(isoDay(new Date(Date.now() + 14 * 86_400_000)));
  const [days, setDays] = useState("30");
  const [email, setEmail] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [blockEmail, setBlockEmail] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setReason("");
    setError(null);
    setSecret(null);
    setCopied(false);
    setEmail("");
    setConfirmEmail("");
    setBlockEmail(false);
    setLength("7");
  }, [kind]);

  if (!kind) return null;
  const m = META[kind];

  async function submit() {
    if (!kind) return;
    setBusy(true);
    setError(null);
    try {
      const body: Record<string, unknown> = { action: kind };
      if (["suspend", "unsuspend", "block", "unblock", "grantComp", "revokeComp", "extendAccess", "delete"].includes(kind)) body.reason = reason;
      if (kind === "suspend") {
        body.until =
          length === "open" ? null
          : length === "date" ? new Date(`${until}T23:59:59Z`).toISOString()
          : new Date(Date.now() + Number(length) * 86_400_000).toISOString();
      }
      if (kind === "extendAccess") body.days = Number(days);
      if (kind === "changeEmail") body.email = email;
      if (kind === "delete") Object.assign(body, { confirmEmail, blockEmail });
      const r = await run(body);
      if (kind === "tempPassword" && r.secret) {
        setSecret(r.secret);
        return;
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  const needsReason = kind === "suspend" || kind === "block";
  const canSubmit =
    !busy &&
    (!needsReason || reason.trim().length > 0) &&
    (kind !== "changeEmail" || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) &&
    (kind !== "delete" || confirmEmail.trim().toLowerCase() === learner.email.toLowerCase()) &&
    (kind !== "extendAccess" || (Number(days) >= 1 && Number(days) <= 730));

  if (secret) {
    return (
      <Dialog
        open
        onClose={onClose}
        title="Temporary password set"
        icon={KeyRound}
        tone="warn"
        description="Give it to the learner privately (not by public chat). It is shown only once and is not stored in readable form."
        footer={<Button variant="primary" onClick={onClose}>Done</Button>}
      >
        <div className="flex items-center gap-2 rounded-[var(--a-radius-card)] border border-[var(--a-border)] bg-[var(--a-surface-2)] p-3">
          <code data-testid="temp-password" className="min-w-0 flex-1 select-all break-all font-mono text-[17px] font-semibold tracking-wide text-[var(--a-ink)]">
            {secret}
          </code>
          <Button
            size="sm"
            variant="secondary"
            icon={copied ? Check : Copy}
            onClick={() => {
              navigator.clipboard?.writeText(secret).then(() => setCopied(true)).catch(() => {});
            }}
          >
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
        <ul className="mt-4 space-y-1.5 font-dm text-[13px] text-[var(--a-ink-2)]">
          <li>• Every device {learner.name} was signed in on has been signed out.</li>
          <li>• At the next sign-in they must choose a new password.</li>
          <li>• Any reset link sent earlier no longer works.</li>
        </ul>
      </Dialog>
    );
  }

  const description: Record<ActionKind, React.ReactNode> = {
    suspend: <>{learner.name} is signed out at once and cannot sign in until the suspension ends. They see your reason on the sign-in screen.</>,
    unsuspend: <>{learner.name} can sign in again straight away.</>,
    block: <>A permanent ban. {learner.name} is signed out, cannot sign in with a password or Google, and cannot create a new account with <strong>{learner.email}</strong>.</>,
    unblock: <>{learner.name} can sign in again and the email is no longer refused at sign-up.</>,
    resetLink: <>Sends the usual ARFA reset email to <strong>{learner.email}</strong> in their language. The link works for 1 hour.</>,
    tempPassword: <>For a learner who cannot use the reset email. Signs them out everywhere; they must choose a new password at the next sign-in.</>,
    markVerified: <>Marks <strong>{learner.email}</strong> as verified, for example after confirming it with the learner by other means.</>,
    changeEmail: <>The learner signs in with the new address from now on. Both the old and the new address get a notice. The new address is marked unverified.</>,
    signOutEverywhere: <>Ends every session on every device. Use it when an account may be shared or a device was lost.</>,
    grantComp: <>Free access to every track, lab and exam, with no end date. Same as Admin, Test access. Nothing is charged.</>,
    revokeComp: <>Ends the free access now. Purchased tracks and team seats are not affected.</>,
    extendAccess: <>Adds free access for a number of days (on top of any current free period). Paid Stripe subscriptions are extended in Stripe instead.</>,
    delete: (
      <>
        Anonymises the account: name, email, sign-in history, notes, reflections, drafts, Tutor conversations and messages are removed. Payments,
        subscription records and certificate verification records are kept without personal data. This cannot be undone.
      </>
    ),
  };

  return (
    <Dialog
      open
      onClose={onClose}
      title={m.title}
      icon={m.icon}
      tone={m.tone}
      description={description[kind]}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button variant={m.variant} onClick={submit} loading={busy} disabled={!canSubmit}>{m.confirm}</Button>
        </>
      }
    >
      <div className="space-y-4">
        {kind === "suspend" ? (
          <div>
            <p className="mb-1.5 font-dm text-[12.5px] font-semibold text-[var(--a-ink-2)]">Length</p>
            <Segmented
              ariaLabel="Suspension length"
              value={length}
              onChange={setLength}
              options={[
                { value: "1", label: "1 day" },
                { value: "7", label: "7 days" },
                { value: "30", label: "30 days" },
                { value: "date", label: "Until date" },
                { value: "open", label: "Until lifted" },
              ]}
            />
            {length === "date" ? (
              <div className="mt-3 max-w-[220px]">
                <TextField label="Last day (UTC)" type="date" value={until} min={isoDay(new Date(Date.now() + 86_400_000))} onChange={(e) => setUntil(e.target.value)} />
              </div>
            ) : null}
          </div>
        ) : null}

        {kind === "extendAccess" ? (
          <div>
            <p className="mb-1.5 font-dm text-[12.5px] font-semibold text-[var(--a-ink-2)]">Days to add</p>
            <div className="flex flex-wrap items-center gap-2">
              <Segmented ariaLabel="Days" value={["7", "30", "90"].includes(days) ? days : ""} onChange={setDays} options={[{ value: "7", label: "7" }, { value: "30", label: "30" }, { value: "90", label: "90" }]} />
              <input
                type="number"
                min={1}
                max={730}
                value={days}
                onChange={(e) => setDays(e.target.value)}
                aria-label="Number of days"
                className={cn(inputCls, "h-9 w-24 tabular-nums")}
              />
              <span className="font-dm text-[13px] text-[var(--a-ink-3)]">days</span>
            </div>
          </div>
        ) : null}

        {kind === "changeEmail" ? (
          <TextField label="New email" type="email" autoComplete="off" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" hint={`Current: ${learner.email}`} />
        ) : null}

        {kind === "delete" ? (
          <>
            <TextField
              label={<>Type <span className="font-mono text-[var(--a-danger)]">{learner.email}</span> to confirm</>}
              value={confirmEmail}
              autoComplete="off"
              onChange={(e) => setConfirmEmail(e.target.value)}
            />
            <label className="flex items-start gap-2.5 rounded-[var(--a-radius-control)] border border-[var(--a-border)] p-3 font-dm text-[13px] text-[var(--a-ink-2)]">
              <input type="checkbox" checked={blockEmail} onChange={(e) => setBlockEmail(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[var(--a-danger)]" />
              <span>
                <strong className="text-[var(--a-ink)]">Also block this email</strong>
                <span className="block text-[var(--a-ink-3)]">Refuses a new sign-up with the same address. Leave off for a normal deletion request.</span>
              </span>
            </label>
          </>
        ) : null}

        {["suspend", "unsuspend", "block", "unblock", "grantComp", "revokeComp", "extendAccess", "delete"].includes(kind) ? (
          <TextArea
            label={kind === "suspend" || kind === "block" ? "Reason (shown to the learner)" : "Reason (internal)"}
            optional={!needsReason}
            value={reason}
            maxLength={1000}
            onChange={(e) => setReason(e.target.value)}
            placeholder={kind === "suspend" ? "For example: Several reports of exam answers shared in the community." : kind === "block" ? "For example: Payment fraud confirmed by Stripe." : "Recorded in the audit log"}
            hint={kind === "suspend" || kind === "block" ? "Write it for the learner: clear and polite. It is also kept in the audit log." : "Kept in the audit log."}
          />
        ) : null}

        {error ? (
          <p role="alert" className="rounded-[var(--a-radius-control)] bg-[var(--a-danger-bg)] px-3 py-2 font-dm text-[13px] font-medium text-[var(--a-danger)]">{error}</p>
        ) : null}
      </div>
    </Dialog>
  );
}

// ── Actions menu ───────────────────────────────────────────────────────────

type Item = { kind: ActionKind | "export"; label: string; icon: ElementType; danger?: boolean; hint?: string };

function menuGroups(l: LearnerSummary): Array<{ label: string; items: Item[] }> {
  const groups: Array<{ label: string; items: Item[] }> = [];
  const account: Item[] = [];
  if (l.status === "suspended") account.push({ kind: "unsuspend", label: "Lift suspension", icon: PlayCircle });
  else if (l.status === "active" && !l.isOwnerAccount) account.push({ kind: "suspend", label: "Suspend", icon: PauseCircle });
  account.push({ kind: "signOutEverywhere", label: "Sign out everywhere", icon: LogOut });
  groups.push({ label: "Account", items: account });
  if (l.status !== "deleted") {
    groups.push({
      label: "Password and email",
      items: [
        { kind: "resetLink", label: "Send password reset link", icon: Mail },
        ...(!l.isOwnerAccount ? [{ kind: "tempPassword" as const, label: "Set a temporary password", icon: KeyRound }] : []),
        ...(!l.emailVerified ? [{ kind: "markVerified" as const, label: "Mark email verified", icon: BadgeCheck }] : []),
        ...(!l.isOwnerAccount ? [{ kind: "changeEmail" as const, label: "Change email", icon: MailPlus }] : []),
      ],
    });
    groups.push({
      label: "Access",
      items: [
        ...(l.comped && !l.compTimed ? [{ kind: "revokeComp" as const, label: "Revoke free access", icon: ShieldOff, danger: true }] : []),
        ...(!l.comped && !l.paidStripe ? [{ kind: "grantComp" as const, label: "Grant free access", icon: Gift }] : []),
        ...(l.comped && l.compTimed ? [{ kind: "revokeComp" as const, label: "End free access now", icon: ShieldOff, danger: true }] : []),
        ...(!l.paidStripe && !(l.comped && !l.compTimed) ? [{ kind: "extendAccess" as const, label: "Extend access by days", icon: CalendarPlus }] : []),
      ],
    });
  }
  groups.push({ label: "Data", items: [{ kind: "export", label: "Export data (JSON)", icon: Download }] });
  return groups.filter((g) => g.items.length > 0);
}

export function LearnerHeaderActions({ learner, composer }: { learner: LearnerSummary; composer: ComposerContext }) {
  const [open, setOpen] = useState(false);
  const [dialog, setDialog] = useState<ActionKind | null>(null);
  const [compose, setCompose] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const groups = menuGroups(learner);

  useEffect(() => {
    if (!open) return;
    const first = menuRef.current?.querySelector<HTMLElement>("[role=menuitem]");
    first?.focus();
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  function onMenuKey(e: React.KeyboardEvent) {
    const items = Array.from(menuRef.current?.querySelectorAll<HTMLElement>("[role=menuitem]") ?? []);
    const i = items.indexOf(document.activeElement as HTMLElement);
    if (e.key === "ArrowDown") {
      e.preventDefault();
      items[(i + 1) % items.length]?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      items[(i - 1 + items.length) % items.length]?.focus();
    } else if (e.key === "Escape") {
      setOpen(false);
      wrapRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
    }
  }

  function choose(kind: Item["kind"]) {
    setOpen(false);
    if (kind === "export") {
      window.location.href = `/api/admin/learn/learners/${learner.id}/export`;
      return;
    }
    setDialog(kind);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {learner.status !== "deleted" ? (
        <Button variant="primary" icon={MessageSquare} onClick={() => setCompose(true)}>
          Message
        </Button>
      ) : null}
      <div className="relative" ref={wrapRef}>
        <Button
          variant="secondary"
          icon={UserCog}
          iconRight={ChevronDown}
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          Actions
        </Button>
        {open ? (
          <div
            ref={menuRef}
            role="menu"
            aria-label="Learner actions"
            onKeyDown={onMenuKey}
            className="a-anim-pop absolute right-0 top-full z-50 mt-1.5 w-[268px] overflow-hidden rounded-[12px] border border-[var(--a-border)] bg-[var(--a-surface)] py-1.5 shadow-[var(--a-shadow-pop)]"
          >
            {groups.map((g, gi) => (
              <div key={g.label} className={cn(gi > 0 && "mt-1 border-t border-[var(--a-border)] pt-1")}>
                <p className="a-micro px-3 pb-1 pt-1.5">{g.label}</p>
                {g.items.map((it) => (
                  <button
                    key={it.kind + it.label}
                    type="button"
                    role="menuitem"
                    tabIndex={-1}
                    onClick={() => choose(it.kind)}
                    className={cn(
                      "flex w-full items-center gap-2.5 px-3 py-2 text-left font-dm text-[13.5px] outline-none transition-colors",
                      "hover:bg-[var(--a-surface-2)] focus-visible:bg-[var(--a-surface-2)]",
                      it.danger ? "text-[var(--a-danger)]" : "text-[var(--a-ink)]",
                    )}
                  >
                    <it.icon size={15} aria-hidden className={it.danger ? "" : "text-[var(--a-ink-3)]"} />
                    {it.label}
                  </button>
                ))}
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <ActionDialog kind={dialog} learner={learner} onClose={() => setDialog(null)} />

      <Drawer open={compose} onClose={() => setCompose(false)} title={`Message ${learner.name}`} width={720}>
        <MessageComposer
          context={composer}
          initial={{ audience: { type: "one", studentId: learner.id, label: `${learner.name} <${learner.email}>` } }}
          lockAudience
          compact
          onSent={() => setCompose(false)}
        />
      </Drawer>
    </div>
  );
}

/** One button that opens one action's dialog (Danger zone, Purchases tab). */
export function ActionButton({
  kind,
  learner,
  label,
  variant = "secondary",
  icon,
  size = "md",
}: {
  kind: ActionKind;
  learner: LearnerSummary;
  label: string;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  icon?: ElementType;
  size?: "sm" | "md";
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant={variant} size={size} icon={icon ?? META[kind].icon} onClick={() => setOpen(true)}>
        {label}
      </Button>
      <ActionDialog kind={open ? kind : null} learner={learner} onClose={() => setOpen(false)} />
    </>
  );
}

export function CertificateRevoke({ id, revoked }: { id: string; revoked: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);
  async function toggle() {
    setBusy(true);
    try {
      await postJson(`/api/admin/learn/certificate/${id}`, { revoked: !revoked }, "PATCH");
      toast.success(revoked ? "Certificate restored" : "Certificate revoked");
      setConfirm(false);
      router.refresh();
    } catch (err) {
      toast.error("Could not update the certificate", err instanceof Error ? err.message : undefined);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Button size="sm" variant={revoked ? "secondary" : "ghost"} onClick={() => (revoked ? toggle() : setConfirm(true))} loading={busy && revoked}>
        {revoked ? "Restore" : "Revoke"}
      </Button>
      <Dialog
        open={confirm}
        onClose={() => setConfirm(false)}
        title="Revoke this certificate?"
        icon={ShieldOff}
        tone="danger"
        description="Its public verify page will show it as revoked. You can restore it later."
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirm(false)}>Cancel</Button>
            <Button variant="danger" loading={busy} onClick={toggle}>Revoke certificate</Button>
          </>
        }
      />
    </>
  );
}
