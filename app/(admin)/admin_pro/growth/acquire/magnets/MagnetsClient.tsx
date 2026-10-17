"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { BookOpen, ClipboardCheck, ExternalLink, Gauge, LayoutGrid, Magnet, Plus, Sparkles } from "lucide-react";
import { Badge, Button, DataTable, Drawer, EmptyState, PageHeader, SearchInput, Segmented, Select, Toolbar, useToast, type Column } from "@/components/admin/ui";
import { MAGNET_TYPE_HINT, MAGNET_TYPE_LABEL, MAGNET_TYPES, type MagnetType } from "@/lib/growth/acquire/types";
import type { RefStats } from "@/lib/growth/acquire/stats";
import { api, hintCls, labelCls, LANG_OPTIONS, textareaCls } from "../_components/form";

type Row = { id: string; slug: string; title: string; type: string; status: string; language: string; updatedAt: string; stats: RefStats };
type Product = { key: string; label: string; group: string };
type Audience = { id: string; name: string; language: string };

const TYPE_ICON: Record<MagnetType, typeof ClipboardCheck> = { checklist: ClipboardCheck, guide: BookOpen, quiz: Gauge, templates: LayoutGrid };

const IDEAS: Record<MagnetType, string> = {
  checklist: "The 15-minute AI setup checklist for a small business",
  guide: "How to answer customer messages at night without hiring",
  quiz: "Is your business losing leads at night? Get your score",
  templates: "The free AI starter pack: scanner, cost calculator and guides",
};

const pct = (r: number | null) => (r === null ? "n/a" : `${(r * 100).toFixed(r < 0.1 ? 1 : 0)}%`);

