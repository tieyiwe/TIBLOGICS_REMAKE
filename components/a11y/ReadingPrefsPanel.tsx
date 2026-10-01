"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useT } from "@/lib/i18n/client";
import { useFocusTrap } from "@/lib/a11y/useFocusTrap";
import {
  DEFAULT_PREFS,
  FONT_OPTIONS,
  LETTER_OPTIONS,
  LINE_OPTIONS,
  SIZE_OPTIONS,
  applyPrefs,
  loadPrefs,
  savePrefs,
  type ReadingPrefs,
} from "@/lib/a11y/reading-prefs";

/**
 * "Aa" button and the reading preferences dialog. Each change applies at
 * once (data-rp-* on <html>) and is saved in this browser.
 */
export default function ReadingPrefsPanel({ className = "" }: { className?: string }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [prefs, setPrefs] = useState<ReadingPrefs>(DEFAULT_PREFS);
  const [saved, setSaved] = useState(false);
  const dialog = useRef<HTMLDivElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const descId = useId();

  useFocusTrap(dialog, open, { initialFocus: closeBtn });

  useEffect(() => {
    if (open) setPrefs(loadPrefs());
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  function update(patch: Partial<ReadingPrefs>) {
    const next = { ...prefs, ...patch };
    setPrefs(next);
    applyPrefs(next);
    setSaved(savePrefs(next));
  }

  const radios = <K extends "font" | "size" | "line" | "letter">(
    key: K,
    options: readonly ReadingPrefs[K][],
    legend: string,
    labelKey: string,
  ) => (
    <fieldset className="py-3">
      <legend className="text-sm font-bold text-[var(--ink)]">{legend}</legend>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((o) => {
          const checked = prefs[key] === o;
          return (
            <label
              key={o}
              className={`inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm ${
                checked
                  ? "border-[var(--blue)] bg-[var(--blue-light)] font-semibold text-[var(--ink)]"
                  : "border-[var(--border)] bg-white text-[var(--ink2)] hover:border-[var(--ink3)]"
              }`}
            >
              <input
                type="radio"
                name={`rp-${key}`}
                value={o}
                checked={checked}
                onChange={() => update({ [key]: o } as Partial<ReadingPrefs>)}
                className="h-4 w-4 accent-[var(--blue)]"
              />
              {t(`${labelKey}.${o}`)}
            </label>
          );
        })}
      </div>
    </fieldset>
  );

  const toggle = (key: "motion" | "contrast" | "focus", title: string, desc: string) => {
    const id = `rp-${key}`;
    return (
      <div className="flex items-start justify-between gap-4 py-3">
        <div className="min-w-0">
          <span id={`${id}-label`} className="block text-sm font-bold text-[var(--ink)]">
            {title}
          </span>
          <span id={`${id}-desc`} className="mt-0.5 block text-xs leading-relaxed text-[var(--ink2)]">
            {desc}
          </span>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={prefs[key]}
          aria-labelledby={`${id}-label`}
          aria-describedby={`${id}-desc`}
          onClick={() => update({ [key]: !prefs[key] } as Partial<ReadingPrefs>)}
          className={`relative mt-0.5 inline-flex h-7 w-12 shrink-0 items-center rounded-full border-2 transition-colors ${
            prefs[key] ? "border-[var(--blue)] bg-[var(--blue)]" : "border-[#5A6E84] bg-white"
          }`}
        >
          <span
            aria-hidden="true"
            className={`absolute h-5 w-5 rounded-full shadow transition-transform ${
              prefs[key] ? "translate-x-[22px] bg-white" : "translate-x-[2px] bg-[#5A6E84]"
            }`}
          />
        </button>
      </div>
    );
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        title={t("a11y.prefs.open")}
        className={`inline-flex h-11 min-w-[44px] items-center justify-center gap-1.5 rounded-full border border-[var(--border)] bg-white px-3 text-sm font-bold text-[var(--ink)] hover:border-[var(--ink3)] ${className}`}
      >
        <span aria-hidden="true" className="font-serif text-base leading-none">
          Aa
        </span>
        <span className="sr-only">{t("a11y.prefs.open")}</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-[90] flex justify-end bg-[rgba(13,27,42,0.45)]" onClick={() => setOpen(false)}>
          <div
            ref={dialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descId}
            onClick={(e) => e.stopPropagation()}
            className="flex h-full w-full max-w-md flex-col overflow-y-auto bg-white shadow-2xl"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-[var(--border)] bg-white px-5 py-4">
              <h2 id={titleId} className="text-lg font-black text-[var(--ink)]">
                {t("a11y.prefs.title")}
              </h2>
              <button
                ref={closeBtn}
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex min-h-[44px] items-center rounded-full border border-[var(--border)] px-4 text-sm font-semibold text-[var(--ink2)] hover:border-[var(--ink3)]"
              >
                {t("a11y.prefs.close")}
              </button>
            </div>

            <div className="px-5 pb-6">
              <p id={descId} className="mt-4 text-sm leading-relaxed text-[var(--ink2)]">
                {t("a11y.prefs.intro")}
              </p>

              <p className="rp-sample mt-4 rounded-xl border border-[var(--border)] bg-[var(--s2)] p-4 text-[var(--ink)]">
                {t("a11y.prefs.sample")}
              </p>

              <div className="mt-2 divide-y divide-[var(--border)]">
                {radios("font", FONT_OPTIONS, t("a11y.prefs.font"), "a11y.prefs.font")}
                {radios("size", SIZE_OPTIONS, t("a11y.prefs.size"), "a11y.prefs.size")}
                {radios("line", LINE_OPTIONS, t("a11y.prefs.line"), "a11y.prefs.line")}
                {radios("letter", LETTER_OPTIONS, t("a11y.prefs.letter"), "a11y.prefs.letter")}
                {toggle("contrast", t("a11y.prefs.contrast"), t("a11y.prefs.contrastDesc"))}
                {toggle("motion", t("a11y.prefs.motion"), t("a11y.prefs.motionDesc"))}
                {toggle("focus", t("a11y.prefs.focus"), t("a11y.prefs.focusDesc"))}
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => update(DEFAULT_PREFS)}
                  className="inline-flex min-h-[44px] items-center rounded-full border border-[var(--border)] px-4 text-sm font-semibold text-[var(--ink2)] hover:border-[var(--ink3)]"
                >
                  {t("a11y.prefs.reset")}
                </button>
                <p role="status" className="text-xs font-semibold text-green-800">
                  {saved ? t("a11y.prefs.saved") : ""}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
