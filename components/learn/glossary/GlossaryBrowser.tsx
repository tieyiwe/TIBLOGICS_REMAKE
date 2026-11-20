"use client";

import { useEffect, useMemo, useState } from "react";

export interface BrowserTerm {
  id: string;
  term: string;
  /** The English name, also searchable from any language. */
  en: string;
  def: string;
  category: string;
  related: Array<{ id: string; term: string }>;
}

/** Search, category filter and A to Z list for the glossary page. A #term-id link opens on that term. */
export default function GlossaryBrowser({
  terms,
  categories,
  labels,
  locale,
}: {
  terms: BrowserTerm[];
  categories: Array<{ id: string; label: string }>;
  labels: { search: string; all: string; related: string; none: string; count: string };
  locale: string;
}) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string | null>(null);
  const [focus, setFocus] = useState<string | null>(null);

  // Arriving from a lesson pop-up (#term-id): show and highlight that term.
  useEffect(() => {
    const go = () => {
      const id = decodeURIComponent(window.location.hash.slice(1));
      if (!id || !terms.some((x) => x.id === id)) return;
      setQ("");
      setCat(null);
      setFocus(id);
      requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ block: "center" }));
    };
    go();
    window.addEventListener("hashchange", go);
    return () => window.removeEventListener("hashchange", go);
  }, [terms]);

  const norm = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
  const shown = useMemo(() => {
    const n = norm(q.trim());
    return terms.filter((x) => (!cat || x.category === cat) && (!n || norm(`${x.term} ${x.en} ${x.def}`).includes(n)));
  }, [terms, q, cat]);
  const groups = useMemo(() => {
    const m = new Map<string, BrowserTerm[]>();
    for (const x of shown) {
      const L = norm(x.term[0] ?? "#").toUpperCase();
      const k = /[A-Z]/.test(L) ? L : "#";
      m.set(k, [...(m.get(k) ?? []), x]);
    }
    return [...m.entries()].sort(([a], [b]) => a.localeCompare(b, locale));
  }, [shown, locale]);
  const chip = (on: boolean) =>
    `rounded-full border px-3 py-1.5 text-xs font-bold transition-colors ${on ? "border-[#0D1B2A] bg-[#0D1B2A] text-white" : "border-[#D2DCE8] bg-white text-[#3A4A5C] hover:border-[#0D1B2A]"}`;

  return (
    <div>
      <div className="sticky top-16 z-10 -mx-4 bg-[var(--s2,#F4F7FB)]/95 px-4 py-3 backdrop-blur">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={labels.search}
          aria-label={labels.search}
          className="w-full rounded-xl border border-[#D2DCE8] bg-white px-4 py-3 text-[15px] text-[#0D1B2A] outline-none focus:border-[#F47C20]"
          data-testid="glossary-search"
        />
        <div className="mt-3 flex flex-wrap gap-2" role="group">
          <button type="button" className={chip(cat === null)} aria-pressed={cat === null} onClick={() => setCat(null)}>{labels.all}</button>
          {categories.map((c) => (
            <button key={c.id} type="button" className={chip(cat === c.id)} aria-pressed={cat === c.id} onClick={() => setCat(cat === c.id ? null : c.id)}>
              {c.label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-[#5A6E84]" aria-live="polite">{labels.count.replace("{n}", String(shown.length))}</p>
      </div>

      {groups.length === 0 && <p className="mt-6 rounded-xl bg-white p-6 text-sm text-[#3A4A5C]">{labels.none}</p>}
      {groups.map(([letter, list]) => (
        <section key={letter} className="mt-6" aria-labelledby={`letter-${letter}`}>
          <h2 id={`letter-${letter}`} className="font-syne text-lg font-black text-[#F47C20]">{letter}</h2>
          <dl className="mt-2 grid gap-3 sm:grid-cols-2">
            {list.map((x) => (
              <div
                key={x.id}
                id={x.id}
                className={`scroll-mt-48 rounded-2xl border bg-white p-4 ${focus === x.id ? "border-[#F47C20] ring-2 ring-[#F47C20]/30" : "border-[#D2DCE8]"}`}
              >
                <dt className="text-[15px] font-black text-[#0D1B2A]">
                  {x.term}
                  {x.en !== x.term && <span className="ml-2 text-xs font-semibold text-[#5A6E84]">({x.en})</span>}
                </dt>
                <dd className="mt-1 text-sm leading-relaxed text-[#3A4A5C]">{x.def}</dd>
                {x.related.length > 0 && (
                  <dd className="mt-2 text-xs text-[#5A6E84]">
                    {labels.related}{" "}
                    {x.related.map((r, i) => (
                      <span key={r.id}>
                        {i > 0 && ", "}
                        <a href={`#${r.id}`} className="font-semibold text-[#2251A3] underline underline-offset-2">{r.term}</a>
                      </span>
                    ))}
                  </dd>
                )}
              </div>
            ))}
          </dl>
        </section>
      ))}
    </div>
  );
}
