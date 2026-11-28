"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Copy, Eye, EyeOff, ExternalLink, Globe, Link2, Monitor, Plus, Rocket, Save, Smartphone, Trash2, Undo2 } from "lucide-react";
import { Badge, Button, Card, IconButton, PageHeader, Segmented, Select, StatCard, useToast } from "@/components/admin/ui";
import {
  blankSection,
  CTA_KINDS,
  CTA_LABEL,
  pageProblems,
  SECTION_LABEL,
  SECTION_TYPES,
  type CtaKind,
  type PageContent,
  type PageSection,
  type SectionType,
} from "@/lib/growth/acquire/types";
import type { RecentCapture, RefStats } from "@/lib/growth/acquire/stats";
import type { Labels } from "@/lib/growth/acquire/fmt";
import PageSections from "@/app/(public)/lp/_components/PageSections";
import { api, hintCls, inputCls, labelCls, LANG_OPTIONS, textareaCls } from "../../_components/form";
import { Block, Field, move, RowTools, StringList } from "../../_components/ListEditors";

// Landing page editor: basics, CTA, ordered sections (toggle, reorder, add,
// remove) and a live preview rendered with the public page's own component.

type Initial = {
  id: string;
  slug: string;
  title: string;
  status: string;
  language: string;
  productKey: string;
  noindex: boolean;
  content: PageContent;
  shortLink: string | null;
  fromKit: boolean;
};
type Product = { key: string; label: string; group: string; url: string };

