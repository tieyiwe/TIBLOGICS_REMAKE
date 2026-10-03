"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  CalendarRange, Check, CheckCheck, Copy, ExternalLink, FileText, Gift, Link2, Mail, Send, Sparkles, Trash2, TrendingUp, Users,
} from "lucide-react";
import { Badge, Button, Card, EmptyState, Segmented, StatCard, useToast } from "@/components/admin/ui";
import type { CampaignDTO } from "@/lib/growth/campaigns";
import type { PostView } from "@/lib/growth/content/posts";
import type { Row } from "@/lib/growth/reports";
import { PLATFORM_INFO, STATUS_LABEL, type PostStatus } from "@/lib/growth/content/platforms";
import PostDrawer, { fmtWhen, type AudienceTz } from "../../_components/PostDrawer";
import { money, Progress, StatusPill } from "../../_components/ui";

const CHANNEL_LABEL: Record<string, string> = {
  linkedin: "LinkedIn", x: "X", facebook: "Facebook", instagram: "Instagram", whatsapp: "WhatsApp Status",
  email: "Newsletter", newsletter: "Newsletter", outreach: "Cold outreach", ads: "Paid ads",
};
const ch = (k: string) => CHANNEL_LABEL[k] ?? k;

interface ProgressView {
  value: number; target: number; display: string; targetDisplay: string; pct: number; elapsed: number; daysLeft: number; onTrack: boolean;
  posts: Record<string, number>; enrolled: number; replied: number;
  totals: Row; byPlatform: Row[]; byLink: Row[]; daily: { day: string; clicks: number; signups: number; conversions: number }[];
}

function insight(rows: Row[]): string | null {
  const scored = rows.filter((r) => r.clicks > 0 || r.signups + r.conversions > 0);
  if (!scored.length) return null;
  const best = [...scored].sort((a, b) => b.signups + b.conversions - (a.signups + a.conversions) || b.clicks - a.clicks)[0];
  if (best.signups + best.conversions > 0) return `${ch(best.key)} is working best: ${best.signups + best.conversions} result${best.signups + best.conversions === 1 ? "" : "s"} from ${best.clicks} clicks. Put the next posts there.`;
  return `${ch(best.key)} brings the most clicks (${best.clicks}) but no results yet. Check the landing page and the call to action.`;
}

