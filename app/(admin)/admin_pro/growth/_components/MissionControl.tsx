"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlarmClock, AlertTriangle, CheckCheck, Flame, Lightbulb, MailCheck, MousePointerClick, Newspaper, PartyPopper,
  Pencil, Reply, Sparkles, Target, TrendingUp, Users, X, Zap,
} from "lucide-react";
import { Button, EmptyState, Skeleton, useToast } from "@/components/admin/ui";
import type { ActionButton, GoalItem, Goals, NextAction, Streak } from "@/lib/growth/mission";
import type { PostView } from "@/lib/growth/content/posts";
import PostDrawer, { patchPost, type AudienceTz } from "./PostDrawer";
import { Card, input, label, Progress } from "./ui";

const KIND_ICON: Record<string, typeof Zap> = {
  reply: Reply,
  "lead-clicked": MousePointerClick,
  "manual-post": AlarmClock,
  "approve-posts": CheckCheck,
  "new-content": Newspaper,
  "failed-posts": AlertTriangle,
  "approve-outreach": MailCheck,
  "channel-insight": TrendingUp,
  "goal-pace": Target,
  "empty-week": Lightbulb,
  trend: Flame,
  enrich: Users,
};

const TONE_RING: Record<NextAction["tone"], string> = {
  danger: "bg-[var(--a-danger-bg)] text-[var(--a-danger)]",
  warn: "bg-[var(--a-warn-bg)] text-[var(--a-warn)]",
  info: "bg-[var(--a-info-bg)] text-[var(--a-info)]",
  success: "bg-[var(--a-success-bg)] text-[var(--a-success)]",
  orange: "bg-[var(--a-orange-bg)] text-[var(--a-orange-text)]",
};

const SNOOZE_KEY = "growth-mission-snoozed";
const today = () => new Date().toISOString().slice(0, 10);

function readSnoozed(): Record<string, string> {
  try {
    const raw = JSON.parse(localStorage.getItem(SNOOZE_KEY) ?? "{}") as Record<string, string>;
    return Object.fromEntries(Object.entries(raw).filter(([, d]) => d === today()));
  } catch {
    return {};
  }
}

