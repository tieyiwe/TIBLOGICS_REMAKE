"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { AlertTriangle, Loader2, Search, Sparkles } from "lucide-react";
import type { CatalogItem, CatalogType } from "@/lib/growth/catalog";
import { LANGUAGE_LABEL, LANGUAGES, type Language } from "@/lib/growth/content/platforms";
import { btn, Card, input, label } from "../_components/ui";

interface KitRow {
  id: string;
  slug: string;
  productKey: string;
  productType: string;
  productTitle: string;
  language: string;
  audienceId: string | null;
  createdAt: string;
  warningCount: number;
  queued: number;
}

export default function ContentClient({
  catalog, types, audiences, defaultLanguage, kits,
}: {
  catalog: CatalogItem[];
  types: Record<CatalogType, string>;
  audiences: { id: string; name: string; language: string }[];
  defaultLanguage: Language;
  kits: KitRow[];
}) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [type, setType] = useState<"" | CatalogType>("");
  const [sel, setSel] = useState<CatalogItem | null>(null);
  const [language, setLanguage] = useState<Language>(defaultLanguage);
  const [audienceId, setAudienceId] = useState(audiences.find((a) => a.language === defaultLanguage)?.id ?? audiences[0]?.id ?? "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const counts = useMemo(() => {
    const m = new Map<string, number>();
    for (const i of catalog) m.set(i.type, (m.get(i.type) ?? 0) + 1);
    return m;
  }, [catalog]);
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return catalog.filter((i) => (!type || i.type === type) && (!s || `${i.title} ${i.summary}`.toLowerCase().includes(s)));
  }, [catalog, q, type]);
  const kitsFor = (key: string) => kits.filter((k) => k.productKey === key).length;

  async function generate() {
    if (!sel) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/admin/growth/kits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productKey: sel.key, language, audienceId }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error ?? `Failed (${res.status})`);
      router.push(`/admin_pro/growth/content/${j.kit.id}`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
      <Card title="Catalog" subtitle={`${catalog.length} items, built from AI Academy tracks, the Store, Toolkit, tools, services, events, live sessions and AI Times.`}>
        <div className="flex flex-wrap gap-2 mb-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--a-ink-3)]" />
            <input aria-label="Search the catalog" className={`${input} pl-9`} placeholder="Search products…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5 mb-3">
          <button onClick={() => setType("")} className={`rounded-full px-2.5 py-1 font-dm text-xs border ${type === "" ? "bg-[var(--a-navy)] text-white border-[var(--a-navy)]" : "bg-[var(--a-surface)] text-[var(--a-ink-2)] border-[var(--a-border-strong)]"}`}>All</button>
          {(Object.keys(types) as CatalogType[]).filter((t) => counts.get(t)).map((t) => (
            <button key={t} onClick={() => setType(t)} className={`rounded-full px-2.5 py-1 font-dm text-xs border ${type === t ? "bg-[var(--a-navy)] text-white border-[var(--a-navy)]" : "bg-[var(--a-surface)] text-[var(--a-ink-2)] border-[var(--a-border-strong)]"}`}>
              {types[t]} ({counts.get(t)})
            </button>
          ))}
        </div>
        <ul className="grid gap-2 sm:grid-cols-2 max-h-[560px] overflow-y-auto pr-1">
          {list.map((i) => (
            <li key={i.key}>
              <button
                onClick={() => { setSel(i); setErr(null); }}
                data-key={i.key}
                className={`w-full text-left rounded-[12px] border p-3 transition-colors ${sel?.key === i.key ? "border-[var(--a-orange)] bg-[var(--a-orange-bg)]" : "border-[var(--a-border-strong)] bg-[var(--a-surface)] hover:bg-[var(--a-surface-2)]"}`}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="font-dm text-[11px] font-semibold uppercase tracking-wide text-[var(--a-ink-3)]">{types[i.type]}</span>
                  {kitsFor(i.key) > 0 && <span className="font-dm text-[11px] text-[var(--a-success)]">{kitsFor(i.key)} kit{kitsFor(i.key) > 1 ? "s" : ""}</span>}
                </span>
                <span className="block font-dm text-sm font-semibold text-[var(--a-ink)] mt-0.5">{i.title}</span>
                <span className="block font-dm text-xs text-[var(--a-ink-2)] line-clamp-2 mt-0.5">{i.summary}</span>
                {i.price && <span className="block font-dm text-[11px] text-[var(--a-ink-3)] mt-1">{i.price}</span>}
              </button>
            </li>
          ))}
          {list.length === 0 && <li className="font-dm text-sm text-[var(--a-ink-3)]">No matches.</li>}
        </ul>
      </Card>

      <div className="space-y-4">
        <Card title="Generate a kit">
          {!sel ? (
            <p className="font-dm text-sm text-[var(--a-ink-3)]">Choose a product from the catalog.</p>
          ) : (
            <div className="space-y-3">
              <div>
                <p className="font-dm text-xs text-[var(--a-ink-3)]">{types[sel.type]}</p>
                <p className="font-syne font-bold text-[var(--a-ink)]">{sel.title}</p>
              </div>
              <div>
                <p className={label}>Claims the kit may use (from the product data)</p>
                <ul className="list-disc pl-5 space-y-1 font-dm text-xs text-[var(--a-ink-2)] max-h-48 overflow-y-auto">
                  {sel.facts.map((f, i) => <li key={i}>{f}</li>)}
                </ul>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={label} htmlFor="k-lang">Language</label>
                  <select id="k-lang" className={input} value={language} onChange={(e) => setLanguage(e.target.value as Language)}>
                    {LANGUAGES.map((l) => <option key={l} value={l}>{LANGUAGE_LABEL[l]}</option>)}
                  </select>
                </div>
                <div>
                  <label className={label} htmlFor="k-aud">Audience</label>
                  <select id="k-aud" className={input} value={audienceId} onChange={(e) => {
                    setAudienceId(e.target.value);
                    const a = audiences.find((x) => x.id === e.target.value);
                    if (a && (LANGUAGES as readonly string[]).includes(a.language)) setLanguage(a.language as Language);
                  }}>
                    {audiences.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>
              </div>
              {err && <p role="alert" className="font-dm text-sm text-[var(--a-danger)]">{err}</p>}
              <button className={`${btn.primary} w-full`} disabled={busy} onClick={generate}>
                {busy ? <><Loader2 size={15} className="animate-spin" /> Writing the kit (up to a minute)…</> : <><Sparkles size={15} /> Generate marketing kit</>}
              </button>
            </div>
          )}
        </Card>

        <Card title="Kits" subtitle="Newest first">
          {kits.length === 0 ? (
            <p className="font-dm text-sm text-[var(--a-ink-3)]">No kits yet.</p>
          ) : (
            <ul className="divide-y divide-[var(--a-border)]">
              {kits.map((k) => (
                <li key={k.id} className="py-2">
                  <Link href={`/admin_pro/growth/content/${k.id}`} className="block group">
                    <span className="font-dm text-sm font-semibold text-[var(--a-ink)] group-hover:text-[var(--a-blue)]">{k.productTitle}</span>
                    <span className="flex flex-wrap gap-x-2 font-dm text-[11px] text-[var(--a-ink-3)]">
                      <span>{types[k.productType as CatalogType] ?? k.productType}</span>
                      <span>{k.language.toUpperCase()}</span>
                      <span>{new Date(k.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                      <span>{k.queued ? `${k.queued} queued` : "not queued"}</span>
                      {k.warningCount > 0 && <span className="inline-flex items-center gap-0.5 text-[var(--a-orange-text)]"><AlertTriangle size={11} /> {k.warningCount}</span>}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
