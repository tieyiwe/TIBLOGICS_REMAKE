"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Download, ImagePlus, Trash2, Wand2 } from "lucide-react";
import { Button, Segmented } from "@/components/admin/ui";
import {
  CARD_FORMATS, CARD_TEMPLATES, CARD_THEMES, slideCount, specQuery, suggestCard, TEMPLATE_LABEL,
  type CardContext, type CardFormat, type CardSpec, type CardTemplate, type CardTheme,
} from "@/lib/growth/cards/spec";
import { input, label } from "./ui";

/** The preview URL for a spec (debounced by the caller). */
export function cardUrl(spec: CardSpec, slide = 0, download = false): string {
  return `/api/admin/growth/cards?${specQuery(spec, slide)}${download ? "&download=1" : ""}`;
}

function useDebounced<T>(v: T, ms = 450): T {
  const [d, setD] = useState(v);
  useEffect(() => {
    const t = setTimeout(() => setD(v), ms);
    return () => clearTimeout(t);
  }, [v, ms]);
  return d;
}

const THEME_SWATCH: Record<CardTheme, string> = { navy: "bg-[#132C52]", light: "bg-[#F1F4F9] ring-1 ring-[var(--a-border-strong)]", orange: "bg-[#F47C20]" };

/**
 * Image card editor: pick a template, format and theme; the copy starts
 * from the post (no model call) and stays editable; preview and download.
 */
