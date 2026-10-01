"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Copy, ExternalLink, Trash2, X } from "lucide-react";
import type { PostView } from "@/lib/growth/content/posts";
import { composePost, deepLink, PLATFORM_INFO, PLATFORMS, STATUS_LABEL, type Platform, type PostStatus } from "@/lib/growth/content/platforms";
import { suggestSlots } from "@/lib/growth/content/times";
import { btn, input, label, StatusPill } from "./ui";

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
  const [body, setBody] = useState(post.body);
  const [tags, setTags] = useState(post.hashtags.join(" "));
  const [platform, setPlatform] = useState<Platform>(post.platform);
  const [when, setWhen] = useState(toLocalInput(post.scheduledAt));
  const [tz, setTz] = useState(() => audiences.find((a) => a.language === post.language)?.timezone ?? audiences[0]?.timezone ?? "America/New_York");
  const [extUrl, setExtUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setBody(post.body);
    setTags(post.hashtags.join(" "));
    setPlatform(post.platform);
    setWhen(toLocalInput(post.scheduledAt));
    setErr(null);
  }, [post]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const hashtags = tags.split(/[\s,]+/).map((t) => t.replace(/^#/, "")).filter(Boolean);
  const text = composePost({ platform, body, hashtags, shortUrl: post.shortUrl });
  const max = PLATFORM_INFO[platform].maxChars;
  const editable = ["draft", "scheduled", "ready", "failed", "rejected"].includes(post.status);
  const dirty = body !== post.body || tags !== post.hashtags.join(" ") || platform !== post.platform || when !== toLocalInput(post.scheduledAt);
  const slots = useMemo(() => suggestSlots(platform, tz, new Date(), 4), [platform, tz]);

  async function run(extra: Record<string, unknown>, saveEdits = true) {
    setBusy(true);
    setErr(null);
    try {
      const payload: Record<string, unknown> = { ...extra };
      if (saveEdits && editable && dirty) {
        Object.assign(payload, { body, hashtags, platform, scheduledAt: when ? new Date(when).toISOString() : null });
      }
      onChange(await patchPost(post.id, payload));
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!confirm("Delete this post from the queue?")) return;
    setBusy(true);
    const res = await fetch(`/api/admin/growth/posts/${post.id}`, { method: "DELETE" });
    setBusy(false);
    if (res.ok) onDelete(post.id);
    else setErr((await res.json().catch(() => ({}))).error ?? "Delete failed");
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
  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label="Edit post">
      <button className="absolute inset-0 bg-black/30" aria-label="Close" onClick={onClose} />
      <div className="relative h-full w-full max-w-lg overflow-y-auto bg-white shadow-xl p-5 space-y-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-dm text-xs text-[#7A8FA6]">{post.source === "kit" ? "From a marketing kit" : post.source === "repurpose" ? "Auto-drafted from new content" : "Manual post"} · {post.language.toUpperCase()}</p>
            <h2 className="font-syne font-bold text-lg text-[#0D1B2A] flex items-center gap-2 flex-wrap">
              {PLATFORM_INFO[post.platform].label} post <StatusPill status={s} label={STATUS_LABEL[s] ?? s} />
            </h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#F4F7FB]" aria-label="Close editor"><X size={18} /></button>
        </div>

        {post.error && <p className="rounded-lg bg-[#FEF3F2] border border-[#F3C5C0] px-3 py-2 font-dm text-xs text-[#B42318]">{post.error}</p>}
        {s === "ready" && (
          <p className="rounded-lg bg-[#FEF0E3] border border-[#F7CBA3] px-3 py-2 font-dm text-xs text-[#8A3D06]">
            Time to post this by hand: copy the text, open {PLATFORM_INFO[post.platform].label}, post it, then press “Mark as posted”.
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
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className={label}>Best times</span>
            <select aria-label="Audience time zone" className="rounded-md border border-[#D2DCE8] px-2 py-1 font-dm text-xs" value={tz} onChange={(e) => setTz(e.target.value)}>
              {[...new Map(audiences.map((a) => [a.timezone, a])).values()].map((a) => <option key={a.timezone} value={a.timezone}>{a.name} ({a.timezone})</option>)}
            </select>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {slots.map((d) => (
              <button key={d.toISOString()} type="button" disabled={!editable} onClick={() => setWhen(toLocalInput(d.toISOString()))}
                className="rounded-full border border-[#D2DCE8] px-2.5 py-1 font-dm text-xs text-[#2251A3] hover:bg-[#F4F7FB] disabled:opacity-50">
                {fmtWhen(d.toISOString(), tz)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className={label} htmlFor="pd-body">Post text</label>
          <textarea id="pd-body" rows={9} className={input} value={body} disabled={!editable} onChange={(e) => setBody(e.target.value)} />
        </div>
        <div>
          <label className={label} htmlFor="pd-tags">Hashtags (space separated)</label>
          <input id="pd-tags" className={input} value={tags} disabled={!editable} onChange={(e) => setTags(e.target.value)} placeholder="AI SmallBusiness" />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <span className={label}>Preview (what gets posted)</span>
            <span className={`font-dm text-xs tabular-nums ${text.length > max ? "text-[#B42318] font-semibold" : "text-[#7A8FA6]"}`}>{text.length}/{max}</span>
          </div>
          <pre className="whitespace-pre-wrap break-words rounded-lg bg-[#F4F7FB] border border-[#D2DCE8] p-3 font-dm text-sm text-[#0D1B2A] max-h-72 overflow-y-auto">{text}</pre>
          {post.shortUrl && <p className="mt-1 font-dm text-[11px] text-[#7A8FA6]">Tracked link: {post.shortUrl}</p>}
        </div>

        {err && <p role="alert" className="font-dm text-sm text-[#B42318]">{err}</p>}

        <div className="flex flex-wrap gap-2 pt-1">
          {editable && dirty && <button className={btn.dark} disabled={busy} onClick={() => run({})}>Save changes</button>}
          {(s === "draft" || s === "rejected") && (
            <button className={btn.primary} disabled={busy || text.length > max} onClick={() => run({ action: "approve" })}>
              <Check size={15} /> Approve & schedule
            </button>
          )}
          {s === "failed" && <button className={btn.primary} disabled={busy} onClick={() => run({ action: "retry" })}>Retry now</button>}
          {(s === "scheduled" || s === "ready") && <button className={btn.ghost} disabled={busy} onClick={() => run({ action: "unschedule" })}>Back to draft</button>}
          <button className={btn.ghost} onClick={copy}>{copied ? <Check size={15} /> : <Copy size={15} />} {copied ? "Copied" : "Copy text"}</button>
          <a className={btn.ghost} href={deepLink(platform, text, post.shortUrl)} target="_blank" rel="noopener noreferrer">
            <ExternalLink size={15} /> Open {PLATFORM_INFO[platform].label}
          </a>
        </div>

        {["draft", "scheduled", "ready", "failed"].includes(s) && (
          <div className="rounded-xl border border-[#D2DCE8] p-3 space-y-2">
            <p className="font-dm text-xs text-[#3A4A5C]">Posted it yourself? Record it so the calendar and reports are right.</p>
            <div className="flex gap-2">
              <input className={input} placeholder="Post URL (optional, https)" value={extUrl} onChange={(e) => setExtUrl(e.target.value)} />
              <button className={btn.dark} disabled={busy} onClick={() => run({ action: "mark-posted", externalUrl: extUrl }, false)}>Mark as posted</button>
            </div>
          </div>
        )}
        {post.externalUrl && (
          <a href={post.externalUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-dm text-sm text-[#2251A3] underline">
            View the published post <ExternalLink size={13} />
          </a>
        )}

        <div className="flex flex-wrap gap-2 border-t border-[#D2DCE8] pt-3">
          {["draft", "ready", "failed"].includes(s) && <button className={btn.ghost} disabled={busy} onClick={() => run({ action: "reject" }, false)}>Reject</button>}
          {s === "rejected" && <button className={btn.ghost} disabled={busy} onClick={() => run({ action: "restore" }, false)}>Restore to draft</button>}
          {s !== "publishing" && <button className={btn.danger} disabled={busy} onClick={remove}><Trash2 size={15} /> Delete</button>}
        </div>
      </div>
    </div>
  );
}
