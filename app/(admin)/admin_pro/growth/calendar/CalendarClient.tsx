"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, RefreshCw } from "lucide-react";
import type { PostView } from "@/lib/growth/content/posts";
import { PLATFORM_INFO, PLATFORMS, STATUS_LABEL, type Platform, type PostStatus } from "@/lib/growth/content/platforms";
import PostDrawer, { patchPost, type AudienceTz } from "../_components/PostDrawer";
import { btn, Card, input, label, StatusPill } from "../_components/ui";

const DAY = 86_400_000;
const pad = (n: number) => String(n).padStart(2, "0");
const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
function weekStart(d: Date): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dow = (x.getDay() + 6) % 7; // Monday = 0
  return new Date(x.getTime() - dow * DAY);
}
const addDaysLocal = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const timeOf = (iso: string) => new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

function Chip({ p, onOpen, draggable }: { p: PostView; onOpen: () => void; draggable: boolean }) {
  const info = PLATFORM_INFO[p.platform];
  return (
    <button
      type="button"
      draggable={draggable}
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", p.id);
        e.dataTransfer.effectAllowed = "move";
      }}
      onClick={onOpen}
      data-post-id={p.id}
      className={`w-full text-left rounded-lg border bg-white px-2 py-1.5 hover:shadow-sm transition-shadow ${draggable ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"} ${p.status === "rejected" ? "opacity-50" : ""}`}
      style={{ borderLeft: `3px solid ${info.color}` }}
      title={p.text.slice(0, 200)}
    >
      <span className="flex items-center justify-between gap-1">
        <span className="font-dm text-[11px] font-semibold text-[#0D1B2A] truncate">{info.label}</span>
        {p.scheduledAt && <span className="font-dm text-[10px] text-[#7A8FA6] shrink-0">{timeOf(p.scheduledAt)}</span>}
      </span>
      <span className="block font-dm text-[11px] text-[#3A4A5C] line-clamp-2 leading-snug">{p.body}</span>
      <span className="mt-1 block"><StatusPill status={p.status} label={STATUS_LABEL[p.status as PostStatus] ?? p.status} /></span>
    </button>
  );
}