export default function CardStudio({
  text,
  spec,
  onChange,
  ctx,
  compact,
}: {
  text: string;
  spec: CardSpec | null;
  onChange: (s: CardSpec | null) => void;
  ctx?: CardContext;
  compact?: boolean;
}) {
  const [slide, setSlide] = useState(0);
  const debounced = useDebounced(spec);
  const total = spec ? slideCount(spec) : 0;
  useEffect(() => {
    if (slide >= total) setSlide(Math.max(0, total - 1));
  }, [slide, total]);

  if (!spec) {
    return (
      <div className="rounded-[var(--a-radius-control)] border border-dashed border-[var(--a-border-strong)] p-3">
        <p className="mb-2 font-dm text-[12.5px] text-[var(--a-ink-3)]">Add an on-brand image card. Posts with an image get more reach, and LinkedIn and Facebook publish it automatically.</p>
        <div className="flex flex-wrap gap-1.5">
          {CARD_TEMPLATES.map((t) => (
            <Button key={t} size="sm" icon={ImagePlus} onClick={() => onChange(suggestCard(text, t, ctx))}>
              {TEMPLATE_LABEL[t]}
            </Button>
          ))}
        </div>
      </div>
    );
  }

  const set = (patch: Partial<CardSpec>) => onChange({ ...spec, ...patch });
  const fmt = CARD_FORMATS[spec.format];
  return (
    <div className={`grid gap-3 ${compact ? "" : "md:grid-cols-[minmax(0,1fr)_220px]"}`}>
      <div className="space-y-2.5 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <Segmented
            size="sm"
            ariaLabel="Card template"
            value={spec.template}
            onChange={(v) => onChange({ ...suggestCard(text, v as CardTemplate, ctx, spec.format), theme: spec.theme })}
            options={CARD_TEMPLATES.map((t) => ({ value: t, label: TEMPLATE_LABEL[t] }))}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Segmented
            size="sm"
            ariaLabel="Card format"
            value={spec.format}
            onChange={(v) => set({ format: v as CardFormat })}
            options={(Object.keys(CARD_FORMATS) as CardFormat[]).map((f) => ({ value: f, label: f === "square" ? "1:1" : f === "portrait" ? "4:5" : "1.91:1" }))}
          />
          <span className="flex items-center gap-1.5" role="radiogroup" aria-label="Card theme">
            {CARD_THEMES.map((t) => (
              <button
                key={t}
                type="button"
                role="radio"
                aria-checked={spec.theme === t}
                aria-label={`${t} theme`}
                onClick={() => set({ theme: t })}
                className={`h-6 w-6 rounded-full ${THEME_SWATCH[t]} ${spec.theme === t ? "outline outline-2 outline-offset-2 outline-[var(--a-blue)]" : ""}`}
              />
            ))}
          </span>
          <button type="button" className="ml-auto inline-flex items-center gap-1 font-dm text-[12px] font-semibold text-[var(--a-blue)] hover:underline" onClick={() => onChange({ ...suggestCard(text, spec.template, ctx, spec.format), theme: spec.theme })}>
            <Wand2 size={13} aria-hidden /> Refill from post
          </button>
        </div>
        {spec.template === "carousel" ? (
          <div className="space-y-2">
            {spec.slides.map((s, i) => (
              <div key={i} className="grid gap-1.5 sm:grid-cols-[28px_minmax(0,1fr)]">
                <span className="pt-2 font-dm text-[11px] font-bold text-[var(--a-ink-3)]">{i + 1}</span>
                <div className="space-y-1">
                  <input aria-label={`Slide ${i + 1} title`} className={input} value={s.title} onFocus={() => setSlide(i)} onChange={(e) => set({ slides: spec.slides.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)) })} />
                  <input aria-label={`Slide ${i + 1} text`} className={input} value={s.body} onFocus={() => setSlide(i)} onChange={(e) => set({ slides: spec.slides.map((x, j) => (j === i ? { ...x, body: e.target.value } : x)) })} />
                </div>
              </div>
            ))}
            <div className="flex gap-2">
              {spec.slides.length < 8 && <Button size="sm" onClick={() => set({ slides: [...spec.slides.slice(0, -1), { title: "", body: "" }, ...spec.slides.slice(-1)] })}>Add slide</Button>}
              {spec.slides.length > 2 && <Button size="sm" variant="ghost" onClick={() => set({ slides: spec.slides.filter((_, j) => j !== slide) })}>Remove slide {slide + 1}</Button>}
            </div>
          </div>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {spec.template === "stat" && (
              <div>
                <label className={label} htmlFor="card-stat">Figure (from a proof point)</label>
                <input id="card-stat" className={input} value={spec.stat} onChange={(e) => set({ stat: e.target.value })} placeholder="200+" />
              </div>
            )}
            <div className={spec.template === "stat" ? "" : "sm:col-span-2"}>
              <label className={label} htmlFor="card-head">{spec.template === "spotlight" ? "Product name" : spec.template === "stat" ? "What it means" : "Quote"}</label>
              <textarea id="card-head" rows={2} className={input} value={spec.headline} onChange={(e) => set({ headline: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <label className={label} htmlFor="card-sub">Supporting line</label>
              <input id="card-sub" className={input} value={spec.sub} onChange={(e) => set({ sub: e.target.value })} />
            </div>
            {spec.template === "spotlight" && (
              <div className="sm:col-span-2">
                <label className={label} htmlFor="card-bul">Benefits (one per line)</label>
                <textarea id="card-bul" rows={3} className={input} value={spec.bullets.join("\n")} onChange={(e) => set({ bullets: e.target.value.split("\n").slice(0, 4) })} />
              </div>
            )}
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="ghost" icon={Trash2} onClick={() => onChange(null)}>Remove image</Button>
        </div>
      </div>
      <div className="space-y-2">
        <div className="overflow-hidden rounded-[var(--a-radius-control)] border border-[var(--a-border)] bg-[var(--a-surface-2)]" style={{ aspectRatio: `${fmt.width} / ${fmt.height}` }}>
          {debounced && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cardUrl(debounced, Math.min(slide, slideCount(debounced) - 1))} alt={`${TEMPLATE_LABEL[spec.template]} card preview`} className="h-full w-full object-cover" data-testid="card-preview" />
          )}
        </div>
        <div className="flex items-center justify-between gap-2">
          {total > 1 ? (
            <span className="flex items-center gap-1">
              <button type="button" aria-label="Previous slide" className="rounded p-1 hover:bg-[var(--a-surface-2)] disabled:opacity-40" disabled={slide === 0} onClick={() => setSlide(slide - 1)}><ChevronLeft size={16} /></button>
              <span className="font-dm text-[12px] tabular-nums text-[var(--a-ink-3)]">{slide + 1}/{total}</span>
              <button type="button" aria-label="Next slide" className="rounded p-1 hover:bg-[var(--a-surface-2)] disabled:opacity-40" disabled={slide >= total - 1} onClick={() => setSlide(slide + 1)}><ChevronRight size={16} /></button>
            </span>
          ) : (
            <span className="font-dm text-[11.5px] text-[var(--a-ink-3)]">{fmt.label}</span>
          )}
          <a href={cardUrl(spec, slide, true)} download className="inline-flex items-center gap-1 font-dm text-[12px] font-semibold text-[var(--a-blue)] hover:underline">
            <Download size={13} aria-hidden /> PNG
          </a>
        </div>
      </div>
    </div>
  );
}
