"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, ArrowRight, Flame, Newspaper, PenLine, RefreshCw } from "lucide-react";
import { Badge, Button, EmptyState, Segmented, Skeleton, useToast } from "@/components/admin/ui";
import type { PostView } from "@/lib/growth/content/posts";
import type { TrendIdea } from "@/lib/growth/trends";
import { PLATFORM_INFO, type Platform } from "@/lib/growth/content/platforms";
import PostDrawer, { type AudienceTz } from "./PostDrawer";
import { Card } from "./ui";

const ago = (iso: string) => {
  const h = Math.round((Date.now() - Date.parse(iso)) / 3_600_000);
  return h < 1 ? "just now" : h < 24 ? `${h}h ago` : `${Math.round(h / 24)}d ago`;
};

function IdeaCard({ idea, onDraft, busy }: { idea: TrendIdea; onDraft: (p: Platform) => void; busy: boolean }) {
  const [platform, setPlatform] = useState<Platform>(idea.posts[0]?.platform ?? "linkedin");
  const post = idea.posts.find((p) => p.platform === platform) ?? idea.posts[0];
  const done = idea.drafted.includes(platform);
  return (
    <article className="flex min-w-0 flex-col rounded-[var(--a-radius-card)] border border-[var(--a-border)] bg-[var(--a-surface)] p-4" data-testid="trend-idea">
      <div className="flex items-start gap-2">
        <Newspaper size={16} className="mt-0.5 shrink-0 text-[var(--a-ink-3)]" aria-hidden />
        <div className="min-w-0">
          <p className="line-clamp-2 font-dm text-[13.5px] font-semibold text-[var(--a-ink)]">{idea.title}</p>
          <p className="font-dm text-[11.5px] text-[var(--a-ink-3)]">{idea.category} · {ago(idea.publishedAt)}</p>
        </div>
      </div>
      <div className="mt-2 flex items-center gap-1.5 font-dm text-[12px] text-[var(--a-ink-2)]">
        <ArrowRight size={13} className="text-[var(--a-orange)]" aria-hidden />
        <span className="truncate">Pairs with <b>{idea.productTitle}</b></span>
      </div>
      {idea.angle && <p className="mt-1.5 line-clamp-2 font-dm text-[12.5px] text-[var(--a-ink-3)]">{idea.angle}</p>}
      <div className="mt-3">
        <Segmented
          size="sm"
          ariaLabel="Platform"
          value={platform}
          onChange={(v) => setPlatform(v as Platform)}
          options={idea.posts.map((p) => ({ value: p.platform, label: PLATFORM_INFO[p.platform].label }))}
        />
      </div>
      <p className="mt-2 line-clamp-5 whitespace-pre-wrap rounded-[var(--a-radius-control)] bg-[var(--a-surface-2)] p-2.5 font-dm text-[12.5px] leading-relaxed text-[var(--a-ink-2)]">{post?.text}</p>
      {idea.warnings.length > 0 && (
        <p className="mt-2 flex items-start gap-1.5 font-dm text-[11.5px] text-[var(--a-warn)]">
          <AlertTriangle size={13} className="mt-0.5 shrink-0" aria-hidden /> {idea.warnings[0]}
        </p>
      )}
      <div className="mt-auto pt-3">
        <Button size="sm" variant={done ? "secondary" : "primary"} icon={PenLine} loading={busy} onClick={() => onDraft(platform)} data-testid="trend-draft">
          {done ? "Open draft" : "Draft it"}
        </Button>
      </div>
    </article>
  );
}

/** "Trending now": AI Times news turned into ready-to-draft post ideas. */
export default function TrendIdeas({ audiences }: { audiences: AudienceTz[] }) {
  const toast = useToast();
  const [ideas, setIdeas] = useState<TrendIdea[] | null>(null);
  const [pending, setPending] = useState(0);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [open, setOpen] = useState<PostView | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/growth/trends").then((x) => x.json());
      if (r.error) throw new Error(r.error);
      setIdeas(r.ideas);
      setPending(r.pending);
    } catch (e) {
      setIdeas((x) => x ?? []);
      toast.error("Trend ideas unavailable", e instanceof Error ? e.message : undefined);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function draft(idea: TrendIdea, platform: Platform) {
    setBusy(idea.blogId);
    try {
      const res = await fetch("/api/admin/growth/trends/draft", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ blogId: idea.blogId, platform }) });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error ?? "Could not draft it");
      if (j.created) toast.success("Draft created", "Review it, add an image, then approve.");
      setIdeas((xs) => xs?.map((x) => (x.blogId === idea.blogId ? { ...x, drafted: [...new Set([...x.drafted, platform])] } : x)) ?? null);
      setOpen(j.post);
    } catch (e) {
      toast.error("Could not draft it", e instanceof Error ? e.message : undefined);
    } finally {
      setBusy(null);
    }
  }

  return (
    <Card
      id="trends"
      title={<span className="inline-flex items-center gap-1.5"><Flame size={16} className="text-[var(--a-orange)]" aria-hidden /> Trending now</span>}
      subtitle="Today's AI Times news, paired with the product it sells best. One click drafts the post."
      action={
        <span className="flex items-center gap-2">
          {pending > 0 && <Badge tone="info">{pending} more coming</Badge>}
          <Button size="sm" variant="ghost" icon={RefreshCw} loading={loading} onClick={load} aria-label="Refresh trend ideas">Refresh</Button>
        </span>
      }
    >
      {ideas === null ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => <div key={i} className="rounded-[var(--a-radius-card)] border border-[var(--a-border)] p-4"><Skeleton lines={5} /></div>)}
        </div>
      ) : ideas.length === 0 ? (
        <EmptyState compact icon={Newspaper} title={pending ? "Writing ideas for the latest articles" : "No recent AI Times articles"} body={pending ? "They will appear here in a moment. Press Refresh." : "When the news agent publishes, ideas show up here."} />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {ideas.map((i) => <IdeaCard key={i.blogId} idea={i} busy={busy === i.blogId} onDraft={(p) => draft(i, p)} />)}
        </div>
      )}
      {open && (
        <PostDrawer post={open} audiences={audiences} onClose={() => setOpen(null)} onChange={setOpen} onDelete={() => setOpen(null)} />
      )}
    </Card>
  );
}
