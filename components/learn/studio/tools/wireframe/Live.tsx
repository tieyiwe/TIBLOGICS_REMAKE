"use client";

// Wireframe Builder live panel: a clickable phone preview of the screen being
// edited (buttons, cards and tabs navigate between screens) beside the spec
// (user stories, Given/When/Then, the builder prompt), both updating as blocks
// are added. The design it gets is already debounced.

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { screenByName, type Design } from "./model";
import { buildSpec, labelOf } from "./spec";
import { Mock, Phone } from "./Mock";
import { Measure } from "../automation/kit";

type Tr = (key: string, vars?: Record<string, string | number>) => string;
const NS = "studio.wireframe-builder";

export default function WireframeLive({
  t,
  design,
  screenId,
  appFallback,
  reduce,
  tall,
}: {
  t: Tr;
  design: Design;
  /** The screen open in the editor: the preview starts there. */
  screenId: string;
  appFallback: string;
  reduce: boolean;
  tall: boolean;
}) {
  const k = (s: string, v?: Record<string, string | number>) => t(`${NS}.${s}`, v);
  const spec = useMemo(() => buildSpec(design, t, appFallback), [design, t, appFallback]);
  const [stack, setStack] = useState<string[]>([]);
  const [tab, setTab] = useState<"stories" | "criteria" | "prompt">("stories");
  const [copied, setCopied] = useState(false);

  // Follow the editor: switching screens there restarts the preview.
  useEffect(() => setStack([]), [screenId]);

  const start = design.screens.find((s) => s.id === screenId) ?? design.screens[0];
  const pvId = stack[stack.length - 1] ?? start?.id;
  const pv = design.screens.find((s) => s.id === pvId) ?? start;
  const nameOf = (id: string | null) => (id ? design.screens.find((s) => s.id === id)?.name : undefined);
  const go = (id: string) => setStack((st) => [...(st.length ? st : [start.id]), id]);
  const goTab = (name: string) => {
    const s = screenByName(design, name);
    if (s && s.id !== pv.id) go(s.id);
  };

  const copy = async (text: string) => {
    let ok = false;
    try {
      await navigator.clipboard.writeText(text);
      ok = true;
    } catch {
      try {
        const ta = document.createElement("textarea");
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        ok = document.execCommand("copy");
        ta.remove();
      } catch {
        ok = false;
      }
    }
    setCopied(ok);
    if (ok) window.setTimeout(() => setCopied(false), 2000);
  };

  if (!pv) return null;

  // Stable keys for repeated lines (two blocks with the same label).
  const keyed = <V,>(list: V[], text: (v: V) => string) => {
    const seen = new Map<string, number>();
    return list.map((v) => {
      const base = text(v);
      const n = (seen.get(base) ?? 0) + 1;
      seen.set(base, n);
      return { v, key: `${base}#${n}` };
    });
  };
  const item = (key: string, children: React.ReactNode, cls: string) => (
    <motion.li key={key} layout={!reduce} initial={reduce ? false : { opacity: 0, x: 10, boxShadow: "0 0 0 2px rgba(244,124,32,1)" }}
      animate={{ opacity: 1, x: 0, boxShadow: "0 0 0 0px rgba(244,124,32,0)" }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }} className={cls}>
      {children}
    </motion.li>
  );

  const preview = (
    <div>
      <div className="mx-auto mb-2 flex max-w-[340px] items-center justify-between gap-2">
        <button
          type="button"
          disabled={stack.length < 2}
          onClick={() => setStack((st) => st.slice(0, -1))}
          className="min-h-[36px] rounded-xl bg-[var(--s2)] px-3 text-xs font-bold text-[var(--ink)] disabled:opacity-40"
        >
          ← {k("pvBack")}
        </button>
        <span className="truncate text-sm font-bold text-[var(--ink)]" data-preview-screen={pv.name}>
          📱 {pv.name}
        </span>
      </div>
      <Phone label={k("previewLabel", { screen: pv.name })} minHeight={tall ? 520 : 400}>
        <div className="grid auto-rows-min grid-cols-2 gap-2">
          {pv.comps.map((c) => {
            const body = <Mock c={c} label={labelOf(c, t)} preview activeTab={pv.name} onTab={goTab} />;
            return c.link && c.type !== "tabs" && design.screens.some((s) => s.id === c.link) ? (
              <button
                key={c.id}
                type="button"
                onClick={() => go(c.link!)}
                className={`rounded-xl text-left transition hover:brightness-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2251A3] ${c.half ? "col-span-1" : "col-span-2"}`}
                aria-label={`${labelOf(c, t)} → ${nameOf(c.link)}`}
              >
                {body}
              </button>
            ) : (
              <div key={c.id} className={c.half ? "col-span-1" : "col-span-2"}>
                {body}
              </div>
            );
          })}
          {pv.comps.length === 0 && <p className="col-span-2 mt-16 text-center text-sm text-[var(--ink3)]">{k("emptyCanvas")}</p>}
        </div>
      </Phone>
      <p className="mt-2 text-center text-[11px] text-[var(--ink3)]">{k("previewHint")}</p>
    </div>
  );

  const specPanel = (
    <section aria-label={k("spec.title")} className="min-w-0">
      <div className="flex flex-wrap gap-1.5" role="tablist" aria-label={k("spec.title")}>
        {(["stories", "criteria", "prompt"] as const).map((x) => (
          <button
            key={x}
            type="button"
            role="tab"
            aria-selected={tab === x}
            onClick={() => setTab(x)}
            className={`min-h-[34px] rounded-xl px-2.5 text-xs font-bold ${tab === x ? "bg-[#0D1B2A] text-white" : "bg-[var(--s2)] text-[var(--ink2)]"}`}
          >
            {k(`spec.${x}`)}
            {x === "stories" ? ` (${spec.stories.length})` : x === "criteria" ? ` (${spec.criteria.length})` : ""}
          </button>
        ))}
      </div>
      <div className="mt-2" role="tabpanel">
        {tab === "prompt" ? (
          <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap break-words rounded-xl bg-[var(--s2)] p-3 text-xs leading-relaxed text-[var(--ink)]">{spec.prompt}</pre>
        ) : tab === "stories" ? (
          spec.stories.length ? (
            <ul className="space-y-1.5 text-sm text-[var(--ink)]" data-spec="stories">
              <AnimatePresence initial={false}>{keyed(spec.stories, (s) => s).map(({ v, key }) => item(key, v, "rounded-lg px-2 py-1 leading-snug"))}</AnimatePresence>
            </ul>
          ) : (
            <p className="text-sm text-[var(--ink3)]">{k("spec.emptyStories")}</p>
          )
        ) : spec.criteria.length ? (
          <ul className="space-y-2" data-spec="criteria">
            <AnimatePresence initial={false}>
              {keyed(spec.criteria, (c) => `${c.screen}|${c.given}|${c.when}|${c.then}`).map(({ v: c, key }) =>
                item(
                  key,
                  <>
                    <span className="text-[10px] font-bold uppercase tracking-wide text-[var(--ink3)]">{c.screen}</span>
                    <span className="block">
                      <b className="text-[#2251A3]">{k("spec.given")}</b> {c.given}
                    </span>
                    <span className="block">
                      <b className="text-[#C45A0A]">{k("spec.when")}</b> {c.when}
                    </span>
                    <span className="block">
                      <b className="text-emerald-700">{k("spec.then")}</b> {c.then}
                    </span>
                  </>,
                  "rounded-xl bg-[var(--s2)] p-2.5 text-sm text-[var(--ink)]",
                ),
              )}
            </AnimatePresence>
          </ul>
        ) : (
          <p className="text-sm text-[var(--ink3)]">{k("spec.emptyCriteria")}</p>
        )}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => copy(tab === "prompt" ? spec.prompt : spec.markdown)}
          className="min-h-[40px] rounded-xl bg-[#F47C20] px-4 text-sm font-bold text-white shadow-sm hover:bg-[#E05F00] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F47C20]"
        >
          📋 {tab === "prompt" ? k("spec.copyPrompt") : k("spec.copySpec")}
        </button>
        <span role="status" className="text-xs font-semibold text-emerald-700">
          {copied ? k("spec.copied") : ""}
        </span>
      </div>
      <p className="mt-2 text-[11px] text-[var(--ink3)]">{k("spec.tip")}</p>
    </section>
  );

  return (
    <Measure>
      {(w) => (
        <div className={w >= 640 ? "grid grid-cols-[minmax(260px,320px)_minmax(0,1fr)] items-start gap-4" : "space-y-5"}>
          {preview}
          {specPanel}
        </div>
      )}
    </Measure>
  );
}