export default function CampaignDetail({
  campaign: c, progress: p, posts: initialPosts, products, matches, sequence, acquire, audiences,
}: {
  campaign: CampaignDTO;
  progress: ProgressView;
  posts: PostView[];
  products: { key: string; title: string; url: string }[];
  matches: { count: number; ids: string[]; sample: { id: string; companyName: string; score: number | null; area: string | null }[] };
  sequence: { id: string; name: string; status: string } | null;
  acquire: boolean;
  audiences: AudienceTz[];
}) {
  const router = useRouter();
  const toast = useToast();
  const [status, setStatus] = useState(c.status);
  const [posts, setPosts] = useState(initialPosts);
  const [open, setOpen] = useState<PostView | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const drafts = posts.filter((x) => x.status === "draft");
  const expected = Math.round(p.target * p.elapsed);
  const tip = insight(p.byPlatform);

  async function setCampaignStatus(s: string) {
    setStatus(s);
    const res = await fetch(`/api/admin/growth/campaigns/${c.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: s }) });
    if (res.ok) toast.success(`Campaign ${s === "done" ? "marked done" : s}`);
    else { toast.error("Could not change the status"); setStatus(c.status); }
  }

  async function approveDrafts() {
    setBusy("approve");
    try {
      const res = await fetch("/api/admin/growth/posts/bulk", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids: drafts.map((d) => d.id), action: "approve" }) });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error);
      setPosts((xs) => xs.map((x) => j.posts.find((y: PostView) => y.id === x.id) ?? x));
      if (j.failed?.length) toast.error(`${j.updated} approved, ${j.failed.length} need a fix`, j.failed[0].error);
      else toast.success(`${j.updated} posts approved`, "They publish at their scheduled times.");
    } catch (e) {
      toast.error("Approval failed", e instanceof Error ? e.message : undefined);
    } finally {
      setBusy(null);
    }
  }

  async function enrol() {
    if (!sequence || !matches.ids.length) return;
    if (!confirm(`Draft emails for ${matches.ids.length} matching lead(s)? Nothing is sent until you approve each one in the outreach inbox.`)) return;
    setBusy("enrol");
    let enrolled = 0;
    let skipped = 0;
    try {
      for (let i = 0; i < matches.ids.length; i += 25) {
        const res = await fetch("/api/admin/growth/outreach/enroll", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sequenceId: sequence.id, leadIds: matches.ids.slice(i, i + 25) }) });
        const j = await res.json();
        if (!res.ok) throw new Error(j.error);
        enrolled += j.enrolled.length;
        skipped += j.skipped.length;
      }
      toast.success(`${enrolled} lead${enrolled === 1 ? "" : "s"} drafted`, skipped ? `${skipped} skipped (no consent, suppressed or already in a sequence).` : "Approve them in the outreach inbox.");
      router.refresh();
    } catch (e) {
      toast.error("Enrolment failed", e instanceof Error ? e.message : undefined);
    } finally {
      setBusy(null);
    }
  }

  async function remove() {
    if (!confirm("Delete this campaign? Its kit, posts, links and sequence stay where they are.")) return;
    const res = await fetch(`/api/admin/growth/campaigns/${c.id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Campaign deleted");
      router.push("/admin_pro/growth/campaigns");
    }
  }

  async function copy(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(url);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      toast.info("Copy blocked", url);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <Segmented ariaLabel="Campaign status" value={status} onChange={setCampaignStatus} options={[{ value: "active", label: "Active" }, { value: "paused", label: "Paused" }, { value: "done", label: "Done" }]} />
        <span className="ml-auto" />
        <Button variant="ghost" icon={Trash2} className="text-[var(--a-danger)]" onClick={remove}>Delete</Button>
      </div>

      {/* Goal */}
      <section className="rounded-[var(--a-radius-hero)] border border-[var(--a-border)] bg-gradient-to-br from-[#0D1B2A] via-[#132C52] to-[#1B3A6B] p-6 text-white shadow-[var(--a-shadow-card)]" data-testid="campaign-goal">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-dm text-[11px] font-semibold uppercase tracking-[.12em] text-white/70">Goal: {c.goalLabel}</p>
            <p className="mt-1 font-dm text-[44px] font-bold leading-none tabular-nums">{p.display}<span className="text-[20px] font-semibold text-white/60"> / {p.targetDisplay}</span></p>
          </div>
          <div className="text-right font-dm">
            <Badge tone={p.pct >= 100 ? "success" : p.onTrack ? "info" : "warn"} dot>{p.pct >= 100 ? "Goal reached" : p.onTrack ? "On track" : "Behind pace"}</Badge>
            <p className="mt-1 text-[13px] text-white/75">{p.daysLeft} day{p.daysLeft === 1 ? "" : "s"} left · expected by now: {c.goalType === "revenue" ? money(expected) : expected}</p>
          </div>
        </div>
        <div className="relative mt-5 h-3 overflow-hidden rounded-full bg-white/15">
          <div className="h-full rounded-full bg-[#F47C20]" style={{ width: `${p.pct}%` }} />
          <span className="absolute top-0 h-3 w-0.5 bg-white" style={{ left: `${Math.round(p.elapsed * 100)}%` }} title="Where you should be by now" />
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Clicks" value={p.totals.clicks} spark={p.daily.map((d) => d.clicks)} />
        <StatCard label="AI Academy sign-ups" value={p.totals.signups} />
        <StatCard label="Conversions" value={p.totals.conversions} />
        <StatCard label="Revenue" value={money(p.totals.revenueCents)} tone={p.totals.revenueCents ? "success" : "default"} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0 space-y-5">
          <Card title={<span className="inline-flex items-center gap-1.5"><TrendingUp size={15} className="text-[var(--a-ink-3)]" aria-hidden /> What&apos;s working</span>} subtitle="By channel (utm_source), from this campaign's tracked links only.">
            {tip && <p className="mb-3 rounded-[var(--a-radius-control)] bg-[var(--a-success-bg)] px-3 py-2 font-dm text-[13px] text-[var(--a-success)]" data-testid="campaign-insight">{tip}</p>}
            {p.byPlatform.length === 0 ? (
              <EmptyState compact icon={TrendingUp} title="No clicks yet" body="Once the posts and links go out, results per channel show up here." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[480px] font-dm text-[13px]">
                  <thead><tr className="text-left text-[11px] uppercase tracking-[.06em] text-[var(--a-ink-3)]"><th className="py-1.5">Channel</th><th className="py-1.5 text-right">Clicks</th><th className="py-1.5 text-right">Sign-ups</th><th className="py-1.5 text-right">Conversions</th><th className="py-1.5 text-right">Revenue</th></tr></thead>
                  <tbody>
                    {p.byPlatform.map((r) => (
                      <tr key={r.key} className="border-t border-[var(--a-border)]">
                        <td className="py-1.5 font-semibold text-[var(--a-ink)]">{ch(r.key)}</td>
                        <td className="py-1.5 text-right tabular-nums">{r.clicks}</td>
                        <td className="py-1.5 text-right tabular-nums">{r.signups}</td>
                        <td className="py-1.5 text-right tabular-nums">{r.conversions}</td>
                        <td className="py-1.5 text-right tabular-nums">{money(r.revenueCents)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {p.byLink.some((l) => l.clicks > 0) && (
              <>
                <p className="a-micro mt-4">Top links</p>
                <ul className="mt-1 divide-y divide-[var(--a-border)]">
                  {p.byLink.filter((l) => l.clicks > 0).slice(0, 5).map((l) => (
                    <li key={l.key} className="flex items-center justify-between gap-2 py-1.5 font-dm text-[13px]"><span className="truncate">{l.label}</span><span className="tabular-nums font-semibold">{l.clicks}</span></li>
                  ))}
                </ul>
              </>
            )}
          </Card>

          <Card
            title={<span className="inline-flex items-center gap-1.5"><FileText size={15} className="text-[var(--a-ink-3)]" aria-hidden /> Posts ({posts.length})</span>}
            subtitle={c.kitId ? "From the campaign's content kit, each with its own tracked link." : "The kit could not be created; see the notes."}
            action={
              <span className="flex flex-wrap gap-2">
                {drafts.length > 0 && <Button size="sm" variant="primary" icon={CheckCheck} loading={busy === "approve"} onClick={approveDrafts} data-testid="campaign-approve">Approve {drafts.length} drafts</Button>}
                {c.kitId && <Button size="sm" href={`/admin_pro/growth/content/${c.kitId}`}>Open kit</Button>}
              </span>
            }
          >
            {posts.length === 0 ? <p className="font-dm text-[13px] text-[var(--a-ink-3)]">No posts queued.</p> : (
              <ul className="grid gap-2 sm:grid-cols-2">
                {posts.map((x) => (
                  <li key={x.id}>
                    <button type="button" onClick={() => setOpen(x)} className="w-full rounded-[var(--a-radius-control)] border border-[var(--a-border)] bg-white p-2.5 text-left hover:border-[var(--a-border-strong)]" style={{ borderLeft: `3px solid ${PLATFORM_INFO[x.platform].color}` }}>
                      <span className="flex items-center justify-between gap-2">
                        <span className="font-dm text-[12px] font-semibold text-[var(--a-ink)]">{PLATFORM_INFO[x.platform].label}</span>
                        <StatusPill status={x.status} label={STATUS_LABEL[x.status as PostStatus] ?? x.status} />
                      </span>
                      <span className="mt-0.5 line-clamp-2 block font-dm text-[12px] text-[var(--a-ink-3)]">{x.body}</span>
                      <span className="mt-1 block font-dm text-[11px] text-[var(--a-ink-3)]">{fmtWhen(x.scheduledAt)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {c.plan.weekly.length > 0 && (
            <Card title={<span className="inline-flex items-center gap-1.5"><CalendarRange size={15} className="text-[var(--a-ink-3)]" aria-hidden /> The plan</span>} subtitle={c.plan.summary}>
              <ol className="grid gap-3 md:grid-cols-2">
                {c.plan.weekly.map((w) => (
                  <li key={w.week} className="rounded-[var(--a-radius-control)] border border-[var(--a-border)] p-3">
                    <p className="a-micro">Week {w.week}</p>
                    <p className="mt-1 font-dm text-[13.5px] font-semibold text-[var(--a-ink)]">{w.focus}</p>
                    <ul className="mt-1.5 space-y-1">{w.actions.map((a, i) => <li key={i} className="flex gap-1.5 font-dm text-[12.5px] text-[var(--a-ink-2)]"><Check size={13} className="mt-0.5 shrink-0 text-[var(--a-success)]" aria-hidden />{a}</li>)}</ul>
                  </li>
                ))}
              </ol>
            </Card>
          )}
        </div>

        <aside className="space-y-5">
          <Card title={<span className="inline-flex items-center gap-1.5"><Link2 size={15} className="text-[var(--a-ink-3)]" aria-hidden /> Share links</span>} subtitle="Use these for bio links, WhatsApp, newsletters and ads.">
            {(c.assets.links ?? []).length === 0 ? <p className="font-dm text-[13px] text-[var(--a-ink-3)]">No share links.</p> : (
              <ul className="space-y-2">
                {(c.assets.links ?? []).map((l) => (
                  <li key={l.code} className="flex items-center gap-2">
                    <Badge tone="neutral">{ch(l.channel)}</Badge>
                    <code className="min-w-0 flex-1 truncate font-mono text-[12px] text-[var(--a-ink-2)]">{l.url}</code>
                    <button type="button" aria-label={`Copy ${ch(l.channel)} link`} onClick={() => copy(l.url)} className="rounded p-1.5 hover:bg-[var(--a-surface-2)]">
                      {copied === l.url ? <Check size={14} className="text-[var(--a-success)]" /> : <Copy size={14} />}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {products.length > 0 && <p className="mt-3 font-dm text-[12px] text-[var(--a-ink-3)]">Points to: {products.map((x) => x.title).join(", ")}</p>}
          </Card>

          <Card title={<span className="inline-flex items-center gap-1.5"><Mail size={15} className="text-[var(--a-ink-3)]" aria-hidden /> Outreach</span>}>
            {!sequence ? (
              <p className="font-dm text-[13px] text-[var(--a-ink-3)]">No outreach in this campaign.</p>
            ) : (
              <div className="space-y-3 font-dm text-[13px]">
                <p><b className="text-[var(--a-ink)]">{sequence.name}</b> <Badge tone={sequence.status === "active" ? "success" : "neutral"} className="ml-1">{sequence.status}</Badge></p>
                <div className="flex flex-wrap gap-1.5">
                  {c.leadFilter.industries.map((x) => <Badge key={x} tone="info">{x}</Badge>)}
                  {c.leadFilter.areas.map((x) => <Badge key={x} tone="neutral">{x}</Badge>)}
                  {c.leadFilter.minScore > 0 && <Badge tone="orange">score {c.leadFilter.minScore}+</Badge>}
                </div>
                <p className="text-[var(--a-ink-2)]"><Users size={13} className="mr-1 inline" aria-hidden /><b data-testid="match-count">{matches.count}</b> matching lead{matches.count === 1 ? "" : "s"} · {p.enrolled} enrolled · {p.replied} replied</p>
                {matches.sample.length > 0 && <p className="text-[12px] text-[var(--a-ink-3)]">{matches.sample.map((l) => l.companyName).join(", ")}{matches.count > matches.sample.length ? "…" : ""}</p>}
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="primary" icon={Send} disabled={!matches.ids.length} loading={busy === "enrol"} onClick={enrol}>Draft emails for {Math.min(matches.ids.length, 100)}</Button>
                  <Button size="sm" href="/admin_pro/growth/outreach">Approval inbox</Button>
                </div>
                <p className="text-[11.5px] text-[var(--a-ink-3)]">Leads without consent, on the suppression list or already in a sequence are skipped. You approve every email.</p>
              </div>
            )}
          </Card>

          {c.plan.leadMagnet && (
            <Card title={<span className="inline-flex items-center gap-1.5"><Gift size={15} className="text-[var(--a-ink-3)]" aria-hidden /> Lead magnet</span>}>
              <p className="font-dm text-[13.5px] font-semibold text-[var(--a-ink)]">{c.plan.leadMagnet.title}</p>
              <p className="mt-1 font-dm text-[12.5px] text-[var(--a-ink-2)]">{c.plan.leadMagnet.hook}</p>
              {acquire ? (
                <Button size="sm" className="mt-3" icon={Sparkles} href={`/admin_pro/growth/acquire?magnet=${encodeURIComponent(c.plan.leadMagnet.title)}&campaign=${encodeURIComponent(c.slug)}`}>Build it in Acquire</Button>
              ) : (
                <p className="mt-2 font-dm text-[11.5px] text-[var(--a-ink-3)]">A suggestion for now: build it as a free download and share it with the links above.</p>
              )}
            </Card>
          )}

          {(c.assets.errors ?? []).length > 0 && (
            <Card title="Notes">
              <ul className="space-y-1">{(c.assets.errors ?? []).map((e, i) => <li key={i} className="font-dm text-[12px] text-[var(--a-warn)]">{e}</li>)}</ul>
            </Card>
          )}

          <Link href={`/admin_pro/growth/links?days=90`} className="inline-flex items-center gap-1 font-dm text-[13px] font-semibold text-[var(--a-blue)] hover:underline">
            Full attribution <ExternalLink size={13} aria-hidden />
          </Link>
        </aside>
      </div>

      {open && (
        <PostDrawer post={open} audiences={audiences} onClose={() => setOpen(null)}
          onChange={(x) => { setPosts((xs) => xs.map((y) => (y.id === x.id ? x : y))); setOpen(x); }}
          onDelete={(id) => { setPosts((xs) => xs.filter((y) => y.id !== id)); setOpen(null); }} />
      )}
    </div>
  );
}
