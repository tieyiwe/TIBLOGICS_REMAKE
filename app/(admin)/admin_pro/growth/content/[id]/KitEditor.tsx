"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { AlertTriangle, CalendarPlus, CheckCircle2, Image as ImageIcon, Mail, Plus, Save, Trash2 } from "lucide-react";
import { Badge, Button, Segmented, Tabs, useToast } from "@/components/admin/ui";
import type { KitAd, KitContent, KitEmail, KitPost } from "@/lib/growth/content/kit-types";
import type { PostView } from "@/lib/growth/content/posts";
import { composePost, PLATFORM_INFO, PLATFORMS, STATUS_LABEL, type Platform, type PostStatus } from "@/lib/growth/content/platforms";
import { adWhere, checkText, claimContext, emailWhere, lengthWarning, postWhere, SAMPLE_SHORT_URL, type ClaimContext } from "@/lib/growth/content/claims";
import type { CardContext } from "@/lib/growth/cards/spec";
import PostDrawer, { fmtWhen, type AudienceTz } from "../../_components/PostDrawer";
import CardStudio, { cardUrl } from "../../_components/CardStudio";
import {
  CharRing, EmailPreview, GoogleAdPreview, LandingPreview, LinkedInAdPreview, MetaAdPreview, PostPreview, VideoPreview,
} from "../../_components/previews";
import { Card, input, label, StatusPill } from "../../_components/ui";
import { AiActions, Suggestions, type Suggestion } from "./AiActions";

const lines = (a: string[]) => a.join("\n");
const unlines = (s: string) => s.split("\n").map((x) => x.trim()).filter(Boolean);

type Tab = "overview" | "social" | "emails" | "ads" | "video" | "landing";
const TAB_KEYS: Tab[] = ["overview", "social", "emails", "ads", "video", "landing"];

function Area({ id, value, onChange, rows = 3, ...rest }: { id: string; value: string; onChange: (v: string) => void; rows?: number; "aria-label"?: string }) {
  return <textarea id={id} rows={rows} className={input} value={value} onChange={(e) => onChange(e.target.value)} {...rest} />;
}

function Warnings({ items }: { items: string[] }) {
  if (!items.length) return null;
  return (
    <ul className="space-y-1" data-testid="inline-warnings">
      {items.map((w, i) => (
        <li key={i} className="flex gap-1.5 rounded-md bg-[var(--a-warn-bg)] px-2 py-1 font-dm text-[12px] text-[var(--a-warn)]">
          <AlertTriangle size={13} className="mt-0.5 shrink-0" aria-hidden />
          {w.replace(/^[^:]+:\s*/, "")}
        </li>
      ))}
    </ul>
  );
}

const postText = (p: KitPost) => composePost({ platform: p.platform, body: p.text, hashtags: p.hashtags, shortUrl: SAMPLE_SHORT_URL });

function postWarnings(p: KitPost, i: number, ctx: ClaimContext): string[] {
  const w = checkText(postWhere(i, p.platform), p.text, ctx);
  const lw = lengthWarning(postWhere(i, p.platform), p);
  return lw ? [...w, lw] : w;
}