const pct = (r: number | null) => (r === null ? "n/a" : `${(r * 100).toFixed(r < 0.1 ? 1 : 0)}%`);
const money = (c: number) => `$${(c / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

const SECTION_HINT: Record<SectionType, string> = {
  hero: "Headline, subheadline, bullets and the main button.",
  pains: "The problems your audience has, in their words.",
  benefits: "What changes for them, tied to the product facts.",
  proof: "Only your approved proof points from Growth settings.",
  product: "Product name, price line and facts.",
  faq: "Real objections with honest answers.",
  cta: "A closing banner with the main button.",
  form: "Email capture with consent. Leads go to Leads and the newsletter.",
};

export default function PageEditor({
  initial,
  stats,
  recent,
  products,
  proofPoints,
  labels,
  site,
}: {
  initial: Initial;
  stats: RefStats;
  recent: RecentCapture[];
  products: Product[];
  proofPoints: string[];
  labels: Record<string, Labels>;
  site: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const [title, setTitle] = useState(initial.title);
  const [slug, setSlug] = useState(initial.slug);
  const [language, setLanguage] = useState(initial.language);
  const [productKey, setProductKey] = useState(initial.productKey);
  const [noindex, setNoindex] = useState(initial.noindex);
  const [c, setC] = useState<PageContent>(initial.content);
  const [status, setStatus] = useState(initial.status);
  const [shortLink, setShortLink] = useState(initial.shortLink);
  const [saved, setSaved] = useState(() =>
    JSON.stringify({ title: initial.title, slug: initial.slug, language: initial.language, productKey: initial.productKey, noindex: initial.noindex, c: initial.content }),
  );
  const [busy, setBusy] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(initial.content.sections[0]?.id ?? null);
  const [addType, setAddType] = useState<SectionType>("faq");
  const [view, setView] = useState("desktop");
  const [showPreview, setShowPreview] = useState(true);

  const snapshot = JSON.stringify({ title, slug, language, productKey, noindex, c });
  const dirty = snapshot !== saved;
  const problems = useMemo(() => pageProblems(c), [c]);
  const live = status === "published";
  const L = labels[language] ?? labels.en;

  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  const groups = useMemo(() => {
    const g = new Map<string, Product[]>();
    for (const p of products) g.set(p.group, [...(g.get(p.group) ?? []), p]);
    return [...g.entries()];
  }, [products]);

  const sections = c.sections;
  const setSections = (v: PageSection[]) => setC((x) => ({ ...x, sections: v }));
  const upSection = (id: string, patch: Partial<PageSection>) => setSections(sections.map((s) => (s.id === id ? { ...s, ...patch } : s)));

  function addSection() {
    const s = blankSection(addType, sections.length);
    if (addType === "proof") s.items = proofPoints.slice(0, 4);
    // A new form or closing CTA goes at the end; anything else before them.
    const tail = sections.findIndex((x) => x.type === "cta" || x.type === "form");
    const at = addType === "cta" || addType === "form" || tail < 0 ? sections.length : tail;
    setSections([...sections.slice(0, at), s, ...sections.slice(at)]);
    setOpenId(s.id);
  }

  function onProduct(key: string) {
    setProductKey(key);
    const p = products.find((x) => x.key === key);
    if (!p || c.cta.kind === "newsletter" || c.cta.kind === "custom" || c.cta.kind === "booking") return;
    setC((x) => ({ ...x, cta: { ...x.cta, href: p.url } }));
  }

  async function save(quiet = false): Promise<boolean> {
    setBusy("save");
    try {
      const r = await api<{ page: { slug: string; content: PageContent } }>(`/api/admin/growth/acquire/pages/${initial.id}`, {
        method: "PATCH",
        body: { title, slug, language, productKey: productKey || null, noindex, content: c },
      });
      setSlug(r.page.slug);
      setC(r.page.content);
      setSaved(JSON.stringify({ title, slug: r.page.slug, language, productKey, noindex, c: r.page.content }));
      if (!quiet) toast.success("Saved");
      return true;
    } catch (e) {
      toast.error("Could not save", e instanceof Error ? e.message : undefined);
      return false;
    } finally {
      setBusy(null);
    }
  }

  async function action(name: "publish" | "unpublish" | "link" | "translate") {
    if ((name === "publish" || name === "translate") && dirty && !(await save(true))) return;
    if (name === "unpublish" && !window.confirm("Unpublish this page? Visitors get a 404 until you publish it again.")) return;
    setBusy(name);
    try {
      const r = await api<{ status?: string; url?: string; ready?: string[] }>(`/api/admin/growth/acquire/pages/${initial.id}`, { body: { action: name } });
      if (r.status) {
        setStatus(r.status);
        toast.success(r.status === "published" ? "Published" : "Unpublished", r.status === "published" ? `Live at /lp/${slug}` : "The public page now returns 404.");
      }
      if (r.url) {
        setShortLink(r.url);
        await navigator.clipboard?.writeText(r.url).catch(() => {});
        toast.success("Tracked link ready", "Copied. Clicks show in Links & attribution.");
      }
      if (r.ready) toast.success("Translations ready", r.ready.length ? r.ready.map((l) => l.toUpperCase()).join(", ") : "None yet; try again in a minute.");
      router.refresh();
    } catch (e) {
      toast.error("That did not work", e instanceof Error ? e.message : undefined);
    } finally {
      setBusy(null);
    }
  }

  async function remove() {
    if (!window.confirm(`Delete "${title}"? The public page stops working. Leads it collected stay in Leads and the newsletter.`)) return;
    setBusy("delete");
    try {
      await api(`/api/admin/growth/acquire/pages/${initial.id}`, { method: "DELETE" });
      toast.success("Deleted");
      router.push("/admin_pro/growth/acquire/pages");
    } catch (e) {
      toast.error("Could not delete", e instanceof Error ? e.message : undefined);
      setBusy(null);
    }
  }

  const publicUrl = `${site}/lp/${slug}`;
  const previewCta = c.cta.kind === "newsletter" ? "#lead-form" : c.cta.href || null;

  return (
    <>
      <PageHeader
        breadcrumb={[{ label: "Acquisition", href: "/admin_pro/growth/acquire" }, { label: "Landing pages", href: "/admin_pro/growth/acquire/pages" }, { label: title }]}
        title={title || "Untitled page"}
        meta={
          <>
            <Badge tone={live ? "success" : "neutral"} dot>{live ? "Live" : "Draft"}</Badge>
            <Badge tone="neutral">{language.toUpperCase()}</Badge>
            {noindex && <Badge tone="neutral"><EyeOff size={11} aria-hidden /> noindex</Badge>}
            {initial.fromKit && <Badge tone="info">From a content kit</Badge>}
            {dirty && <Badge tone="warn">Unsaved changes</Badge>}
          </>
        }
        actions={
          <>
            {live && <Button href={`/lp/${slug}`} external icon={ExternalLink} variant="ghost">View</Button>}
            <Button icon={Save} onClick={() => save()} loading={busy === "save"} disabled={!!busy || !dirty}>Save</Button>
            {live ? (
              <Button icon={Undo2} onClick={() => action("unpublish")} loading={busy === "unpublish"} disabled={!!busy}>Unpublish</Button>
            ) : (
              <Button variant="primary" icon={Rocket} onClick={() => action("publish")} loading={busy === "publish"} disabled={!!busy || problems.length > 0} title={problems[0]}>Publish</Button>
            )}
          </>
        }
        className="!mb-0"
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatCard label="Visits" value={stats.views} />
        <StatCard label="Leads" value={stats.captures} tone="orange" />
        <StatCard label="Visit to lead" value={pct(stats.rate)} />
        <StatCard label="CTA clicks" value={stats.ctas} />
        <StatCard label="Conversions" value={stats.signups + stats.conversions} hint={stats.revenueCents ? `${money(stats.revenueCents)} revenue` : "Sign-ups and purchases"} className="col-span-2 lg:col-span-1" />
      </div>

      <div className={`grid grid-cols-1 gap-6 ${showPreview ? "xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]" : "xl:grid-cols-[minmax(0,1fr)_340px]"}`}>
        <div className="min-w-0 space-y-6">
          {problems.length > 0 && (
            <div role="status" className="rounded-[var(--a-radius-card)] border border-[#f7dcb5] bg-[var(--a-warn-bg)] px-4 py-3">
              <p className="font-dm text-[13px] font-semibold text-[var(--a-warn)]">Before you publish</p>
              <ul className="mt-1 space-y-0.5 pl-4 font-dm text-[13px] text-[var(--a-warn)] [list-style:disc]">
                {problems.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </div>
          )}

          <Card title="Basics">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field id="p-title" label="Internal name">
                <input id="p-title" className={inputCls} value={title} maxLength={160} onChange={(e) => setTitle(e.target.value)} />
              </Field>
              <Field id="p-slug" label="URL" hint={live ? "Unpublish to change a live URL." : `${site.replace(/^https?:\/\//, "")}/lp/${slug}`}>
                <input id="p-slug" className={inputCls} value={slug} disabled={live} onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))} />
              </Field>
              <Field id="p-product" label="Product">
                <Select id="p-product" className="w-full" value={productKey} onChange={(e) => onProduct(e.target.value)}>
                  <option value="">No product</option>
                  {groups.map(([g, list]) => (
                    <optgroup key={g} label={g}>
                      {list.map((p) => (
                        <option key={p.key} value={p.key}>{p.label}</option>
                      ))}
                    </optgroup>
                  ))}
                </Select>
              </Field>
              <div>
                <span className={labelCls}>Language</span>
                <Segmented ariaLabel="Language" value={language} onChange={setLanguage} options={LANG_OPTIONS} />
                <p className={hintCls}>{language === "en" ? "French and Swahili visitors get an automatic translation." : "Shown as written to every visitor."}</p>
              </div>
              <Field id="p-desc" label="Share description" hint="Used for the link preview and the share image.">
                <textarea id="p-desc" rows={2} className={textareaCls} value={c.description} maxLength={300} onChange={(e) => setC((x) => ({ ...x, description: e.target.value }))} />
              </Field>
              <div className="space-y-2 pt-1">
                <label className="flex min-h-9 items-center gap-2 font-dm text-[13.5px] text-[var(--a-ink-2)]">
                  <input type="checkbox" className="h-4 w-4 accent-[var(--a-blue)]" checked={noindex} onChange={(e) => setNoindex(e.target.checked)} />
                  Hide from search engines (noindex)
                </label>
                <label className="flex min-h-9 items-center gap-2 font-dm text-[13.5px] text-[var(--a-ink-2)]">
                  <input type="checkbox" className="h-4 w-4 accent-[var(--a-blue)]" checked={c.askBusiness} onChange={(e) => setC((x) => ({ ...x, askBusiness: e.target.checked }))} />
                  Lead form asks for the business name
                </label>
                <label className="flex min-h-9 items-center gap-2 font-dm text-[13.5px] text-[var(--a-ink-2)]">
                  <input type="checkbox" className="h-4 w-4 accent-[var(--a-blue)]" checked={c.askWhatsapp} onChange={(e) => setC((x) => ({ ...x, askWhatsapp: e.target.checked }))} />
                  Lead form asks for WhatsApp
                </label>
              </div>
            </div>
          </Card>

          <Card title="Call to action" subtitle="Where the hero, product and closing buttons go. Clicks are counted and the visitor keeps the page's campaign.">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-[220px_1fr]">
              <Field id="p-ctakind" label="Button goes to">
                <Select
                  id="p-ctakind"
                  className="w-full"
                  value={c.cta.kind}
                  onChange={(e) => {
                    const kind = e.target.value as CtaKind;
                    const p = products.find((x) => x.key === productKey);
                    const href = kind === "newsletter" ? "" : kind === "booking" ? "/book" : (kind === "buy" || kind === "track") && p ? p.url : c.cta.href;
                    setC((x) => ({ ...x, cta: { kind, href } }));
                  }}
                >
                  {CTA_KINDS.map((k) => (
                    <option key={k} value={k}>{CTA_LABEL[k]}</option>
                  ))}
                </Select>
              </Field>
              {c.cta.kind !== "newsletter" ? (
                <Field id="p-ctahref" label="Destination" hint="A page on this site (/learning-box) or an https link on an allowed domain.">
                  <input id="p-ctahref" className={inputCls} value={c.cta.href} maxLength={500} placeholder="/learning-box" onChange={(e) => setC((x) => ({ ...x, cta: { ...x.cta, href: e.target.value.trim() } }))} />
                </Field>
              ) : (
                <p className={`${hintCls} self-end`}>Buttons scroll to the lead form on the page.</p>
              )}
            </div>
          </Card>

          <Card
            title="Sections"
            subtitle="Reorder with the arrows. Switch a section off without losing it."
            action={
              <div className="flex items-center gap-2">
                <Select aria-label="Section to add" value={addType} onChange={(e) => setAddType(e.target.value as SectionType)}>
                  {SECTION_TYPES.map((t) => (
                    <option key={t} value={t}>{SECTION_LABEL[t]}</option>
                  ))}
                </Select>
                <Button size="sm" icon={Plus} onClick={addSection}>Add</Button>
              </div>
            }
          >
            <ol className="space-y-2" aria-label="Page sections in order">
              {sections.map((s, i) => {
                const open = openId === s.id;
                return (
                  <li key={s.id} className={`rounded-[var(--a-radius-control)] border ${s.enabled ? "border-[var(--a-border)]" : "border-dashed border-[var(--a-border-strong)] opacity-80"} bg-[var(--a-surface)]`}>
                    <div className="flex items-center gap-2 px-2 py-1.5">
                      <button
                        type="button"
                        aria-expanded={open}
                        aria-controls={`sec-${s.id}`}
                        onClick={() => setOpenId(open ? null : s.id)}
                        className="flex min-h-9 min-w-0 flex-1 items-center gap-2 rounded-lg px-1 text-left hover:bg-[var(--a-surface-2)]"
                      >
                        {open ? <ChevronDown size={16} aria-hidden className="shrink-0 text-[var(--a-ink-3)]" /> : <ChevronRight size={16} aria-hidden className="shrink-0 text-[var(--a-ink-3)]" />}
                        <span className="w-5 shrink-0 text-right font-dm text-[12px] tabular-nums text-[var(--a-ink-3)]">{i + 1}</span>
                        <span className="min-w-0 truncate font-dm text-[13.5px] font-semibold text-[var(--a-ink)]">
                          {SECTION_LABEL[s.type]}
                          {s.title ? <span className="font-normal text-[var(--a-ink-3)]"> · {s.title}</span> : null}
                        </span>
                      </button>
                      <IconButton
                        icon={s.enabled ? Eye : EyeOff}
                        size="sm"
                        aria-label={s.enabled ? `Hide ${SECTION_LABEL[s.type]} section` : `Show ${SECTION_LABEL[s.type]} section`}
                        aria-pressed={s.enabled}
                        onClick={() => upSection(s.id, { enabled: !s.enabled })}
                      />
                      <RowTools
                        i={i}
                        n={sections.length}
                        label={`${SECTION_LABEL[s.type]} section`}
                        onMove={(d) => setSections(move(sections, i, d))}
                        onRemove={() => {
                          if (window.confirm(`Remove the ${SECTION_LABEL[s.type]} section?`)) setSections(sections.filter((x) => x.id !== s.id));
                        }}
                      />
                    </div>
                    {open && (
                      <div id={`sec-${s.id}`} className="space-y-3 border-t border-[var(--a-border)] p-3">
                        <p className={hintCls}>{SECTION_HINT[s.type]}</p>
                        <SectionFields s={s} up={(patch) => upSection(s.id, patch)} proofPoints={proofPoints} />
                      </div>
                    )}
                  </li>
                );
              })}
            </ol>
          </Card>

          <SideCards
            className={showPreview ? "" : "xl:hidden"}
            live={live}
            slug={slug}
            publicUrl={publicUrl}
            shortLink={shortLink}
            language={language}
            busy={busy}
            dirty={dirty}
            recent={recent}
            onAction={action}
            onRemove={remove}
            copy={(v) => navigator.clipboard?.writeText(v).then(() => toast.success("Copied"))}
          />
        </div>

        {showPreview ? (
          <div className="min-w-0 xl:sticky xl:top-4 xl:self-start">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-syne text-[16px] font-bold text-[var(--a-ink)]">Live preview</h2>
              <div className="flex items-center gap-2">
                <Segmented
                  ariaLabel="Preview width"
                  value={view}
                  onChange={setView}
                  options={[
                    { value: "desktop", label: <span className="inline-flex items-center gap-1.5"><Monitor size={14} aria-hidden /> Desktop</span> },
                    { value: "mobile", label: <span className="inline-flex items-center gap-1.5"><Smartphone size={14} aria-hidden /> Phone</span> },
                  ]}
                />
                <Button size="sm" variant="ghost" onClick={() => setShowPreview(false)}>Hide</Button>
              </div>
            </div>
            <div className="overflow-hidden rounded-[var(--a-radius-card)] border border-[var(--a-border)] bg-[var(--a-surface-2)] p-3">
              <div
                className="mx-auto max-h-[78vh] overflow-y-auto overflow-x-hidden rounded-xl bg-white shadow-[var(--a-shadow-card)]"
                style={view === "mobile" ? { maxWidth: 390 } : undefined}
                aria-label="Preview of the public page"
              >
                {/* zoom keeps the desktop layout readable in half the width */}
                <div lang={language} style={view === "desktop" ? { zoom: 0.62 } : undefined}>
                  <PageSections content={c} labels={L} slug={slug} locale={language} ctaHref={previewCta} preview />
                </div>
              </div>
            </div>
            <p className={hintCls}>The preview uses the published page&apos;s own layout. The form and buttons are inactive here.</p>
          </div>
        ) : (
          <aside className="min-w-0 space-y-4 xl:sticky xl:top-4 xl:self-start">
            <Button icon={Eye} onClick={() => setShowPreview(true)}>Show live preview</Button>
            <SideCards
              className="hidden xl:block"
              live={live}
              slug={slug}
              publicUrl={publicUrl}
              shortLink={shortLink}
              language={language}
              busy={busy}
              dirty={dirty}
              recent={recent}
              onAction={action}
              onRemove={remove}
              copy={(v) => navigator.clipboard?.writeText(v).then(() => toast.success("Copied"))}
            />
          </aside>
        )}
      </div>
    </>
  );
}

