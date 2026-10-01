"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Columns, List, Search, Upload, RefreshCw, Plus, Sparkles, Send, X, Mail, Phone, Globe, Ban, Trash2,
  CheckSquare, Square, Filter, Loader2, ArrowRight, Flame,
} from "lucide-react";
import ComplianceNote from "@/components/admin/growth-outreach/ComplianceNote";
import { OFFER_BY_KEY } from "@/lib/growth/outreach/offers";
import { CONSENT_BASES, STAGES } from "@/lib/growth/outreach/shared";
import LeadDrawer from "./LeadDrawer";
import { api, Modal, ScorePill, StagePill, type Lead } from "./ui";
import ImportModal from "./ImportModal";

interface Seq { id: string; name: string; status: string }

const SOURCE_LABEL: Record<string, string> = { aria: "Aria", prospect: "Prospects", csv: "CSV", manual: "Manual", growth: "Growth" };

export default function LeadsClient({ initialLeads, sequences, canSend }: { initialLeads: Lead[]; sequences: Seq[]; canSend: boolean }) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [view, setView] = useState<"kanban" | "table">("kanban");
  const [q, setQ] = useState("");
  const [stage, setStage] = useState("");
  const [industry, setIndustry] = useState("");
  const [area, setArea] = useState("");
  const [source, setSource] = useState("");
  const [minScore, setMinScore] = useState(0);
  const [hasEmail, setHasEmail] = useState<"" | "yes" | "no">("");
  const [hasWebsite, setHasWebsite] = useState<"" | "yes" | "no">("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [openId, setOpenId] = useState<string | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [enrolOpen, setEnrolOpen] = useState(false);
  const [toast, setToast] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const workerRef = useRef(false);

  // Remember the view per browser.
  useEffect(() => {
    try {
      const v = localStorage.getItem("growth-leads-view");
      if (v === "table" || v === "kanban") setView(v);
    } catch { /* ignore */ }
  }, []);
  useEffect(() => {
    try { localStorage.setItem("growth-leads-view", view); } catch { /* ignore */ }
  }, [view]);

  const flash = (kind: "ok" | "err", text: string) => {
    setToast({ kind, text });
    setTimeout(() => setToast(null), 5000);
  };

  const reload = useCallback(async () => {
    const d = await api<{ leads: Lead[] }>("/api/admin/growth/leads");
    setLeads(d.leads);
  }, []);

  // Enrichment worker: while anything is queued, process a few at a time.
  const queued = leads.filter((l) => l.enrichStatus === "queued" || l.enrichStatus === "running").length;
  useEffect(() => {
    if (queued === 0 || workerRef.current) return;
    workerRef.current = true;
    (async () => {
      try {
        for (let i = 0; i < 400; i++) {
          const r = await api<{ processed: number; remaining: number; limited: boolean }>("/api/admin/growth/leads/enrich/run", { method: "POST" });
          await reload();
          if (r.remaining === 0) break;
          await new Promise((res) => setTimeout(res, r.limited ? 15000 : r.processed === 0 ? 4000 : 400));
        }
      } catch (e) {
        flash("err", e instanceof Error ? e.message : "Enrichment worker stopped");
      } finally {
        workerRef.current = false;
      }
    })();
  }, [queued, reload]);

  const industries = useMemo(() => [...new Set(leads.map((l) => l.industry).filter(Boolean) as string[])].sort(), [leads]);
  const areas = useMemo(() => [...new Set(leads.map((l) => l.area).filter(Boolean) as string[])].sort(), [leads]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return leads.filter((l) => {
      if (stage && l.stage !== stage) return false;
      if (industry && l.industry !== industry) return false;
      if (area && l.area !== area) return false;
      if (source && l.source !== source) return false;
      if (minScore > 0 && (l.score ?? -1) < minScore) return false;
      if (hasEmail === "yes" && !l.email) return false;
      if (hasEmail === "no" && l.email) return false;
      if (hasWebsite === "yes" && !l.website) return false;
      if (hasWebsite === "no" && l.website) return false;
      if (needle) {
        const hay = `${l.companyName} ${l.contactName ?? ""} ${l.email ?? ""} ${l.domain ?? ""} ${l.industry ?? ""} ${l.area ?? ""}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
  }, [leads, q, stage, industry, area, source, minScore, hasEmail, hasWebsite]);

  const activeFilters = [stage, industry, area, source, hasEmail, hasWebsite].filter(Boolean).length + (minScore > 0 ? 1 : 0);
  const allSelected = filtered.length > 0 && filtered.every((l) => selected.has(l.id));
  const toggle = (id: string) => setSelected((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(filtered.map((l) => l.id)));

  async function bulk(action: string, value?: string) {
    const ids = [...selected];
    if (!ids.length) return;
    if (action === "delete" && !confirm(`Delete ${ids.length} lead(s) and their outreach history? This cannot be undone.`)) return;
    if (action === "dnc" && !confirm(`Mark ${ids.length} lead(s) do-not-contact? Their addresses go on the suppression list.`)) return;
    setBusy(true);
    try {
      const r = await api<{ count: number }>("/api/admin/growth/leads/bulk", { method: "POST", body: JSON.stringify({ ids, action, value }) });
      flash("ok", action === "enrich" ? `${r.count} lead(s) queued for enrichment` : `Updated ${r.count} lead(s)`);
      if (action === "delete") setSelected(new Set());
      await reload();
    } catch (e) {
      flash("err", e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function sync() {
    setBusy(true);
    try {
      const r = await api<{ created: number; duplicates: number }>("/api/admin/growth/leads/sync", { method: "POST" });
      flash("ok", `Synced: ${r.created} new from Aria/Prospects${r.duplicates ? `, ${r.duplicates} duplicates skipped` : ""}`);
      await reload();
    } catch (e) {
      flash("err", e instanceof Error ? e.message : "Sync failed");
    } finally {
      setBusy(false);
    }
  }

  async function moveStage(id: string, to: string) {
    const lead = leads.find((l) => l.id === id);
    if (!lead || lead.stage === to) return;
    setLeads((ls) => ls.map((l) => (l.id === id ? { ...l, stage: to } : l)));
    try {
      await api(`/api/admin/growth/leads/${id}`, { method: "PATCH", body: JSON.stringify({ stage: to }) });
    } catch (e) {
      flash("err", e instanceof Error ? e.message : "Could not move");
      await reload();
    }
  }

  const counts = useMemo(() => {
    const m = new Map<string, number>();
    for (const l of leads) m.set(l.stage, (m.get(l.stage) ?? 0) + 1);
    return m;
  }, [leads]);
  const withEmail = leads.filter((l) => l.email).length;
  const hot = counts.get("hot") ?? 0;

  return (
    <div className="max-w-[1600px] mx-auto space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-dm text-xs font-semibold uppercase tracking-wider text-[#F47C20]">Growth</p>
          <h1 className="font-syne font-extrabold text-2xl text-[#0D1B2A]">Leads</h1>
          <p className="font-dm text-sm text-[#7A8FA6]">Aria, Prospects and imported lists in one pipeline. Enrich, score, then hand the best ones to outreach.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={sync} disabled={busy} className="btn-admin-secondary inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-[#D2DCE8] bg-white text-sm font-dm font-semibold text-[#1B3A6B] hover:bg-[#F4F7FB] disabled:opacity-50">
            <RefreshCw size={15} className={busy ? "animate-spin" : ""} /> Sync Aria + Prospects
          </button>
          <button onClick={() => setShowImport(true)} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-[#D2DCE8] bg-white text-sm font-dm font-semibold text-[#1B3A6B] hover:bg-[#F4F7FB]" data-testid="open-import">
            <Upload size={15} /> Import CSV
          </button>
          <button onClick={() => setShowAdd(true)} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-[#D2DCE8] bg-white text-sm font-dm font-semibold text-[#1B3A6B] hover:bg-[#F4F7FB]">
            <Plus size={15} /> Add lead
          </button>
          <Link href="/admin_pro/growth/outreach" className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[#1B3A6B] text-white text-sm font-dm font-semibold hover:bg-[#2251A3]">
            <Send size={15} /> Outreach <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Leads", value: leads.length },
          { label: "With a public email", value: withEmail },
          { label: "Hot", value: hot, accent: true },
          { label: "Enrichment queue", value: queued },
        ].map((k) => (
          <div key={k.label} className="rounded-2xl bg-white border border-[#E5EAF2] px-4 py-3">
            <p className="font-dm text-xs text-[#7A8FA6]">{k.label}</p>
            <p className={`font-syne font-bold text-2xl ${k.accent ? "text-[#F47C20]" : "text-[#0D1B2A]"}`}>
              {k.value}
              {k.label === "Enrichment queue" && queued > 0 && <Loader2 size={16} className="inline ml-2 animate-spin text-[#2251A3]" />}
            </p>
          </div>
        ))}
      </div>

      <ComplianceNote />

      {/* Toolbar */}
      <div className="rounded-2xl bg-white border border-[#E5EAF2] p-3 space-y-3">
        <div className="flex flex-col gap-2 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7A8FA6]" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search company, contact, email, domain..." className="w-full pl-9 pr-3 py-2 rounded-lg border border-[#D2DCE8] font-dm text-sm focus:outline-none focus:ring-2 focus:ring-[#2251A3]/30" />
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowFilters((s) => !s)} className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-dm font-semibold ${activeFilters ? "border-[#2251A3] text-[#2251A3] bg-[#EBF0FA]" : "border-[#D2DCE8] text-[#3A4A5C]"}`}>
              <Filter size={15} /> Filters{activeFilters ? ` (${activeFilters})` : ""}
            </button>
            <div className="inline-flex rounded-lg border border-[#D2DCE8] overflow-hidden">
              <button onClick={() => setView("kanban")} aria-label="Kanban view" className={`px-3 py-2 ${view === "kanban" ? "bg-[#1B3A6B] text-white" : "text-[#3A4A5C]"}`}><Columns size={15} /></button>
              <button onClick={() => setView("table")} aria-label="Table view" className={`px-3 py-2 ${view === "table" ? "bg-[#1B3A6B] text-white" : "text-[#3A4A5C]"}`}><List size={15} /></button>
            </div>
          </div>
        </div>
        {showFilters && (
          <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-2 font-dm text-sm">
            <Sel label="Stage" value={stage} onChange={setStage} options={STAGES.map((s) => [s.key, s.label])} />
            <Sel label="Industry" value={industry} onChange={setIndustry} options={industries.map((i) => [i, i])} />
            <Sel label="Area" value={area} onChange={setArea} options={areas.map((a) => [a, a])} />
            <Sel label="Source" value={source} onChange={setSource} options={Object.entries(SOURCE_LABEL)} />
            <Sel label="Has email" value={hasEmail} onChange={(v) => setHasEmail(v as "" | "yes" | "no")} options={[["yes", "Yes"], ["no", "No"]]} />
            <Sel label="Has website" value={hasWebsite} onChange={(v) => setHasWebsite(v as "" | "yes" | "no")} options={[["yes", "Yes"], ["no", "No"]]} />
            <label className="col-span-2 flex flex-col gap-1">
              <span className="text-xs text-[#7A8FA6]">Min score: <b className="text-[#0D1B2A]">{minScore}</b></span>
              <input type="range" min={0} max={100} step={5} value={minScore} onChange={(e) => setMinScore(Number(e.target.value))} className="accent-[#F47C20]" />
            </label>
          </div>
        )}
        {selected.size > 0 && (
          <div className="flex flex-wrap items-center gap-2 rounded-xl bg-[#0D1B2A] text-white px-3 py-2 font-dm text-sm" data-testid="bulk-bar">
            <span className="font-semibold">{selected.size} selected</span>
            <span className="opacity-30">|</span>
            <BulkBtn onClick={() => bulk("enrich")} disabled={busy}><Sparkles size={14} /> Enrich + score</BulkBtn>
            <BulkBtn onClick={() => setEnrolOpen(true)} disabled={busy}><Send size={14} /> Add to sequence</BulkBtn>
            <select onChange={(e) => { if (e.target.value) bulk("stage", e.target.value); e.target.value = ""; }} className="bg-white/10 rounded-md px-2 py-1 text-white text-sm" defaultValue="">
              <option value="" className="text-black">Set stage...</option>
              {STAGES.map((s) => <option key={s.key} value={s.key} className="text-black">{s.label}</option>)}
            </select>
            <select onChange={(e) => { if (e.target.value) bulk("consent", e.target.value); e.target.value = ""; }} className="bg-white/10 rounded-md px-2 py-1 text-white text-sm max-w-[200px]" defaultValue="">
              <option value="" className="text-black">Set consent basis...</option>
              {CONSENT_BASES.map((c) => <option key={c.key} value={c.key} className="text-black">{c.label}</option>)}
            </select>
            <BulkBtn onClick={() => bulk("dnc")} disabled={busy}><Ban size={14} /> Do not contact</BulkBtn>
            <BulkBtn onClick={() => bulk("delete")} disabled={busy}><Trash2 size={14} /> Delete</BulkBtn>
            <button onClick={() => setSelected(new Set())} className="ml-auto opacity-70 hover:opacity-100"><X size={16} /></button>
          </div>
        )}
      </div>

      {/* Body */}
      {leads.length === 0 ? (
        <div className="rounded-2xl bg-white border border-dashed border-[#D2DCE8] p-10 text-center">
          <p className="font-syne font-bold text-lg text-[#0D1B2A]">No leads yet</p>
          <p className="font-dm text-sm text-[#7A8FA6] mt-1">Find leads with <Link className="text-[#2251A3] underline" href="/admin_pro/agents/aria">Aria</Link>, import a CSV, or add one by hand.</p>
        </div>
      ) : view === "kanban" ? (
        <div className="flex gap-3 overflow-x-auto pb-3 snap-x" data-testid="kanban">
          {STAGES.map((s) => {
            const col = filtered.filter((l) => l.stage === s.key).sort((a, b) => (b.score ?? -1) - (a.score ?? -1));
            return (
              <div
                key={s.key}
                className="snap-start flex-shrink-0 w-[280px] rounded-2xl bg-[#EEF2F7] p-2 flex flex-col max-h-[70vh]"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { const id = e.dataTransfer.getData("text/plain"); if (id) moveStage(id, s.key); }}
              >
                <div className="flex items-center justify-between px-2 py-1.5">
                  <span className="flex items-center gap-2 font-dm text-sm font-semibold text-[#0D1B2A]">
                    <span className="w-2 h-2 rounded-full" style={{ background: s.color }} /> {s.label}
                  </span>
                  <span className="font-dm text-xs text-[#7A8FA6]">{col.length}</span>
                </div>
                <div className="flex-1 overflow-y-auto space-y-2 p-1">
                  {col.slice(0, 200).map((l) => (
                    <LeadCard key={l.id} lead={l} selected={selected.has(l.id)} onToggle={() => toggle(l.id)} onOpen={() => setOpenId(l.id)} />
                  ))}
                  {col.length > 200 && <p className="text-center text-xs text-[#7A8FA6] font-dm py-2">+{col.length - 200} more: use filters or table view</p>}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl bg-white border border-[#E5EAF2] overflow-x-auto" data-testid="table">
          <table className="w-full min-w-[980px] font-dm text-sm">
            <thead className="bg-[#F4F7FB] text-[#7A8FA6] text-xs uppercase tracking-wide">
              <tr>
                <th className="p-3 w-10"><button onClick={toggleAll} aria-label="Select all">{allSelected ? <CheckSquare size={16} /> : <Square size={16} />}</button></th>
                <th className="p-3 text-left">Company</th>
                <th className="p-3 text-left">Email</th>
                <th className="p-3 text-left">Industry / area</th>
                <th className="p-3 text-left">Score</th>
                <th className="p-3 text-left">Best offer</th>
                <th className="p-3 text-left">Stage</th>
                <th className="p-3 text-left">Source</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 1000).map((l) => (
                <tr key={l.id} className="border-t border-[#F0F3F8] hover:bg-[#FAFBFD] cursor-pointer" onClick={() => setOpenId(l.id)}>
                  <td className="p-3" onClick={(e) => { e.stopPropagation(); toggle(l.id); }}>{selected.has(l.id) ? <CheckSquare size={16} className="text-[#2251A3]" /> : <Square size={16} className="text-[#B7C3D3]" />}</td>
                  <td className="p-3">
                    <p className="font-semibold text-[#0D1B2A]">{l.companyName}</p>
                    <p className="text-xs text-[#7A8FA6]">{[l.contactName, l.domain].filter(Boolean).join(" · ")}</p>
                  </td>
                  <td className="p-3 text-xs">
                    {l.email ? <span className="text-[#0F6E56]">{l.email}</span> : <span className="text-[#9CA3AF]">{l.emailStatus === "none_found" ? "No public email found" : "-"}</span>}
                  </td>
                  <td className="p-3 text-xs text-[#3A4A5C]">{[l.industry, l.area].filter(Boolean).join(" · ") || "-"}</td>
                  <td className="p-3"><ScorePill lead={l} /></td>
                  <td className="p-3 text-xs text-[#3A4A5C] max-w-[220px] truncate">{l.bestOffer ? OFFER_BY_KEY.get(l.bestOffer)?.name : "-"}</td>
                  <td className="p-3"><StagePill stage={l.stage} /></td>
                  <td className="p-3 text-xs text-[#7A8FA6]">{SOURCE_LABEL[l.source] ?? l.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <p className="p-6 text-center text-sm text-[#7A8FA6] font-dm">No leads match these filters.</p>}
        </div>
      )}

      {openId && (
        <LeadDrawer
          id={openId}
          canSend={canSend}
          onClose={() => setOpenId(null)}
          onChanged={reload}
          flash={flash}
        />
      )}
      {showImport && <ImportModal onClose={() => setShowImport(false)} onDone={async () => { await reload(); }} />}
      {showAdd && <AddLeadModal onClose={() => setShowAdd(false)} onDone={async (id) => { await reload(); setShowAdd(false); setOpenId(id); }} />}
      {enrolOpen && (
        <EnrolModal
          ids={[...selected]}
          sequences={sequences}
          onClose={() => setEnrolOpen(false)}
          onDone={async () => { await reload(); }}
        />
      )}

      {toast && (
        <div role="status" className={`fixed bottom-5 right-5 z-[60] max-w-sm rounded-xl px-4 py-3 shadow-lg font-dm text-sm ${toast.kind === "ok" ? "bg-[#0D1B2A] text-white" : "bg-red-600 text-white"}`}>
          {toast.text}
        </div>
      )}
    </div>
  );
}

function Sel({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: Array<[string, string]> }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs text-[#7A8FA6]">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="rounded-lg border border-[#D2DCE8] px-2 py-1.5 bg-white">
        <option value="">All</option>
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </label>
  );
}

function BulkBtn({ children, onClick, disabled }: { children: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} className="inline-flex items-center gap-1.5 rounded-md bg-white/10 hover:bg-white/20 px-2.5 py-1 disabled:opacity-50">
      {children}
    </button>
  );
}

function LeadCard({ lead, selected, onToggle, onOpen }: { lead: Lead; selected: boolean; onToggle: () => void; onOpen: () => void }) {
  return (
    <div
      draggable
      onDragStart={(e) => e.dataTransfer.setData("text/plain", lead.id)}
      onClick={onOpen}
      className={`group rounded-xl bg-white border p-3 cursor-pointer hover:shadow-md transition-shadow ${selected ? "border-[#2251A3] ring-2 ring-[#2251A3]/20" : "border-[#E5EAF2]"}`}
      data-testid="lead-card"
    >
      <div className="flex items-start gap-2">
        <button onClick={(e) => { e.stopPropagation(); onToggle(); }} aria-label="Select" className="mt-0.5 text-[#B7C3D3] hover:text-[#2251A3]">
          {selected ? <CheckSquare size={15} className="text-[#2251A3]" /> : <Square size={15} />}
        </button>
        <div className="min-w-0 flex-1">
          <p className="font-dm font-semibold text-sm text-[#0D1B2A] truncate">{lead.companyName}</p>
          <p className="font-dm text-xs text-[#7A8FA6] truncate">{[lead.industry, lead.area].filter(Boolean).join(" · ") || lead.domain || " "}</p>
        </div>
        <ScorePill lead={lead} />
      </div>
      {lead.bestOffer && <p className="mt-2 font-dm text-[11px] text-[#2251A3] truncate">{OFFER_BY_KEY.get(lead.bestOffer)?.name}</p>}
      <div className="mt-2 flex items-center gap-2 text-[#B7C3D3]">
        <Mail size={13} className={lead.email ? "text-[#0F6E56]" : ""} />
        <Phone size={13} className={lead.phone ? "text-[#0F6E56]" : ""} />
        <Globe size={13} className={lead.website ? "text-[#0F6E56]" : ""} />
        {lead.handedOverAt && <Flame size={13} className="text-[#F47C20]" />}
        {lead.doNotContact && <Ban size={13} className="text-red-500" />}
        <span className="ml-auto font-dm text-[10px] text-[#9CA3AF]">{SOURCE_LABEL[lead.source] ?? lead.source}</span>
      </div>
    </div>
  );
}

function AddLeadModal({ onClose, onDone }: { onClose: () => void; onDone: (id: string) => void }) {
  const [f, setF] = useState<Record<string, string>>({ consentBasis: "unset" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const fields: Array<[string, string]> = [["companyName", "Company *"], ["contactName", "Contact name"], ["role", "Role"], ["email", "Business email"], ["phone", "Phone"], ["website", "Website"], ["industry", "Industry"], ["area", "City / area"], ["linkedinUrl", "LinkedIn URL"]];
  async function save() {
    setBusy(true);
    setErr("");
    try {
      const r = await api<{ lead: { id: string } }>("/api/admin/growth/leads", { method: "POST", body: JSON.stringify(f) });
      onDone(r.lead.id);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal title="Add lead" onClose={onClose}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-dm text-sm">
        {fields.map(([k, label]) => (
          <label key={k} className="flex flex-col gap-1">
            <span className="text-xs text-[#7A8FA6]">{label}</span>
            <input value={f[k] ?? ""} onChange={(e) => setF({ ...f, [k]: e.target.value })} className="rounded-lg border border-[#D2DCE8] px-3 py-2" />
          </label>
        ))}
        <label className="flex flex-col gap-1 sm:col-span-2">
          <span className="text-xs text-[#7A8FA6]">Consent basis</span>
          <select value={f.consentBasis} onChange={(e) => setF({ ...f, consentBasis: e.target.value })} className="rounded-lg border border-[#D2DCE8] px-2 py-2">
            {CONSENT_BASES.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
          </select>
        </label>
      </div>
      {err && <p className="mt-3 text-sm text-red-600 font-dm">{err}</p>}
      <div className="mt-4 flex justify-end gap-2">
        <button onClick={onClose} className="px-4 py-2 rounded-lg font-dm text-sm text-[#3A4A5C]">Cancel</button>
        <button onClick={save} disabled={busy || !f.companyName} className="px-4 py-2 rounded-lg bg-[#F47C20] text-white font-dm text-sm font-semibold disabled:opacity-50">Add lead</button>
      </div>
    </Modal>
  );
}

function EnrolModal({ ids, sequences, onClose, onDone }: { ids: string[]; sequences: Seq[]; onClose: () => void; onDone: () => Promise<void> }) {
  const [seq, setSeq] = useState(sequences.find((s) => s.status === "active")?.id ?? "");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ enrolled: number; skipped: Array<{ company: string; reason: string }> } | null>(null);
  const [err, setErr] = useState("");
  async function run() {
    setBusy(true);
    setErr("");
    let enrolled = 0;
    const skipped: Array<{ company: string; reason: string }> = [];
    try {
      for (let i = 0; i < ids.length; i += 25) {
        const r = await api<{ enrolled: unknown[]; skipped: Array<{ company: string; reason: string }> }>("/api/admin/growth/outreach/enroll", {
          method: "POST", body: JSON.stringify({ sequenceId: seq, leadIds: ids.slice(i, i + 25) }),
        });
        enrolled += r.enrolled.length;
        skipped.push(...r.skipped);
        setProgress(Math.min(ids.length, i + 25));
      }
      setResult({ enrolled, skipped });
      await onDone();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal title={`Add ${ids.length} lead(s) to a sequence`} onClose={onClose}>
      {!result ? (
        <div className="space-y-3 font-dm text-sm">
          <p className="text-[#3A4A5C]">Every email of the sequence is drafted for each lead (personalised by AI where the step asks for it). <b>Nothing is sent</b> until you approve the drafts on the Outreach page.</p>
          <select value={seq} onChange={(e) => setSeq(e.target.value)} className="w-full rounded-lg border border-[#D2DCE8] px-3 py-2">
            {sequences.map((s) => <option key={s.id} value={s.id}>{s.name}{s.status !== "active" ? ` (${s.status})` : ""}</option>)}
          </select>
          <p className="text-xs text-[#7A8FA6]">Leads without an email, without a consent basis, on the suppression list, or already replied are skipped and listed.</p>
          {busy && <p className="text-[#2251A3] flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Drafting... {progress}/{ids.length}</p>}
          {err && <p className="text-red-600">{err}</p>}
          <div className="flex justify-end gap-2">
            <button onClick={onClose} className="px-4 py-2 rounded-lg text-[#3A4A5C]">Cancel</button>
            <button onClick={run} disabled={busy || !seq} className="px-4 py-2 rounded-lg bg-[#F47C20] text-white font-semibold disabled:opacity-50" data-testid="enrol-run">Draft emails</button>
          </div>
        </div>
      ) : (
        <div className="space-y-3 font-dm text-sm" data-testid="enrol-result">
          <p className="text-[#0F6E56] font-semibold">{result.enrolled} lead(s) drafted and waiting for your approval.</p>
          {result.skipped.length > 0 && (
            <div>
              <p className="text-[#B8500A] font-semibold">{result.skipped.length} skipped</p>
              <ul className="mt-1 max-h-48 overflow-y-auto text-xs text-[#3A4A5C] space-y-0.5">
                {result.skipped.map((s, i) => <li key={i}><b>{s.company}</b>: {s.reason}</li>)}
              </ul>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <button onClick={onClose} className="px-4 py-2 rounded-lg text-[#3A4A5C]">Close</button>
            <Link href="/admin_pro/growth/outreach" className="px-4 py-2 rounded-lg bg-[#1B3A6B] text-white font-semibold">Review and approve</Link>
          </div>
        </div>
      )}
    </Modal>
  );
}