export default function KitEditor({
  kit, facts, site, initialPosts, audiences, rules, product,
}: {
  kit: { id: string; slug: string; productUrl: string | null; language: string; content: KitContent; warnings: string[] };
  facts: string[];
  site: string;
  initialPosts: PostView[];
  audiences: AudienceTz[];
  rules: { proofPoints: string[]; bannedClaims: string[] };
  product: { title: string; typeLabel: string };
}) {
  const router = useRouter();
  const toast = useToast();
  const [c, setC] = useState<KitContent>(kit.content);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [posts, setPosts] = useState(initialPosts);
  const [open, setOpen] = useState<PostView | null>(null);
  const [tab, setTab] = useState<Tab>("overview");
  const [sel, setSel] = useState(0);
  const [emailSel, setEmailSel] = useState(0);
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  const [sugg, setSugg] = useState<Record<string, Suggestion<unknown>>>({});
  const [start, setStart] = useState(() => {
    const d = new Date(Date.now() + 86_400_000);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });

  // Tab in the URL hash, so a reload or a shared link lands on the same tab.
  useEffect(() => {
    const h = window.location.hash.slice(1) as Tab;
    if (TAB_KEYS.includes(h)) setTab(h);
  }, []);
  const go = (t: string) => {
    setTab(t as Tab);
    try { history.replaceState(null, "", `#${t}`); } catch { /* ignore */ }
  };

  // Leaving with unsaved edits asks first.
  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  const ctx = useMemo(() => claimContext(facts, rules), [facts, rules]);
  const cardCtx: CardContext = { productTitle: product.title, productType: product.typeLabel, benefits: c.benefits, proofPoints: rules.proofPoints, cta: c.hero.cta };

  const warn = useMemo(() => {
    const posts = c.posts.map((p, i) => postWarnings(p, i, ctx));
    const emails = c.emails.map((e, i) => checkText(emailWhere(i), [e.subject, e.preview, e.body].join(" "), ctx));
    const ads = c.ads.map((a, i) => checkText(adWhere(i, a.network), [a.headline, a.primaryText, a.description].join(" "), ctx));
    const hero = checkText("Hero", [c.hero.headline, c.hero.subheadline, ...c.hero.bullets].join(" "), ctx);
    const video = checkText("Video script", [c.video.hook, c.video.script, ...c.video.onScreenText].join(" "), ctx);
    const overview = [
      ...checkText("Positioning", c.positioning, ctx),
      ...c.pains.flatMap((p, i) => checkText(`Pain ${i + 1}`, p, ctx)),
      ...c.benefits.flatMap((p, i) => checkText(`Benefit ${i + 1}`, p, ctx)),
    ];
    return { posts, emails, ads, hero, video, overview, total: [...posts.flat(), ...emails.flat(), ...ads.flat(), ...hero, ...video, ...overview] };
  }, [c, ctx]);

  const edit = (patch: Partial<KitContent>) => { setC((x) => ({ ...x, ...patch })); setDirty(true); };
  const setPost = (i: number, patch: Partial<KitPost>) => edit({ posts: c.posts.map((p, j) => (j === i ? { ...p, ...patch } : p)) });
  const setEmail = (i: number, patch: Partial<KitEmail>) => edit({ emails: c.emails.map((e, j) => (j === i ? { ...e, ...patch } : e)) });
  const setAd = (i: number, patch: Partial<KitAd>) => edit({ ads: c.ads.map((a, j) => (j === i ? { ...a, ...patch } : a)) });
  const putSugg = (key: string, s: Suggestion<unknown> | null) => setSugg((x) => { const n = { ...x }; if (s) n[key] = s; else delete n[key]; return n; });

  async function call(name: string, url: string, init: RequestInit) {
    setBusy(name);
    try {
      const res = await fetch(url, { headers: { "Content-Type": "application/json" }, ...init });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error ?? `Failed (${res.status})`);
      return j;
    } catch (e) {
      toast.error("Something went wrong", e instanceof Error ? e.message : String(e));
      return null;
    } finally {
      setBusy(null);
    }
  }

  async function save(quiet = false) {
    const j = await call("save", `/api/admin/growth/kits/${kit.id}`, { method: "PATCH", body: JSON.stringify({ content: c }) });
    if (j) {
      setC(j.kit.content);
      setDirty(false);
      if (!quiet) toast.success("Kit saved", `${(j.kit.warnings ?? []).length} claim check${(j.kit.warnings ?? []).length === 1 ? "" : "s"} to review.`);
    }
    return !!j;
  }

  async function queue() {
    if (dirty && !(await save(true))) return;
    const j = await call("queue", `/api/admin/growth/kits/${kit.id}/queue`, { method: "POST", body: JSON.stringify({ start }) });
    if (j) {
      const r = await fetch(`/api/admin/growth/kits/${kit.id}`).then((x) => x.json());
      setPosts(r.posts ?? []);
      toast.success(j.created ? `${j.created} posts queued as drafts` : "All posts were already queued", j.created ? "Approve them in the calendar or from Mission control." : undefined);
    }
  }

  async function newsletter() {
    if (dirty && !(await save(true))) return;
    const j = await call("newsletter", `/api/admin/growth/kits/${kit.id}/newsletter`, { method: "POST" });
    if (j) {
      setC((x) => ({ ...x, newsletterCampaignIds: j.campaignIds }));
      toast.success(j.created ? `${j.created} draft campaigns created` : "The draft campaigns already exist", "Review and send them from Newsletter.");
    }
  }

  async function remove() {
    if (!confirm("Delete this kit and its unpublished queue items? Tracked links and their history stay.")) return;
    const j = await call("delete", `/api/admin/growth/kits/${kit.id}`, { method: "DELETE" });
    if (j) {
      toast.success("Kit deleted");
      router.push("/admin_pro/growth/content");
    }
  }

  const productLink = kit.productUrl ? (kit.productUrl.startsWith("/") ? `${site}${kit.productUrl}` : kit.productUrl) : null;
  const visiblePosts = c.posts.map((p, i) => ({ p, i })).filter((x) => platformFilter === "all" || x.p.platform === platformFilter);
  const cur = c.posts[sel] ?? c.posts[0];
  const curIndex = c.posts[sel] ? sel : 0;

  const tabs = [
    { id: "overview", label: "Overview", count: warn.overview.length || null },
    { id: "social", label: "Social", count: c.posts.length },
    { id: "emails", label: "Emails", count: c.emails.length },
    { id: "ads", label: "Ads", count: c.ads.length },
    { id: "video", label: "Video" },
    { id: "landing", label: "Landing" },
  ];

  return (
    <div className="space-y-4">
      {/* Action bar */}
      <div className="sticky top-0 z-20 -mx-4 border-b border-[var(--a-border)] bg-[var(--a-bg)]/95 px-4 pt-2 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="flex flex-wrap items-center gap-2 pb-2">
          <Button variant={dirty ? "primary" : "secondary"} icon={Save} loading={busy === "save"} disabled={!dirty} onClick={() => save()} data-testid="kit-save">
            {dirty ? "Save changes" : "Saved"}
          </Button>
          <span className="inline-flex items-center gap-1.5">
            <label htmlFor="kit-start" className="font-dm text-[12px] text-[var(--a-ink-3)]">Start</label>
            <input id="kit-start" type="date" className="h-9 rounded-[var(--a-radius-control)] border border-[var(--a-border-strong)] bg-white px-2 font-dm text-[13px]" value={start} onChange={(e) => setStart(e.target.value)} />
          </span>
          <Button icon={CalendarPlus} loading={busy === "queue"} disabled={!!busy && busy !== "queue"} onClick={queue}>Queue posts as drafts</Button>
          <Button icon={Mail} loading={busy === "newsletter"} disabled={!!busy && busy !== "newsletter"} onClick={newsletter}>
            {c.newsletterCampaignIds?.length ? "Newsletter drafts created" : "Create newsletter drafts"}
          </Button>
          {c.newsletterCampaignIds?.length ? <Link className="font-dm text-[13px] text-[var(--a-blue)] underline" href="/admin_pro/newsletter">Open Newsletter</Link> : null}
          <span className="ml-auto flex items-center gap-2">
            {warn.total.length > 0 ? (
              <Badge tone="warn" dot>{warn.total.length} claim check{warn.total.length === 1 ? "" : "s"}</Badge>
            ) : (
              <Badge tone="success" dot>Claims OK</Badge>
            )}
            <Button variant="ghost" icon={Trash2} className="text-[var(--a-danger)]" loading={busy === "delete"} onClick={remove} aria-label="Delete kit">
              <span className="hidden sm:inline">Delete</span>
            </Button>
          </span>
        </div>
        <Tabs items={tabs} active={tab} onChange={go} ariaLabel="Kit sections" />
      </div>

      {/* ── Overview ───────────────────────────────────────────── */}
      {tab === "overview" && (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="min-w-0 space-y-4">
            <Card title="Positioning">
              <Area id="positioning" aria-label="Positioning one-liner" rows={2} value={c.positioning} onChange={(v) => edit({ positioning: v })} />
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div><label className={label} htmlFor="pains">Audience pains (one per line)</label><Area id="pains" rows={5} value={lines(c.pains)} onChange={(v) => edit({ pains: unlines(v) })} /></div>
                <div><label className={label} htmlFor="benefits">Benefits (one per line)</label><Area id="benefits" rows={5} value={lines(c.benefits)} onChange={(v) => edit({ benefits: unlines(v) })} /></div>
              </div>
              <div className="mt-3"><Warnings items={warn.overview} /></div>
            </Card>
            <Card title="2-week posting calendar" subtitle="Queue posts places each post on its day at the platform's best time for this kit's audience.">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] font-dm text-[13px]">
                  <thead><tr className="text-left text-[11px] uppercase tracking-[.06em] text-[var(--a-ink-3)]"><th className="py-1 pr-2">Day</th><th className="py-1 pr-2">Channel</th><th className="py-1 pr-2">Item</th><th className="py-1">Note</th></tr></thead>
                  <tbody>
                    {c.calendar.map((e, i) => (
                      <tr key={i} className="border-t border-[var(--a-border)] align-top">
                        <td className="w-20 py-1.5 pr-2">
                          <input aria-label={`Calendar entry ${i + 1} day`} type="number" min={1} max={14} className="w-16 rounded-md border border-[var(--a-border-strong)] px-2 py-1" value={e.day}
                            onChange={(x) => edit({ calendar: c.calendar.map((y, j) => (j === i ? { ...y, day: Math.min(14, Math.max(1, Number(x.target.value) || 1)) } : y)) })} />
                        </td>
                        <td className="whitespace-nowrap py-1.5 pr-2">{e.channel === "email" ? "Email" : PLATFORM_INFO[e.channel].label}</td>
                        <td className="py-1.5 pr-2 text-[var(--a-ink-2)]">
                          <button type="button" className="text-left hover:text-[var(--a-blue)] hover:underline" onClick={() => { if (e.channel === "email") { setEmailSel(e.ref); go("emails"); } else { setSel(e.ref); go("social"); } }}>
                            {e.channel === "email" ? `Email ${e.ref + 1}: ${c.emails[e.ref]?.subject ?? "?"}` : `Post ${e.ref + 1}: ${(c.posts[e.ref]?.text ?? "?").slice(0, 70)}…`}
                          </button>
                        </td>
                        <td className="py-1.5 text-[var(--a-ink-3)]">{e.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
          <aside className="space-y-4">
            <Card title={<span className="inline-flex items-center gap-1.5">{warn.total.length ? <AlertTriangle size={15} className="text-[var(--a-warn)]" /> : <CheckCircle2 size={15} className="text-[var(--a-success)]" />} Claim checks</span>} subtitle="Live: numbers not in the product data or proof points, banned claims, over-length posts.">
              {warn.total.length === 0 ? <p className="font-dm text-[13px] text-[var(--a-success)]">No issues found.</p> : (
                <ul className="max-h-80 space-y-1.5 overflow-y-auto">
                  {warn.total.map((w, i) => <li key={i} className="rounded-md bg-[var(--a-warn-bg)] px-2 py-1 font-dm text-[12px] text-[var(--a-warn)]">{w}</li>)}
                </ul>
              )}
            </Card>
            <Card title="Product data" subtitle="The only product claims allowed.">
              <ul className="list-disc space-y-1 pl-5 font-dm text-[12.5px] text-[var(--a-ink-2)]">{facts.map((f, i) => <li key={i}>{f}</li>)}</ul>
              {productLink && <p className="mt-2 break-all font-dm text-[12px] text-[var(--a-ink-3)]">Links to: {productLink}</p>}
            </Card>
            <Card title={`Queued posts (${posts.length})`} action={<Link href="/admin_pro/growth/calendar" className="font-dm text-[12.5px] font-semibold text-[var(--a-blue)] hover:underline">Calendar</Link>}>
              {posts.length === 0 ? <p className="font-dm text-[13px] text-[var(--a-ink-3)]">Not queued yet.</p> : (
                <ul className="space-y-1.5">
                  {posts.map((p) => (
                    <li key={p.id}>
                      <button onClick={() => setOpen(p)} className="w-full rounded-[var(--a-radius-control)] border border-[var(--a-border)] px-2 py-1.5 text-left hover:bg-[var(--a-surface-2)]" style={{ borderLeft: `3px solid ${PLATFORM_INFO[p.platform].color}` }}>
                        <span className="flex items-center justify-between gap-2">
                          <span className="font-dm text-[12px] font-semibold text-[var(--a-ink)]">{PLATFORM_INFO[p.platform].label}{p.image ? " · image" : ""}</span>
                          <StatusPill status={p.status} label={STATUS_LABEL[p.status as PostStatus] ?? p.status} />
                        </span>
                        <span className="block font-dm text-[11px] text-[var(--a-ink-3)]">{fmtWhen(p.scheduledAt)}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </aside>
        </div>
      )}

      {/* ── Social ─────────────────────────────────────────────── */}
      {tab === "social" && (
        <div className="grid gap-4 lg:grid-cols-[250px_minmax(0,1fr)] 2xl:grid-cols-[250px_minmax(0,1fr)_340px]">
          <div className="min-w-0 space-y-2">
            <select aria-label="Filter posts by platform" className={input} value={platformFilter} onChange={(e) => setPlatformFilter(e.target.value)}>
              <option value="all">All platforms ({c.posts.length})</option>
              {PLATFORMS.map((p) => <option key={p} value={p}>{PLATFORM_INFO[p].label} ({c.posts.filter((x) => x.platform === p).length})</option>)}
            </select>
            <ul className="flex gap-2 overflow-x-auto pb-1 lg:block lg:space-y-1.5 lg:overflow-visible" data-testid="post-list">
              {visiblePosts.map(({ p, i }) => {
                const len = postText(p).length;
                const w = warn.posts[i]?.length ?? 0;
                return (
                  <li key={i} className="w-[220px] shrink-0 lg:w-auto">
                    <button type="button" onClick={() => setSel(i)} aria-current={i === curIndex}
                      className={`w-full rounded-[var(--a-radius-control)] border bg-white p-2 text-left transition-colors ${i === curIndex ? "border-[var(--a-blue)] ring-2 ring-[var(--a-blue)]/15" : "border-[var(--a-border)] hover:border-[var(--a-border-strong)]"}`}
                      style={{ borderLeft: `3px solid ${PLATFORM_INFO[p.platform].color}` }}>
                      <span className="flex items-center gap-1.5 font-dm text-[11.5px] font-semibold text-[var(--a-ink-2)]">
                        #{i + 1} {PLATFORM_INFO[p.platform].label}
                        {p.image && <ImageIcon size={12} className="text-[var(--a-ink-3)]" aria-label="has image" />}
                        {w > 0 && <span className="ml-auto inline-flex items-center gap-0.5 text-[var(--a-warn)]"><AlertTriangle size={11} />{w}</span>}
                      </span>
                      <span className="mt-0.5 line-clamp-2 block font-dm text-[12px] text-[var(--a-ink-3)]">{p.text || "Empty post"}</span>
                      <span className={`mt-1 block font-dm text-[10.5px] tabular-nums ${len > PLATFORM_INFO[p.platform].maxChars ? "font-bold text-[var(--a-danger)]" : "text-[var(--a-ink-3)]"}`}>{len}/{PLATFORM_INFO[p.platform].maxChars}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
            <Button size="sm" icon={Plus} onClick={() => { edit({ posts: [...c.posts, { platform: platformFilter !== "all" ? (platformFilter as Platform) : "linkedin", text: "", hashtags: [] }] }); setSel(c.posts.length); }}>Add post</Button>
          </div>

          {cur ? (
            <>
              <div className="min-w-0 space-y-4">
                <Card
                  title={`Post ${curIndex + 1}`}
                  action={
                    <span className="flex items-center gap-2">
                      <CharRing value={postText(cur).length} max={PLATFORM_INFO[cur.platform].maxChars} />
                      <Button size="sm" variant="ghost" icon={Trash2} aria-label={`Remove post ${curIndex + 1}`} onClick={() => { edit({ posts: c.posts.filter((_, j) => j !== curIndex) }); setSel(Math.max(0, curIndex - 1)); }} />
                    </span>
                  }
                >
                  <div className="space-y-3">
                    <Segmented
                      size="sm"
                      ariaLabel="Platform"
                      value={cur.platform}
                      onChange={(v) => setPost(curIndex, { platform: v as Platform })}
                      options={PLATFORMS.map((p) => ({ value: p, label: PLATFORM_INFO[p].label.replace(" Status", "") }))}
                    />
                    <Area id={`post-${curIndex}`} aria-label={`Post ${curIndex + 1} text`} rows={8} value={cur.text} onChange={(v) => setPost(curIndex, { text: v })} />
                    <input aria-label={`Post ${curIndex + 1} hashtags`} className={input} value={cur.hashtags.map((h) => `#${h}`).join(" ")} placeholder="#hashtags"
                      onChange={(e) => setPost(curIndex, { hashtags: e.target.value.split(/[\s,]+/).map((h) => h.replace(/^#/, "")).filter(Boolean) })} />
                    <Warnings items={warn.posts[curIndex] ?? []} />
                    <AiActions kitId={kit.id} kind="post" index={curIndex} item={cur} language={kit.language} onSuggest={(s) => putSugg(`post:${curIndex}`, s as Suggestion<unknown>)} disabled={!cur.text.trim()} />
                    {sugg[`post:${curIndex}`] && (
                      <Suggestions<KitPost>
                        s={sugg[`post:${curIndex}`] as Suggestion<KitPost>}
                        render={(it) => <p className="whitespace-pre-wrap font-dm text-[13px] text-[var(--a-ink-2)]">{it.text}{it.hashtags.length ? `\n\n${it.hashtags.map((h) => `#${h}`).join(" ")}` : ""}</p>}
                        onReplace={(it) => { setPost(curIndex, { text: it.text, hashtags: it.hashtags }); putSugg(`post:${curIndex}`, null); }}
                        onAdd={(it) => { edit({ posts: [...c.posts, { ...it, image: cur.image ?? null }] }); putSugg(`post:${curIndex}`, null); toast.success("Added as a new post", `Post ${c.posts.length + 1}`); }}
                        onDismiss={() => putSugg(`post:${curIndex}`, null)}
                        copyText={(it) => it.text}
                      />
                    )}
                  </div>
                </Card>
                <Card title="Image card" subtitle="Rendered on brand from this post. Attached when you queue the posts.">
                  <CardStudio text={cur.text} spec={cur.image ?? null} onChange={(s) => setPost(curIndex, { image: s })} ctx={cardCtx} />
                </Card>
                <div className="2xl:hidden">
                  <p className="a-micro mb-2">Live preview</p>
                  <div className="max-w-[420px]"><PostPreview platform={cur.platform} text={postText(cur)} image={cur.image ? cardUrl(cur.image) : null} linkUrl={SAMPLE_SHORT_URL} /></div>
                </div>
              </div>
              <aside className="hidden 2xl:block">
                <div className="sticky top-28 space-y-2" data-testid="post-preview">
                  <p className="a-micro">Live preview: {PLATFORM_INFO[cur.platform].label}</p>
                  <PostPreview platform={cur.platform} text={postText(cur)} image={cur.image ? cardUrl(cur.image) : null} linkUrl={SAMPLE_SHORT_URL} />
                </div>
              </aside>
            </>
          ) : (
            <p className="font-dm text-[13px] text-[var(--a-ink-3)]">No posts yet. Add one.</p>
          )}
        </div>
      )}

      {/* ── Emails ─────────────────────────────────────────────── */}
      {tab === "emails" && (
        <div className="space-y-3">
          <Segmented ariaLabel="Email" value={String(emailSel)} onChange={(v) => setEmailSel(Number(v))} options={c.emails.map((e, i) => ({ value: String(i), label: `Email ${i + 1}`, count: warn.emails[i]?.length || undefined }))} />
          {c.emails[emailSel] ? (
            <TwoPane
              editor={
                <Card title={`Email ${emailSel + 1}`} subtitle="Create newsletter drafts turns these into draft campaigns with tracked links (utm_medium=email).">
                  <div className="space-y-3">
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div><label className={label} htmlFor={`e-s-${emailSel}`}>Subject</label><input id={`e-s-${emailSel}`} className={input} value={c.emails[emailSel].subject} onChange={(x) => setEmail(emailSel, { subject: x.target.value })} /></div>
                      <div><label className={label} htmlFor={`e-p-${emailSel}`}>Preview text</label><input id={`e-p-${emailSel}`} className={input} value={c.emails[emailSel].preview} onChange={(x) => setEmail(emailSel, { preview: x.target.value })} /></div>
                    </div>
                    <div><label className={label} htmlFor={`e-b-${emailSel}`}>Body</label><Area id={`e-b-${emailSel}`} rows={10} value={c.emails[emailSel].body} onChange={(v) => setEmail(emailSel, { body: v })} /></div>
                    <div className="max-w-xs"><label className={label} htmlFor={`e-c-${emailSel}`}>Button</label><input id={`e-c-${emailSel}`} className={input} value={c.emails[emailSel].cta} onChange={(x) => setEmail(emailSel, { cta: x.target.value })} /></div>
                    <Warnings items={warn.emails[emailSel] ?? []} />
                    <AiActions kitId={kit.id} kind="email" index={emailSel} item={c.emails[emailSel]} language={kit.language} onSuggest={(s) => putSugg(`email:${emailSel}`, s as Suggestion<unknown>)} />
                    {sugg[`email:${emailSel}`] && (
                      <Suggestions<KitEmail>
                        s={sugg[`email:${emailSel}`] as Suggestion<KitEmail>}
                        render={(it) => <div className="font-dm text-[13px] text-[var(--a-ink-2)]"><p className="font-semibold text-[var(--a-ink)]">{it.subject}</p><p className="mt-1 line-clamp-6 whitespace-pre-wrap">{it.body}</p></div>}
                        onReplace={(it) => { setEmail(emailSel, it); putSugg(`email:${emailSel}`, null); }}
                        onDismiss={() => putSugg(`email:${emailSel}`, null)}
                      />
                    )}
                  </div>
                </Card>
              }
              preview={<EmailPreview subject={c.emails[emailSel].subject} preview={c.emails[emailSel].preview} body={c.emails[emailSel].body} cta={c.emails[emailSel].cta} />}
              label="Inbox and email preview"
            />
          ) : <p className="font-dm text-[13px] text-[var(--a-ink-3)]">This kit has no emails.</p>}
        </div>
      )}

      {/* ── Ads ────────────────────────────────────────────────── */}
      {tab === "ads" && (
        <div className="space-y-4">
          {c.ads.map((a, i) => (
            <TwoPane
              key={i}
              editor={
                <Card title={`${a.network === "meta" ? "Meta" : a.network === "google" ? "Google search" : "LinkedIn"} ad`}>
                  <div className="space-y-2.5">
                    {(["headline", "primaryText", "description", "cta"] as const).map((f) => {
                      const lim = AD_LIMITS[a.network][f];
                      return (
                        <div key={f}>
                          <div className="flex items-center justify-between">
                            <label className={label} htmlFor={`ad-${i}-${f}`}>{f === "primaryText" ? (a.network === "google" ? "Headline 2" : "Primary text") : f === "cta" ? "Call to action" : f[0].toUpperCase() + f.slice(1)}</label>
                            {lim ? <CharRing value={a[f].length} max={lim} size={22} /> : null}
                          </div>
                          <Area id={`ad-${i}-${f}`} rows={f === "primaryText" && a.network !== "google" ? 3 : 1} value={a[f]} onChange={(v) => setAd(i, { [f]: v })} />
                        </div>
                      );
                    })}
                    <Warnings items={warn.ads[i] ?? []} />
                    <AiActions kitId={kit.id} kind="ad" index={i} item={a} language={kit.language} onSuggest={(s) => putSugg(`ad:${i}`, s as Suggestion<unknown>)} />
                    {sugg[`ad:${i}`] && (
                      <Suggestions<KitAd>
                        s={sugg[`ad:${i}`] as Suggestion<KitAd>}
                        render={(it) => <div className="font-dm text-[13px] text-[var(--a-ink-2)]"><p className="font-semibold text-[var(--a-ink)]">{it.headline}</p><p className="mt-1">{it.primaryText}</p><p className="mt-1 text-[var(--a-ink-3)]">{it.description}</p></div>}
                        onReplace={(it) => { setAd(i, it); putSugg(`ad:${i}`, null); }}
                        onDismiss={() => putSugg(`ad:${i}`, null)}
                      />
                    )}
                  </div>
                </Card>
              }
              preview={
                a.network === "google" ? <GoogleAdPreview headline={a.headline} headline2={a.primaryText} description={a.description} />
                  : a.network === "meta" ? <MetaAdPreview primaryText={a.primaryText} headline={a.headline} description={a.description} cta={a.cta} image={c.posts.find((p) => p.image)?.image ? cardUrl({ ...c.posts.find((p) => p.image)!.image!, format: "landscape" }) : null} />
                    : <LinkedInAdPreview primaryText={a.primaryText} headline={a.headline} cta={a.cta} image={c.posts.find((p) => p.image)?.image ? cardUrl({ ...c.posts.find((p) => p.image)!.image!, format: "landscape" }) : null} />
              }
              label={`${a.network} ad preview`}
            />
          ))}
        </div>
      )}

      {/* ── Video ──────────────────────────────────────────────── */}
      {tab === "video" && (
        <TwoPane
          editor={
            <Card title={`Short video script (${c.video.durationSeconds}s reel)`}>
              <div className="space-y-2.5">
                <div className="grid gap-2 sm:grid-cols-2">
                  <div><label className={label} htmlFor="v-title">Title</label><input id="v-title" className={input} value={c.video.title} onChange={(e) => edit({ video: { ...c.video, title: e.target.value } })} /></div>
                  <div><label className={label} htmlFor="v-hook">Hook (first 3 seconds)</label><input id="v-hook" className={input} value={c.video.hook} onChange={(e) => edit({ video: { ...c.video, hook: e.target.value } })} /></div>
                </div>
                <div><label className={label} htmlFor="v-script">Script</label><Area id="v-script" rows={10} value={c.video.script} onChange={(v) => edit({ video: { ...c.video, script: v } })} /></div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div><label className={label} htmlFor="v-ost">On-screen text (one per line)</label><Area id="v-ost" rows={4} value={lines(c.video.onScreenText)} onChange={(v) => edit({ video: { ...c.video, onScreenText: unlines(v) } })} /></div>
                  <div><label className={label} htmlFor="v-cta">Call to action</label><input id="v-cta" className={input} value={c.video.cta} onChange={(e) => edit({ video: { ...c.video, cta: e.target.value } })} /></div>
                </div>
                <Warnings items={warn.video} />
                <AiActions kitId={kit.id} kind="video" index={0} item={c.video} language={kit.language} onSuggest={(s) => putSugg("video", s as Suggestion<unknown>)} />
                {sugg.video && (
                  <Suggestions<KitContent["video"]>
                    s={sugg.video as Suggestion<KitContent["video"]>}
                    render={(it) => <div className="font-dm text-[13px] text-[var(--a-ink-2)]"><p className="font-semibold text-[var(--a-ink)]">{it.hook}</p><p className="mt-1 line-clamp-6 whitespace-pre-wrap">{it.script}</p></div>}
                    onReplace={(it) => { edit({ video: it }); putSugg("video", null); }}
                    onDismiss={() => putSugg("video", null)}
                  />
                )}
              </div>
            </Card>
          }
          preview={<VideoPreview hook={c.video.hook} onScreenText={c.video.onScreenText} cta={c.video.cta} durationSeconds={c.video.durationSeconds} />}
          label="Reel preview"
        />
      )}

      {/* ── Landing ────────────────────────────────────────────── */}
      {tab === "landing" && (
        <TwoPane
          editor={
            <Card title="Landing page hero">
              <div className="space-y-2.5">
                <div><label className={label} htmlFor="h-head">Headline</label><input id="h-head" className={input} value={c.hero.headline} onChange={(e) => edit({ hero: { ...c.hero, headline: e.target.value } })} /></div>
                <div><label className={label} htmlFor="h-sub">Subheadline</label><Area id="h-sub" rows={2} value={c.hero.subheadline} onChange={(v) => edit({ hero: { ...c.hero, subheadline: v } })} /></div>
                <div className="grid gap-2 sm:grid-cols-[1fr_200px]">
                  <div><label className={label} htmlFor="h-bul">Bullets (one per line)</label><Area id="h-bul" rows={3} value={lines(c.hero.bullets)} onChange={(v) => edit({ hero: { ...c.hero, bullets: unlines(v) } })} /></div>
                  <div><label className={label} htmlFor="h-cta">Button</label><input id="h-cta" className={input} value={c.hero.cta} onChange={(e) => edit({ hero: { ...c.hero, cta: e.target.value } })} /></div>
                </div>
                <Warnings items={warn.hero} />
                <AiActions kitId={kit.id} kind="hero" index={0} item={c.hero} language={kit.language} onSuggest={(s) => putSugg("hero", s as Suggestion<unknown>)} />
                {sugg.hero && (
                  <Suggestions<KitContent["hero"]>
                    s={sugg.hero as Suggestion<KitContent["hero"]>}
                    render={(it) => <div className="font-dm text-[13px] text-[var(--a-ink-2)]"><p className="font-semibold text-[var(--a-ink)]">{it.headline}</p><p className="mt-1">{it.subheadline}</p></div>}
                    onReplace={(it) => { edit({ hero: it }); putSugg("hero", null); }}
                    onDismiss={() => putSugg("hero", null)}
                  />
                )}
              </div>
            </Card>
          }
          preview={<LandingPreview headline={c.hero.headline} subheadline={c.hero.subheadline} bullets={c.hero.bullets} cta={c.hero.cta} />}
          label="Landing hero preview"
        />
      )}

      {open && (
        <PostDrawer post={open} audiences={audiences} onClose={() => setOpen(null)}
          onChange={(p) => { setPosts((xs) => xs.map((x) => (x.id === p.id ? p : x))); setOpen(p); }}
          onDelete={(id) => { setPosts((xs) => xs.filter((x) => x.id !== id)); setOpen(null); }} />
      )}
    </div>
  );
}

const AD_LIMITS: Record<string, Record<"headline" | "primaryText" | "description" | "cta", number>> = {
  google: { headline: 30, primaryText: 30, description: 90, cta: 0 },
  meta: { headline: 40, primaryText: 125, description: 30, cta: 0 },
  linkedin: { headline: 70, primaryText: 150, description: 0, cta: 0 },
};

function TwoPane({ editor, preview, label: aria }: { editor: ReactNode; preview: ReactNode; label: string }) {
  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_400px]">
      <div className="min-w-0">{editor}</div>
      <aside aria-label={aria} className="min-w-0">
        <div className="sticky top-28 space-y-2" data-testid="preview-pane">
          <p className="a-micro">Live preview</p>
          {preview}
        </div>
      </aside>
    </div>
  );
}
