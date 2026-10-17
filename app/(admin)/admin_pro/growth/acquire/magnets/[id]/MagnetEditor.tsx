"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Copy, ExternalLink, Globe, Link2, Plus, Rocket, Save, Trash2, Undo2 } from "lucide-react";
import { Badge, Button, Card, PageHeader, Segmented, Select, StatCard, useToast } from "@/components/admin/ui";
import {
  MAGNET_TYPE_LABEL,
  magnetProblems,
  type MagnetContent,
  type MagnetType,
  type QuizQuestion,
} from "@/lib/growth/acquire/types";
import type { RecentCapture, RefStats } from "@/lib/growth/acquire/stats";
import { api, hintCls, inputCls, labelCls, LANG_OPTIONS, textareaCls } from "../../_components/form";
import { Block, Field, move, RowTools, StringList } from "../../_components/ListEditors";

type Initial = {
  id: string;
  slug: string;
  type: string;
  title: string;
  status: string;
  language: string;
  productKey: string;
  noindex: boolean;
  content: MagnetContent;
  shortLink: string | null;
};
type Product = { key: string; label: string; group: string };

const pct = (r: number | null) => (r === null ? "n/a" : `${(r * 100).toFixed(r < 0.1 ? 1 : 0)}%`);

export default function MagnetEditor({
  initial,
  stats,
  recent,
  products,
  links,
  site,
}: {
  initial: Initial;
  stats: RefStats;
  recent: RecentCapture[];
  products: Product[];
  links: { href: string; label: string }[];
  site: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const type = initial.type as MagnetType;
  const [title, setTitle] = useState(initial.title);
  const [slug, setSlug] = useState(initial.slug);
  const [language, setLanguage] = useState(initial.language);
  const [productKey, setProductKey] = useState(initial.productKey);
  const [noindex, setNoindex] = useState(initial.noindex);
  const [c, setC] = useState<MagnetContent>(initial.content);
  const [status, setStatus] = useState(initial.status);
  const [shortLink, setShortLink] = useState(initial.shortLink);
  const [saved, setSaved] = useState(() => JSON.stringify({ title: initial.title, slug: initial.slug, language: initial.language, productKey: initial.productKey, noindex: initial.noindex, c: initial.content }));
  const [busy, setBusy] = useState<string | null>(null);

  const snapshot = JSON.stringify({ title, slug, language, productKey, noindex, c });
  const dirty = snapshot !== saved;
  const problems = useMemo(() => magnetProblems(type, c), [type, c]);
  const live = status === "published";
  const set = <K extends keyof MagnetContent>(k: K, v: MagnetContent[K]) => setC((x) => ({ ...x, [k]: v }));

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

  async function save(quiet = false): Promise<boolean> {
    setBusy("save");
    try {
      const r = await api<{ magnet: { slug: string; content: MagnetContent } }>(`/api/admin/growth/acquire/magnets/${initial.id}`, {
        method: "PATCH",
        body: { title, slug, language, productKey: productKey || null, noindex, content: c },
      });
      setSlug(r.magnet.slug);
      setC(r.magnet.content);
      setSaved(JSON.stringify({ title, slug: r.magnet.slug, language, productKey, noindex, c: r.magnet.content }));
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
    if (name === "publish" && dirty && !(await save(true))) return;
    setBusy(name);
    try {
      const r = await api<{ status?: string; url?: string; ready?: string[] }>(`/api/admin/growth/acquire/magnets/${initial.id}`, { body: { action: name } });
      if (r.status) {
        setStatus(r.status);
        toast.success(r.status === "published" ? "Published" : "Unpublished", r.status === "published" ? `Live at /free/${slug}` : "The public page now returns 404.");
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
    if (!window.confirm(`Delete "${title}"? The public page stops working. Sign-ups it collected stay in Leads and the newsletter.`)) return;
    setBusy("delete");
    try {
      await api(`/api/admin/growth/acquire/magnets/${initial.id}`, { method: "DELETE" });
      toast.success("Deleted");
      router.push("/admin_pro/growth/acquire/magnets");
    } catch (e) {
      toast.error("Could not delete", e instanceof Error ? e.message : undefined);
      setBusy(null);
    }
  }

  const publicUrl = `${site}/free/${slug}`;

  return (
    <>
      <PageHeader
        breadcrumb={[{ label: "Acquisition", href: "/admin_pro/growth/acquire" }, { label: "Lead magnets", href: "/admin_pro/growth/acquire/magnets" }, { label: title }]}
        title={title || "Untitled magnet"}
        meta={
          <>
            <Badge tone={live ? "success" : "neutral"} dot>{live ? "Live" : "Draft"}</Badge>
            <Badge tone="info">{MAGNET_TYPE_LABEL[type]}</Badge>
            <Badge tone="neutral">{language.toUpperCase()}</Badge>
            {dirty && <Badge tone="warn">Unsaved changes</Badge>}
          </>
        }
        actions={
          <>
            {live && <Button href={`/free/${slug}`} external icon={ExternalLink} variant="ghost">View</Button>}
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

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-6">
          <Card title="Basics">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field id="m-title" label="Internal name">
                <input id="m-title" className={inputCls} value={title} maxLength={160} onChange={(e) => setTitle(e.target.value)} />
              </Field>
              <Field id="m-slug" label="URL" hint={live ? "Unpublish to change a live URL." : `${site.replace(/^https?:\/\//, "")}/free/${slug}`}>
                <input id="m-slug" className={inputCls} value={slug} disabled={live} onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))} />
              </Field>
              <Field id="m-product" label="Recommended product">
                <Select id="m-product" className="w-full" value={productKey} onChange={(e) => setProductKey(e.target.value)}>
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
            </div>
            <label className="mt-4 flex items-center gap-2 font-dm text-[13.5px] text-[var(--a-ink-2)]">
              <input type="checkbox" className="h-4 w-4 accent-[var(--a-blue)]" checked={noindex} onChange={(e) => setNoindex(e.target.checked)} />
              Hide from search engines (noindex)
            </label>
          </Card>

          <Card title="Sign-up page" subtitle="What people see before they give their email">
            <div className="space-y-4">
              <Field id="m-head" label="Headline">
                <input id="m-head" className={inputCls} value={c.headline} maxLength={160} onChange={(e) => set("headline", e.target.value)} />
              </Field>
              <Field id="m-sub" label="Subheadline">
                <textarea id="m-sub" rows={2} className={textareaCls} value={c.subheadline} maxLength={400} onChange={(e) => set("subheadline", e.target.value)} />
              </Field>
              <StringList id="m-bullets" label="What you get" items={c.bullets} onChange={(v) => set("bullets", v)} max={6} addLabel="Add bullet" />
              <Field id="m-cta" label="Form button" hint={type === "quiz" ? "Shown under the quiz result." : undefined}>
                <input id="m-cta" className={inputCls} value={c.ctaLabel} maxLength={60} onChange={(e) => set("ctaLabel", e.target.value)} placeholder="Send it to me" />
              </Field>
            </div>
          </Card>

          <Card title={`${MAGNET_TYPE_LABEL[type]} content`} subtitle="The asset itself (web page and Save as PDF)">
            <div className="space-y-4">
              <Field id="m-intro" label="Intro">
                <textarea id="m-intro" rows={3} className={textareaCls} value={c.intro} onChange={(e) => set("intro", e.target.value)} />
              </Field>
              {type === "checklist" && <ChecklistEditor c={c} set={set} />}
              {type === "guide" && <GuideEditor c={c} set={set} />}
              {type === "quiz" && <QuizEditor c={c} set={set} />}
              {type === "templates" && <TemplatesEditor c={c} set={set} links={links} />}
              {type !== "quiz" && (
                <Field id="m-outro" label="Closing">
                  <textarea id="m-outro" rows={2} className={textareaCls} value={c.outro} onChange={(e) => set("outro", e.target.value)} />
                </Field>
              )}
            </div>
          </Card>

          <Card title="Recommendation and email">
            <div className="space-y-4">
              <Field id="m-pitch" label="Why the product helps (next step)">
                <textarea id="m-pitch" rows={2} className={textareaCls} value={c.productPitch} maxLength={600} onChange={(e) => set("productPitch", e.target.value)} />
              </Field>
              <Field id="m-pcta" label="Product button">
                <input id="m-pcta" className={inputCls} value={c.productCta} maxLength={60} onChange={(e) => set("productCta", e.target.value)} />
              </Field>
              <Field id="m-subj" label="Email subject">
                <input id="m-subj" className={inputCls} value={c.emailSubject} maxLength={160} onChange={(e) => set("emailSubject", e.target.value)} />
              </Field>
              <Field id="m-body" label="Email body" hint="Plain text. The link to the asset, the quiz result, the product and an unsubscribe link are added automatically.">
                <textarea id="m-body" rows={5} className={textareaCls} value={c.emailBody} maxLength={3000} onChange={(e) => set("emailBody", e.target.value)} />
              </Field>
            </div>
          </Card>
        </div>

        <aside className="min-w-0 space-y-4 xl:sticky xl:top-4 xl:self-start">
          {problems.length > 0 && (
            <Card title="Before you publish">
              <ul className="space-y-1.5 pl-4 font-dm text-[13px] text-[var(--a-warn)] [list-style:disc]">
                {problems.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </Card>
          )}
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Views" value={stats.views} />
            <StatCard label="Sign-ups" value={stats.captures} tone="orange" />
            <StatCard label="Conversion" value={pct(stats.rate)} />
            <StatCard label="Product clicks" value={stats.ctas} />
          </div>
          <Card title="Share" icon={Globe}>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input readOnly aria-label="Public URL" value={publicUrl} className={`${inputCls} font-mono text-[12px]`} onFocus={(e) => e.currentTarget.select()} />
                <Button size="sm" icon={Copy} aria-label="Copy public URL" onClick={() => navigator.clipboard?.writeText(publicUrl).then(() => toast.success("Copied"))} />
              </div>
              {shortLink ? (
                <div className="flex items-center gap-2">
                  <input readOnly aria-label="Tracked link" value={shortLink} className={`${inputCls} font-mono text-[12px]`} onFocus={(e) => e.currentTarget.select()} />
                  <Button size="sm" icon={Copy} aria-label="Copy tracked link" onClick={() => navigator.clipboard?.writeText(shortLink).then(() => toast.success("Copied"))} />
                </div>
              ) : (
                <Button size="sm" icon={Link2} onClick={() => action("link")} loading={busy === "link"} disabled={!!busy}>Create tracked link</Button>
              )}
              {language === "en" && (
                <Button size="sm" variant="ghost" onClick={() => action("translate")} loading={busy === "translate"} disabled={!!busy || dirty}>Pre-translate FR and SW</Button>
              )}
            </div>
          </Card>
          <Card title="Latest sign-ups" padded={false}>
            {recent.length ? (
              <ul className="divide-y divide-[var(--a-border)]">
                {recent.map((r) => (
                  <li key={r.id} className="px-5 py-2.5 font-dm text-[13px]">
                    <span className="block truncate font-semibold text-[var(--a-ink)]">{r.name || r.email}</span>
                    <span className="block truncate text-[12px] text-[var(--a-ink-3)]">
                      {r.business ? `${r.business} · ` : ""}
                      {new Date(r.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      {r.score !== null ? ` · score ${r.score}` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-5 py-4 font-dm text-[13px] text-[var(--a-ink-3)]">No sign-ups yet. They also appear in <Link href="/admin_pro/growth/leads" className="text-[var(--a-blue)] hover:underline">Leads</Link>.</p>
            )}
          </Card>
          <Button variant="ghost" icon={Trash2} className="text-[var(--a-danger)]" onClick={remove} loading={busy === "delete"} disabled={!!busy}>Delete magnet</Button>
        </aside>
      </div>
    </>
  );
}

type SetFn = <K extends keyof MagnetContent>(k: K, v: MagnetContent[K]) => void;

function ChecklistEditor({ c, set }: { c: MagnetContent; set: SetFn }) {
  const secs = c.checklist;
  const up = (v: MagnetContent["checklist"]) => set("checklist", v);
  return (
    <div className="space-y-3">
      {secs.map((s, i) => (
        <Block key={i} title={`Section ${i + 1}`} tools={<RowTools i={i} n={secs.length} label={`section ${i + 1}`} onMove={(d) => up(move(secs, i, d))} onRemove={() => up(secs.filter((_, j) => j !== i))} />}>
          <Field id={`cl-h-${i}`} label="Heading">
            <input id={`cl-h-${i}`} className={inputCls} value={s.heading} onChange={(e) => up(secs.map((x, j) => (j === i ? { ...x, heading: e.target.value } : x)))} />
          </Field>
          <p className={labelCls}>Items</p>
          <ul className="space-y-2">
            {s.items.map((it, k) => (
              <li key={k} className="flex items-start gap-2">
                <div className="min-w-0 flex-1 space-y-1.5">
                  <input aria-label={`Item ${k + 1}`} className={inputCls} value={it.text} placeholder="Action to tick off" onChange={(e) => up(secs.map((x, j) => (j === i ? { ...x, items: x.items.map((y, m) => (m === k ? { ...y, text: e.target.value } : y)) } : x)))} />
                  <input aria-label={`Item ${k + 1} note`} className={`${inputCls} text-[12.5px]`} value={it.note} placeholder="Why or how (optional)" onChange={(e) => up(secs.map((x, j) => (j === i ? { ...x, items: x.items.map((y, m) => (m === k ? { ...y, note: e.target.value } : y)) } : x)))} />
                </div>
                <RowTools i={k} n={s.items.length} label={`item ${k + 1}`} onMove={(d) => up(secs.map((x, j) => (j === i ? { ...x, items: move(x.items, k, d) } : x)))} onRemove={() => up(secs.map((x, j) => (j === i ? { ...x, items: x.items.filter((_, m) => m !== k) } : x)))} />
              </li>
            ))}
          </ul>
          <Button size="sm" variant="ghost" icon={Plus} onClick={() => up(secs.map((x, j) => (j === i ? { ...x, items: [...x.items, { text: "", note: "" }] } : x)))}>Add item</Button>
        </Block>
      ))}
      <Button size="sm" icon={Plus} onClick={() => up([...secs, { heading: "", items: [{ text: "", note: "" }] }])}>Add section</Button>
    </div>
  );
}

function GuideEditor({ c, set }: { c: MagnetContent; set: SetFn }) {
  const secs = c.guide;
  const up = (v: MagnetContent["guide"]) => set("guide", v);
  return (
    <div className="space-y-3">
      {secs.map((s, i) => (
        <Block key={i} title={`Section ${i + 1}`} tools={<RowTools i={i} n={secs.length} label={`section ${i + 1}`} onMove={(d) => up(move(secs, i, d))} onRemove={() => up(secs.filter((_, j) => j !== i))} />}>
          <Field id={`g-h-${i}`} label="Heading">
            <input id={`g-h-${i}`} className={inputCls} value={s.heading} onChange={(e) => up(secs.map((x, j) => (j === i ? { ...x, heading: e.target.value } : x)))} />
          </Field>
          <Field id={`g-b-${i}`} label="Body" hint="Separate paragraphs with a blank line.">
            <textarea id={`g-b-${i}`} rows={5} className={textareaCls} value={s.body} onChange={(e) => up(secs.map((x, j) => (j === i ? { ...x, body: e.target.value } : x)))} />
          </Field>
        </Block>
      ))}
      <Button size="sm" icon={Plus} onClick={() => up([...secs, { heading: "", body: "" }])}>Add section</Button>
      <StringList id="g-take" label="Key takeaways" items={c.takeaways} onChange={(v) => set("takeaways", v)} max={8} addLabel="Add takeaway" />
    </div>
  );
}

function QuizEditor({ c, set }: { c: MagnetContent; set: SetFn }) {
  const qs = c.questions;
  const up = (v: QuizQuestion[]) => set("questions", v);
  const upQ = (i: number, q: Partial<QuizQuestion>) => up(qs.map((x, j) => (j === i ? { ...x, ...q } : x)));
  return (
    <div className="space-y-3">
      <p className={hintCls}>Points: 3 is best practice, 0 the weakest answer. The tip is shown to people who picked that answer (leave it empty for the best one).</p>
      {qs.map((q, i) => (
        <Block key={i} title={`Question ${i + 1}`} tools={<RowTools i={i} n={qs.length} label={`question ${i + 1}`} onMove={(d) => up(move(qs, i, d))} onRemove={() => up(qs.filter((_, j) => j !== i))} />}>
          <input aria-label={`Question ${i + 1}`} className={inputCls} value={q.text} onChange={(e) => upQ(i, { text: e.target.value })} />
          <ul className="space-y-2">
            {q.options.map((o, k) => (
              <li key={k} className="grid grid-cols-[1fr_72px_auto] items-start gap-2 sm:grid-cols-[1fr_72px_1fr_auto]">
                <input aria-label={`Question ${i + 1} answer ${k + 1}`} className={inputCls} value={o.label} placeholder="Answer" onChange={(e) => upQ(i, { options: q.options.map((y, m) => (m === k ? { ...y, label: e.target.value } : y)) })} />
                <select aria-label={`Answer ${k + 1} points`} className={inputCls} value={o.points} onChange={(e) => upQ(i, { options: q.options.map((y, m) => (m === k ? { ...y, points: Number(e.target.value) } : y)) })}>
                  {[0, 1, 2, 3].map((p) => (
                    <option key={p} value={p}>{p} pt</option>
                  ))}
                </select>
                <input aria-label={`Answer ${k + 1} tip`} className={`${inputCls} col-span-2 sm:col-span-1`} value={o.tip} placeholder="Tip for this answer" onChange={(e) => upQ(i, { options: q.options.map((y, m) => (m === k ? { ...y, tip: e.target.value } : y)) })} />
                <RowTools i={k} n={q.options.length} label={`answer ${k + 1}`} onMove={(d) => upQ(i, { options: move(q.options, k, d) })} onRemove={() => upQ(i, { options: q.options.filter((_, m) => m !== k) })} />
              </li>
            ))}
          </ul>
          {q.options.length < 5 && <Button size="sm" variant="ghost" icon={Plus} onClick={() => upQ(i, { options: [...q.options, { label: "", points: 0, tip: "" }] })}>Add answer</Button>}
        </Block>
      ))}
      <Button size="sm" icon={Plus} onClick={() => up([...qs, { text: "", options: [{ label: "", points: 3, tip: "" }, { label: "", points: 0, tip: "" }] }])}>Add question</Button>

      <p className={`${labelCls} pt-2`}>Result bands</p>
      {c.bands.map((b, i) => (
        <Block key={i} title={`From ${b.min} points`} tools={<RowTools i={i} n={c.bands.length} label={`band ${i + 1}`} onMove={(d) => set("bands", move(c.bands, i, d))} onRemove={() => set("bands", c.bands.filter((_, j) => j !== i))} />}>
          <div className="grid grid-cols-[90px_1fr] gap-2">
            <input aria-label={`Band ${i + 1} minimum score`} type="number" min={0} max={100} className={inputCls} value={b.min} onChange={(e) => set("bands", c.bands.map((x, j) => (j === i ? { ...x, min: Math.max(0, Math.min(100, Number(e.target.value) || 0)) } : x)))} />
            <input aria-label={`Band ${i + 1} title`} className={inputCls} value={b.title} placeholder="Result name" onChange={(e) => set("bands", c.bands.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))} />
          </div>
          <textarea aria-label={`Band ${i + 1} text`} rows={2} className={textareaCls} value={b.body} placeholder="What this score means and the next step" onChange={(e) => set("bands", c.bands.map((x, j) => (j === i ? { ...x, body: e.target.value } : x)))} />
        </Block>
      ))}
      {c.bands.length < 5 && <Button size="sm" icon={Plus} onClick={() => set("bands", [...c.bands, { min: 50, title: "", body: "" }])}>Add band</Button>}
    </div>
  );
}

function TemplatesEditor({ c, set, links }: { c: MagnetContent; set: SetFn; links: { href: string; label: string }[] }) {
  const items = c.templates;
  const up = (v: MagnetContent["templates"]) => set("templates", v);
  return (
    <div className="space-y-3">
      {items.map((t, i) => (
        <Block key={i} title={t.title || `Item ${i + 1}`} tools={<RowTools i={i} n={items.length} label={`item ${i + 1}`} onMove={(d) => up(move(items, i, d))} onRemove={() => up(items.filter((_, j) => j !== i))} />}>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <input aria-label={`Item ${i + 1} title`} className={inputCls} value={t.title} placeholder="Title" onChange={(e) => up(items.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))} />
            <input aria-label={`Item ${i + 1} button`} className={inputCls} value={t.label} placeholder="Button text" onChange={(e) => up(items.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} />
          </div>
          <textarea aria-label={`Item ${i + 1} description`} rows={2} className={textareaCls} value={t.description} placeholder="How to use it" onChange={(e) => up(items.map((x, j) => (j === i ? { ...x, description: e.target.value } : x)))} />
          <select aria-label={`Item ${i + 1} link`} className={inputCls} value={links.some((l) => l.href === t.href) ? t.href : ""} onChange={(e) => up(items.map((x, j) => (j === i ? { ...x, href: e.target.value } : x)))}>
            <option value="">{t.href && !links.some((l) => l.href === t.href) ? `Current: ${t.href}` : "Pick a page"}</option>
            {links.map((l) => (
              <option key={l.href} value={l.href}>{l.label}</option>
            ))}
          </select>
        </Block>
      ))}
      <Button size="sm" icon={Plus} onClick={() => up([...items, { title: "", description: "", href: links[0]?.href ?? "/tools", label: "" }])}>Add item</Button>
    </div>
  );
}