function SideCards({
  className = "",
  live,
  slug,
  publicUrl,
  shortLink,
  language,
  busy,
  dirty,
  recent,
  onAction,
  onRemove,
  copy,
}: {
  className?: string;
  live: boolean;
  slug: string;
  publicUrl: string;
  shortLink: string | null;
  language: string;
  busy: string | null;
  dirty: boolean;
  recent: RecentCapture[];
  onAction: (a: "link" | "translate") => void;
  onRemove: () => void;
  copy: (v: string) => void;
}) {
  return (
    <div className={`space-y-4 ${className}`}>
      <Card title="Share" icon={Globe}>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <input readOnly aria-label="Public URL" value={publicUrl} className={`${inputCls} font-mono text-[12px]`} onFocus={(e) => e.currentTarget.select()} />
            <Button size="sm" icon={Copy} aria-label="Copy public URL" onClick={() => copy(publicUrl)} />
          </div>
          {shortLink ? (
            <div className="flex items-center gap-2">
              <input readOnly aria-label="Tracked link" value={shortLink} className={`${inputCls} font-mono text-[12px]`} onFocus={(e) => e.currentTarget.select()} />
              <Button size="sm" icon={Copy} aria-label="Copy tracked link" onClick={() => copy(shortLink)} />
            </div>
          ) : (
            <Button size="sm" icon={Link2} onClick={() => onAction("link")} loading={busy === "link"} disabled={!!busy}>Create tracked link</Button>
          )}
          {language === "en" && (
            <Button size="sm" variant="ghost" onClick={() => onAction("translate")} loading={busy === "translate"} disabled={!!busy || dirty}>Pre-translate FR and SW</Button>
          )}
          {live ? (
            <OgPreview slug={slug} />
          ) : (
            <p className={hintCls}>The share image is generated from the hero and description once the page is live.</p>
          )}
        </div>
      </Card>
      <Card title="Latest leads" padded={false}>
        {recent.length ? (
          <ul className="divide-y divide-[var(--a-border)]">
            {recent.map((r) => (
              <li key={r.id} className="px-5 py-2.5 font-dm text-[13px]">
                <span className="block truncate font-semibold text-[var(--a-ink)]">{r.name || r.email}</span>
                <span className="block truncate text-[12px] text-[var(--a-ink-3)]">
                  {r.business ? `${r.business} · ` : ""}
                  {new Date(r.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  {r.utmCampaign ? ` · ${r.utmCampaign}` : ""}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-5 py-4 font-dm text-[13px] text-[var(--a-ink-3)]">
            No leads yet. They also appear in <Link href="/admin_pro/growth/leads" className="text-[var(--a-blue)] hover:underline">Leads</Link>.
          </p>
        )}
      </Card>
      <Button variant="ghost" icon={Trash2} className="text-[var(--a-danger)]" onClick={onRemove} loading={busy === "delete"} disabled={!!busy}>Delete page</Button>
    </div>
  );
}

/** The live page's share image (its URL carries a build hash, so read it from the page's own og:image). */
function OgPreview({ slug }: { slug: string }) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    let on = true;
    fetch(`/lp/${slug}`)
      .then((r) => (r.ok ? r.text() : ""))
      .then((html) => {
        const m = /<meta property="og:image" content="([^"]+)"/.exec(html);
        if (!on || !m) return;
        const u = new URL(m[1].replace(/&amp;/g, "&"), window.location.origin);
        setSrc(`${u.pathname}${u.search}`);
      })
      .catch(() => {});
    return () => {
      on = false;
    };
  }, [slug]);
  return (
    <div>
      <p className={labelCls}>Share image</p>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="Share image preview" className="w-full rounded-lg border border-[var(--a-border)]" loading="lazy" />
      ) : (
        <div className="aspect-[1200/630] w-full animate-pulse rounded-lg bg-[var(--a-surface-2)]" aria-hidden />
      )}
    </div>
  );
}

