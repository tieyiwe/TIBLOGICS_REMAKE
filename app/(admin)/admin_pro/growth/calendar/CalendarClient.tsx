"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays, Check, CheckCheck, ChevronLeft, ChevronRight, CircleAlert, GripVertical, Hand, Plus, RefreshCw, X } from "lucide-react";
import { Badge, Button, Card, EmptyState, IconButton, Segmented, Select, Toolbar, useToast } from "@/components/admin/ui";
import type { PostView } from "@/lib/growth/content/posts";
import { PLATFORM_INFO, PLATFORMS, STATUS_LABEL, type Platform, type PostStatus } from "@/lib/growth/content/platforms";
import PostDrawer, { patchPost, type AudienceTz } from "../_components/PostDrawer";
import { input, label, StatusPill } from "../_components/ui";

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
const LOCKED = ["published", "publishing"];
type View = "week" | "month";

function Chip({
  p,
  onOpen,
  draggable,
  compact,
  selectable,
  selected,
  onToggle,
}: {
  p: PostView;
  onOpen: () => void;
  draggable: boolean;
  compact?: boolean;
  selectable?: boolean;
  selected?: boolean;
  onToggle?: () => void;
}) {
  const info = PLATFORM_INFO[p.platform];
  return (
    <div
      draggable={draggable}
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", p.id);
        e.dataTransfer.effectAllowed = "move";
      }}
      data-post-id={p.id}
      className={`group relative flex items-stretch rounded-[8px] border bg-[var(--a-surface)] transition-[box-shadow,border-color] duration-150 hover:border-[var(--a-border-strong)] hover:shadow-[0_2px_8px_rgba(13,27,42,.08)] ${selected ? "border-[var(--a-blue)] ring-2 ring-[var(--a-blue)]/20" : "border-[var(--a-border)]"} ${p.status === "rejected" ? "opacity-50" : ""} ${draggable ? "cursor-grab active:cursor-grabbing" : ""}`}
    >
      <span className="w-[3px] shrink-0 rounded-l-[7px]" style={{ background: info.color }} aria-hidden />
      {selectable && (
        <label className="flex shrink-0 items-start pl-1.5 pt-1.5">
          <span className="sr-only">Select post</span>
          <input type="checkbox" checked={!!selected} onChange={onToggle} className="h-3.5 w-3.5 accent-[var(--a-blue)]" />
        </label>
      )}
      <button type="button" onClick={onOpen} className="min-w-0 flex-1 px-2 py-1.5 text-left focus-visible:outline-none" title={p.text.slice(0, 200)}>
        <span className="flex items-center justify-between gap-1">
          <span className="min-w-0 truncate font-dm text-[11.5px] font-semibold text-[var(--a-ink)]">{info.label}</span>
          {p.scheduledAt && <span className="shrink-0 font-dm text-[10.5px] tabular-nums text-[var(--a-ink-3)]">{timeOf(p.scheduledAt)}</span>}
        </span>
        {!compact && <span className="block font-dm text-[11.5px] leading-snug text-[var(--a-ink-2)] line-clamp-2 [overflow-wrap:anywhere]">{p.body}</span>}
        <span className="mt-1 flex items-center gap-1">
          <StatusPill status={p.status} label={STATUS_LABEL[p.status as PostStatus] ?? p.status} />
          {p.image && <span className="font-dm text-[10px] font-semibold text-[var(--a-ink-3)]">IMG</span>}
        </span>
      </button>
      {draggable && <GripVertical size={12} className="absolute right-0.5 top-1/2 -translate-y-1/2 text-[var(--a-ink-3)] opacity-0 group-hover:opacity-60" aria-hidden />}
    </div>
  );
}

