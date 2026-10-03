"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle, CheckCircle2, CheckCheck, Clock, Inbox, Loader2, Pause, Pencil, Play, Plus, Send, ShieldOff, SkipForward, Sparkles, Trash2, Users, Archive, X, ExternalLink,
} from "lucide-react";
import ComplianceNote from "@/components/admin/growth-outreach/ComplianceNote";
import { Badge, Button, EmptyState, Kbd, StatCard, Tabs, useToast } from "@/components/admin/ui";
import { OFFERS } from "@/lib/growth/outreach/offers";
import GrowthTabs from "../_components/GrowthTabs";
import { PageHeader, Progress } from "../_components/ui";
import { api, Modal } from "../leads/ui";

interface Status {
  dailyCap: number; sent24h: number; perRun: number; window: string; inWindow: boolean; fromName: string; fromEmail: string; replyTo: string;
  physicalAddress: string | null; problems: string[]; lastRunAt: string | null; lastResult: { reason?: string; sent?: number } | null; counts: Record<string, number>;
}
interface Step { dayOffset: number; subject: string; body: string; personalise: boolean }
interface Sequence { id: string; name: string; description: string | null; status: string; offerKey: string | null; steps: Step[]; stats: Record<string, number> }
interface QMsg {
  id: string; enrollmentId: string; leadId: string; stepIndex: number; dayOffset: number; toEmail: string | null; subject: string; bodyText: string;
  personalised: boolean; status: string; scheduledFor: string | null; sentAt: string | null; error: string | null; approvedBy: string | null;
  lead: { id: string; companyName: string; contactName: string | null; score: number | null; consentBasis: string; stage: string } | null; sequenceName: string;
}
interface Supp { value: string; reason: string; source: string | null; note: string | null; createdAt: string }

const TABS = [
  { key: "draft", label: "Needs approval" },
  { key: "approved", label: "Scheduled" },
  { key: "sent", label: "Sent" },
  { key: "problems", label: "Failed / skipped" },
  { key: "sequences", label: "Sequences" },
  { key: "suppression", label: "Suppression list" },
] as const;
type Tab = (typeof TABS)[number]["key"];

const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleString("en-CA", { dateStyle: "medium", timeStyle: "short" }) : "");
const isTyping = (t: EventTarget | null) => {
  const el = t as HTMLElement | null;
  return !!el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT" || el.isContentEditable);
};