export function NextActions({ actions: initial, posts, audiences }: { actions: NextAction[]; posts: Record<string, PostView>; audiences: AudienceTz[] }) {
  const router = useRouter();
  const toast = useToast();
  const [actions, setActions] = useState(initial);
  const [snoozed, setSnoozed] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [posted, setPosted] = useState<Record<string, boolean>>({});
  const [open, setOpen] = useState<PostView | null>(null);

  useEffect(() => setActions(initial), [initial]);
  useEffect(() => setSnoozed(readSnoozed()), []);

  const visible = actions.filter((a) => !snoozed[a.id]);

  const snooze = (id: string) => {
    const next = { ...readSnoozed(), [id]: today() };
    try { localStorage.setItem(SNOOZE_KEY, JSON.stringify(next)); } catch { /* private mode */ }
    setSnoozed(next);
  };
  const done = (id: string) => setActions((xs) => xs.filter((x) => x.id !== id));

  async function run(a: NextAction, b: ActionButton) {
    const key = `${a.id}:${b.label}`;
    if (b.type === "link") return router.push(b.href);
    if (b.type === "open-post") {
      const p = posts[b.postId];
      if (p) setOpen(p);
      else router.push("/admin_pro/growth/calendar");
      return;
    }
    if (b.type === "copy-open") {
      try {
        await navigator.clipboard.writeText(b.text);
        toast.success("Copied", "Paste it in the window that just opened.");
      } catch {
        toast.info("Copy blocked by the browser", "Open the post and copy the text by hand.");
      }
      window.open(b.url, "_blank", "noopener,noreferrer");
      setPosted((x) => ({ ...x, [a.id]: true }));
      return;
    }
    setBusy(key);
    try {
      const res = await fetch("/api/admin/growth/posts/bulk", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids: b.ids, action: "approve" }) });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error ?? "Approval failed");
      if (j.failed?.length) toast.error(`${j.updated} approved, ${j.failed.length} need a fix`, j.failed[0].error);
      else toast.success(`${j.updated} post${j.updated === 1 ? "" : "s"} approved`, "They publish at their scheduled times.");
      done(a.id);
      router.refresh();
    } catch (e) {
      toast.error("Approval failed", e instanceof Error ? e.message : undefined);
    } finally {
      setBusy(null);
    }
  }

  async function markPosted(a: NextAction, postId: string) {
    setBusy(`${a.id}:posted`);
    try {
      await patchPost(postId, { action: "mark-posted" });
      toast.success("Marked as posted");
      done(a.id);
      router.refresh();
    } catch (e) {
      toast.error("Could not mark it", e instanceof Error ? e.message : undefined);
    } finally {
      setBusy(null);
    }
  }

  if (!visible.length) {
    return <EmptyState compact icon={PartyPopper} title="All caught up" body="Nothing needs you right now. Plan the next campaign while it is quiet." action={<Button variant="primary" icon={Sparkles} href="/admin_pro/growth/campaigns/new">Plan a campaign</Button>} />;
  }

  return (
    <>
      <ol className="divide-y divide-[var(--a-border)]" data-testid="next-actions">
        {visible.map((a) => {
          const Icon = KIND_ICON[a.kind] ?? Zap;
          const copyOpen = a.primary.type === "copy-open" ? a.primary : null;
          return (
            <li key={a.id} className="group flex gap-3 py-3 first:pt-0 last:pb-0" data-testid="next-action" data-kind={a.kind}>
              <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] ${TONE_RING[a.tone]}`}>
                <Icon size={17} aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-start gap-2">
                  <p className="min-w-0 flex-1 font-dm text-[14px] font-semibold leading-snug text-[var(--a-ink)]">{a.title}</p>
                  <button type="button" onClick={() => snooze(a.id)} className="rounded p-1 text-[var(--a-ink-3)] opacity-60 hover:bg-[var(--a-surface-2)] hover:opacity-100" aria-label={`Hide "${a.title}" until tomorrow`} title="Hide until tomorrow">
                    <X size={14} />
                  </button>
                </div>
                {a.detail && <p className="mt-0.5 line-clamp-2 font-dm text-[12.5px] text-[var(--a-ink-3)]">{a.detail}</p>}
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button size="sm" variant="primary" loading={busy === `${a.id}:${a.primary.label}`} onClick={() => run(a, a.primary)} data-testid="action-primary">
                    {a.primary.label}
                  </Button>
                  {copyOpen && posted[a.id] && (
                    <Button size="sm" variant="secondary" icon={CheckCheck} loading={busy === `${a.id}:posted`} onClick={() => markPosted(a, copyOpen.postId)}>
                      I posted it
                    </Button>
                  )}
                  {a.secondary?.map((b) => (
                    <Button key={b.label} size="sm" variant="ghost" onClick={() => run(a, b)}>
                      {b.label}
                    </Button>
                  ))}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
      {open && (
        <PostDrawer post={open} audiences={audiences} onClose={() => setOpen(null)} onChange={(p) => { setOpen(p); router.refresh(); }} onDelete={() => { setOpen(null); router.refresh(); }} />
      )}
    </>
  );
}

/** Optional two-sentence brief (Haiku, cached per feed). Hidden when unavailable. */
export function MissionBrief({ enabled }: { enabled: boolean }) {
  const [text, setText] = useState<string | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "error">(enabled ? "loading" : "idle");
  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    fetch("/api/admin/growth/mission/summary", { method: "POST" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((j) => alive && (setText(j.text), setState("idle")))
      .catch(() => alive && setState("error"));
    return () => { alive = false; };
  }, [enabled]);
  if (!enabled || state === "error") return null;
  return (
    <div className="flex items-start gap-3 rounded-[var(--a-radius-card)] border border-[#d3def3] bg-gradient-to-r from-[var(--a-info-bg)] to-[var(--a-surface)] px-4 py-3" data-testid="mission-brief">
      <Sparkles size={17} className="mt-0.5 shrink-0 text-[var(--a-blue)]" aria-hidden />
      {state === "loading" ? <div className="flex-1"><Skeleton lines={2} /></div> : <p className="font-dm text-[13.5px] leading-relaxed text-[var(--a-ink-2)]">{text}</p>}
    </div>
  );
}

export function GoalTracker({ items: initial, elapsed, goals: initialGoals }: { items: GoalItem[]; elapsed: number; goals: Goals }) {
  const toast = useToast();
  const [items, setItems] = useState(initial);
  const [goals, setGoals] = useState(initialGoals);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const anySet = items.some((i) => i.target > 0);

  async function save() {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/growth/mission", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ goals }) });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "Save failed");
      setItems(j.progress.items);
      setGoals(j.goals);
      setEditing(false);
      toast.success("Weekly goals saved");
    } catch (e) {
      toast.error("Could not save goals", e instanceof Error ? e.message : undefined);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card
      title={<span className="inline-flex items-center gap-1.5"><Target size={16} className="text-[var(--a-ink-3)]" aria-hidden /> This week&apos;s goals</span>}
      subtitle={`${Math.round(elapsed * 100)}% of the week gone`}
      action={<Button size="sm" variant="ghost" icon={Pencil} onClick={() => setEditing((e) => !e)} data-testid="edit-goals">{editing ? "Close" : anySet ? "Edit" : "Set goals"}</Button>}
    >
      {editing ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {([["signups", "AI Academy sign-ups"], ["leads", "New leads"], ["revenueCents", "Revenue (USD)"], ["posts", "Posts published"]] as const).map(([k, l]) => (
              <div key={k}>
                <label className={label} htmlFor={`goal-${k}`}>{l}</label>
                <input
                  id={`goal-${k}`}
                  type="number"
                  min={0}
                  className={input}
                  value={k === "revenueCents" ? Math.round(goals[k] / 100) : goals[k]}
                  onChange={(e) => setGoals({ ...goals, [k]: k === "revenueCents" ? Math.round(Number(e.target.value) * 100) : Number(e.target.value) })}
                />
              </div>
            ))}
          </div>
          <Button variant="primary" size="sm" loading={busy} onClick={save} data-testid="save-goals">Save goals</Button>
        </div>
      ) : !anySet ? (
        <p className="font-dm text-[13px] text-[var(--a-ink-3)]">Set a weekly target for sign-ups, leads, revenue or posts. Progress fills in from your tracked links automatically.</p>
      ) : (
        <ul className="space-y-3.5" data-testid="goal-list">
          {items.filter((i) => i.target > 0).map((i) => {
            const pct = i.target ? i.value / i.target : 0;
            const tone = pct >= 1 ? "success" : pct >= elapsed * 0.8 ? "blue" : "warn";
            return (
              <li key={i.key}>
                <div className="mb-1 flex items-baseline justify-between gap-2 font-dm">
                  <span className="text-[13px] font-semibold text-[var(--a-ink)]">{i.label}</span>
                  <span className="text-[13px] tabular-nums text-[var(--a-ink-2)]"><b className="text-[var(--a-ink)]">{i.display}</b> / {i.targetDisplay}</span>
                </div>
                <Progress value={i.value} max={i.target} tone={tone} label={`${i.label} progress`} />
                <p className="mt-1 font-dm text-[11.5px] text-[var(--a-ink-3)]">{pct >= 1 ? "Goal reached" : `Last week: ${i.key === "revenueCents" ? `$${Math.round(i.lastWeek / 100)}` : i.lastWeek}`} · {i.source}</p>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

export function StreakCard({ streak }: { streak: Streak }) {
  const label = useMemo(() => (streak.current >= 7 ? "On fire. Keep it going." : streak.current >= 3 ? "Nice rhythm." : streak.current >= 1 ? "Started. Show up again tomorrow." : "Publish or approve something today to start a streak."), [streak.current]);
  return (
    <Card title={<span className="inline-flex items-center gap-1.5"><Flame size={16} className="text-[var(--a-orange)]" aria-hidden /> Consistency streak</span>} subtitle="A day counts when a post goes out or outreach is approved.">
      <div className="flex items-end gap-4">
        <p className="font-dm text-[34px] font-bold leading-none tabular-nums text-[var(--a-ink)]" data-testid="streak-current">{streak.current}<span className="ml-1 text-[14px] font-semibold text-[var(--a-ink-3)]">day{streak.current === 1 ? "" : "s"}</span></p>
        <p className="pb-1 font-dm text-[12px] text-[var(--a-ink-3)]">Best: {streak.best}</p>
      </div>
      <div className="mt-3 flex gap-1" aria-label="Last 14 days">
        {streak.days.map((d) => (
          <span key={d.day} title={`${d.day}: ${d.count} action${d.count === 1 ? "" : "s"}`} className={`h-6 flex-1 rounded-[5px] ${d.active ? "bg-[var(--a-orange)]" : "bg-[var(--a-surface-2)] ring-1 ring-inset ring-[var(--a-border)]"}`} />
        ))}
      </div>
      <p className="mt-2 font-dm text-[12.5px] text-[var(--a-ink-2)]">{label}</p>
    </Card>
  );
}