function SectionFields({ s, up, proofPoints }: { s: PageSection; up: (p: Partial<PageSection>) => void; proofPoints: string[] }) {
  const id = s.id;
  const titleLabel = s.type === "hero" ? "Headline" : s.type === "form" ? "Form heading" : s.type === "product" ? "Product name" : "Heading (optional, a default is used)";
  const showBody = s.type === "hero" || s.type === "product" || s.type === "cta" || s.type === "form";
  const bodyLabel = s.type === "hero" ? "Subheadline" : s.type === "product" ? "Price line" : s.type === "form" ? "What they get" : "Text";
  const showItems = s.type === "hero" || s.type === "pains" || s.type === "benefits" || s.type === "product";
  const showCta = s.type === "hero" || s.type === "product" || s.type === "cta" || s.type === "form";
  return (
    <>
      <Field id={`t-${id}`} label={titleLabel}>
        <input id={`t-${id}`} className={inputCls} value={s.title} maxLength={200} onChange={(e) => up({ title: e.target.value })} />
      </Field>
      {showBody && (
        <Field id={`b-${id}`} label={bodyLabel}>
          {s.type === "product" ? (
            <input id={`b-${id}`} className={inputCls} value={s.body} maxLength={200} onChange={(e) => up({ body: e.target.value })} />
          ) : (
            <textarea id={`b-${id}`} rows={2} className={textareaCls} value={s.body} maxLength={2000} onChange={(e) => up({ body: e.target.value })} />
          )}
        </Field>
      )}
      {showItems && (
        <StringList
          id={`i-${id}`}
          label={s.type === "hero" ? "Bullets" : s.type === "product" ? "Facts" : s.type === "pains" ? "Pains" : "Benefits"}
          items={s.items}
          onChange={(v) => up({ items: v })}
          multiline={s.type !== "hero"}
          addLabel="Add line"
        />
      )}
      {s.type === "proof" && (
        <fieldset>
          <legend className={labelCls}>Approved proof points</legend>
          {proofPoints.length ? (
            <ul className="space-y-1.5">
              {proofPoints.map((p) => (
                <li key={p}>
                  <label className="flex items-start gap-2 font-dm text-[13px] text-[var(--a-ink-2)]">
                    <input
                      type="checkbox"
                      className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--a-blue)]"
                      checked={s.items.includes(p)}
                      onChange={(e) => up({ items: e.target.checked ? [...s.items, p] : s.items.filter((x) => x !== p) })}
                    />
                    {p}
                  </label>
                </li>
              ))}
            </ul>
          ) : (
            <p className={hintCls}>
              No proof points yet. Add them in <Link href="/admin_pro/growth/settings" className="text-[var(--a-blue)] hover:underline">Growth settings</Link>; this section stays hidden until then.
            </p>
          )}
        </fieldset>
      )}
      {s.type === "faq" && (
        <div className="space-y-2">
          {s.faq.map((f, k) => (
            <Block key={k} title={`Question ${k + 1}`} tools={<RowTools i={k} n={s.faq.length} label={`question ${k + 1}`} onMove={(d) => up({ faq: move(s.faq, k, d) })} onRemove={() => up({ faq: s.faq.filter((_, j) => j !== k) })} />}>
              <input aria-label={`Question ${k + 1}`} className={inputCls} value={f.q} placeholder="Question" onChange={(e) => up({ faq: s.faq.map((x, j) => (j === k ? { ...x, q: e.target.value } : x)) })} />
              <textarea aria-label={`Answer ${k + 1}`} rows={2} className={textareaCls} value={f.a} placeholder="Answer" onChange={(e) => up({ faq: s.faq.map((x, j) => (j === k ? { ...x, a: e.target.value } : x)) })} />
            </Block>
          ))}
          {s.faq.length < 10 && (
            <Button size="sm" variant="ghost" icon={Plus} onClick={() => up({ faq: [...s.faq, { q: "", a: "" }] })}>Add question</Button>
          )}
        </div>
      )}
      {showCta && (
        <Field id={`c-${id}`} label={s.type === "form" ? "Submit button" : "Button text"} hint={s.type === "form" ? undefined : "Leave empty to hide the button in this section."}>
          <input id={`c-${id}`} className={inputCls} value={s.ctaLabel} maxLength={60} onChange={(e) => up({ ctaLabel: e.target.value })} />
        </Field>
      )}
    </>
  );
}
