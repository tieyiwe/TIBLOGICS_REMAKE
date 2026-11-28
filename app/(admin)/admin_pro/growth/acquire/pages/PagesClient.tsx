"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ExternalLink, EyeOff, FileText, LayoutTemplate, Package, Plus, Sparkles } from "lucide-react";
import { Badge, Button, DataTable, Drawer, EmptyState, PageHeader, SearchInput, Segmented, Select, Toolbar, useToast, type Column } from "@/components/admin/ui";
import type { RefStats } from "@/lib/growth/acquire/stats";
import { api, hintCls, labelCls, LANG_OPTIONS, textareaCls } from "../_components/form";

type Row = { id: string; slug: string; title: string; status: string; language: string; noindex: boolean; updatedAt: string; stats: RefStats };
type Product = { key: string; label: string; group: string };

const money = (c: number) => `$${(c / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

const MODES = [
  { value: "kit", label: "From a content kit", icon: Package, hint: "Uses the kit's hero, pains and benefits. No AI cost, ready in a second." },
  { value: "ai", label: "AI draft for a product", icon: Sparkles, hint: "Sonnet writes hero, pains, benefits, FAQ and closing from the product facts." },
  { value: "blank", label: "Blank page", icon: FileText, hint: "A hero, benefits, FAQ and lead form to fill in yourself." },
] as const;

export default function PagesClient({
  pages,
  kits,
  products,
  audiences,
  openNew,
  presetKit,
}: {
  pages: Row[];
  kits: { id: string; label: string }[];
  products: Product[];
  audiences: { id: string; name: string }[];
  openNew: boolean;
  presetKit: string | null;
}) {
  const router = useRouter();
  const toast = useToast();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [open, setOpen] = useState(openNew || !!presetKit);
  const [mode, setMode] = useState<"kit" | "ai" | "blank">(presetKit || kits.length ? "kit" : "ai");
  const [kitId, setKitId] = useState(presetKit ?? kits[0]?.id ?? "");
  const [productKey, setProductKey] = useState(products.find((p) => p.key === "learn-plan:monthly")?.key ?? "");
  const [goal, setGoal] = useState("");
  const [language, setLanguage] = useState("en");
  const [audienceId, setAudienceId] = useState(audiences[0]?.id ?? "");
  const [busy, setBusy] = useState(false);

  const groups = useMemo(() => {
    const g = new Map<string, Product[]>();
    for (const p of products) g.set(p.group, [...(g.get(p.group) ?? []), p]);
    return [...g.entries()];
  }, [products]);
  const rows = pages.filter((p) => (status === "all" || (status === "live" ? p.status === "published" : p.status !== "published")) && (!q || `${p.title} ${p.slug}`.toLowerCase().includes(q.toLowerCase())));

  async function create() {
    if (mode === "kit" && !kitId) return toast.error("Pick a content kit");
    setBusy(true);
    try {
      const r = await api<{ page: { id: string }; warnings: string[] }>("/api/admin/growth/acquire/pages", {
        body: { mode, kitId, productKey: productKey || null, goal, language, audienceId: audienceId || null },
      });
      toast.success("Page created", r.warnings.length ? `${r.warnings.length} claim${r.warnings.length === 1 ? "" : "s"} to check.` : "Arrange the sections, then publish.");
      router.push(`/admin_pro/growth/acquire/pages/${r.page.id}`);
    } catch (e) {
      toast.error("Could not create the page", e instanceof Error ? e.message : undefined);
      setBusy(false);
    }
  }

  const cols: Column<Row>[] = [
    {
      key: "title",
      header: "Landing page",
      primary: true,
      render: (r) => (
        <span className="min-w-0">
          <span className="block">{r.title}</span>
          <span className="block font-dm text-[12px] font-normal text-[var(--a-ink-3)]">/lp/{r.slug}</span>
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (r) => (
        <span className="inline-flex flex-wrap gap-1">
          <Badge tone={r.status === "published" ? "success" : "neutral"} dot>{r.status === "published" ? "Live" : "Draft"}</Badge>
          {r.noindex && <Badge tone="neutral"><EyeOff size={11} aria-hidden /> noindex</Badge>}
        </span>
      ),
    },
    { key: "lang", header: "Lang", hideOnMobile: true, render: (r) => r.language.toUpperCase() },
    { key: "views", header: "Visits", align: "right", render: (r) => <span className="tabular-nums">{r.stats.views}</span> },
    { key: "leads", header: "Leads", align: "right", render: (r) => <span className="tabular-nums font-semibold text-[var(--a-ink)]">{r.stats.captures}</span> },
    { key: "cta", header: "CTA clicks", align: "right", render: (r) => <span className="tabular-nums">{r.stats.ctas}</span> },
    { key: "conv", header: "Conversions", align: "right", hideOnMobile: true, render: (r) => <span className="tabular-nums">{r.stats.signups + r.stats.conversions}</span> },
    { key: "rev", header: "Revenue", align: "right", hideOnMobile: true, render: (r) => <span className="tabular-nums">{money(r.stats.revenueCents)}</span> },
    {
      key: "open",
      header: <span className="sr-only">Open</span>,
      align: "right",
      hideOnMobile: true,
      render: (r) =>
        r.status === "published" ? (
          <a href={`/lp/${r.slug}`} target="_blank" rel="noopener noreferrer" aria-label={`Open ${r.title} in a new tab`} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[var(--a-ink-3)] hover:bg-[var(--a-surface-2)] hover:text-[var(--a-ink)]" onClick={(e) => e.stopPropagation()}>
            <ExternalLink size={15} aria-hidden />
          </a>
        ) : null,
    },
  ];

  return (
    <>
      <PageHeader
        title="Landing pages"
        subtitle="One page per campaign: hero, pains, benefits, proof, product facts, FAQ and a lead form. Visits, leads and the sign-ups and purchases that follow are tracked per page."
        actions={<Button variant="primary" icon={Plus} onClick={() => setOpen(true)}>New landing page</Button>}
        className="!mb-0"
      />
      <div>
        <Toolbar>
          <SearchInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search pages" label="Search pages" />
          <Segmented
            ariaLabel="Status"
            value={status}
            onChange={setStatus}
            options={[
              { value: "all", label: "All", count: pages.length },
              { value: "live", label: "Live", count: pages.filter((p) => p.status === "published").length },
              { value: "draft", label: "Drafts", count: pages.filter((p) => p.status !== "published").length },
            ]}
          />
        </Toolbar>
        <DataTable
          columns={cols}
          rows={rows}
          rowKey={(r) => r.id}
          rowHref={(r) => `/admin_pro/growth/acquire/pages/${r.id}`}
          caption="Landing pages"
          empty={
            <EmptyState
              icon={LayoutTemplate}
              title={pages.length ? "No pages match" : "No landing pages yet"}
              body={pages.length ? "Clear the search or switch the filter." : "Start from a content kit: its hero, pains and benefits become the page."}
              action={pages.length ? undefined : <Button variant="primary" icon={Plus} onClick={() => setOpen(true)}>New landing page</Button>}
            />
          }
        />
      </div>

      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title="New landing page"
        width={560}
        footer={
          <div className="flex justify-end">
            <Button variant="primary" icon={mode === "ai" ? Sparkles : Plus} onClick={create} loading={busy} disabled={busy}>
              {busy ? (mode === "ai" ? "Drafting…" : "Creating…") : mode === "ai" ? "Draft with AI" : "Create page"}
            </Button>
          </div>
        }
      >
        <div className="space-y-5 p-5">
          <div role="radiogroup" aria-label="Start from" className="space-y-2">
            {MODES.map((m) => {
              const on = m.value === mode;
              const disabled = m.value === "kit" && kits.length === 0;
              return (
                <button
                  key={m.value}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  disabled={disabled}
                  onClick={() => setMode(m.value)}
                  className={`flex w-full min-h-[44px] items-start gap-3 rounded-[var(--a-radius-control)] border p-3 text-left transition-colors disabled:opacity-50 ${on ? "border-[var(--a-blue)] bg-[var(--a-info-bg)] ring-1 ring-[var(--a-blue)]" : "border-[var(--a-border)] hover:bg-[var(--a-surface-2)]"}`}
                >
                  <m.icon size={18} className={on ? "mt-0.5 text-[var(--a-blue)]" : "mt-0.5 text-[var(--a-ink-3)]"} aria-hidden />
                  <span>
                    <span className="block font-dm text-[13.5px] font-semibold text-[var(--a-ink)]">{m.label}</span>
                    <span className="block font-dm text-[12px] text-[var(--a-ink-3)]">{disabled ? "Create a content kit first (Growth, Content kits)." : m.hint}</span>
                  </span>
                </button>
              );
            })}
          </div>
          {mode === "kit" ? (
            <div>
              <label htmlFor="lp-kit" className={labelCls}>Content kit</label>
              <Select id="lp-kit" className="w-full" value={kitId} onChange={(e) => setKitId(e.target.value)}>
                {kits.map((k) => (
                  <option key={k.id} value={k.id}>{k.label}</option>
                ))}
              </Select>
              <p className={hintCls}>The page keeps the kit&apos;s language and product. Proof points come from your brand settings only.</p>
            </div>
          ) : (
            <>
              <div>
                <label htmlFor="lp-product" className={labelCls}>Product</label>
                <Select id="lp-product" className="w-full" value={productKey} onChange={(e) => setProductKey(e.target.value)}>
                  <option value="">No product (newsletter / lead capture)</option>
                  {groups.map(([g, list]) => (
                    <optgroup key={g} label={g}>
                      {list.map((p) => (
                        <option key={p.key} value={p.key}>{p.label}</option>
                      ))}
                    </optgroup>
                  ))}
                </Select>
              </div>
              {mode === "ai" && (
                <div>
                  <label htmlFor="lp-goal" className={labelCls}>Campaign goal</label>
                  <textarea id="lp-goal" rows={2} className={textareaCls} value={goal} maxLength={400} onChange={(e) => setGoal(e.target.value)} placeholder="Example: get dental clinics in Montreal to book a free AI receptionist demo" />
                </div>
              )}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <span className={labelCls}>Language</span>
                  <Segmented ariaLabel="Language" value={language} onChange={setLanguage} options={LANG_OPTIONS} />
                </div>
                {mode === "ai" && (
                  <div>
                    <label htmlFor="lp-aud" className={labelCls}>Audience</label>
                    <Select id="lp-aud" className="w-full" value={audienceId} onChange={(e) => setAudienceId(e.target.value)}>
                      <option value="">General</option>
                      {audiences.map((a) => (
                        <option key={a.id} value={a.id}>{a.name}</option>
                      ))}
                    </Select>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </Drawer>
    </>
  );
}
