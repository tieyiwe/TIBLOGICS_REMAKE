"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Columns3, List, Upload, RefreshCw, Plus, Sparkles, Send, X, Mail, Phone, Globe, Ban, Trash2,
  CheckSquare, Square, Filter, Loader2, Flame, Linkedin, MessageSquareReply, MousePointerClick, ArrowUpRight, Users,
} from "lucide-react";
import ComplianceNote from "@/components/admin/growth-outreach/ComplianceNote";
import { Button, EmptyState, Kbd, SearchInput, Segmented, StatCard, Toolbar, useToast } from "@/components/admin/ui";
import { OFFER_BY_KEY } from "@/lib/growth/outreach/offers";
import { CONSENT_BASES, STAGES } from "@/lib/growth/outreach/shared";
import GrowthTabs from "../_components/GrowthTabs";
import { PageHeader } from "../_components/ui";
import LeadDrawer from "./LeadDrawer";
import { api, Modal, ScorePill, StagePill, type Lead } from "./ui";
import ImportModal from "./ImportModal";

interface Seq { id: string; name: string; status: string }

const SOURCE_LABEL: Record<string, string> = { aria: "Aria", prospect: "Prospects", csv: "CSV", manual: "Manual", growth: "Growth" };

const isTyping = (t: EventTarget | null) => {
  const el = t as HTMLElement | null;
  return !!el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT" || el.isContentEditable);
};