export default function CalendarClient({ audiences, configured }: { audiences: AudienceTz[]; configured: Record<Platform, boolean> }) {
  const [start, setStart] = useState(() => weekStart(new Date()));
  const [posts, setPosts] = useState<PostView[]>([]);
  const [queue, setQueue] = useState<PostView[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [open, setOpen] = useState<PostView | null>(null);
  const [platformFilter, setPlatformFilter] = useState<"" | Platform>("");
  const [hideRejected, setHideRejected] = useState(true);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const days = useMemo(() => Array.from({ length: 14 }, (_, i) => addDaysLocal(start, i)), [start]);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const from = start.toISOString();
      const to = addDaysLocal(start, 14).toISOString();
      const [a, b] = await Promise.all([
        fetch(`/api/admin/growth/posts?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`).then((r) => r.json()),
        fetch(`/api/admin/growth/posts?status=draft,ready,failed`).then((r) => r.json()),
      ]);
      if (a.error || b.error) throw new Error(a.error ?? b.error);
      setPosts(a.posts);
      setQueue(b.posts);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not load posts");
    } finally {
      setLoading(false);
    }
  }, [start]);

  useEffect(() => {
    load();
  }, [load]);

  const upsert = (p: PostView) => {
    setPosts((xs) => (xs.some((x) => x.id === p.id) ? xs.map((x) => (x.id === p.id ? p : x)) : xs));
    setQueue((xs) => {
      const inQ = ["draft", "ready", "failed"].includes(p.status);
      const has = xs.some((x) => x.id === p.id);
      if (inQ) return has ? xs.map((x) => (x.id === p.id ? p : x)) : [...xs, p];
      return xs.filter((x) => x.id !== p.id);
    });
    setOpen((o) => (o?.id === p.id ? p : o));
  };

  const visible = (p: PostView) => (!platformFilter || p.platform === platformFilter) && (!hideRejected || p.status !== "rejected");
  const byDay = useMemo(() => {
    const m = new Map<string, PostView[]>();
    for (const p of posts) {
      if (!p.scheduledAt || !visible(p)) continue;
      const k = ymd(new Date(p.scheduledAt));
      m.set(k, [...(m.get(k) ?? []), p]);
    }
    for (const v of m.values()) v.sort((a, b) => (a.scheduledAt ?? "").localeCompare(b.scheduledAt ?? ""));
    return m;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [posts, platformFilter, hideRejected]);

  async function dropOn(day: Date, id: string) {
    setDragOver(null);
    const p = posts.find((x) => x.id === id) ?? queue.find((x) => x.id === id);
    if (!p || ["published", "publishing"].includes(p.status)) return;
    const old = p.scheduledAt ? new Date(p.scheduledAt) : null;
    const next = new Date(day.getFullYear(), day.getMonth(), day.getDate(), old?.getHours() ?? 9, old?.getMinutes() ?? 0);
    if (p.status === "scheduled" && next.getTime() < Date.now()) {
      setErr("A scheduled post cannot be moved into the past.");
      return;
    }
    const prev = posts;
    // Optimistic move
    setPosts((xs) => (xs.some((x) => x.id === id) ? xs.map((x) => (x.id === id ? { ...x, scheduledAt: next.toISOString() } : x)) : [...xs, { ...p, scheduledAt: next.toISOString() }]));
    try {
      upsert(await patchPost(id, { scheduledAt: next.toISOString() }));
    } catch (e) {
      setPosts(prev);
      setErr(e instanceof Error ? e.message : "Could not move the post");
    }
  }

  const today = ymd(new Date());
  const ready = queue.filter((p) => p.status === "ready");
  const drafts = queue.filter((p) => p.status === "draft");
  const failed = queue.filter((p) => p.status === "failed");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <button className={btn.ghost} onClick={() => setStart(addDaysLocal(start, -7))} aria-label="Previous week"><ChevronLeft size={16} /></button>
        <button className={btn.ghost} onClick={() => setStart(weekStart(new Date()))}>This week</button>
        <button className={btn.ghost} onClick={() => setStart(addDaysLocal(start, 7))} aria-label="Next week"><ChevronRight size={16} /></button>
        <span className="font-dm text-sm text-[#3A4A5C] mx-1">
          {start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – {addDaysLocal(start, 13).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </span>
        <select aria-label="Platform filter" className="rounded-lg border border-[#D2DCE8] bg-white px-2 py-2 font-dm text-sm" value={platformFilter} onChange={(e) => setPlatformFilter(e.target.value as Platform | "")}>
          <option value="">All platforms</option>
          {PLATFORMS.map((p) => <option key={p} value={p}>{PLATFORM_INFO[p].label}</option>)}
        </select>
        <label className="inline-flex items-center gap-1.5 font-dm text-sm text-[#3A4A5C]">
          <input type="checkbox" checked={hideRejected} onChange={(e) => setHideRejected(e.target.checked)} /> Hide rejected
        </label>
        <div className="ml-auto flex gap-2">
          <button className={btn.ghost} onClick={load} aria-label="Reload"><RefreshCw size={15} className={loading ? "animate-spin" : ""} /></button>
          <button className={btn.primary} onClick={() => setShowNew(true)}><Plus size={15} /> New post</button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 font-dm text-xs text-[#3A4A5C]">
        {PLATFORMS.map((p) => (
          <span key={p} className="inline-flex items-center gap-1.5 rounded-full bg-white border border-[#D2DCE8] px-2.5 py-1">
            <span className="w-2 h-2 rounded-full" style={{ background: PLATFORM_INFO[p].color }} />
            {PLATFORM_INFO[p].label}: {PLATFORM_INFO[p].api ? (configured[p] ? "auto-publish" : "no tokens, manual") : "manual (copy + deep link)"}
          </span>
        ))}
      </div>

      {err && <p role="alert" className="rounded-lg bg-[#FEF3F2] border border-[#F3C5C0] px-3 py-2 font-dm text-sm text-[#B42318]">{err}</p>}

      {/* Grid: md and up */}
      <div className="hidden md:block bg-white border border-[#D2DCE8] rounded-2xl overflow-hidden">
        <div className="grid grid-cols-7 border-b border-[#D2DCE8] bg-[#F4F7FB]">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
            <div key={d} className="px-2 py-1.5 font-dm text-xs font-semibold text-[#3A4A5C]">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((d) => {
            const k = ymd(d);
            const list = byDay.get(k) ?? [];
            return (
              <div
                key={k}
                data-day={k}
                onDragOver={(e) => { e.preventDefault(); setDragOver(k); }}
                onDragLeave={() => setDragOver((x) => (x === k ? null : x))}
                onDrop={(e) => { e.preventDefault(); const id = e.dataTransfer.getData("text/plain"); if (id) dropOn(d, id); }}
                className={`min-h-[150px] border-r border-b border-[#E6ECF3] p-1.5 space-y-1.5 ${dragOver === k ? "bg-[#EAF1FB]" : k < today ? "bg-[#FAFBFD]" : ""}`}
              >
                <div className={`font-dm text-xs ${k === today ? "font-bold text-[#F47C20]" : "text-[#7A8FA6]"}`}>{d.getDate()} {d.getDate() === 1 || d === days[0] ? d.toLocaleDateString("en-US", { month: "short" }) : ""}</div>
                {(expanded.has(k) ? list : list.slice(0, 5)).map((p) => (
                  <Chip key={p.id} p={p} onOpen={() => setOpen(p)} draggable={!["published", "publishing"].includes(p.status)} />
                ))}
                {list.length > 5 && !expanded.has(k) && (
                  <button className="font-dm text-[11px] text-[#2251A3] underline" onClick={() => setExpanded((x) => new Set(x).add(k))}>+{list.length - 5} more</button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Agenda: phones */}
      <div className="md:hidden space-y-3">
        {days.map((d) => {
          const list = byDay.get(ymd(d)) ?? [];
          if (!list.length) return null;
          return (
            <div key={ymd(d)}>
              <p className="font-dm text-xs font-semibold text-[#3A4A5C] mb-1">{d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}</p>
              <div className="space-y-1.5">{list.map((p) => <Chip key={p.id} p={p} onOpen={() => setOpen(p)} draggable={false} />)}</div>
            </div>
          );
        })}
        {!loading && byDay.size === 0 && <p className="font-dm text-sm text-[#7A8FA6]">Nothing scheduled in these two weeks.</p>}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card title={`Needs approval (${drafts.length})`} subtitle="Drafts from kits, automation and manual posts. Open one to edit, approve or reject.">
          <QueueList items={drafts} onOpen={setOpen} />
        </Card>
        <Card title={`Ready to post by hand (${ready.length})`} subtitle="Due posts for platforms without publishing tokens.">
          <QueueList items={ready} onOpen={setOpen} />
        </Card>
        <Card title={`Failed (${failed.length})`} subtitle="Check the error, fix, then retry.">
          <QueueList items={failed} onOpen={setOpen} />
        </Card>
      </div>

      {open && (
        <PostDrawer
          post={open}
          audiences={audiences}
          onClose={() => setOpen(null)}
          onChange={upsert}
          onDelete={(id) => {
            setPosts((xs) => xs.filter((x) => x.id !== id));
            setQueue((xs) => xs.filter((x) => x.id !== id));
            setOpen(null);
          }}
        />
      )}
      {showNew && <NewPost onClose={() => setShowNew(false)} onCreated={(p) => { setShowNew(false); upsert(p); setPosts((xs) => [...xs, p]); setOpen(p); }} />}
    </div>
  );
}

function QueueList({ items, onOpen }: { items: PostView[]; onOpen: (p: PostView) => void }) {
  if (!items.length) return <p className="font-dm text-sm text-[#7A8FA6]">Nothing here.</p>;
  return (
    <ul className="space-y-1.5 max-h-96 overflow-y-auto">
      {items.map((p) => (
        <li key={p.id}>
          <Chip p={p} onOpen={() => onOpen(p)} draggable />
        </li>
      ))}
    </ul>
  );
}

function NewPost({ onClose, onCreated }: { onClose: () => void; onCreated: (p: PostView) => void }) {
  const [platform, setPlatform] = useState<Platform>("linkedin");
  const [body, setBody] = useState("");
  const [target, setTarget] = useState("");
  const [campaign, setCampaign] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  async function create() {
    setBusy(true);
    setErr(null);
    const res = await fetch("/api/admin/growth/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ platform, body, targetUrl: target, campaign }),
    });
    const j = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setErr(j.error ?? "Could not create the post");
    onCreated(j.post);
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="New post">
      <button className="absolute inset-0 bg-black/30" aria-label="Close" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl bg-white p-5 space-y-3 shadow-xl">
        <h2 className="font-syne font-bold text-lg text-[#0D1B2A]">New post</h2>
        <div>
          <label className={label} htmlFor="np-platform">Platform</label>
          <select id="np-platform" className={input} value={platform} onChange={(e) => setPlatform(e.target.value as Platform)}>
            {PLATFORMS.map((p) => <option key={p} value={p}>{PLATFORM_INFO[p].label}</option>)}
          </select>
        </div>
        <div>
          <label className={label} htmlFor="np-body">Text</label>
          <textarea id="np-body" rows={5} className={input} value={body} onChange={(e) => setBody(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={label} htmlFor="np-target">Link to (optional)</label>
            <input id="np-target" className={input} placeholder="/learning-box" value={target} onChange={(e) => setTarget(e.target.value)} />
          </div>
          <div>
            <label className={label} htmlFor="np-campaign">Campaign</label>
            <input id="np-campaign" className={input} placeholder="manual" value={campaign} onChange={(e) => setCampaign(e.target.value)} />
          </div>
        </div>
        {err && <p role="alert" className="font-dm text-sm text-[#B42318]">{err}</p>}
        <div className="flex justify-end gap-2">
          <button className={btn.ghost} onClick={onClose}>Cancel</button>
          <button className={btn.primary} disabled={busy || !body.trim()} onClick={create}>Create draft</button>
        </div>
      </div>
    </div>
  );
}