export default function MagnetsClient({ magnets, products, audiences, openNew }: { magnets: Row[]; products: Product[]; audiences: Audience[]; openNew: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [open, setOpen] = useState(openNew);
  const [type, setType] = useState<MagnetType>("checklist");
  const [topic, setTopic] = useState("");
  const [productKey, setProductKey] = useState(products.find((p) => p.key === "learn-plan:monthly")?.key ?? "");
  const [language, setLanguage] = useState("en");
  const [audienceId, setAudienceId] = useState(audiences[0]?.id ?? "");
  const [busy, setBusy] = useState<"ai" | "blank" | null>(null);

  const rows = useMemo(
    () =>
      magnets.filter(
        (m) => (status === "all" || (status === "live" ? m.status === "published" : m.status !== "published")) && (!q || `${m.title} ${m.slug}`.toLowerCase().includes(q.toLowerCase())),
      ),
    [magnets, q, status],
  );
  const groups = useMemo(() => {
    const g = new Map<string, Product[]>();
    for (const p of products) g.set(p.group, [...(g.get(p.group) ?? []), p]);
    return [...g.entries()];
  }, [products]);

  async function create(mode: "ai" | "blank") {
    setBusy(mode);
    try {
      const r = await api<{ magnet: { id: string }; warnings: string[] }>("/api/admin/growth/acquire/magnets", {
        body: { mode, type, topic: topic.trim() || (mode === "blank" ? "" : IDEAS[type]), productKey: productKey || null, language, audienceId: audienceId || null },
      });
      toast.success(mode === "ai" ? "Draft ready" : "Magnet created", r.warnings.length ? `${r.warnings.length} claim${r.warnings.length === 1 ? "" : "s"} to check before publishing.` : "Review it, then publish.");
      router.push(`/admin_pro/growth/acquire/magnets/${r.magnet.id}`);
    } catch (e) {
      toast.error("Could not create the magnet", e instanceof Error ? e.message : undefined);
      setBusy(null);
    }
  }

  const cols: Column<Row>[] = [
    {
      key: "title",
      header: "Lead magnet",
      primary: true,
      render: (r) => (
        <span className="min-w-0">
          <span className="block">{r.title}</span>
          <span className="block font-dm text-[12px] font-normal text-[var(--a-ink-3)]">/free/{r.slug}</span>
        </span>
      ),
    },
    { key: "type", header: "Type", render: (r) => MAGNET_TYPE_LABEL[r.type as MagnetType] ?? r.type },
    { key: "lang", header: "Lang", hideOnMobile: true, render: (r) => r.language.toUpperCase() },
    { key: "status", header: "Status", render: (r) => <Badge tone={r.status === "published" ? "success" : "neutral"} dot>{r.status === "published" ? "Live" : "Draft"}</Badge> },
    { key: "views", header: "Views", align: "right", render: (r) => <span className="tabular-nums">{r.stats.views}</span> },
    { key: "caps", header: "Sign-ups", align: "right", render: (r) => <span className="tabular-nums font-semibold text-[var(--a-ink)]">{r.stats.captures}</span> },
    { key: "rate", header: "Conversion", align: "right", render: (r) => <span className="tabular-nums">{pct(r.stats.rate)}</span> },
    { key: "cta", header: "Product clicks", align: "right", hideOnMobile: true, render: (r) => <span className="tabular-nums">{r.stats.ctas}</span> },
    {
      key: "open",
      header: <span className="sr-only">Open</span>,
      align: "right",
      hideOnMobile: true,
      render: (r) =>
        r.status === "published" ? (
          <a href={`/free/${r.slug}`} target="_blank" rel="noopener noreferrer" aria-label={`Open ${r.title} in a new tab`} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[var(--a-ink-3)] hover:bg-[var(--a-surface-2)] hover:text-[var(--a-ink)]" onClick={(e) => e.stopPropagation()}>
            <ExternalLink size={15} aria-hidden />
          </a>
        ) : null,
    },
  ];

  return (
    <>
      <PageHeader
        title="Lead magnets"
        subtitle="Free checklists, guides, scorecards and template packs that people trade their email for. Each sign-up joins the newsletter and the Leads pipeline with express consent, gets the asset by email and is pointed to a product."
        actions={<Button variant="primary" icon={Plus} onClick={() => setOpen(true)}>New lead magnet</Button>}
        className="!mb-0"
      />
      <div>
        <Toolbar>
          <SearchInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search magnets" label="Search magnets" />
          <Segmented
            ariaLabel="Status"
            value={status}
            onChange={setStatus}
            options={[
              { value: "all", label: "All", count: magnets.length },
              { value: "live", label: "Live", count: magnets.filter((m) => m.status === "published").length },
              { value: "draft", label: "Drafts", count: magnets.filter((m) => m.status !== "published").length },
            ]}
          />
        </Toolbar>
        <DataTable
          columns={cols}
          rows={rows}
          rowKey={(r) => r.id}
          rowHref={(r) => `/admin_pro/growth/acquire/magnets/${r.id}`}
          caption="Lead magnets"
          empty={
            <EmptyState
              icon={Magnet}
              title={magnets.length ? "No magnets match" : "No lead magnets yet"}
              body={magnets.length ? "Clear the search or switch the filter." : "Pick a type and a product; AI drafts it from your brand voice in under a minute."}
              action={magnets.length ? undefined : <Button variant="primary" icon={Plus} onClick={() => setOpen(true)}>New lead magnet</Button>}
            />
          }
        />
      </div>

      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title="New lead magnet"
        width={560}
        footer={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button variant="ghost" onClick={() => create("blank")} loading={busy === "blank"} disabled={!!busy}>Start blank</Button>
            <Button variant="primary" icon={Sparkles} onClick={() => create("ai")} loading={busy === "ai"} disabled={!!busy}>
              {busy === "ai" ? "Drafting…" : "Draft with AI"}
            </Button>
          </div>
        }
      >
        <div className="space-y-5 p-5">
          <fieldset>
            <legend className={labelCls}>Type</legend>
            <div role="radiogroup" aria-label="Type" className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {MAGNET_TYPES.map((t) => {
                const Icon = TYPE_ICON[t];
                const on = t === type;
                return (
                  <button
                    key={t}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => setType(t)}
                    className={`flex min-h-[44px] items-start gap-3 rounded-[var(--a-radius-control)] border p-3 text-left transition-colors ${on ? "border-[var(--a-blue)] bg-[var(--a-info-bg)] ring-1 ring-[var(--a-blue)]" : "border-[var(--a-border)] hover:bg-[var(--a-surface-2)]"}`}
                  >
                    <Icon size={18} className={on ? "mt-0.5 text-[var(--a-blue)]" : "mt-0.5 text-[var(--a-ink-3)]"} aria-hidden />
                    <span className="min-w-0">
                      <span className="block font-dm text-[13.5px] font-semibold text-[var(--a-ink)]">{MAGNET_TYPE_LABEL[t]}</span>
                      <span className="block font-dm text-[12px] leading-snug text-[var(--a-ink-3)]">{MAGNET_TYPE_HINT[t]}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>
          <div>
            <label htmlFor="mg-topic" className={labelCls}>Topic or angle</label>
            <textarea id="mg-topic" rows={2} className={textareaCls} value={topic} onChange={(e) => setTopic(e.target.value)} placeholder={IDEAS[type]} maxLength={400} />
            <p className={hintCls}>Leave empty to use the example. Name the outcome your audience wants.</p>
          </div>
          <div>
            <label htmlFor="mg-product" className={labelCls}>Product it recommends</label>
            <Select id="mg-product" className="w-full" value={productKey} onChange={(e) => setProductKey(e.target.value)}>
              <option value="">No product</option>
              {groups.map(([g, list]) => (
                <optgroup key={g} label={g}>
                  {list.map((p) => (
                    <option key={p.key} value={p.key}>{p.label}</option>
                  ))}
                </optgroup>
              ))}
            </Select>
            <p className={hintCls}>The draft may only use this product&apos;s facts and your approved proof points.</p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <span className={labelCls}>Language</span>
              <Segmented ariaLabel="Language" value={language} onChange={setLanguage} options={LANG_OPTIONS} />
              <p className={hintCls}>English magnets are auto-translated for French and Swahili visitors.</p>
            </div>
            <div>
              <label htmlFor="mg-aud" className={labelCls}>Audience</label>
              <Select id="mg-aud" className="w-full" value={audienceId} onChange={(e) => setAudienceId(e.target.value)}>
                <option value="">General</option>
                {audiences.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </Select>
            </div>
          </div>
          <p className="rounded-[var(--a-radius-control)] bg-[var(--a-surface-2)] p-3 font-dm text-[12.5px] leading-relaxed text-[var(--a-ink-2)]">
            Drafts are written by Claude Sonnet from <Link href="/admin_pro/growth/settings" className="font-semibold text-[var(--a-blue)] hover:underline">Brand &amp; audiences</Link>. Nothing goes live until you publish it.
          </p>
        </div>
      </Drawer>
    </>
  );
}