export default function LeadsClient({ initialLeads, sequences, canSend, clicks = {}, initialOpen = null }: {
  initialLeads: Lead[]; sequences: Seq[]; canSend: boolean; clicks?: Record<string, number>; initialOpen?: string | null;
}) {
  const toastApi = useToast();
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
  const [warmOnly, setWarmOnly] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [openId, setOpenId] = useState<string | null>(initialOpen);
  const [focusId, setFocusId] = useState<string | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [enrolIds, setEnrolIds] = useState<string[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [rowBusy, setRowBusy] = useState<string | null>(null);
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

  // Stable, so the drawer's loader does not re-run on every render.
  const flash = useCallback((kind: "ok" | "err", text: string) => {
    if (kind === "ok") toastApi.success(text);
    else toastApi.error(text);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
  }, [queued, reload, flash]);

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
      if (warmOnly && !clicks[l.id] && !l.repliedAt) return false;
      if (needle) {
        const hay = `${l.companyName} ${l.contactName ?? ""} ${l.email ?? ""} ${l.domain ?? ""} ${l.industry ?? ""} ${l.area ?? ""}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
  }, [leads, q, stage, industry, area, source, minScore, hasEmail, hasWebsite, warmOnly, clicks]);

  // Columns, and a flat order for j/k (column by column, best score first).
  const columns = useMemo(
    () => STAGES.map((s) => ({ stage: s, leads: filtered.filter((l) => l.stage === s.key).sort((a, b) => (b.score ?? -1) - (a.score ?? -1)) })),
    [filtered],
  );
  const order = useMemo(() => (view === "kanban" ? columns.flatMap((c) => c.leads.slice(0, 200)) : filtered.slice(0, 1000)), [view, columns, filtered]);

  const activeFilters = [stage, industry, area, source, hasEmail, hasWebsite].filter(Boolean).length + (minScore > 0 ? 1 : 0) + (warmOnly ? 1 : 0);
  const allSelected = filtered.length > 0 && filtered.every((l) => selected.has(l.id));
  const toggle = useCallback((id: string) => setSelected((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; }), []);
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(filtered.map((l) => l.id)));

  async function bulk(action: string, value?: string, ids = [...selected]) {
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

  async function quick(id: string, action: "enrich" | "hot") {
    setRowBusy(`${id}:${action}`);
    try {
      if (action === "enrich") {
        await api("/api/admin/growth/leads/bulk", { method: "POST", body: JSON.stringify({ ids: [id], action: "enrich" }) });
        flash("ok", "Queued for enrichment");
      } else {
        await api(`/api/admin/growth/leads/${id}/action`, { method: "POST", body: JSON.stringify({ action: "hot" }) });
        flash("ok", "Marked hot");
      }
      await reload();
    } catch (e) {
      flash("err", e instanceof Error ? e.message : "Failed");
    } finally {
      setRowBusy(null);
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
      flash("ok", `${lead.companyName} moved to ${STAGES.find((s) => s.key === to)?.label ?? to}`);
    } catch (e) {
      flash("err", e instanceof Error ? e.message : "Could not move");
      await reload();
    }
  }

  // Keyboard: j/k move, Enter or o opens, x selects, e enriches, Esc clears.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (openId || showImport || showAdd || enrolIds || isTyping(e.target) || e.metaKey || e.ctrlKey || e.altKey) return;
      const i = focusId ? order.findIndex((l) => l.id === focusId) : -1;
      const go = (n: number) => {
        const next = order[Math.max(0, Math.min(order.length - 1, n))];
        if (!next) return;
        setFocusId(next.id);
        document.querySelector<HTMLElement>(`[data-lead-id="${next.id}"]`)?.focus({ preventScroll: false });
      };
      if (e.key === "j" || e.key === "ArrowDown") { e.preventDefault(); go(i + 1); }
      else if (e.key === "k" || e.key === "ArrowUp") { e.preventDefault(); go(i < 0 ? 0 : i - 1); }
      else if ((e.key === "Enter" || e.key === "o") && focusId) { e.preventDefault(); setOpenId(focusId); }
      else if (e.key === "x" && focusId) { e.preventDefault(); toggle(focusId); }
      else if (e.key === "e" && focusId) { e.preventDefault(); quick(focusId, "enrich"); }
      else if (e.key === "/") { e.preventDefault(); document.querySelector<HTMLInputElement>("#lead-search")?.focus(); }
      else if (e.key === "Escape") { setSelected(new Set()); setFocusId(null); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order, focusId, openId, showImport, showAdd, enrolIds, toggle]);

  const counts = useMemo(() => {
    const m = new Map<string, number>();
    for (const l of leads) m.set(l.stage, (m.get(l.stage) ?? 0) + 1);
    return m;
  }, [leads]);
  const withEmail = leads.filter((l) => l.email).length;
  const hot = counts.get("hot") ?? 0;
  const warm = leads.filter((l) => clicks[l.id] && !["converted", "lost"].includes(l.stage)).length;

  return (
    <div className="mx-auto max-w-[1600px] space-y-5">
      <PageHeader
        title="Leads"
        subtitle="Aria, Prospects and imported lists in one pipeline. Enrich, score, then hand the best ones to outreach."
        actions={
          <>
            <Button icon={RefreshCw} onClick={sync} loading={busy} className="hidden sm:inline-flex">Sync Aria + Prospects</Button>
            <Button icon={Upload} onClick={() => setShowImport(true)} data-testid="open-import">Import CSV</Button>
            <Button icon={Plus} onClick={() => setShowAdd(true)}>Add lead</Button>
            <Button variant="primary" icon={Send} href="/admin_pro/growth/outreach">Outreach</Button>
          </>
        }
      />
      <GrowthTabs />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Leads" value={leads.length.toLocaleString("en-US")} icon={Users} />
        <StatCard label="With a public email" value={withEmail.toLocaleString("en-US")} hint={leads.length ? `${Math.round((withEmail / leads.length) * 100)}% reachable` : undefined} icon={Mail} />
        <StatCard label="Hot" value={hot} tone={hot ? "orange" : "default"} icon={Flame} />
        <StatCard label="Clicked your links" value={warm} hint={queued ? `${queued} in enrichment queue` : "Last 30 days"} tone={warm ? "success" : "default"} icon={MousePointerClick} />
      </div>

      <ComplianceNote />

      <div className="space-y-3">
        <Toolbar
          className="mb-0"
          end={
            <Segmented
              ariaLabel="Leads view"
              value={view}
              onChange={(v) => setView(v as "kanban" | "table")}
              options={[
                { value: "kanban", label: <><Columns3 size={14} aria-hidden /> Board</> },
                { value: "table", label: <><List size={14} aria-hidden /> Table</> },
              ]}
            />
          }
        >
          <SearchInput id="lead-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search company, contact, email, domain" label="Search leads" className="sm:max-w-sm" />
          <Button icon={Filter} onClick={() => setShowFilters((s) => !s)} className={activeFilters ? "border-[var(--a-blue)] bg-[var(--a-info-bg)] text-[var(--a-blue)]" : ""} aria-expanded={showFilters}>
            Filters{activeFilters ? ` (${activeFilters})` : ""}
          </Button>
          <Button icon={MousePointerClick} onClick={() => setWarmOnly((w) => !w)} aria-pressed={warmOnly} className={warmOnly ? "border-[var(--a-success)] bg-[var(--a-success-bg)] text-[var(--a-success)]" : ""}>
            Warm{warm ? ` ${warm}` : ""}
          </Button>
          <span className="hidden items-center gap-1 font-dm text-[12px] text-[var(--a-ink-3)] lg:inline-flex">
            <Kbd>j</Kbd><Kbd>k</Kbd> move <Kbd>Enter</Kbd> open <Kbd>x</Kbd> select <Kbd>e</Kbd> enrich
          </span>
        </Toolbar>
        {showFilters && (
          <div className="grid grid-cols-2 gap-2 rounded-[var(--a-radius-card)] border border-[var(--a-border)] bg-[var(--a-surface)] p-3 font-dm text-sm md:grid-cols-4 xl:grid-cols-8">
            <Sel label="Stage" value={stage} onChange={setStage} options={STAGES.map((s) => [s.key, s.label])} />
            <Sel label="Industry" value={industry} onChange={setIndustry} options={industries.map((i) => [i, i])} />
            <Sel label="Area" value={area} onChange={setArea} options={areas.map((a) => [a, a])} />
            <Sel label="Source" value={source} onChange={setSource} options={Object.entries(SOURCE_LABEL)} />
            <Sel label="Has email" value={hasEmail} onChange={(v) => setHasEmail(v as "" | "yes" | "no")} options={[["yes", "Yes"], ["no", "No"]]} />
            <Sel label="Has website" value={hasWebsite} onChange={(v) => setHasWebsite(v as "" | "yes" | "no")} options={[["yes", "Yes"], ["no", "No"]]} />
            <label className="col-span-2 flex flex-col gap-1">
              <span className="text-[12px] font-semibold text-[var(--a-ink-2)]">Min score: <b className="tabular-nums text-[var(--a-ink)]">{minScore}</b></span>
              <input type="range" min={0} max={100} step={5} value={minScore} onChange={(e) => setMinScore(Number(e.target.value))} className="accent-[var(--a-orange)]" />
            </label>
          </div>
        )}
        {selected.size > 0 && (
          <div className="a-anim-fade flex flex-wrap items-center gap-2 rounded-[var(--a-radius-card)] bg-[var(--a-navy-deep)] px-3 py-2 font-dm text-[13px] text-white shadow-[var(--a-shadow-pop)]" data-testid="bulk-bar">
            <span className="font-semibold tabular-nums">{selected.size} selected</span>
            <span className="opacity-30">|</span>
            <BulkBtn onClick={() => bulk("enrich")} disabled={busy}><Sparkles size={14} /> Enrich + score</BulkBtn>
            <BulkBtn onClick={() => setEnrolIds([...selected])} disabled={busy}><Send size={14} /> Add to sequence</BulkBtn>
            <select onChange={(e) => { if (e.target.value) bulk("stage", e.target.value); e.target.value = ""; }} className="h-8 rounded-md bg-white/10 px-2 text-[13px] text-white" defaultValue="" aria-label="Set stage">
              <option value="" className="text-black">Set stage</option>
              {STAGES.map((s) => <option key={s.key} value={s.key} className="text-black">{s.label}</option>)}
            </select>
            <select onChange={(e) => { if (e.target.value) bulk("consent", e.target.value); e.target.value = ""; }} className="h-8 max-w-[200px] rounded-md bg-white/10 px-2 text-[13px] text-white" defaultValue="" aria-label="Set consent basis">
              <option value="" className="text-black">Set consent basis</option>
              {CONSENT_BASES.map((c) => <option key={c.key} value={c.key} className="text-black">{c.label}</option>)}
            </select>
            <BulkBtn onClick={() => bulk("dnc")} disabled={busy}><Ban size={14} /> Do not contact</BulkBtn>
            <BulkBtn onClick={() => bulk("delete")} disabled={busy}><Trash2 size={14} /> Delete</BulkBtn>
            <button onClick={() => setSelected(new Set())} className="ml-auto flex h-8 w-8 items-center justify-center rounded-md opacity-70 hover:bg-white/10 hover:opacity-100" aria-label="Clear selection"><X size={16} /></button>
          </div>
        )}
      </div>

      {/* Body */}
      {leads.length === 0 ? (
        <div className="rounded-[var(--a-radius-card)] border border-[var(--a-border)] bg-[var(--a-surface)]">
          <EmptyState
            icon={Users}
            title="No leads yet"
            body={<>Find leads with <Link className="text-[var(--a-blue)] underline" href="/admin_pro/agents/aria">Aria</Link>, import a CSV, or add one by hand.</>}
            action={<div className="flex gap-2"><Button variant="primary" icon={Upload} onClick={() => setShowImport(true)}>Import CSV</Button><Button icon={Plus} onClick={() => setShowAdd(true)}>Add lead</Button></div>}
          />
        </div>
      ) : view === "kanban" ? (
        <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-3 sm:mx-0 sm:px-0" data-testid="kanban">
          {columns.map(({ stage: s, leads: col }) => (
            <div
              key={s.key}
              className="flex max-h-[72vh] w-[min(296px,82vw)] flex-shrink-0 snap-start flex-col rounded-[var(--a-radius-card)] border border-[var(--a-border)] bg-[var(--a-surface-2)]"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { const id = e.dataTransfer.getData("text/plain"); if (id) moveStage(id, s.key); }}
            >
              <div className="flex items-center justify-between px-3 pb-1.5 pt-2.5">
                <span className="flex items-center gap-2 font-dm text-[13px] font-semibold text-[var(--a-ink)]">
                  <span className="h-2 w-2 rounded-full" style={{ background: s.color }} /> {s.label}
                </span>
                <span className="rounded-full bg-[var(--a-surface)] px-2 font-dm text-[11.5px] font-semibold tabular-nums text-[var(--a-ink-3)] ring-1 ring-inset ring-[var(--a-border)]">{col.length}</span>
              </div>
              <div className="flex-1 space-y-2 overflow-y-auto p-2 pt-1">
                {col.slice(0, 200).map((l) => (
                  <LeadCard
                    key={l.id}
                    lead={l}
                    clicks={clicks[l.id] ?? 0}
                    focused={focusId === l.id}
                    selected={selected.has(l.id)}
                    busy={rowBusy}
                    onFocus={() => setFocusId(l.id)}
                    onToggle={() => toggle(l.id)}
                    onOpen={() => setOpenId(l.id)}
                    onEnrich={() => quick(l.id, "enrich")}
                    onHot={() => quick(l.id, "hot")}
                    onEnrol={() => setEnrolIds([l.id])}
                  />
                ))}
                {col.length === 0 && <p className="px-2 py-4 text-center font-dm text-[12px] text-[var(--a-ink-3)]">Drop a lead here</p>}
                {col.length > 200 && <p className="py-2 text-center font-dm text-[12px] text-[var(--a-ink-3)]">+{col.length - 200} more: use filters or table view</p>}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-[var(--a-radius-card)] border border-[var(--a-border)] bg-[var(--a-surface)] shadow-[var(--a-shadow-card)]" data-testid="table">
          {/* Cards on phones */}
          <ul className="divide-y divide-[var(--a-border)] md:hidden">
            {filtered.slice(0, 300).map((l) => (
              <li key={l.id}>
                <button className="flex w-full items-center gap-3 px-4 py-3 text-left" onClick={() => setOpenId(l.id)}>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-dm text-[14px] font-semibold text-[var(--a-ink)]">{l.companyName}</span>
                    <span className="mt-1 flex items-center gap-2"><StagePill stage={l.stage} /><Signals lead={l} clicks={clicks[l.id] ?? 0} /></span>
                  </span>
                  <ScorePill lead={l} />
                </button>
              </li>
            ))}
          </ul>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[980px] font-dm text-[13px]">
              <thead className="sticky top-0 bg-[var(--a-surface-2)] text-[11px] uppercase tracking-[.08em] text-[var(--a-ink-3)]">
                <tr>
                  <th className="w-10 p-3"><button onClick={toggleAll} aria-label="Select all">{allSelected ? <CheckSquare size={16} className="text-[var(--a-blue)]" /> : <Square size={16} />}</button></th>
                  <th className="p-3 text-left font-semibold">Company</th>
                  <th className="p-3 text-left font-semibold">Score</th>
                  <th className="p-3 text-left font-semibold">Signals</th>
                  <th className="p-3 text-left font-semibold">Industry / area</th>
                  <th className="p-3 text-left font-semibold">Best offer</th>
                  <th className="p-3 text-left font-semibold">Stage</th>
                  <th className="p-3 text-left font-semibold">Source</th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 1000).map((l) => (
                  <tr
                    key={l.id}
                    data-lead-id={l.id}
                    tabIndex={-1}
                    onFocus={() => setFocusId(l.id)}
                    className={`cursor-pointer border-t border-[var(--a-border)] outline-none transition-colors hover:bg-[var(--a-surface-2)] ${focusId === l.id ? "bg-[var(--a-info-bg)]" : ""}`}
                    onClick={() => setOpenId(l.id)}
                  >
                    <td className="p-3" onClick={(e) => { e.stopPropagation(); toggle(l.id); }}>{selected.has(l.id) ? <CheckSquare size={16} className="text-[var(--a-blue)]" /> : <Square size={16} className="text-[var(--a-border-strong)]" />}</td>
                    <td className="p-3">
                      <p className="font-semibold text-[var(--a-ink)]">{l.companyName}</p>
                      <p className="text-[12px] text-[var(--a-ink-3)]">{[l.contactName, l.email ?? l.domain].filter(Boolean).join(" · ")}</p>
                    </td>
                    <td className="p-3"><ScorePill lead={l} /></td>
                    <td className="p-3"><Signals lead={l} clicks={clicks[l.id] ?? 0} /></td>
                    <td className="p-3 text-[12px] text-[var(--a-ink-2)]">{[l.industry, l.area].filter(Boolean).join(" · ") || "-"}</td>
                    <td className="max-w-[220px] truncate p-3 text-[12px] text-[var(--a-ink-2)]">{l.bestOffer ? OFFER_BY_KEY.get(l.bestOffer)?.name : "-"}</td>
                    <td className="p-3"><StagePill stage={l.stage} /></td>
                    <td className="p-3 text-[12px] text-[var(--a-ink-3)]">{SOURCE_LABEL[l.source] ?? l.source}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && <EmptyState compact icon={Filter} title="No leads match these filters" />}
        </div>
      )}

      {openId && (
        <LeadDrawer
          id={openId}
          canSend={canSend}
          onClose={() => {
            const id = openId;
            setOpenId(null);
            setFocusId(id);
            requestAnimationFrame(() => document.querySelector<HTMLElement>(`[data-lead-id="${id}"]`)?.focus());
          }}
          onChanged={reload}
          flash={flash}
        />
      )}
      {showImport && <ImportModal onClose={() => setShowImport(false)} onDone={async () => { await reload(); }} />}
      {showAdd && <AddLeadModal onClose={() => setShowAdd(false)} onDone={async (id) => { await reload(); setShowAdd(false); setOpenId(id); }} />}
      {enrolIds && (
        <EnrolModal
          ids={enrolIds}
          sequences={sequences}
          onClose={() => setEnrolIds(null)}
          onDone={async () => { await reload(); }}
        />
      )}
    </div>
  );
}

function Sel({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: Array<[string, string]> }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[12px] font-semibold text-[var(--a-ink-2)]">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="h-9 rounded-[var(--a-radius-control)] border border-[var(--a-border-strong)] bg-[var(--a-surface)] px-2 text-[13px] focus:border-[var(--a-blue)] focus:outline-none">
        <option value="">All</option>
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </label>
  );
}

function BulkBtn({ children, onClick, disabled }: { children: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} className="inline-flex h-8 items-center gap-1.5 rounded-md bg-white/10 px-2.5 hover:bg-white/20 disabled:opacity-50">
      {children}
    </button>
  );
}

/** Small icons for what we know about a lead: reachability and intent. */
function Signals({ lead, clicks }: { lead: Lead; clicks: number }) {
  const on = "text-[var(--a-success)]";
  const off = "text-[var(--a-border-strong)]";
  return (
    <span className="inline-flex items-center gap-1.5">
      <Mail size={13} className={lead.email ? on : off} aria-label={lead.email ? "Has email" : "No email"} />
      <Phone size={13} className={lead.phone ? on : off} aria-label={lead.phone ? "Has phone" : "No phone"} />
      <Globe size={13} className={lead.website ? on : off} aria-label={lead.website ? "Has website" : "No website"} />
      {lead.linkedinUrl ? <Linkedin size={13} className="text-[#0A66C2]" aria-label="LinkedIn" /> : null}
      {lead.repliedAt ? <MessageSquareReply size={13} className="text-[#7c3aed]" aria-label="Replied" /> : null}
      {clicks > 0 ? (
        <span className="inline-flex items-center gap-0.5 rounded-full bg-[var(--a-success-bg)] px-1.5 font-dm text-[10.5px] font-bold text-[var(--a-success)]" title={`${clicks} click${clicks === 1 ? "" : "s"} on outreach links, 30 days`}>
          <MousePointerClick size={11} aria-hidden />{clicks}
        </span>
      ) : null}
      {lead.handedOverAt ? <Flame size={13} className="text-[var(--a-orange)]" aria-label="Handed over" /> : null}
      {lead.doNotContact ? <Ban size={13} className="text-[var(--a-danger)]" aria-label="Do not contact" /> : null}
    </span>
  );
}

function LeadCard({ lead, clicks, focused, selected, busy, onFocus, onToggle, onOpen, onEnrich, onHot, onEnrol }: {
  lead: Lead; clicks: number; focused: boolean; selected: boolean; busy: string | null;
  onFocus: () => void; onToggle: () => void; onOpen: () => void; onEnrich: () => void; onHot: () => void; onEnrol: () => void;
}) {
  const offer = lead.bestOffer ? OFFER_BY_KEY.get(lead.bestOffer)?.name : null;
  return (
    <div
      draggable
      tabIndex={0}
      data-lead-id={lead.id}
      onFocus={onFocus}
      onDragStart={(e) => e.dataTransfer.setData("text/plain", lead.id)}
      onClick={onOpen}
      onKeyDown={(e) => { if (e.key === " ") { e.preventDefault(); onToggle(); } }}
      className={`group relative cursor-pointer rounded-[12px] border bg-[var(--a-surface)] p-3 outline-none transition-[box-shadow,border-color] duration-150 hover:border-[var(--a-border-strong)] hover:shadow-[0_4px_14px_rgba(13,27,42,.08)] focus-visible:ring-2 focus-visible:ring-[var(--a-blue)] ${selected ? "border-[var(--a-blue)] ring-2 ring-[var(--a-blue)]/20" : focused ? "border-[var(--a-blue)]" : "border-[var(--a-border)]"}`}
      data-testid="lead-card"
    >
      <div className="flex items-start gap-2">
        <button onClick={(e) => { e.stopPropagation(); onToggle(); }} aria-label={selected ? "Deselect" : "Select"} className="mt-0.5 text-[var(--a-border-strong)] hover:text-[var(--a-blue)]">
          {selected ? <CheckSquare size={15} className="text-[var(--a-blue)]" /> : <Square size={15} />}
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate font-dm text-[13.5px] font-semibold text-[var(--a-ink)]">{lead.companyName}</p>
          <p className="truncate font-dm text-[12px] text-[var(--a-ink-3)]">{[lead.contactName, lead.industry, lead.area].filter(Boolean).join(" · ") || lead.domain || " "}</p>
        </div>
        <ScorePill lead={lead} />
      </div>
      {offer && <p className="mt-2 truncate font-dm text-[11.5px] font-semibold text-[var(--a-blue)]">{offer}</p>}
      <div className="mt-2 flex items-center gap-2">
        <Signals lead={lead} clicks={clicks} />
        <span className="ml-auto font-dm text-[10.5px] text-[var(--a-ink-3)] group-focus-within:opacity-0 group-hover:opacity-0">{SOURCE_LABEL[lead.source] ?? lead.source}</span>
      </div>
      {/* Hover / focus quick actions */}
      <div className="pointer-events-none absolute bottom-2 right-2 flex gap-1 opacity-0 transition-opacity duration-150 group-focus-within:pointer-events-auto group-focus-within:opacity-100 group-hover:pointer-events-auto group-hover:opacity-100" onClick={(e) => e.stopPropagation()}>
        <QuickBtn label="Enrich and score" onClick={onEnrich} busy={busy === `${lead.id}:enrich`}><Sparkles size={13} /></QuickBtn>
        {lead.email && !lead.doNotContact && <QuickBtn label="Add to sequence" onClick={onEnrol}><Send size={13} /></QuickBtn>}
        {lead.stage !== "hot" && <QuickBtn label="Mark hot" onClick={onHot} busy={busy === `${lead.id}:hot`}><Flame size={13} /></QuickBtn>}
        <QuickBtn label="Open" onClick={onOpen}><ArrowUpRight size={13} /></QuickBtn>
      </div>
    </div>
  );
}

function QuickBtn({ label, onClick, busy, children }: { label: string; onClick: () => void; busy?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      disabled={busy}
      className="flex h-7 w-7 items-center justify-center rounded-md border border-[var(--a-border)] bg-[var(--a-surface)] text-[var(--a-ink-2)] shadow-[0_1px_2px_rgba(13,27,42,.06)] hover:border-[var(--a-border-strong)] hover:text-[var(--a-ink)]"
    >
      {busy ? <Loader2 size={13} className="animate-spin" /> : children}
    </button>
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
            <span className="text-xs text-[var(--a-ink-3)]">{label}</span>
            <input value={f[k] ?? ""} onChange={(e) => setF({ ...f, [k]: e.target.value })} className="rounded-[var(--a-radius-control)] border border-[var(--a-border-strong)] px-3 py-2" />
          </label>
        ))}
        <label className="flex flex-col gap-1 sm:col-span-2">
          <span className="text-xs text-[var(--a-ink-3)]">Consent basis</span>
          <select value={f.consentBasis} onChange={(e) => setF({ ...f, consentBasis: e.target.value })} className="rounded-[var(--a-radius-control)] border border-[var(--a-border-strong)] px-2 py-2">
            {CONSENT_BASES.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
          </select>
        </label>
      </div>
      {err && <p className="mt-3 text-sm text-[var(--a-danger)] font-dm">{err}</p>}
      <div className="mt-4 flex justify-end gap-2">
        <button onClick={onClose} className="px-4 py-2 rounded-[var(--a-radius-control)] font-dm text-sm text-[var(--a-ink-2)]">Cancel</button>
        <button onClick={save} disabled={busy || !f.companyName} className="px-4 py-2 rounded-[var(--a-radius-control)] bg-[var(--a-orange-text)] text-white font-dm text-sm font-semibold disabled:opacity-50">Add lead</button>
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
          <p className="text-[var(--a-ink-2)]">Every email of the sequence is drafted for each lead (personalised by AI where the step asks for it). <b>Nothing is sent</b> until you approve the drafts on the Outreach page.</p>
          <select value={seq} onChange={(e) => setSeq(e.target.value)} className="w-full rounded-[var(--a-radius-control)] border border-[var(--a-border-strong)] px-3 py-2">
            {sequences.map((s) => <option key={s.id} value={s.id}>{s.name}{s.status !== "active" ? ` (${s.status})` : ""}</option>)}
          </select>
          <p className="text-xs text-[var(--a-ink-3)]">Leads without an email, without a consent basis, on the suppression list, or already replied are skipped and listed.</p>
          {busy && <p className="text-[var(--a-blue)] flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Drafting... {progress}/{ids.length}</p>}
          {err && <p className="text-[var(--a-danger)]">{err}</p>}
          <div className="flex justify-end gap-2">
            <button onClick={onClose} className="px-4 py-2 rounded-[var(--a-radius-control)] text-[var(--a-ink-2)]">Cancel</button>
            <button onClick={run} disabled={busy || !seq} className="px-4 py-2 rounded-[var(--a-radius-control)] bg-[var(--a-orange-text)] text-white font-semibold disabled:opacity-50" data-testid="enrol-run">Draft emails</button>
          </div>
        </div>
      ) : (
        <div className="space-y-3 font-dm text-sm" data-testid="enrol-result">
          <p className="text-[var(--a-success)] font-semibold">{result.enrolled} lead(s) drafted and waiting for your approval.</p>
          {result.skipped.length > 0 && (
            <div>
              <p className="text-[var(--a-orange-text)] font-semibold">{result.skipped.length} skipped</p>
              <ul className="mt-1 max-h-48 overflow-y-auto text-xs text-[var(--a-ink-2)] space-y-0.5">
                {result.skipped.map((s, i) => <li key={i}><b>{s.company}</b>: {s.reason}</li>)}
              </ul>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <button onClick={onClose} className="px-4 py-2 rounded-[var(--a-radius-control)] text-[var(--a-ink-2)]">Close</button>
            <Link href="/admin_pro/growth/outreach" className="px-4 py-2 rounded-[var(--a-radius-control)] bg-[var(--a-navy)] text-white font-semibold">Review and approve</Link>
          </div>
        </div>
      )}
    </Modal>
  );
}