export default function CalendarClient({ audiences, configured }: { audiences: AudienceTz[]; configured: Record<Platform, boolean> }) {
  const toast = useToast();
  const [view, setView] = useState<View>("week");
  const [anchor, setAnchor] = useState(() => new Date());
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
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);

  // Visible range: a week (7 days from Monday) or a month grid (whole weeks).
  const { start, days } = useMemo(() => {
    if (view === "week") {
      const s = weekStart(anchor);
      return { start: s, days: Array.from({ length: 7 }, (_, i) => addDaysLocal(s, i)) };
    }
    const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
    const s = weekStart(first);
    const last = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0);
    const n = Math.ceil((last.getTime() - s.getTime()) / DAY / 7 + 0.01) * 7;
    return { start: s, days: Array.from({ length: Math.max(35, n) }, (_, i) => addDaysLocal(s, i)) };
  }, [view, anchor]);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const from = start.toISOString();
      const to = addDaysLocal(start, days.length).toISOString();
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
  }, [start, days.length]);

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

  const byDay = useMemo(() => {
    const m = new Map<string, PostView[]>();
    for (const p of posts) {
      if (!p.scheduledAt) continue;
      if (platformFilter && p.platform !== platformFilter) continue;
      if (hideRejected && p.status === "rejected") continue;
      const k = ymd(new Date(p.scheduledAt));
      m.set(k, [...(m.get(k) ?? []), p]);
    }
    for (const v of m.values()) v.sort((a, b) => (a.scheduledAt ?? "").localeCompare(b.scheduledAt ?? ""));
    return m;
  }, [posts, platformFilter, hideRejected]);

  const draftsInView = useMemo(() => [...byDay.values()].flat().filter((p) => p.status === "draft"), [byDay]);

  async function dropOn(day: Date, id: string) {
    setDragOver(null);
    const p = posts.find((x) => x.id === id) ?? queue.find((x) => x.id === id);
    if (!p || LOCKED.includes(p.status)) return;
    const old = p.scheduledAt ? new Date(p.scheduledAt) : null;
    const next = new Date(day.getFullYear(), day.getMonth(), day.getDate(), old?.getHours() ?? 9, old?.getMinutes() ?? 0);
    if (old && ymd(old) === ymd(next)) return;
    if (p.status === "scheduled" && next.getTime() < Date.now()) {
      toast.error("Cannot move into the past", "A scheduled post needs a future time.");
      return;
    }
    const prev = posts;
    setPosts((xs) => (xs.some((x) => x.id === id) ? xs.map((x) => (x.id === id ? { ...x, scheduledAt: next.toISOString() } : x)) : [...xs, { ...p, scheduledAt: next.toISOString() }]));
    try {
      const saved = await patchPost(id, { scheduledAt: next.toISOString() });
      upsert(saved);
      toast.success(`Moved to ${next.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}`, `${PLATFORM_INFO[p.platform].label} keeps its time.`);
    } catch (e) {
      setPosts(prev);
      toast.error("Could not move the post", e instanceof Error ? e.message : undefined);
    }
  }

  async function bulk(ids: string[], action: "approve" | "reject") {
    if (!ids.length) return;
    setBulkBusy(true);
    try {
      const res = await fetch("/api/admin/growth/posts/bulk", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids, action }) });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error ?? "Bulk update failed");
      (j.posts as PostView[]).forEach(upsert);
      setSelected(new Set());
      const failed = (j.failed as unknown[] | undefined)?.length ?? 0;
      toast.success(`${action === "approve" ? "Approved" : "Rejected"} ${j.updated} post${j.updated === 1 ? "" : "s"}`, failed ? `${failed} could not be changed (check their time or text).` : undefined);
    } catch (e) {
      toast.error("Bulk update failed", e instanceof Error ? e.message : undefined);
    } finally {
      setBulkBusy(false);
    }
  }

  const toggle = (id: string) => setSelected((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const shift = (dir: -1 | 1) => setAnchor((a) => (view === "week" ? addDaysLocal(a, 7 * dir) : new Date(a.getFullYear(), a.getMonth() + dir, 1)));

  const today = ymd(new Date());
  const ready = queue.filter((p) => p.status === "ready");
  const drafts = queue.filter((p) => p.status === "draft");
  const unscheduled = drafts.filter((p) => !p.scheduledAt);
  const failed = queue.filter((p) => p.status === "failed");
  const rangeLabel =
    view === "week"
      ? `${days[0].toLocaleDateString("en-US", { month: "short", day: "numeric" })} to ${days[6].toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
      : anchor.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const perCell = view === "week" ? 12 : 3;

  return (
    <div className="space-y-4">
      <Toolbar
        className="mb-0"
        end={
          <>
            <IconButton icon={RefreshCw} aria-label="Reload" onClick={load} className={loading ? "[&_svg]:animate-spin" : ""} />
            <Button variant="primary" icon={Plus} onClick={() => setShowNew(true)}>New post</Button>
          </>
        }
      >
        <div className="flex items-center gap-1">
          <IconButton icon={ChevronLeft} aria-label={view === "week" ? "Previous week" : "Previous month"} onClick={() => shift(-1)} variant="secondary" />
          <Button onClick={() => setAnchor(new Date())}>Today</Button>
          <IconButton icon={ChevronRight} aria-label={view === "week" ? "Next week" : "Next month"} onClick={() => shift(1)} variant="secondary" />
        </div>
        <span className="font-syne text-[16px] font-semibold text-[var(--a-ink)] tabular-nums" aria-live="polite">{rangeLabel}</span>
        <Segmented ariaLabel="Calendar view" value={view} onChange={(v) => setView(v as View)} options={[{ value: "week", label: "Week" }, { value: "month", label: "Month" }]} />
        <Select label="Platform filter" value={platformFilter} onChange={(e) => setPlatformFilter(e.target.value as Platform | "")}>
          <option value="">All platforms</option>
          {PLATFORMS.map((p) => <option key={p} value={p}>{PLATFORM_INFO[p].label}</option>)}
        </Select>
        <label className="inline-flex h-9 items-center gap-1.5 font-dm text-[13px] text-[var(--a-ink-2)]">
          <input type="checkbox" checked={hideRejected} onChange={(e) => setHideRejected(e.target.checked)} className="accent-[var(--a-blue)]" /> Hide rejected
        </label>
      </Toolbar>

      <div className="flex flex-wrap gap-1.5">
        {PLATFORMS.map((p) => (
          <span key={p} className="inline-flex items-center gap-1.5 rounded-full border border-[var(--a-border)] bg-[var(--a-surface)] px-2.5 py-1 font-dm text-[12px] text-[var(--a-ink-2)]">
            <span className="h-2 w-2 rounded-full" style={{ background: PLATFORM_INFO[p].color }} />
            {PLATFORM_INFO[p].label}
            <span className="text-[var(--a-ink-3)]">{PLATFORM_INFO[p].api ? (configured[p] ? "auto" : "manual") : "copy + open"}</span>
          </span>
        ))}
      </div>

      {err && (
        <p role="alert" className="flex items-center gap-2 rounded-[var(--a-radius-control)] border border-[#f6cccc] bg-[var(--a-danger-bg)] px-3 py-2 font-dm text-[13px] text-[var(--a-danger)]">
          <CircleAlert size={15} aria-hidden /> {err}
        </p>
      )}

      {/* Bulk bar: appears with a selection, or offers "approve all drafts in view". */}
      <div className="flex flex-wrap items-center gap-2 rounded-[var(--a-radius-card)] border border-[var(--a-border)] bg-[var(--a-surface)] px-3 py-2 shadow-[var(--a-shadow-card)]">
        {selected.size > 0 ? (
          <>
            <Badge tone="info">{selected.size} selected</Badge>
            <Button size="sm" variant="primary" icon={Check} loading={bulkBusy} onClick={() => bulk([...selected], "approve")}>Approve {selected.size}</Button>
            <Button size="sm" icon={X} disabled={bulkBusy} onClick={() => bulk([...selected], "reject")}>Reject</Button>
            <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>Clear</Button>
          </>
        ) : (
          <>
            <span className="font-dm text-[13px] text-[var(--a-ink-2)]">
              {draftsInView.length ? <><strong className="text-[var(--a-ink)] tabular-nums">{draftsInView.length}</strong> draft{draftsInView.length === 1 ? "" : "s"} in view wait for approval. Tick posts to act on a few, or approve them all.</> : "No drafts waiting in this range."}
            </span>
            {draftsInView.length > 0 && (
              <>
                <Button size="sm" variant="ghost" onClick={() => setSelected(new Set(draftsInView.map((p) => p.id)))}>Select drafts</Button>
                <Button size="sm" variant="primary" icon={CheckCheck} loading={bulkBusy} onClick={() => bulk(draftsInView.map((p) => p.id), "approve")}>Approve all {draftsInView.length}</Button>
              </>
            )}
          </>
        )}
      </div>

      <div className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_300px]">
        {/* Grid: md and up */}
        <div className="hidden min-w-0 overflow-hidden rounded-[var(--a-radius-card)] border border-[var(--a-border)] bg-[var(--a-surface)] shadow-[var(--a-shadow-card)] md:block">
          <div className="grid grid-cols-7 border-b border-[var(--a-border)] bg-[var(--a-surface-2)]">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
              <div key={d} className="px-2 py-2 font-dm text-[11px] font-semibold uppercase tracking-[.08em] text-[var(--a-ink-3)]">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {days.map((d) => {
              const k = ymd(d);
              const list = byDay.get(k) ?? [];
              const outside = view === "month" && d.getMonth() !== anchor.getMonth();
              const shown = expanded.has(k) ? list : list.slice(0, perCell);
              return (
                <div
                  key={k}
                  data-day={k}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(k); }}
                  onDragLeave={() => setDragOver((x) => (x === k ? null : x))}
                  onDrop={(e) => { e.preventDefault(); const id = e.dataTransfer.getData("text/plain"); if (id) dropOn(d, id); }}
                  className={`space-y-1.5 border-b border-r border-[var(--a-border)] p-1.5 transition-colors duration-150 [&:nth-child(7n)]:border-r-0 ${view === "week" ? "min-h-[420px]" : "min-h-[128px]"} ${dragOver === k ? "bg-[var(--a-info-bg)] outline-2 -outline-offset-2 outline-dashed outline-[var(--a-blue)]" : k < today || outside ? "bg-[var(--a-surface-2)]/50" : ""}`}
                >
                  <div className="flex items-center justify-between px-0.5">
                    <span className={`inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1 font-dm text-[12px] tabular-nums ${k === today ? "bg-[var(--a-orange)] font-bold text-white" : outside ? "text-[var(--a-ink-3)]/70" : "font-semibold text-[var(--a-ink-2)]"}`}>
                      {d.getDate()}
                    </span>
                    {(d.getDate() === 1 || d === days[0]) && <span className="font-dm text-[11px] text-[var(--a-ink-3)]">{d.toLocaleDateString("en-US", { month: "short" })}</span>}
                  </div>
                  {shown.map((p) => (
                    <Chip
                      key={p.id}
                      p={p}
                      compact={view === "month"}
                      onOpen={() => setOpen(p)}
                      draggable={!LOCKED.includes(p.status)}
                      selectable={p.status === "draft"}
                      selected={selected.has(p.id)}
                      onToggle={() => toggle(p.id)}
                    />
                  ))}
                  {list.length > perCell && !expanded.has(k) && (
                    <button className="px-1 font-dm text-[11.5px] font-semibold text-[var(--a-blue)] hover:underline" onClick={() => setExpanded((x) => new Set(x).add(k))}>+{list.length - perCell} more</button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Agenda: phones */}
        <div className="space-y-4 md:hidden">
          {days.map((d) => {
            const list = byDay.get(ymd(d)) ?? [];
            if (!list.length) return null;
            return (
              <div key={ymd(d)}>
                <p className={`mb-1.5 font-dm text-[11px] font-semibold uppercase tracking-[.08em] ${ymd(d) === today ? "text-[var(--a-orange-text)]" : "text-[var(--a-ink-3)]"}`}>{d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}</p>
                <div className="space-y-1.5">
                  {list.map((p) => <Chip key={p.id} p={p} onOpen={() => setOpen(p)} draggable={false} selectable={p.status === "draft"} selected={selected.has(p.id)} onToggle={() => toggle(p.id)} />)}
                </div>
              </div>
            );
          })}
          {!loading && byDay.size === 0 && (
            <EmptyState compact icon={CalendarDays} title="Nothing scheduled" body="Approve drafts from a kit or create a post." action={<Button variant="primary" icon={Plus} onClick={() => setShowNew(true)}>New post</Button>} />
          )}
        </div>

        <aside className="grid items-start gap-4 lg:grid-cols-3 2xl:block 2xl:space-y-4">
          <Card title="Needs approval" action={<Badge tone={drafts.length ? "orange" : "neutral"}>{drafts.length}</Badge>} subtitle={unscheduled.length ? `${unscheduled.length} without a date. Drag one onto a day.` : "Open one to edit, approve or reject."}>
            <QueueList items={drafts} onOpen={setOpen} selected={selected} onToggle={toggle} />
          </Card>
          <Card title="Ready to post by hand" icon={Hand} action={<Badge tone={ready.length ? "info" : "neutral"}>{ready.length}</Badge>} subtitle="Due posts for platforms without tokens.">
            <QueueList items={ready} onOpen={setOpen} />
          </Card>
          {failed.length > 0 && (
            <Card title="Failed" action={<Badge tone="danger">{failed.length}</Badge>} subtitle="Check the error, fix, then retry.">
              <QueueList items={failed} onOpen={setOpen} />
            </Card>
          )}
        </aside>
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

function QueueList({ items, onOpen, selected, onToggle }: { items: PostView[]; onOpen: (p: PostView) => void; selected?: Set<string>; onToggle?: (id: string) => void }) {
  if (!items.length) return <p className="font-dm text-[13px] text-[var(--a-ink-3)]">Nothing here.</p>;
  return (
    <ul className="-mx-1 max-h-80 space-y-1.5 overflow-y-auto px-1">
      {items.map((p) => (
        <li key={p.id}>
          <Chip p={p} onOpen={() => onOpen(p)} draggable={!LOCKED.includes(p.status)} selectable={!!onToggle && p.status === "draft"} selected={selected?.has(p.id)} onToggle={() => onToggle?.(p.id)} />
        </li>
      ))}
    </ul>
  );
}

function NewPost({ onClose, onCreated }: { onClose: () => void; onCreated: (p: PostView) => void }) {
  const toast = useToast();
  const [platform, setPlatform] = useState<Platform>("linkedin");
  const [body, setBody] = useState("");
  const [target, setTarget] = useState("");
  const [campaign, setCampaign] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
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
    toast.success("Draft created");
    onCreated(j.post);
  }
  const max = PLATFORM_INFO[platform].maxChars;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="np-title">
      <button className="absolute inset-0 bg-[rgba(13,27,42,.35)]" aria-label="Close" onClick={onClose} />
      <div className="a-anim-pop relative w-full max-w-md space-y-3 rounded-t-[20px] bg-[var(--a-surface)] p-5 shadow-[var(--a-shadow-pop)] sm:rounded-[20px]">
        <h2 id="np-title" className="font-syne text-[18px] font-semibold text-[var(--a-ink)]">New post</h2>
        <div>
          <label className={label} htmlFor="np-platform">Platform</label>
          <select id="np-platform" className={input} value={platform} onChange={(e) => setPlatform(e.target.value as Platform)}>
            {PLATFORMS.map((p) => <option key={p} value={p}>{PLATFORM_INFO[p].label}</option>)}
          </select>
        </div>
        <div>
          <label className={label} htmlFor="np-body">Text</label>
          <textarea id="np-body" rows={5} className={input} value={body} onChange={(e) => setBody(e.target.value)} autoFocus />
          <p className={`mt-1 text-right font-dm text-[11.5px] tabular-nums ${body.length > max ? "text-[var(--a-danger)]" : "text-[var(--a-ink-3)]"}`}>{body.length} / {max}</p>
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
        {err && <p role="alert" className="font-dm text-[13px] text-[var(--a-danger)]">{err}</p>}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" loading={busy} disabled={!body.trim()} onClick={create}>Create draft</Button>
        </div>
      </div>
    </div>
  );
}
