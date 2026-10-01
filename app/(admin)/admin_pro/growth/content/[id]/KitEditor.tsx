"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AlertTriangle, CalendarPlus, Mail, Plus, Save, Trash2 } from "lucide-react";
import type { KitContent, KitPost } from "@/lib/growth/content/kit-types";
import type { PostView } from "@/lib/growth/content/posts";
import { composePost, PLATFORM_INFO, PLATFORMS, STATUS_LABEL, type Platform, type PostStatus } from "@/lib/growth/content/platforms";
import PostDrawer, { fmtWhen, type AudienceTz } from "../../_components/PostDrawer";
import { btn, Card, input, label, StatusPill } from "../../_components/ui";

const lines = (a: string[]) => a.join("\n");
const unlines = (s: string) => s.split("\n").map((x) => x.trim()).filter(Boolean);

function Area({ id, value, onChange, rows = 3, ...rest }: { id: string; value: string; onChange: (v: string) => void; rows?: number; "aria-label"?: string }) {
  return <textarea id={id} rows={rows} className={input} value={value} onChange={(e) => onChange(e.target.value)} {...rest} />;
}

export default function KitEditor({
  kit, facts, site, initialPosts, audiences,
}: {
  kit: { id: string; slug: string; productUrl: string | null; language: string; content: KitContent; warnings: string[] };
  facts: string[];
  site: string;
  initialPosts: PostView[];
  audiences: AudienceTz[];
}) {
  const router = useRouter();
  const [c, setC] = useState<KitContent>(kit.content);
  const [warnings, setWarnings] = useState(kit.warnings);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [posts, setPosts] = useState(initialPosts);
  const [open, setOpen] = useState<PostView | null>(null);
  const [start, setStart] = useState(() => {
    const d = new Date(Date.now() + 86_400_000);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });

  const edit = (patch: Partial<KitContent>) => { setC((x) => ({ ...x, ...patch })); setDirty(true); };
  const setPost = (i: number, patch: Partial<KitPost>) => edit({ posts: c.posts.map((p, j) => (j === i ? { ...p, ...patch } : p)) });

  async function call(name: string, url: string, init: RequestInit) {
    setBusy(name);
    setMsg(null);
    try {
      const res = await fetch(url, { headers: { "Content-Type": "application/json" }, ...init });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error ?? `Failed (${res.status})`);
      return j;
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : String(e) });
      return null;
    } finally {
      setBusy(null);
    }
  }

  async function save() {
    const j = await call("save", `/api/admin/growth/kits/${kit.id}`, { method: "PATCH", body: JSON.stringify({ content: c }) });
    if (j) {
      setC(j.kit.content);
      setWarnings(j.kit.warnings ?? []);
      setDirty(false);
      setMsg({ ok: true, text: "Saved. Checks re-run." });
    }
  }

  async function queue() {
    if (dirty) await save();
    const j = await call("queue", `/api/admin/growth/kits/${kit.id}/queue`, { method: "POST", body: JSON.stringify({ start }) });
    if (j) {
      const r = await fetch(`/api/admin/growth/kits/${kit.id}`).then((x) => x.json());
      setPosts(r.posts ?? []);
      setMsg({ ok: true, text: j.created ? `${j.created} posts added to the queue as drafts. Approve them in the calendar.` : "All posts were already in the queue." });
    }
  }

  async function newsletter() {
    if (dirty) await save();
    const j = await call("newsletter", `/api/admin/growth/kits/${kit.id}/newsletter`, { method: "POST" });
    if (j) {
      edit({ newsletterCampaignIds: j.campaignIds });
      setDirty(false);
      setMsg({ ok: true, text: j.created ? `${j.created} draft campaigns created. Review and send them from Newsletter.` : "The draft campaigns already exist." });
    }
  }

  async function remove() {
    if (!confirm("Delete this kit and its unpublished queue items? Tracked links and their history stay.")) return;
    const j = await call("delete", `/api/admin/growth/kits/${kit.id}`, { method: "DELETE" });
    if (j) router.push("/admin_pro/growth/content");
  }

  const productLink = kit.productUrl ? (kit.productUrl.startsWith("/") ? `${site}${kit.productUrl}` : kit.productUrl) : null;

  return (
    <div className="space-y-4">
      {/* Action bar */}
      <div className="sticky top-0 z-10 -mx-1 flex flex-wrap items-center gap-2 bg-[#F4F7FB]/95 px-1 py-2 backdrop-blur">
        <button className={btn.dark} disabled={!!busy || !dirty} onClick={save}><Save size={15} /> {busy === "save" ? "Saving…" : dirty ? "Save changes" : "Saved"}</button>
        <span className="inline-flex items-center gap-2">
          <label htmlFor="kit-start" className="font-dm text-xs text-[#3A4A5C]">Start</label>
          <input id="kit-start" type="date" className="rounded-lg border border-[#D2DCE8] bg-white px-2 py-1.5 font-dm text-sm" value={start} onChange={(e) => setStart(e.target.value)} />
        </span>
        <button className={btn.primary} disabled={!!busy} onClick={queue}><CalendarPlus size={15} /> {busy === "queue" ? "Queueing…" : "Queue posts as drafts"}</button>
        <button className={btn.ghost} disabled={!!busy} onClick={newsletter}><Mail size={15} /> {c.newsletterCampaignIds?.length ? "Newsletter drafts created" : "Create newsletter drafts"}</button>
        {c.newsletterCampaignIds?.length ? <Link className="font-dm text-sm text-[#2251A3] underline" href="/admin_pro/newsletter">Open Newsletter</Link> : null}
        <button className={`${btn.danger} ml-auto`} disabled={!!busy} onClick={remove}><Trash2 size={15} /> Delete kit</button>
        {msg && <p role="status" className={`w-full font-dm text-sm ${msg.ok ? "text-[#0F6E56]" : "text-[#B42318]"}`}>{msg.text}</p>}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-4 min-w-0">
          <Card title="Positioning">
            <Area id="positioning" aria-label="Positioning one-liner" rows={2} value={c.positioning} onChange={(v) => edit({ positioning: v })} />
            <div className="grid gap-3 sm:grid-cols-2 mt-3">
              <div><label className={label} htmlFor="pains">Audience pains (one per line)</label><Area id="pains" rows={5} value={lines(c.pains)} onChange={(v) => edit({ pains: unlines(v) })} /></div>
              <div><label className={label} htmlFor="benefits">Benefits (one per line)</label><Area id="benefits" rows={5} value={lines(c.benefits)} onChange={(v) => edit({ benefits: unlines(v) })} /></div>
            </div>
          </Card>

          <Card title="Landing page hero">
            <div className="space-y-2">
              <div><label className={label} htmlFor="h-head">Headline</label><input id="h-head" className={input} value={c.hero.headline} onChange={(e) => edit({ hero: { ...c.hero, headline: e.target.value } })} /></div>
              <div><label className={label} htmlFor="h-sub">Subheadline</label><Area id="h-sub" rows={2} value={c.hero.subheadline} onChange={(v) => edit({ hero: { ...c.hero, subheadline: v } })} /></div>
              <div className="grid gap-2 sm:grid-cols-[1fr_200px]">
                <div><label className={label} htmlFor="h-bul">Bullets (one per line)</label><Area id="h-bul" rows={3} value={lines(c.hero.bullets)} onChange={(v) => edit({ hero: { ...c.hero, bullets: unlines(v) } })} /></div>
                <div><label className={label} htmlFor="h-cta">Button</label><input id="h-cta" className={input} value={c.hero.cta} onChange={(e) => edit({ hero: { ...c.hero, cta: e.target.value } })} /></div>
              </div>
            </div>
          </Card>

          <Card
            title={`Social posts (${c.posts.length})`}
            subtitle="The tracked link and hashtags are added after the text. Counts include both."
            action={<button className={btn.ghost} onClick={() => edit({ posts: [...c.posts, { platform: "linkedin", text: "", hashtags: [] }] })}><Plus size={15} /> Add post</button>}
          >
            <div className="grid gap-3 lg:grid-cols-2">
              {c.posts.map((p, i) => {
                const len = composePost({ platform: p.platform, body: p.text, hashtags: p.hashtags, shortUrl: `${site}/go/xxxxxxx` }).length;
                const max = PLATFORM_INFO[p.platform].maxChars;
                return (
                  <div key={i} className="rounded-xl border border-[#D2DCE8] p-3 space-y-2" style={{ borderLeft: `3px solid ${PLATFORM_INFO[p.platform].color}` }}>
                    <div className="flex items-center gap-2">
                      <span className="font-dm text-xs font-semibold text-[#7A8FA6]">#{i + 1}</span>
                      <select aria-label={`Post ${i + 1} platform`} className="rounded-md border border-[#D2DCE8] px-2 py-1 font-dm text-xs" value={p.platform} onChange={(e) => setPost(i, { platform: e.target.value as Platform })}>
                        {PLATFORMS.map((x) => <option key={x} value={x}>{PLATFORM_INFO[x].label}</option>)}
                      </select>
                      <span className={`ml-auto font-dm text-xs tabular-nums ${len > max ? "text-[#B42318] font-semibold" : "text-[#7A8FA6]"}`}>{len}/{max}</span>
                      <button aria-label={`Remove post ${i + 1}`} className="p-1 rounded hover:bg-[#FEF3F2] text-[#B42318]" onClick={() => edit({ posts: c.posts.filter((_, j) => j !== i) })}><Trash2 size={14} /></button>
                    </div>
                    <Area id={`post-${i}`} aria-label={`Post ${i + 1} text`} rows={6} value={p.text} onChange={(v) => setPost(i, { text: v })} />
                    <input aria-label={`Post ${i + 1} hashtags`} className={input} value={p.hashtags.map((h) => `#${h}`).join(" ")} placeholder="#hashtags"
                      onChange={(e) => setPost(i, { hashtags: e.target.value.split(/[\s,]+/).map((h) => h.replace(/^#/, "")).filter(Boolean) })} />
                  </div>
                );
              })}
            </div>
          </Card>

          <Card title="Launch emails" subtitle="“Create newsletter drafts” turns these into draft campaigns with tracked links (utm_medium=email).">
            <div className="space-y-3">
              {c.emails.map((e, i) => (
                <div key={i} className="rounded-xl border border-[#D2DCE8] p-3 space-y-2">
                  <p className="font-dm text-xs font-semibold text-[#7A8FA6]">Email {i + 1}</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div><label className={label} htmlFor={`e-s-${i}`}>Subject</label><input id={`e-s-${i}`} className={input} value={e.subject} onChange={(x) => edit({ emails: c.emails.map((y, j) => (j === i ? { ...y, subject: x.target.value } : y)) })} /></div>
                    <div><label className={label} htmlFor={`e-p-${i}`}>Preview text</label><input id={`e-p-${i}`} className={input} value={e.preview} onChange={(x) => edit({ emails: c.emails.map((y, j) => (j === i ? { ...y, preview: x.target.value } : y)) })} /></div>
                  </div>
                  <div><label className={label} htmlFor={`e-b-${i}`}>Body</label><Area id={`e-b-${i}`} rows={8} value={e.body} onChange={(v) => edit({ emails: c.emails.map((y, j) => (j === i ? { ...y, body: v } : y)) })} /></div>
                  <div className="max-w-xs"><label className={label} htmlFor={`e-c-${i}`}>Button</label><input id={`e-c-${i}`} className={input} value={e.cta} onChange={(x) => edit({ emails: c.emails.map((y, j) => (j === i ? { ...y, cta: x.target.value } : y)) })} /></div>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Ad copy">
            <div className="grid gap-3 lg:grid-cols-3">
              {c.ads.map((a, i) => (
                <div key={i} className="rounded-xl border border-[#D2DCE8] p-3 space-y-2">
                  <p className="font-dm text-xs font-semibold uppercase text-[#7A8FA6]">{a.network === "meta" ? "Meta" : a.network === "google" ? "Google" : "LinkedIn"}</p>
                  {(["headline", "primaryText", "description", "cta"] as const).map((f) => (
                    <div key={f}>
                      <label className={label} htmlFor={`ad-${i}-${f}`}>{f === "primaryText" ? (a.network === "google" ? "Headline 2" : "Primary text") : f === "cta" ? "Call to action" : f[0].toUpperCase() + f.slice(1)} <span className="font-normal text-[#7A8FA6]">({a[f].length})</span></label>
                      <Area id={`ad-${i}-${f}`} rows={f === "primaryText" ? 3 : 1} value={a[f]} onChange={(v) => edit({ ads: c.ads.map((y, j) => (j === i ? { ...y, [f]: v } : y)) })} />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </Card>

          <Card title={`Short video script (${c.video.durationSeconds}s reel)`}>
            <div className="space-y-2">
              <div className="grid gap-2 sm:grid-cols-2">
                <div><label className={label} htmlFor="v-title">Title</label><input id="v-title" className={input} value={c.video.title} onChange={(e) => edit({ video: { ...c.video, title: e.target.value } })} /></div>
                <div><label className={label} htmlFor="v-hook">Hook (first 3 seconds)</label><input id="v-hook" className={input} value={c.video.hook} onChange={(e) => edit({ video: { ...c.video, hook: e.target.value } })} /></div>
              </div>
              <div><label className={label} htmlFor="v-script">Script</label><Area id="v-script" rows={10} value={c.video.script} onChange={(v) => edit({ video: { ...c.video, script: v } })} /></div>
              <div className="grid gap-2 sm:grid-cols-2">
                <div><label className={label} htmlFor="v-ost">On-screen text (one per line)</label><Area id="v-ost" rows={4} value={lines(c.video.onScreenText)} onChange={(v) => edit({ video: { ...c.video, onScreenText: unlines(v) } })} /></div>
                <div><label className={label} htmlFor="v-cta">Call to action</label><input id="v-cta" className={input} value={c.video.cta} onChange={(e) => edit({ video: { ...c.video, cta: e.target.value } })} /></div>
              </div>
            </div>
          </Card>

          <Card title="2-week posting calendar" subtitle="“Queue posts” places each post on its day at the platform's best time for this kit's audience.">
            <div className="overflow-x-auto">
              <table className="w-full font-dm text-sm">
                <thead><tr className="text-left text-xs text-[#7A8FA6]"><th className="py-1 pr-2">Day</th><th className="py-1 pr-2">Channel</th><th className="py-1 pr-2">Item</th><th className="py-1">Note</th></tr></thead>
                <tbody>
                  {c.calendar.map((e, i) => (
                    <tr key={i} className="border-t border-[#E6ECF3] align-top">
                      <td className="py-1.5 pr-2 w-20">
                        <input aria-label={`Calendar entry ${i + 1} day`} type="number" min={1} max={14} className="w-16 rounded-md border border-[#D2DCE8] px-2 py-1" value={e.day}
                          onChange={(x) => edit({ calendar: c.calendar.map((y, j) => (j === i ? { ...y, day: Math.min(14, Math.max(1, Number(x.target.value) || 1)) } : y)) })} />
                      </td>
                      <td className="py-1.5 pr-2 whitespace-nowrap">{e.channel === "email" ? "Email" : PLATFORM_INFO[e.channel].label}</td>
                      <td className="py-1.5 pr-2 text-[#3A4A5C]">{e.channel === "email" ? `Email ${e.ref + 1}: ${c.emails[e.ref]?.subject ?? "?"}` : `Post ${e.ref + 1}: ${(c.posts[e.ref]?.text ?? "?").slice(0, 70)}…`}</td>
                      <td className="py-1.5 text-[#7A8FA6]">{e.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <aside className="space-y-4">
          <Card title={<span className="inline-flex items-center gap-1.5">{warnings.length > 0 && <AlertTriangle size={16} className="text-[#B8500A]" />} Claim checks</span>} subtitle="Numbers not found in the product data or proof points, banned claims, and over-length posts.">
            {warnings.length === 0 ? <p className="font-dm text-sm text-[#0F6E56]">No issues found.</p> : (
              <ul className="space-y-1.5 max-h-80 overflow-y-auto">{warnings.map((w, i) => <li key={i} className="font-dm text-xs text-[#8A3D06] bg-[#FEF0E3] rounded-md px-2 py-1">{w}</li>)}</ul>
            )}
          </Card>
          <Card title="Product data" subtitle="The only product claims allowed.">
            <ul className="list-disc pl-5 space-y-1 font-dm text-xs text-[#3A4A5C]">{facts.map((f, i) => <li key={i}>{f}</li>)}</ul>
            {productLink && <p className="mt-2 font-dm text-xs text-[#7A8FA6] break-all">Links to: {productLink}</p>}
          </Card>
          <Card title={`Queued posts (${posts.length})`} action={<Link href="/admin_pro/growth/calendar" className="font-dm text-xs text-[#2251A3] underline">Calendar</Link>}>
            {posts.length === 0 ? <p className="font-dm text-sm text-[#7A8FA6]">Not queued yet.</p> : (
              <ul className="space-y-1.5">
                {posts.map((p) => (
                  <li key={p.id}>
                    <button onClick={() => setOpen(p)} className="w-full text-left rounded-lg border border-[#D2DCE8] px-2 py-1.5 hover:bg-[#F4F7FB]" style={{ borderLeft: `3px solid ${PLATFORM_INFO[p.platform].color}` }}>
                      <span className="flex items-center justify-between gap-2">
                        <span className="font-dm text-xs font-semibold text-[#0D1B2A]">{PLATFORM_INFO[p.platform].label}</span>
                        <StatusPill status={p.status} label={STATUS_LABEL[p.status as PostStatus] ?? p.status} />
                      </span>
                      <span className="block font-dm text-[11px] text-[#7A8FA6]">{fmtWhen(p.scheduledAt)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </aside>
      </div>

      {open && (
        <PostDrawer post={open} audiences={audiences} onClose={() => setOpen(null)}
          onChange={(p) => { setPosts((xs) => xs.map((x) => (x.id === p.id ? p : x))); setOpen(p); }}
          onDelete={(id) => { setPosts((xs) => xs.filter((x) => x.id !== id)); setOpen(null); }} />
      )}
    </div>
  );
}
