"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle, CheckCircle2, ChevronDown, Clock, Loader2, Pause, Play, Plus, Send, ShieldOff, Sparkles, Trash2, Users, Archive, X,
} from "lucide-react";
import ComplianceNote from "@/components/admin/growth-outreach/ComplianceNote";
import { OFFERS } from "@/lib/growth/outreach/offers";
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

export default function OutreachClient({ canSend, mergeFields }: { canSend: boolean; mergeFields: Array<[string, string]> }) {
  const [tab, setTab] = useState<Tab>("draft");
  const [status, setStatus] = useState<Status | null>(null);
  const [msgs, setMsgs] = useState<QMsg[]>([]);
  const [seqs, setSeqs] = useState<Sequence[]>([]);
  const [supp, setSupp] = useState<Supp[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [editing, setEditing] = useState<Sequence | "new" | null>(null);

  const flash = useCallback((kind: "ok" | "err", text: string) => {
    setToast({ kind, text });
    setTimeout(() => setToast(null), 5000);
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

  // Group the approval queue by enrollment (one card per lead).
  const groups = useMemo(() => {
    const m = new Map<string, QMsg[]>();
    for (const x of msgs) m.set(x.enrollmentId, [...(m.get(x.enrollmentId) ?? []), x]);
    return [...m.values()].map((g) => g.sort((a, b) => a.stepIndex - b.stepIndex));
  }, [msgs]);

  const capPct = status ? Math.min(100, (status.sent24h / Math.max(1, status.dailyCap)) * 100) : 0;

  return (
    <div className="max-w-[1400px] mx-auto space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-dm text-xs font-semibold uppercase tracking-wider text-[#F47C20]">Growth</p>
          <h1 className="font-syne font-extrabold text-2xl text-[#0D1B2A]">Outreach</h1>
          <p className="font-dm text-sm text-[#7A8FA6]">Multi-step email sequences. You approve every email; the sender respects the cap, sending hours and suppression list.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin_pro/growth/leads" className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-[#D2DCE8] bg-white text-sm font-dm font-semibold text-[#1B3A6B] hover:bg-[#F4F7FB]"><Users size={15} /> Leads</Link>
          {canSend && (
            <button onClick={runNow} disabled={busy === "run"} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[#1B3A6B] text-white text-sm font-dm font-semibold hover:bg-[#2251A3] disabled:opacity-50" data-testid="run-now">
              {busy === "run" ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />} Run sender now
            </button>
          )}
        </div>
      </div>

      {status && status.problems.length > 0 && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 font-dm text-sm text-red-700 space-y-1" data-testid="config-problems">
          <p className="font-semibold flex items-center gap-2"><AlertTriangle size={16} /> Sending is blocked</p>
          {status.problems.map((p) => <p key={p}>{p}</p>)}
        </div>
      )}

      {/* Status */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-2xl bg-white border border-[#E5EAF2] px-4 py-3">
          <p className="font-dm text-xs text-[#7A8FA6]">Sent, last 24h</p>
          <p className="font-syne font-bold text-2xl text-[#0D1B2A]">{status?.sent24h ?? "-"}<span className="text-sm text-[#7A8FA6] font-dm"> / {status?.dailyCap ?? "-"} cap</span></p>
          <div className="mt-2 h-1.5 rounded-full bg-[#EEF2F7]"><div className="h-full rounded-full bg-[#F47C20]" style={{ width: `${capPct}%` }} /></div>
        </div>
        <div className="rounded-2xl bg-white border border-[#E5EAF2] px-4 py-3">
          <p className="font-dm text-xs text-[#7A8FA6]">Needs approval</p>
          <p className="font-syne font-bold text-2xl text-[#B8500A]">{status?.counts.draft ?? 0}</p>
        </div>
        <div className="rounded-2xl bg-white border border-[#E5EAF2] px-4 py-3">
          <p className="font-dm text-xs text-[#7A8FA6]">Scheduled</p>
          <p className="font-syne font-bold text-2xl text-[#2251A3]">{status?.counts.approved ?? 0}</p>
        </div>
        <div className="rounded-2xl bg-white border border-[#E5EAF2] px-4 py-3">
          <p className="font-dm text-xs text-[#7A8FA6]">Sending hours</p>
          <p className="font-dm text-sm font-semibold text-[#0D1B2A] mt-1 flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${status?.inWindow ? "bg-[#16a34a]" : "bg-[#9CA3AF]"}`} /> {status?.window ?? "-"}
          </p>
          <p className="font-dm text-[11px] text-[#7A8FA6] mt-1">Last run {status?.lastRunAt ? fmt(status.lastRunAt) : "never"}{status?.lastResult?.reason ? `: ${status.lastResult.reason}` : ""}</p>
        </div>
      </div>

      {status && (
        <p className="font-dm text-xs text-[#7A8FA6]">
          From <b className="text-[#3A4A5C]">{status.fromName} &lt;{status.fromEmail}&gt;</b> · replies go to <b className="text-[#3A4A5C]">{status.replyTo}</b> (mark replies on the lead to stop its sequence) · postal address: <b className="text-[#3A4A5C]">{status.physicalAddress ?? "not set"}</b> · up to {status.perRun} per run, randomly spaced.
        </p>
      )}

      <ComplianceNote defaultOpen={false} />

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[#E5EAF2] overflow-x-auto">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`px-3 py-2 font-dm text-sm font-semibold whitespace-nowrap border-b-2 ${tab === t.key ? "border-[#F47C20] text-[#0D1B2A]" : "border-transparent text-[#7A8FA6]"}`}>
            {t.label}{t.key === "draft" && status?.counts.draft ? ` (${status.counts.draft})` : ""}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="animate-spin text-[#2251A3]" /></div>
      ) : tab === "sequences" ? (
        <Sequences seqs={seqs} onEdit={setEditing} onChanged={() => loadTab("sequences")} flash={flash} />
      ) : tab === "suppression" ? (
        <Suppression entries={supp} canSend={canSend} onChanged={() => loadTab("suppression")} flash={flash} />
      ) : (
        <div className="space-y-3">
          {tab === "draft" && groups.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-[#FFF7ED] border border-[#FED7AA] p-3 font-dm text-sm">
              <span className="text-[#9A3412]">{msgs.length} email(s) for {groups.length} lead(s) are waiting. Nothing sends until approved.</span>
              {canSend ? (
                <button
                  onClick={() => approve({ all: true }, "all", `Approve all ${msgs.length} drafted emails? They will go out over the coming days within the daily cap.`)}
                  disabled={busy === "all"}
                  className="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-[#0F6E56] text-white px-3 py-1.5 font-semibold disabled:opacity-50"
                  data-testid="approve-all"
                >
                  <CheckCircle2 size={15} /> Approve all
                </button>
              ) : (
                <span className="ml-auto text-xs text-[#9A3412]">Only an admin can approve.</span>
              )}
            </div>
          )}
          {groups.length === 0 && (
            <p className="rounded-2xl bg-white border border-dashed border-[#D2DCE8] p-8 text-center font-dm text-sm text-[#7A8FA6]">
              {tab === "draft" ? <>Nothing waiting. Add leads to a sequence from the <Link href="/admin_pro/growth/leads" className="text-[#2251A3] underline">Leads</Link> board.</> : "Nothing here."}
            </p>
          )}
          {groups.map((g) => (
            <LeadGroup key={g[0].enrollmentId} msgs={g} tab={tab} canSend={canSend} busy={busy} onApprove={approve} onChanged={refresh} flash={flash} />
          ))}
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

      {toast && (
        <div role="status" className={`fixed bottom-5 right-5 z-[60] max-w-sm rounded-xl px-4 py-3 shadow-lg font-dm text-sm ${toast.kind === "ok" ? "bg-[#0D1B2A] text-white" : "bg-red-600 text-white"}`} data-testid="toast">
          {toast.text}
        </div>
      )}
    </div>
  );
}

function LeadGroup({ msgs, tab, canSend, busy, onApprove, onChanged, flash }: {
  msgs: QMsg[]; tab: Tab; canSend: boolean; busy: string | null;
  onApprove: (b: Record<string, unknown>, label: string) => Promise<void>; onChanged: () => Promise<void>; flash: (k: "ok" | "err", t: string) => void;
}) {
  const [open, setOpen] = useState(tab === "draft");
  const first = msgs[0];
  return (
    <div className="rounded-2xl bg-white border border-[#E5EAF2]" data-testid="approval-group">
      <div className="flex flex-wrap items-center gap-3 px-4 py-3">
        <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-2 min-w-0 flex-1 text-left">
          <ChevronDown size={16} className={`text-[#7A8FA6] transition-transform ${open ? "" : "-rotate-90"}`} />
          <span className="min-w-0">
            <span className="block font-dm font-semibold text-[#0D1B2A] truncate">{first.lead?.companyName ?? "(deleted lead)"} <span className="font-normal text-[#7A8FA6]">· {first.toEmail}</span></span>
            <span className="block font-dm text-xs text-[#7A8FA6] truncate">{first.sequenceName} · {msgs.length} email(s){first.lead?.score != null ? ` · score ${first.lead.score}` : ""} · consent: {first.lead?.consentBasis.replace(/_/g, " ")}</span>
          </span>
        </button>
        {tab === "draft" && canSend && (
          <button onClick={() => onApprove({ enrollmentIds: [first.enrollmentId] }, first.enrollmentId)} disabled={busy === first.enrollmentId} className="inline-flex items-center gap-1.5 rounded-lg bg-[#0F6E56] text-white px-3 py-1.5 font-dm text-sm font-semibold disabled:opacity-50" data-testid="approve-lead">
            <CheckCircle2 size={14} /> Approve {msgs.length > 1 ? "all steps" : ""}
          </button>
        )}
      </div>
      {open && (
        <div className="border-t border-[#F0F3F8] p-4 grid gap-3 lg:grid-cols-2">
          {msgs.map((m) => <QMessage key={m.id} m={m} canSend={canSend} onApprove={onApprove} onChanged={onChanged} flash={flash} />)}
        </div>
      )}
    </div>
  );
}

function QMessage({ m, canSend, onApprove, onChanged, flash }: {
  m: QMsg; canSend: boolean; onApprove: (b: Record<string, unknown>, label: string) => Promise<void>; onChanged: () => Promise<void>; flash: (k: "ok" | "err", t: string) => void;
}) {
  const [edit, setEdit] = useState(false);
  const [subject, setSubject] = useState(m.subject);
  const [body, setBody] = useState(m.bodyText);
  const unsent = m.status === "draft" || m.status === "approved";
  async function save() {
    try {
      await api(`/api/admin/growth/outreach/messages/${m.id}`, { method: "PATCH", body: JSON.stringify({ subject, bodyText: body }) });
      setEdit(false);
      flash("ok", "Saved. It needs approval again.");
      await onChanged();
    } catch (e) {
      flash("err", e instanceof Error ? e.message : "Failed");
    }
  }
  async function skip() {
    try {
      await api(`/api/admin/growth/outreach/messages/${m.id}`, { method: "DELETE" });
      await onChanged();
    } catch (e) {
      flash("err", e instanceof Error ? e.message : "Failed");
    }
  }
  return (
    <div className="rounded-xl bg-[#FAFBFD] border border-[#EEF2F7] p-3 font-dm text-sm space-y-2" data-testid="queue-message">
      <div className="flex items-center gap-2 text-xs text-[#7A8FA6]">
        <span className="font-semibold text-[#0D1B2A]">Step {m.stepIndex + 1} · day {m.dayOffset}</span>
        {m.personalised && <span className="rounded-full bg-[#F3E8FF] text-[#7c3aed] px-2 py-0.5 font-semibold">AI personalised</span>}
        <span className="ml-auto flex items-center gap-1">
          {m.sentAt ? <><CheckCircle2 size={12} className="text-[#0F6E56]" /> {fmt(m.sentAt)}</> : m.scheduledFor ? <><Clock size={12} /> {fmt(m.scheduledFor)}</> : null}
        </span>
      </div>
      {edit ? (
        <>
          <input value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full rounded-lg border border-[#D2DCE8] px-2.5 py-1.5 font-semibold bg-white" />
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={9} className="w-full rounded-lg border border-[#D2DCE8] p-2.5 bg-white" />
        </>
      ) : (
        <>
          <p className="font-semibold text-[#0D1B2A]">{m.subject}</p>
          <p className="whitespace-pre-wrap text-[#3A4A5C] text-[13px] leading-relaxed">{m.bodyText}</p>
          <p className="text-[11px] text-[#9CA3AF] border-t border-dashed border-[#E5EAF2] pt-1.5">+ footer: sender, postal address, why they got it, one-click unsubscribe</p>
        </>
      )}
      {m.error && <p className="text-xs text-red-600">{m.error}</p>}
      {unsent && (
        <div className="flex flex-wrap justify-end gap-2">
          {edit ? (
            <>
              <button onClick={() => setEdit(false)} className="px-3 py-1 rounded-lg text-[#3A4A5C]">Cancel</button>
              <button onClick={save} className="px-3 py-1 rounded-lg bg-[#1B3A6B] text-white font-semibold">Save</button>
            </>
          ) : (
            <>
              <button onClick={() => setEdit(true)} className="px-3 py-1 rounded-lg border border-[#D2DCE8] bg-white">Edit</button>
              <button onClick={skip} className="px-3 py-1 rounded-lg border border-[#D2DCE8] bg-white text-[#6B7280]">Skip</button>
              {m.status === "draft" && canSend && (
                <button onClick={() => onApprove({ messageIds: [m.id] }, m.id)} className="px-3 py-1 rounded-lg bg-[#0F6E56] text-white font-semibold" data-testid="approve-one">Approve</button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
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
        <button onClick={() => onEdit("new")} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[#F47C20] text-white text-sm font-dm font-semibold" data-testid="new-sequence"><Plus size={15} /> New sequence</button>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {seqs.map((s) => (
          <div key={s.id} className="rounded-2xl bg-white border border-[#E5EAF2] p-4 font-dm text-sm space-y-3">
            <div className="flex items-start gap-2">
              <div className="min-w-0 flex-1">
                <p className="font-syne font-bold text-[#0D1B2A]">{s.name}</p>
                {s.description && <p className="text-xs text-[#7A8FA6]">{s.description}</p>}
              </div>
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${s.status === "active" ? "bg-[#E8F7EE] text-[#0F6E56]" : "bg-[#F4F4F5] text-[#6B7280]"}`}>{s.status}</span>
            </div>
            <ol className="space-y-1.5">
              {s.steps.map((st, i) => (
                <li key={i} className="flex gap-2 text-xs">
                  <span className="flex-shrink-0 rounded-md bg-[#EBF0FA] text-[#2251A3] px-1.5 py-0.5 font-semibold">Day {st.dayOffset}</span>
                  <span className="truncate text-[#3A4A5C]">{st.subject}{st.personalise ? " · AI" : ""}</span>
                </li>
              ))}
            </ol>
            <p className="text-xs text-[#7A8FA6]">
              {Object.entries(s.stats).map(([k, v]) => `${v} ${k}`).join(" · ") || "No emails yet"}
            </p>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => onEdit(s)} className="px-3 py-1 rounded-lg border border-[#D2DCE8]">Edit</button>
              {s.status === "active" ? (
                <button onClick={() => setStatus(s, "paused")} className="inline-flex items-center gap-1 px-3 py-1 rounded-lg border border-[#D2DCE8]"><Pause size={13} /> Pause</button>
              ) : (
                <button onClick={() => setStatus(s, "active")} className="inline-flex items-center gap-1 px-3 py-1 rounded-lg border border-[#D2DCE8]"><Play size={13} /> Resume</button>
              )}
              <button onClick={() => setStatus(s, "archived")} className="inline-flex items-center gap-1 px-3 py-1 rounded-lg border border-[#D2DCE8] text-[#6B7280]"><Archive size={13} /> Archive</button>
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
          <label className="flex flex-col gap-1"><span className="text-xs text-[#7A8FA6]">Name</span><input value={name} onChange={(e) => setName(e.target.value)} className="rounded-lg border border-[#D2DCE8] px-3 py-2" data-testid="seq-name" /></label>
          <label className="flex flex-col gap-1"><span className="text-xs text-[#7A8FA6]">Description</span><input value={description} onChange={(e) => setDescription(e.target.value)} className="rounded-lg border border-[#D2DCE8] px-3 py-2" /></label>
        </div>

        <details className="rounded-xl bg-[#F4F7FB] p-3">
          <summary className="cursor-pointer font-semibold text-[#1B3A6B] flex items-center gap-2"><Sparkles size={14} /> Draft the steps with AI</summary>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <input value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="Audience, e.g. dental clinics in Ottawa" className="rounded-lg border border-[#D2DCE8] px-3 py-2 sm:col-span-3" />
            <select value={offerKey} onChange={(e) => setOfferKey(e.target.value)} className="rounded-lg border border-[#D2DCE8] px-2 py-2">
              <option value="">Best-fit offer per lead</option>
              {OFFERS.map((o) => <option key={o.key} value={o.key}>{o.name}</option>)}
            </select>
            <input value={goal} onChange={(e) => setGoal(e.target.value)} className="rounded-lg border border-[#D2DCE8] px-3 py-2" />
            <button onClick={aiDraft} disabled={!audience || busy === "ai"} className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#1B3A6B] text-white px-3 py-2 font-semibold disabled:opacity-50">
              {busy === "ai" ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />} Draft
            </button>
          </div>
        </details>

        <p className="text-xs text-[#7A8FA6]">Merge fields: {mergeFields.map(([k, d]) => <code key={k} title={d} className="mx-0.5 rounded bg-[#EEF2F7] px-1">{`{{${k}}}`}</code>)}</p>

        <div className="space-y-3">
          {steps.map((s, i) => (
            <div key={i} className="rounded-xl border border-[#E5EAF2] p-3 space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-semibold text-[#0D1B2A]">Step {i + 1}</span>
                <label className="flex items-center gap-1 text-xs text-[#7A8FA6]">Day
                  <input type="number" min={0} max={60} value={s.dayOffset} onChange={(e) => upd(i, { dayOffset: Number(e.target.value) })} className="w-16 rounded-md border border-[#D2DCE8] px-2 py-1" />
                </label>
                <label className="flex items-center gap-1.5 text-xs text-[#3A4A5C]"><input type="checkbox" checked={s.personalise} onChange={(e) => upd(i, { personalise: e.target.checked })} /> Personalise per lead with AI (Haiku)</label>
                <button onClick={() => setSteps((x) => x.filter((_, j) => j !== i))} className="ml-auto text-[#9CA3AF] hover:text-red-600" aria-label="Remove step"><Trash2 size={15} /></button>
              </div>
              <input value={s.subject} onChange={(e) => upd(i, { subject: e.target.value })} placeholder="Subject" className="w-full rounded-lg border border-[#D2DCE8] px-3 py-2 font-semibold" />
              <textarea value={s.body} onChange={(e) => upd(i, { body: e.target.value })} rows={7} placeholder="Body (plain text)" className="w-full rounded-lg border border-[#D2DCE8] p-3" />
              {/^\s*(re|fwd?)\s*:/i.test(s.subject) && <p className="text-xs text-red-600">Subjects that pretend to be a reply or forward are deceptive under CAN-SPAM.</p>}
            </div>
          ))}
          {steps.length < 6 && (
            <button onClick={() => setSteps((x) => [...x, { dayOffset: (x[x.length - 1]?.dayOffset ?? 0) + 3, subject: "", body: "", personalise: false }])} className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-[#D2DCE8] px-3 py-2 text-[#1B3A6B]">
              <Plus size={14} /> Add step
            </button>
          )}
        </div>
        <p className="text-xs text-[#7A8FA6]">Edits apply to leads you enrol from now on; already-drafted emails keep their text (edit them in the approval queue).</p>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-[#3A4A5C]">Cancel</button>
          <button onClick={save} disabled={!name.trim() || busy === "save" || steps.some((s) => /^\s*(re|fwd?)\s*:/i.test(s.subject))} className="px-4 py-2 rounded-lg bg-[#F47C20] text-white font-semibold disabled:opacity-50" data-testid="seq-save">Save sequence</button>
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
      <div className="rounded-2xl bg-white border border-[#E5EAF2] p-4 font-dm text-sm space-y-2 h-fit">
        <p className="font-semibold text-[#0D1B2A] flex items-center gap-2"><ShieldOff size={15} /> Add do-not-contact</p>
        <textarea value={values} onChange={(e) => setValues(e.target.value)} rows={5} placeholder={"name@company.com\n@competitor.com (whole domain)"} className="w-full rounded-lg border border-[#D2DCE8] p-2.5" />
        <button onClick={add} disabled={!values.trim()} className="w-full rounded-lg bg-[#1B3A6B] text-white py-2 font-semibold disabled:opacity-50">Add</button>
        <p className="text-xs text-[#7A8FA6]">Unsubscribes, hard bounces and do-not-contact entries are checked before every send. Unsubscribes cannot be removed by you.</p>
      </div>
      <div className="lg:col-span-2 rounded-2xl bg-white border border-[#E5EAF2] overflow-x-auto">
        <table className="w-full min-w-[520px] font-dm text-sm">
          <thead className="bg-[#F4F7FB] text-[#7A8FA6] text-xs uppercase tracking-wide"><tr><th className="p-3 text-left">Address / domain</th><th className="p-3 text-left">Reason</th><th className="p-3 text-left">Added</th><th className="p-3" /></tr></thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.value} className="border-t border-[#F0F3F8]">
                <td className="p-3 text-[#0D1B2A]">{e.value}</td>
                <td className="p-3"><span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${e.reason === "unsubscribe" ? "bg-red-50 text-red-600" : "bg-[#F4F4F5] text-[#6B7280]"}`}>{e.reason.replace(/_/g, " ")}</span>{e.note && <span className="block text-[11px] text-[#9CA3AF]">{e.note}</span>}</td>
                <td className="p-3 text-xs text-[#7A8FA6]">{new Date(e.createdAt).toLocaleDateString("en-CA")}</td>
                <td className="p-3 text-right">{canSend && e.reason !== "unsubscribe" && e.reason !== "complaint" && <button onClick={() => remove(e.value)} className="text-[#9CA3AF] hover:text-red-600" aria-label="Remove"><X size={15} /></button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {entries.length === 0 && <p className="p-6 text-center text-sm text-[#7A8FA6]">The list is empty.</p>}
      </div>
    </div>
  );
}