export default function OutreachClient({ canSend, mergeFields }: { canSend: boolean; mergeFields: Array<[string, string]> }) {
  const toastApi = useToast();
  const [tab, setTab] = useState<Tab>("draft");
  const [status, setStatus] = useState<Status | null>(null);
  const [msgs, setMsgs] = useState<QMsg[]>([]);
  const [seqs, setSeqs] = useState<Sequence[]>([]);
  const [supp, setSupp] = useState<Supp[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [editing, setEditing] = useState<Sequence | "new" | null>(null);

  const flash = useCallback((kind: "ok" | "err", text: string) => {
    if (kind === "ok") toastApi.success(text);
    else toastApi.error(text);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadStatus = useCallback(async () => setStatus(await api<Status>("/api/admin/growth/outreach/status")), []);
  const loadTab = useCallback(async (t: Tab) => {
    setLoading(true);
    try {
      if (t === "sequences") setSeqs((await api<{ sequences: Sequence[] }>("/api/admin/growth/outreach/sequences")).sequences);
      else if (t === "suppression") setSupp((await api<{ entries: Supp[] }>("/api/admin/growth/outreach/suppression")).entries);
      else if (t === "problems") {
        const [f, c] = await Promise.all([
          api<{ messages: QMsg[] }>("/api/admin/growth/outreach/messages?status=failed"),
          api<{ messages: QMsg[] }>("/api/admin/growth/outreach/messages?status=cancelled"),
        ]);
        setMsgs([...f.messages, ...c.messages]);
      } else setMsgs((await api<{ messages: QMsg[] }>(`/api/admin/growth/outreach/messages?status=${t}`)).messages);
    } catch (e) {
      flash("err", e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [flash]);

  useEffect(() => { loadStatus().catch(() => {}); }, [loadStatus]);
  useEffect(() => { loadTab(tab); }, [tab, loadTab]);

  const refresh = async () => { await Promise.all([loadStatus(), loadTab(tab)]); };

  async function approve(body: Record<string, unknown>, label: string, confirmText?: string) {
    if (confirmText && !confirm(confirmText)) return;
    setBusy(label);
    try {
      const r = await api<{ approved: number }>("/api/admin/growth/outreach/approve", { method: "POST", body: JSON.stringify(body) });
      flash("ok", `${r.approved} email(s) approved and scheduled`);
      await refresh();
    } catch (e) {
      flash("err", e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(null);
    }
  }

  async function runNow() {
    setBusy("run");
    try {
      const r = await api<{ ran: boolean; reason?: string; sent: number; cancelled: number; failed: number; waiting: number }>("/api/admin/growth/outreach/run", { method: "POST" });
      flash(r.sent || r.ran ? "ok" : "err", r.reason ? `${r.reason}${r.sent ? ` (sent ${r.sent})` : ""}` : `Sent ${r.sent}, skipped ${r.cancelled}, failed ${r.failed}, waiting ${r.waiting}`);
      await refresh();
    } catch (e) {
      flash("err", e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(null);
    }
  }

  const leadsWaiting = useMemo(() => new Set(msgs.map((m) => m.enrollmentId)).size, [msgs]);

  return (
    <div className="mx-auto max-w-[1400px] space-y-5">
      <PageHeader
        title="Outreach"
        subtitle="Multi-step email sequences. You approve every email; the sender respects the cap, sending hours and suppression list."
        actions={
          <>
            <Button icon={Users} href="/admin_pro/growth/leads">Leads</Button>
            {canSend && <Button variant="primary" icon={Send} loading={busy === "run"} onClick={runNow} data-testid="run-now">Run sender now</Button>}
          </>
        }
      />
      <GrowthTabs />

      {status && status.problems.length > 0 && (
        <div className="space-y-1 rounded-[var(--a-radius-card)] border border-[#f6cccc] bg-[var(--a-danger-bg)] p-4 font-dm text-[13px] text-[var(--a-danger)]" data-testid="config-problems">
          <p className="flex items-center gap-2 font-semibold"><AlertTriangle size={16} /> Sending is blocked</p>
          {status.problems.map((p) => <p key={p}>{p}</p>)}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-[var(--a-radius-card)] border border-[var(--a-border)] bg-[var(--a-surface)] p-4 shadow-[var(--a-shadow-card)]">
          <p className="font-dm text-[11px] font-semibold uppercase tracking-[.08em] text-[var(--a-ink-3)]">Sent, last 24h</p>
          <p className="mt-1 font-dm text-[24px] font-bold tabular-nums text-[var(--a-ink)]">{status?.sent24h ?? "-"}<span className="text-[13px] font-semibold text-[var(--a-ink-3)]"> / {status?.dailyCap ?? "-"} cap</span></p>
          <div className="mt-2"><Progress value={status?.sent24h ?? 0} max={Math.max(1, status?.dailyCap ?? 1)} label="Daily cap used" /></div>
        </div>
        <StatCard label="Needs approval" value={status?.counts.draft ?? 0} tone={status?.counts.draft ? "orange" : "default"} />
        <StatCard label="Scheduled" value={status?.counts.approved ?? 0} />
        <div className="rounded-[var(--a-radius-card)] border border-[var(--a-border)] bg-[var(--a-surface)] p-4 shadow-[var(--a-shadow-card)]">
          <p className="font-dm text-[11px] font-semibold uppercase tracking-[.08em] text-[var(--a-ink-3)]">Sending hours</p>
          <p className="mt-1.5 flex items-center gap-1.5 font-dm text-[14px] font-semibold text-[var(--a-ink)]">
            <span className={`h-2 w-2 rounded-full ${status?.inWindow ? "bg-[var(--a-success)]" : "bg-[var(--a-ink-3)]"}`} /> {status?.window ?? "-"}
          </p>
          <p className="mt-1 font-dm text-[11.5px] text-[var(--a-ink-3)]">Last run {status?.lastRunAt ? fmt(status.lastRunAt) : "never"}{status?.lastResult?.reason ? `: ${status.lastResult.reason}` : ""}</p>
        </div>
      </div>

      {status && (
        <p className="font-dm text-[12px] text-[var(--a-ink-3)]">
          From <b className="text-[var(--a-ink-2)]">{status.fromName} &lt;{status.fromEmail}&gt;</b> · replies go to <b className="text-[var(--a-ink-2)]">{status.replyTo}</b> (mark replies on the lead to stop its sequence) · postal address: <b className="text-[var(--a-ink-2)]">{status.physicalAddress ?? "not set"}</b> · up to {status.perRun} per run, randomly spaced.
        </p>
      )}

      <ComplianceNote defaultOpen={false} />

      <div className="border-b border-[var(--a-border)]">
        <Tabs
          ariaLabel="Outreach sections"
          active={tab}
          onChange={(id) => { if (id !== tab) { setMsgs([]); setTab(id as Tab); } }}
          items={TABS.map((t) => ({ id: t.key, label: t.label, count: t.key === "draft" ? status?.counts.draft ?? null : t.key === "approved" ? status?.counts.approved ?? null : null }))}
        />
      </div>

      {loading && msgs.length === 0 && tab !== "sequences" && tab !== "suppression" ? (
        <div className="flex justify-center py-10"><Loader2 className="animate-spin text-[var(--a-blue)]" /></div>
      ) : tab === "sequences" ? (
        <Sequences seqs={seqs} onEdit={setEditing} onChanged={() => loadTab("sequences")} flash={flash} />
      ) : tab === "suppression" ? (
        <Suppression entries={supp} canSend={canSend} onChanged={() => loadTab("suppression")} flash={flash} />
      ) : (
        <div className="space-y-3">
          {tab === "draft" && msgs.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 rounded-[var(--a-radius-card)] border border-[#f9d6b8] bg-[var(--a-orange-bg)] px-4 py-2.5 font-dm text-[13px]">
              <span className="text-[var(--a-orange-text)]"><b className="tabular-nums">{msgs.length}</b> email(s) for <b className="tabular-nums">{leadsWaiting}</b> lead(s) are waiting. Nothing sends until approved.</span>
              {canSend ? (
                <Button
                  size="sm"
                  variant="primary"
                  icon={CheckCheck}
                  className="ml-auto"
                  loading={busy === "all"}
                  onClick={() => approve({ all: true }, "all", `Approve all ${msgs.length} drafted emails? They will go out over the coming days within the daily cap.`)}
                  data-testid="approve-all"
                >
                  Approve all
                </Button>
              ) : (
                <span className="ml-auto text-[12px] text-[var(--a-orange-text)]">Only an admin can approve.</span>
              )}
            </div>
          )}
          {msgs.length === 0 ? (
            <div className="rounded-[var(--a-radius-card)] border border-[var(--a-border)] bg-[var(--a-surface)]">
              <EmptyState
                icon={tab === "draft" ? CheckCircle2 : Inbox}
                title={tab === "draft" ? "Inbox zero" : "Nothing here"}
                body={tab === "draft" ? <>Nothing waiting. Add leads to a sequence from the <Link href="/admin_pro/growth/leads" className="text-[var(--a-blue)] underline">Leads</Link> board.</> : undefined}
              />
            </div>
          ) : (
            <MessageInbox key={tab} msgs={msgs} tab={tab} canSend={canSend} onApprove={approve} onCounts={loadStatus} setMsgs={setMsgs} flash={flash} />
          )}
        </div>
      )}

      {editing && (
        <SequenceEditor
          seq={editing === "new" ? null : editing}
          mergeFields={mergeFields}
          onClose={() => setEditing(null)}
          onSaved={async () => { setEditing(null); await loadTab("sequences"); }}
          flash={flash}
        />
      )}
    </div>
  );
}

/**
 * Approval inbox: a list on the left, the selected email on the right.
 * Keys: j/k (or arrows) move, A approve, E edit, S skip.
 */
function MessageInbox({ msgs, tab, canSend, onApprove, onCounts, setMsgs, flash }: {
  msgs: QMsg[]; tab: Tab; canSend: boolean;
  onApprove: (b: Record<string, unknown>, label: string, confirmText?: string) => Promise<void>;
  /** Refreshes the header counts only; the list is updated locally. */
  onCounts: () => Promise<void>;
  setMsgs: (fn: (xs: QMsg[]) => QMsg[]) => void;
  flash: (k: "ok" | "err", t: string) => void;
}) {
  const ordered = useMemo(
    () => [...msgs].sort((a, b) => (a.lead?.companyName ?? "").localeCompare(b.lead?.companyName ?? "") || a.enrollmentId.localeCompare(b.enrollmentId) || a.stepIndex - b.stepIndex),
    [msgs],
  );
  const [selId, setSelId] = useState<string | null>(ordered[0]?.id ?? null);
  const [edit, setEdit] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [working, setWorking] = useState<string | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  const idx = Math.max(0, ordered.findIndex((m) => m.id === selId));
  const sel = ordered[idx] ?? null;
  const unsent = sel ? sel.status === "draft" || sel.status === "approved" : false;
  const steps = sel ? ordered.filter((m) => m.enrollmentId === sel.enrollmentId) : [];

  useEffect(() => {
    if (!ordered.some((m) => m.id === selId)) setSelId(ordered[Math.min(idx, ordered.length - 1)]?.id ?? null);
  }, [ordered, selId, idx]);
  useEffect(() => {
    setEdit(false);
    if (sel) { setSubject(sel.subject); setBody(sel.bodyText); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sel?.id]);

  const select = (id: string, scroll = false) => {
    setSelId(id);
    document.querySelector(`[data-msg-id="${id}"]`)?.scrollIntoView({ block: "nearest" });
    if (scroll && window.matchMedia("(max-width: 1023px)").matches) previewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const nextAfter = (ids: string[]) => {
    const rest = ordered.filter((m) => !ids.includes(m.id));
    const after = ordered.slice(idx + 1).find((m) => !ids.includes(m.id)) ?? rest[rest.length - 1];
    return after?.id ?? null;
  };
  const drop = (ids: string[]) => {
    const n = nextAfter(ids);
    setMsgs((xs) => xs.filter((x) => !ids.includes(x.id)));
    setSelId(n);
  };

  async function approveOne(m: QMsg) {
    if (!canSend || m.status !== "draft") return;
    setWorking("approve");
    try {
      const r = await api<{ approved: number }>("/api/admin/growth/outreach/approve", { method: "POST", body: JSON.stringify({ messageIds: [m.id] }) });
      flash("ok", r.approved ? `Approved: ${m.lead?.companyName ?? "email"}, step ${m.stepIndex + 1}` : "Nothing approved (it may be blocked)");
      drop([m.id]);
      onCounts().catch(() => {});
    } catch (e) {
      flash("err", e instanceof Error ? e.message : "Failed");
    } finally {
      setWorking(null);
    }
  }
  async function skip(m: QMsg) {
    if (!(m.status === "draft" || m.status === "approved")) return;
    setWorking("skip");
    try {
      await api(`/api/admin/growth/outreach/messages/${m.id}`, { method: "DELETE" });
      flash("ok", "Skipped. The rest of the sequence continues.");
      drop([m.id]);
      onCounts().catch(() => {});
    } catch (e) {
      flash("err", e instanceof Error ? e.message : "Failed");
    } finally {
      setWorking(null);
    }
  }
  async function save() {
    if (!sel) return;
    setWorking("save");
    try {
      await api(`/api/admin/growth/outreach/messages/${sel.id}`, { method: "PATCH", body: JSON.stringify({ subject, bodyText: body }) });
      setMsgs((xs) => xs.map((x) => (x.id === sel.id ? { ...x, subject, bodyText: body, status: "draft" } : x)));
      setEdit(false);
      flash("ok", tab === "draft" ? "Saved" : "Saved. It needs approval again.");
      if (tab !== "draft") onCounts().catch(() => {});
    } catch (e) {
      flash("err", e instanceof Error ? e.message : "Failed");
    } finally {
      setWorking(null);
    }
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!sel || e.metaKey || e.ctrlKey || e.altKey) return;
      if (edit) {
        if (e.key === "Escape") { e.preventDefault(); setEdit(false); setSubject(sel.subject); setBody(sel.bodyText); }
        return;
      }
      if (isTyping(e.target) || document.querySelector("[role=dialog]")) return;
      const k = e.key.toLowerCase();
      if (k === "j" || e.key === "ArrowDown") { e.preventDefault(); const n = ordered[Math.min(ordered.length - 1, idx + 1)]; if (n) select(n.id); }
      else if (k === "k" || e.key === "ArrowUp") { e.preventDefault(); const n = ordered[Math.max(0, idx - 1)]; if (n) select(n.id); }
      else if (k === "a" && !working) { e.preventDefault(); approveOne(sel); }
      else if (k === "e" && unsent) { e.preventDefault(); setEdit(true); }
      else if (k === "s" && !working) { e.preventDefault(); skip(sel); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sel, edit, ordered, idx, working, unsent]);

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(300px,380px)_minmax(0,1fr)]" data-testid="outreach-inbox">
      {/* List */}
      <div className="overflow-hidden rounded-[var(--a-radius-card)] border border-[var(--a-border)] bg-[var(--a-surface)] shadow-[var(--a-shadow-card)]">
        <div className="flex items-center justify-between border-b border-[var(--a-border)] bg-[var(--a-surface-2)] px-3 py-2 font-dm text-[12px] text-[var(--a-ink-3)]">
          <span className="tabular-nums">{ordered.length} email{ordered.length === 1 ? "" : "s"}</span>
          <span className="hidden items-center gap-1 sm:inline-flex"><Kbd>j</Kbd><Kbd>k</Kbd> move{tab === "draft" || tab === "approved" ? <> <Kbd>A</Kbd> <Kbd>E</Kbd> <Kbd>S</Kbd></> : null}</span>
        </div>
        <ul className="max-h-[62vh] overflow-y-auto" role="listbox" aria-label="Emails">
          {ordered.map((m) => {
            const on = m.id === sel?.id;
            return (
              <li key={m.id} role="option" aria-selected={on}>
                <button
                  type="button"
                  data-msg-id={m.id}
                  onClick={() => select(m.id, true)}
                  className={`relative block w-full border-b border-[var(--a-border)] px-3 py-2.5 text-left transition-colors duration-150 ${on ? "bg-[var(--a-info-bg)]" : "hover:bg-[var(--a-surface-2)]"}`}
                  data-testid="approval-group"
                >
                  {on && <span className="absolute inset-y-0 left-0 w-[3px] bg-[var(--a-blue)]" aria-hidden />}
                  <span className="flex items-center gap-2">
                    <span className="min-w-0 flex-1 truncate font-dm text-[13px] font-semibold text-[var(--a-ink)]">{m.lead?.companyName ?? "(deleted lead)"}</span>
                    {m.lead?.score != null && <ScoreDot score={m.lead.score} />}
                    <span className="shrink-0 font-dm text-[11px] text-[var(--a-ink-3)]">Step {m.stepIndex + 1}</span>
                  </span>
                  <span className="mt-0.5 block truncate font-dm text-[12.5px] text-[var(--a-ink-2)]">{m.subject}</span>
                  <span className="mt-0.5 flex items-center gap-1.5 font-dm text-[11px] text-[var(--a-ink-3)]">
                    {m.personalised && <Sparkles size={11} className="text-[#7c3aed]" aria-label="AI personalised" />}
                    <span className="truncate">{m.sentAt ? `Sent ${fmt(m.sentAt)}` : m.scheduledFor ? fmt(m.scheduledFor) : `Day ${m.dayOffset}`} · {m.sequenceName}</span>
                    {m.error && <AlertTriangle size={11} className="shrink-0 text-[var(--a-danger)]" aria-label="Error" />}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Preview */}
      <div ref={previewRef} className="min-w-0 scroll-mt-4">
        {sel && (
          <div className="a-anim-fade overflow-hidden rounded-[var(--a-radius-card)] border border-[var(--a-border)] bg-[var(--a-surface)] shadow-[var(--a-shadow-card)]" data-testid="queue-message">
            <div className="flex flex-wrap items-start gap-3 border-b border-[var(--a-border)] px-5 py-4">
              <div className="min-w-0 flex-1">
                <p className="font-syne text-[17px] font-semibold text-[var(--a-ink)]">{sel.lead?.companyName ?? "(deleted lead)"}</p>
                <p className="mt-0.5 font-dm text-[12.5px] text-[var(--a-ink-3)]">
                  {[sel.lead?.contactName, sel.sequenceName, `step ${sel.stepIndex + 1} of ${steps.length || 1}`, sel.lead ? `consent: ${sel.lead.consentBasis.replace(/_/g, " ")}` : null].filter(Boolean).join(" · ")}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {sel.personalised && <Badge tone="info"><Sparkles size={11} aria-hidden /> AI personalised</Badge>}
                {sel.lead?.score != null && <Badge tone={sel.lead.score >= 70 ? "success" : sel.lead.score >= 45 ? "orange" : "neutral"}>Score {sel.lead.score}</Badge>}
                {sel.lead && <Button size="sm" variant="ghost" icon={ExternalLink} href={`/admin_pro/growth/leads?open=${sel.lead.id}`}>Lead</Button>}
              </div>
            </div>

            <div className="space-y-3 px-5 py-4">
              <dl className="grid grid-cols-[64px_1fr] gap-y-1 font-dm text-[12.5px]">
                <dt className="text-[var(--a-ink-3)]">To</dt><dd className="truncate text-[var(--a-ink)]">{sel.toEmail ?? "-"}</dd>
                <dt className="text-[var(--a-ink-3)]">When</dt>
                <dd className="flex items-center gap-1 text-[var(--a-ink-2)]">
                  {sel.sentAt ? <><CheckCircle2 size={12} className="text-[var(--a-success)]" /> Sent {fmt(sel.sentAt)}</> : sel.scheduledFor ? <><Clock size={12} /> {fmt(sel.scheduledFor)}</> : <>Day {sel.dayOffset} after approval, inside sending hours</>}
                </dd>
              </dl>
              {edit ? (
                <div className="space-y-2">
                  <label className="block">
                    <span className="sr-only">Subject</span>
                    <input value={subject} onChange={(e) => setSubject(e.target.value)} autoFocus className="h-9 w-full rounded-[var(--a-radius-control)] border border-[var(--a-border-strong)] px-3 font-dm text-[14px] font-semibold focus:border-[var(--a-blue)] focus:outline-none focus:ring-2 focus:ring-[var(--a-blue)]/20" />
                  </label>
                  <label className="block">
                    <span className="sr-only">Body</span>
                    <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={12} onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); save(); } }} className="w-full rounded-[var(--a-radius-control)] border border-[var(--a-border-strong)] p-3 font-dm text-[13.5px] leading-relaxed focus:border-[var(--a-blue)] focus:outline-none focus:ring-2 focus:ring-[var(--a-blue)]/20" />
                  </label>
                  <p className="font-dm text-[11.5px] text-[var(--a-ink-3)]"><Kbd>Ctrl</Kbd> + <Kbd>Enter</Kbd> to save, <Kbd>Esc</Kbd> to cancel.</p>
                </div>
              ) : (
                <div className="rounded-[12px] border border-[var(--a-border)] bg-[var(--a-surface-2)]/60 p-4">
                  <p className="font-dm text-[15px] font-semibold text-[var(--a-ink)]" data-testid="preview-subject">{sel.subject}</p>
                  <p className="mt-3 whitespace-pre-wrap font-dm text-[13.5px] leading-relaxed text-[var(--a-ink-2)]">{sel.bodyText}</p>
                  <p className="mt-4 border-t border-dashed border-[var(--a-border-strong)] pt-2 font-dm text-[11.5px] text-[var(--a-ink-3)]">+ footer: sender, postal address, why they got it, one-click unsubscribe</p>
                </div>
              )}
              {sel.error && <p className="rounded-[var(--a-radius-control)] bg-[var(--a-danger-bg)] px-3 py-2 font-dm text-[12.5px] text-[var(--a-danger)]">{sel.error}</p>}
            </div>

            {unsent && (
              <div className="flex flex-wrap items-center gap-2 border-t border-[var(--a-border)] bg-[var(--a-surface-2)]/50 px-5 py-3">
                {edit ? (
                  <>
                    <Button variant="ghost" onClick={() => { setEdit(false); setSubject(sel.subject); setBody(sel.bodyText); }}>Cancel</Button>
                    <Button variant="primary" loading={working === "save"} onClick={save}>Save</Button>
                  </>
                ) : (
                  <>
                    {sel.status === "draft" && (
                      canSend ? (
                        <Button variant="primary" icon={CheckCircle2} loading={working === "approve"} onClick={() => approveOne(sel)} data-testid="approve-one">
                          Approve <Kbd className="ml-1 border-white/30 bg-white/15 text-white shadow-none">A</Kbd>
                        </Button>
                      ) : (
                        <span className="font-dm text-[12px] text-[var(--a-ink-3)]">Only an admin can approve.</span>
                      )
                    )}
                    <Button icon={Pencil} onClick={() => setEdit(true)}>Edit <Kbd className="ml-1">E</Kbd></Button>
                    <Button variant="ghost" icon={SkipForward} loading={working === "skip"} onClick={() => skip(sel)}>Skip <Kbd className="ml-1">S</Kbd></Button>
                    {sel.status === "draft" && canSend && steps.length > 1 && (
                      <Button
                        variant="ghost"
                        className="ml-auto"
                        icon={CheckCheck}
                        onClick={async () => { await onApprove({ enrollmentIds: [sel.enrollmentId] }, sel.enrollmentId); }}
                        data-testid="approve-lead"
                      >
                        Approve all {steps.length} steps
                      </Button>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ScoreDot({ score }: { score: number }) {
  const cls = score >= 70 ? "bg-[var(--a-success-bg)] text-[var(--a-success)]" : score >= 45 ? "bg-[var(--a-orange-bg)] text-[var(--a-orange-text)]" : "bg-[var(--a-surface-2)] text-[var(--a-ink-3)]";
  return <span className={`shrink-0 rounded-full px-1.5 font-dm text-[10.5px] font-bold tabular-nums leading-[18px] ${cls}`}>{score}</span>;
}

function Sequences({ seqs, onEdit, onChanged, flash }: { seqs: Sequence[]; onEdit: (s: Sequence | "new") => void; onChanged: () => Promise<void>; flash: (k: "ok" | "err", t: string) => void }) {
  async function setStatus(s: Sequence, status: string) {
    if (status === "archived" && !confirm(`Archive "${s.name}"? Unsent emails in it are cancelled.`)) return;
    try {
      await api(`/api/admin/growth/outreach/sequences/${s.id}`, { method: "PATCH", body: JSON.stringify({ status }) });
      await onChanged();
    } catch (e) {
      flash("err", e instanceof Error ? e.message : "Failed");
    }
  }
  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button onClick={() => onEdit("new")} className="inline-flex items-center gap-2 px-3 py-2 rounded-[var(--a-radius-control)] bg-[var(--a-orange-text)] text-white text-sm font-dm font-semibold" data-testid="new-sequence"><Plus size={15} /> New sequence</button>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {seqs.map((s) => (
          <div key={s.id} className="rounded-[var(--a-radius-card)] bg-white border border-[var(--a-border)] p-4 font-dm text-sm space-y-3">
            <div className="flex items-start gap-2">
              <div className="min-w-0 flex-1">
                <p className="font-syne font-bold text-[var(--a-ink)]">{s.name}</p>
                {s.description && <p className="text-xs text-[var(--a-ink-3)]">{s.description}</p>}
              </div>
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${s.status === "active" ? "bg-[var(--a-success-bg)] text-[var(--a-success)]" : "bg-[#F4F4F5] text-[var(--a-ink-3)]"}`}>{s.status}</span>
            </div>
            <ol className="space-y-1.5">
              {s.steps.map((st, i) => (
                <li key={i} className="flex gap-2 text-xs">
                  <span className="flex-shrink-0 rounded-md bg-[var(--a-info-bg)] text-[var(--a-blue)] px-1.5 py-0.5 font-semibold">Day {st.dayOffset}</span>
                  <span className="truncate text-[var(--a-ink-2)]">{st.subject}{st.personalise ? " · AI" : ""}</span>
                </li>
              ))}
            </ol>
            <p className="text-xs text-[var(--a-ink-3)]">
              {Object.entries(s.stats).map(([k, v]) => `${v} ${k}`).join(" · ") || "No emails yet"}
            </p>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => onEdit(s)} className="px-3 py-1 rounded-[var(--a-radius-control)] border border-[var(--a-border-strong)]">Edit</button>
              {s.status === "active" ? (
                <button onClick={() => setStatus(s, "paused")} className="inline-flex items-center gap-1 px-3 py-1 rounded-[var(--a-radius-control)] border border-[var(--a-border-strong)]"><Pause size={13} /> Pause</button>
              ) : (
                <button onClick={() => setStatus(s, "active")} className="inline-flex items-center gap-1 px-3 py-1 rounded-[var(--a-radius-control)] border border-[var(--a-border-strong)]"><Play size={13} /> Resume</button>
              )}
              <button onClick={() => setStatus(s, "archived")} className="inline-flex items-center gap-1 px-3 py-1 rounded-[var(--a-radius-control)] border border-[var(--a-border-strong)] text-[var(--a-ink-3)]"><Archive size={13} /> Archive</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SequenceEditor({ seq, mergeFields, onClose, onSaved, flash }: {
  seq: Sequence | null; mergeFields: Array<[string, string]>; onClose: () => void; onSaved: () => Promise<void>; flash: (k: "ok" | "err", t: string) => void;
}) {
  const [name, setName] = useState(seq?.name ?? "");
  const [description, setDescription] = useState(seq?.description ?? "");
  const [steps, setSteps] = useState<Step[]>(seq?.steps ?? [{ dayOffset: 0, subject: "", body: "", personalise: true }]);
  const [audience, setAudience] = useState("");
  const [offerKey, setOfferKey] = useState(seq?.offerKey ?? "");
  const [goal, setGoal] = useState("book a 15-minute call");
  const [busy, setBusy] = useState<string | null>(null);

  const upd = (i: number, p: Partial<Step>) => setSteps((s) => s.map((x, j) => (j === i ? { ...x, ...p } : x)));

  async function aiDraft() {
    setBusy("ai");
    try {
      const r = await api<{ steps: Step[] }>("/api/admin/growth/outreach/sequences/draft", { method: "POST", body: JSON.stringify({ audience, offerKey, goal, steps: 3 }) });
      setSteps(r.steps);
    } catch (e) {
      flash("err", e instanceof Error ? e.message : "AI unavailable");
    } finally {
      setBusy(null);
    }
  }

  async function save() {
    setBusy("save");
    try {
      const payload = JSON.stringify({ name, description, steps, offerKey: offerKey || null });
      if (seq) await api(`/api/admin/growth/outreach/sequences/${seq.id}`, { method: "PATCH", body: payload });
      else await api("/api/admin/growth/outreach/sequences", { method: "POST", body: payload });
      flash("ok", "Sequence saved");
      await onSaved();
    } catch (e) {
      flash("err", e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <Modal title={seq ? "Edit sequence" : "New sequence"} onClose={onClose} wide>
      <div className="space-y-4 font-dm text-sm">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1"><span className="text-xs text-[var(--a-ink-3)]">Name</span><input value={name} onChange={(e) => setName(e.target.value)} className="rounded-[var(--a-radius-control)] border border-[var(--a-border-strong)] px-3 py-2" data-testid="seq-name" /></label>
          <label className="flex flex-col gap-1"><span className="text-xs text-[var(--a-ink-3)]">Description</span><input value={description} onChange={(e) => setDescription(e.target.value)} className="rounded-[var(--a-radius-control)] border border-[var(--a-border-strong)] px-3 py-2" /></label>
        </div>

        <details className="rounded-[12px] bg-[var(--a-surface-2)] p-3">
          <summary className="cursor-pointer font-semibold text-[var(--a-navy)] flex items-center gap-2"><Sparkles size={14} /> Draft the steps with AI</summary>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <input value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="Audience, e.g. dental clinics in Ottawa" className="rounded-[var(--a-radius-control)] border border-[var(--a-border-strong)] px-3 py-2 sm:col-span-3" />
            <select value={offerKey} onChange={(e) => setOfferKey(e.target.value)} className="rounded-[var(--a-radius-control)] border border-[var(--a-border-strong)] px-2 py-2">
              <option value="">Best-fit offer per lead</option>
              {OFFERS.map((o) => <option key={o.key} value={o.key}>{o.name}</option>)}
            </select>
            <input value={goal} onChange={(e) => setGoal(e.target.value)} className="rounded-[var(--a-radius-control)] border border-[var(--a-border-strong)] px-3 py-2" />
            <button onClick={aiDraft} disabled={!audience || busy === "ai"} className="inline-flex items-center justify-center gap-1.5 rounded-[var(--a-radius-control)] bg-[var(--a-navy)] text-white px-3 py-2 font-semibold disabled:opacity-50">
              {busy === "ai" ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />} Draft
            </button>
          </div>
        </details>

        <p className="text-xs text-[var(--a-ink-3)]">Merge fields: {mergeFields.map(([k, d]) => <code key={k} title={d} className="mx-0.5 rounded bg-[var(--a-surface-2)] px-1">{`{{${k}}}`}</code>)}</p>

        <div className="space-y-3">
          {steps.map((s, i) => (
            <div key={i} className="rounded-[12px] border border-[var(--a-border)] p-3 space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-semibold text-[var(--a-ink)]">Step {i + 1}</span>
                <label className="flex items-center gap-1 text-xs text-[var(--a-ink-3)]">Day
                  <input type="number" min={0} max={60} value={s.dayOffset} onChange={(e) => upd(i, { dayOffset: Number(e.target.value) })} className="w-16 rounded-md border border-[var(--a-border-strong)] px-2 py-1" />
                </label>
                <label className="flex items-center gap-1.5 text-xs text-[var(--a-ink-2)]"><input type="checkbox" checked={s.personalise} onChange={(e) => upd(i, { personalise: e.target.checked })} /> Personalise per lead with AI (Haiku)</label>
                <button onClick={() => setSteps((x) => x.filter((_, j) => j !== i))} className="ml-auto text-[var(--a-ink-3)] hover:text-[var(--a-danger)]" aria-label="Remove step"><Trash2 size={15} /></button>
              </div>
              <input value={s.subject} onChange={(e) => upd(i, { subject: e.target.value })} placeholder="Subject" className="w-full rounded-[var(--a-radius-control)] border border-[var(--a-border-strong)] px-3 py-2 font-semibold" />
              <textarea value={s.body} onChange={(e) => upd(i, { body: e.target.value })} rows={7} placeholder="Body (plain text)" className="w-full rounded-[var(--a-radius-control)] border border-[var(--a-border-strong)] p-3" />
              {/^\s*(re|fwd?)\s*:/i.test(s.subject) && <p className="text-xs text-[var(--a-danger)]">Subjects that pretend to be a reply or forward are deceptive under CAN-SPAM.</p>}
            </div>
          ))}
          {steps.length < 6 && (
            <button onClick={() => setSteps((x) => [...x, { dayOffset: (x[x.length - 1]?.dayOffset ?? 0) + 3, subject: "", body: "", personalise: false }])} className="inline-flex items-center gap-1.5 rounded-[var(--a-radius-control)] border border-dashed border-[var(--a-border-strong)] px-3 py-2 text-[var(--a-navy)]">
              <Plus size={14} /> Add step
            </button>
          )}
        </div>
        <p className="text-xs text-[var(--a-ink-3)]">Edits apply to leads you enrol from now on; already-drafted emails keep their text (edit them in the approval queue).</p>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-[var(--a-radius-control)] text-[var(--a-ink-2)]">Cancel</button>
          <button onClick={save} disabled={!name.trim() || busy === "save" || steps.some((s) => /^\s*(re|fwd?)\s*:/i.test(s.subject))} className="px-4 py-2 rounded-[var(--a-radius-control)] bg-[var(--a-orange-text)] text-white font-semibold disabled:opacity-50" data-testid="seq-save">Save sequence</button>
        </div>
      </div>
    </Modal>
  );
}

function Suppression({ entries, canSend, onChanged, flash }: { entries: Supp[]; canSend: boolean; onChanged: () => Promise<void>; flash: (k: "ok" | "err", t: string) => void }) {
  const [values, setValues] = useState("");
  async function add() {
    try {
      const r = await api<{ added: number; invalid: string[] }>("/api/admin/growth/outreach/suppression", { method: "POST", body: JSON.stringify({ values }) });
      flash("ok", `${r.added} added${r.invalid.length ? `, ${r.invalid.length} invalid` : ""}`);
      setValues("");
      await onChanged();
    } catch (e) {
      flash("err", e instanceof Error ? e.message : "Failed");
    }
  }
  async function remove(v: string) {
    if (!confirm(`Remove ${v} from the suppression list?`)) return;
    try {
      await api(`/api/admin/growth/outreach/suppression?value=${encodeURIComponent(v)}`, { method: "DELETE" });
      await onChanged();
    } catch (e) {
      flash("err", e instanceof Error ? e.message : "Failed");
    }
  }
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="rounded-[var(--a-radius-card)] bg-white border border-[var(--a-border)] p-4 font-dm text-sm space-y-2 h-fit">
        <p className="font-semibold text-[var(--a-ink)] flex items-center gap-2"><ShieldOff size={15} /> Add do-not-contact</p>
        <textarea value={values} onChange={(e) => setValues(e.target.value)} rows={5} placeholder={"name@company.com\n@competitor.com (whole domain)"} className="w-full rounded-[var(--a-radius-control)] border border-[var(--a-border-strong)] p-2.5" />
        <button onClick={add} disabled={!values.trim()} className="w-full rounded-[var(--a-radius-control)] bg-[var(--a-navy)] text-white py-2 font-semibold disabled:opacity-50">Add</button>
        <p className="text-xs text-[var(--a-ink-3)]">Unsubscribes, hard bounces and do-not-contact entries are checked before every send. Unsubscribes cannot be removed by you.</p>
      </div>
      <div className="lg:col-span-2 rounded-[var(--a-radius-card)] bg-white border border-[var(--a-border)] overflow-x-auto">
        <table className="w-full min-w-[520px] font-dm text-sm">
          <thead className="bg-[var(--a-surface-2)] text-[var(--a-ink-3)] text-xs uppercase tracking-wide"><tr><th className="p-3 text-left">Address / domain</th><th className="p-3 text-left">Reason</th><th className="p-3 text-left">Added</th><th className="p-3" /></tr></thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.value} className="border-t border-[var(--a-border)]">
                <td className="p-3 text-[var(--a-ink)]">{e.value}</td>
                <td className="p-3"><span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${e.reason === "unsubscribe" ? "bg-[var(--a-danger-bg)] text-[var(--a-danger)]" : "bg-[#F4F4F5] text-[var(--a-ink-3)]"}`}>{e.reason.replace(/_/g, " ")}</span>{e.note && <span className="block text-[11px] text-[var(--a-ink-3)]">{e.note}</span>}</td>
                <td className="p-3 text-xs text-[var(--a-ink-3)]">{new Date(e.createdAt).toLocaleDateString("en-CA")}</td>
                <td className="p-3 text-right">{canSend && e.reason !== "unsubscribe" && e.reason !== "complaint" && <button onClick={() => remove(e.value)} className="text-[var(--a-ink-3)] hover:text-[var(--a-danger)]" aria-label="Remove"><X size={15} /></button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {entries.length === 0 && <p className="p-6 text-center text-sm text-[var(--a-ink-3)]">The list is empty.</p>}
      </div>
    </div>
  );
}
