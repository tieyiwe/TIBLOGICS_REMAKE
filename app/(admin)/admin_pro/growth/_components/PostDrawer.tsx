"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Copy, Download, ExternalLink, RotateCcw, Trash2 } from "lucide-react";
import { Badge, Button, Drawer, useToast } from "@/components/admin/ui";
import type { PostView } from "@/lib/growth/content/posts";
import { composePost, deepLink, PLATFORM_INFO, PLATFORMS, STATUS_LABEL, type Platform, type PostStatus } from "@/lib/growth/content/platforms";
import { suggestSlots } from "@/lib/growth/content/times";
import type { CardSpec } from "@/lib/growth/cards/spec";
import CardStudio, { cardUrl } from "./CardStudio";
import { CharRing, PostPreview } from "./previews";
import { input, label, StatusPill } from "./ui";

export interface AudienceTz {
  id: string;
  name: string;
  timezone: string;
  language: string;
}

export function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

export function fmtWhen(iso: string | null, tz?: string): string {
  if (!iso) return "Not scheduled";
  return new Date(iso).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", ...(tz ? { timeZone: tz, timeZoneName: "short" } : {}) });
}

export async function patchPost(id: string, body: Record<string, unknown>): Promise<PostView> {
  const res = await fetch(`/api/admin/growth/posts/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const j = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(j.error ?? `Failed (${res.status})`);
  return j.post as PostView;
}

const SOURCE_LABEL: Record<string, string> = { kit: "From a marketing kit", repurpose: "Auto-drafted from new content", trend: "Trend idea", manual: "Manual post" };

export default function PostDrawer({
  post,
  audiences,
  onClose,
  onChange,
  onDelete,
}: {
  post: PostView;
  audiences: AudienceTz[];
  onClose: () => void;
  onChange: (p: PostView) => void;
  onDelete: (id: string) => void;
}) {
  const toast = useToast();
  const [body, setBody] = useState(post.body);
  const [tags, setTags] = useState(post.hashtags.join(" "));
  const [platform, setPlatform] = useState<Platform>(post.platform);
  const [when, setWhen] = useState(toLocalInput(post.scheduledAt));
  const [image, setImage] = useState<CardSpec | null>(post.image);
  const [tz, setTz] = useState(() => audiences.find((a) => a.language === post.language)?.timezone ?? audiences[0]?.timezone ?? "America/New_York");
  const [extUrl, setExtUrl] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setBody(post.body);
    setTags(post.hashtags.join(" "));
    setPlatform(post.platform);
    setWhen(toLocalInput(post.scheduledAt));
    setImage(post.image);
    setErr(null);
  }, [post]);

  const hashtags = tags.split(/[\s,]+/).map((t) => t.replace(/^#/, "")).filter(Boolean);
  const text = composePost({ platform, body, hashtags, shortUrl: post.shortUrl });
  const max = PLATFORM_INFO[platform].maxChars;
  const editable = ["draft", "scheduled", "ready", "failed", "rejected"].includes(post.status);
  const imageDirty = JSON.stringify(image) !== JSON.stringify(post.image);
  const dirty = body !== post.body || tags !== post.hashtags.join(" ") || platform !== post.platform || when !== toLocalInput(post.scheduledAt) || imageDirty;
  const slots = useMemo(() => suggestSlots(platform, tz, new Date(), 4), [platform, tz]);
  const previewImage = image ? cardUrl(image, 0) : null;

  async function run(name: string, extra: Record<string, unknown>, saveEdits = true, done?: string) {
    setBusy(name);
    setErr(null);
    try {
      const payload: Record<string, unknown> = { ...extra };
      if (saveEdits && editable && dirty) {
        Object.assign(payload, { body, hashtags, platform, scheduledAt: when ? new Date(when).toISOString() : null });
        if (imageDirty) payload.image = image;
      }
      onChange(await patchPost(post.id, payload));
      if (done) toast.success(done);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  }

  async function remove() {
    if (!confirm("Delete this post from the queue?")) return;
    setBusy("delete");
    const res = await fetch(`/api/admin/growth/posts/${post.id}`, { method: "DELETE" });
    setBusy(null);
    if (res.ok) {
      toast.success("Post deleted");
      onDelete(post.id);
    } else setErr((await res.json().catch(() => ({}))).error ?? "Delete failed");
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setErr("Copy failed: select the preview text and copy it by hand.");
    }
  }

  const s = post.status as PostStatus;
  const footer = (
    <div className="flex flex-wrap items-center gap-2">
      {editable && dirty && <Button variant="secondary" loading={busy === "save"} onClick={() => run("save", {}, true, "Saved")}>Save changes</Button>}
      {(s === "draft" || s === "rejected") && (
        <Button variant="primary" icon={Check} loading={busy === "approve"} disabled={text.length > max} onClick={() => run("approve", { action: "approve" }, true, "Approved and scheduled")}>
          Approve & schedule
        </Button>
      )}
      {s === "failed" && <Button variant="primary" icon={RotateCcw} loading={busy === "retry"} onClick={() => run("retry", { action: "retry" }, true, "Retrying now")}>Retry now</Button>}
      {(s === "scheduled" || s === "ready") && <Button loading={busy === "unschedule"} onClick={() => run("unschedule", { action: "unschedule" }, true, "Back to draft")}>Back to draft</Button>}
      <Button icon={copied ? Check : Copy} onClick={copy}>{copied ? "Copied" : "Copy text"}</Button>
      <Button icon={ExternalLink} href={deepLink(platform, text, post.shortUrl)} external>Open {PLATFORM_INFO[platform].label}</Button>
    </div>
  );

  return (
    <Drawer open onClose={onClose} title={`${PLATFORM_INFO[post.platform].label} post`} width={760} footer={footer}>
      <div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill status={s} label={STATUS_LABEL[s] ?? s} />
            <Badge tone="neutral">{SOURCE_LABEL[post.source] ?? post.source}</Badge>
            <Badge tone="neutral">{post.language.toUpperCase()}</Badge>
            {post.autoPublish ? <Badge tone="success" dot>Auto-publish</Badge> : <Badge tone="orange" dot>Post by hand</Badge>}
          </div>

          {post.error && <p className="rounded-[var(--a-radius-control)] bg-[var(--a-danger-bg)] px-3 py-2 font-dm text-[12.5px] text-[var(--a-danger)]">{post.error}</p>}
          {s === "ready" && (
            <p className="rounded-[var(--a-radius-control)] bg-[var(--a-orange-bg)] px-3 py-2 font-dm text-[12.5px] text-[var(--a-orange-text)]">
              Time to post this by hand: copy the text{image ? " and download the image" : ""}, open {PLATFORM_INFO[post.platform].label}, post it, then press Mark as posted.
            </p>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={label} htmlFor="pd-platform">Platform</label>
              <select id="pd-platform" className={input} value={platform} disabled={!editable} onChange={(e) => setPlatform(e.target.value as Platform)}>
                {PLATFORMS.map((p) => <option key={p} value={p}>{PLATFORM_INFO[p].label}</option>)}
              </select>
            </div>
            <div>
              <label className={label} htmlFor="pd-when">Publish at (your time)</label>
              <input id="pd-when" type="datetime-local" className={input} value={when} disabled={!editable} onChange={(e) => setWhen(e.target.value)} />
            </div>
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between gap-2">
              <span className={label}>Best times</span>
              <select aria-label="Audience time zone" className="rounded-md border border-[var(--a-border-strong)] bg-white px-2 py-1 font-dm text-[12px]" value={tz} onChange={(e) => setTz(e.target.value)}>
                {audiences.filter((a, i) => audiences.findIndex((b) => b.timezone === a.timezone) === i).map((a) => <option key={a.timezone} value={a.timezone}>{a.name} ({a.timezone})</option>)}
              </select>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {slots.map((d) => (
                <button key={d.toISOString()} type="button" disabled={!editable} onClick={() => setWhen(toLocalInput(d.toISOString()))}
                  className="rounded-full border border-[var(--a-border-strong)] px-2.5 py-1 font-dm text-[12px] text-[var(--a-blue)] hover:bg-[var(--a-surface-2)] disabled:opacity-50">
                  {fmtWhen(d.toISOString(), tz)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className={label} htmlFor="pd-body">Post text</label>
              <CharRing value={text.length} max={max} />
            </div>
            <textarea id="pd-body" rows={8} className={input} value={body} disabled={!editable} onChange={(e) => setBody(e.target.value)} />
          </div>
          <div>
            <label className={label} htmlFor="pd-tags">Hashtags (space separated)</label>
            <input id="pd-tags" className={input} value={tags} disabled={!editable} onChange={(e) => setTags(e.target.value)} placeholder="AI SmallBusiness" />
            {post.shortUrl && <p className="mt-1 font-dm text-[11.5px] text-[var(--a-ink-3)]">Tracked link added after the text: {post.shortUrl}</p>}
          </div>

          <div>
            <p className={label}>Image card</p>
            {editable ? <CardStudio text={body} spec={image} onChange={setImage} compact /> : image ? null : <p className="font-dm text-[12.5px] text-[var(--a-ink-3)]">No image.</p>}
            {post.image && !imageDirty && (
              <div className="mt-2 flex flex-wrap gap-2">
                {Array.from({ length: post.slides }).map((_, i) => (
                  <a key={i} href={`/api/admin/growth/cards/post/${post.id}?slide=${i}&download=1`} className="inline-flex items-center gap-1 font-dm text-[12px] font-semibold text-[var(--a-blue)] hover:underline">
                    <Download size={13} aria-hidden /> {post.slides > 1 ? `Slide ${i + 1}` : "Download image"}
                  </a>
                ))}
              </div>
            )}
          </div>

          {err && <p role="alert" className="font-dm text-[13px] text-[var(--a-danger)]">{err}</p>}

          {["draft", "scheduled", "ready", "failed"].includes(s) && (
            <div className="space-y-2 rounded-[var(--a-radius-card)] border border-[var(--a-border)] p-3">
              <p className="font-dm text-[12.5px] text-[var(--a-ink-2)]">Posted it yourself? Record it so the calendar and reports are right.</p>
              <div className="flex gap-2">
                <input className={input} placeholder="Post URL (optional, https)" value={extUrl} onChange={(e) => setExtUrl(e.target.value)} aria-label="Post URL" />
                <Button variant="secondary" loading={busy === "posted"} onClick={() => run("posted", { action: "mark-posted", externalUrl: extUrl }, false, "Marked as posted")}>Mark as posted</Button>
              </div>
            </div>
          )}
          {post.externalUrl && (
            <a href={post.externalUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-dm text-[13px] text-[var(--a-blue)] underline">
              View the published post <ExternalLink size={13} />
            </a>
          )}

          <div className="flex flex-wrap gap-2 border-t border-[var(--a-border)] pt-3">
            {["draft", "ready", "failed"].includes(s) && <Button size="sm" variant="ghost" loading={busy === "reject"} onClick={() => run("reject", { action: "reject" }, false, "Rejected")}>Reject</Button>}
            {s === "rejected" && <Button size="sm" variant="ghost" loading={busy === "restore"} onClick={() => run("restore", { action: "restore" }, false, "Restored to draft")}>Restore to draft</Button>}
            {s !== "publishing" && <Button size="sm" variant="ghost" icon={Trash2} className="text-[var(--a-danger)]" loading={busy === "delete"} onClick={remove}>Delete</Button>}
          </div>
        </div>

        <aside className="space-y-2">
          <p className="a-micro">Live preview</p>
          <PostPreview platform={platform} text={text} image={previewImage} linkUrl={post.shortUrl} />
        </aside>
      </div>
    </Drawer>
  );
}
