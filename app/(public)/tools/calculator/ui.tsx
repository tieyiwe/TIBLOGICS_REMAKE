"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Info } from "lucide-react";
import { useT } from "@/lib/i18n/client";

// Small building blocks shared by the calculator sections.

export const inputCls =
  "w-full px-3 py-2 border border-[#D2DCE8] rounded-xl text-sm font-dm text-[#0D1B2A] bg-white focus:outline-none focus:ring-2 focus:ring-[#2251A3]/25 focus:border-[#2251A3] disabled:bg-[#F4F7FB] disabled:text-[#7A8FA6]";
export const labelCls = "font-dm text-[13px] font-semibold text-[#3A4A5C]";

export function Section({
  id,
  step,
  title,
  subtitle,
  children,
  footer,
}: {
  id: string;
  step: number;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="calc-card bg-white border border-[#D2DCE8] rounded-2xl scroll-mt-28">
      <div className="p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span
            aria-hidden
            className="shrink-0 w-8 h-8 rounded-full bg-[#1B3A6B] text-white font-syne font-bold text-sm flex items-center justify-center"
          >
            {step}
          </span>
          <div className="min-w-0">
            <h2 id={`${id}-title`} className="font-syne font-bold text-lg sm:text-xl text-[#0D1B2A] leading-tight">
              {title}
            </h2>
            {subtitle && <p className="font-dm text-sm text-[#7A8FA6] mt-1">{subtitle}</p>}
          </div>
        </div>
        <div className="mt-5">{children}</div>
      </div>
      {footer && <div className="border-t border-[#E4EAF2] bg-[#F9FBFD] rounded-b-2xl px-5 sm:px-6 py-3">{footer}</div>}
    </section>
  );
}

export function SubHeading({ children }: { children: React.ReactNode }) {
  return <h3 className="font-syne font-bold text-sm text-[#1B3A6B] mt-6 mb-3 first:mt-0">{children}</h3>;
}

/** An (i) button that reveals a short explanation. Works with mouse, touch and keyboard. */
export function InfoTip({ text, label }: { text: string; label?: string }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const id = useId();
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);
  return (
    <span ref={ref} className="relative inline-flex align-middle no-print">
      <button
        type="button"
        aria-label={label ? t("calculator.ui.whatIs", { label }) : t("calculator.ui.moreInfo")}
        aria-expanded={open}
        aria-describedby={open ? id : undefined}
        onClick={() => setOpen((o) => !o)}
        className="ml-1 w-5 h-5 inline-flex items-center justify-center rounded-full text-[#7A8FA6] hover:text-[#2251A3] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2251A3]"
      >
        <Info size={14} aria-hidden />
      </button>
      {open && (
        <span
          id={id}
          role="tooltip"
          className="absolute z-30 left-1/2 -translate-x-1/2 top-6 w-64 max-w-[80vw] rounded-xl bg-[#0D1B2A] text-white text-xs font-dm font-normal leading-relaxed p-3 shadow-lg"
        >
          {text}
        </span>
      )}
    </span>
  );
}

function roundTo(n: number, step: number): number {
  if (step >= 1) return Math.round(n);
  const d = Math.max(0, Math.ceil(-Math.log10(step)));
  return Number(n.toFixed(d));
}

/** A number input that lets people type freely and commits valid numbers. */
export function NumberInput({
  value,
  onChange,
  min = 0,
  max,
  step = 1,
  id,
  ariaLabel,
  prefix,
  suffix,
  className = "",
  disabled,
}: {
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  step?: number;
  id?: string;
  ariaLabel?: string;
  prefix?: string;
  suffix?: string;
  className?: string;
  disabled?: boolean;
}) {
  const [text, setText] = useState(String(value));
  const focused = useRef(false);
  useEffect(() => {
    if (!focused.current) setText(String(roundTo(value, step)));
  }, [value, step]);
  const commit = (s: string) => {
    const n = Number(s.replace(",", "."));
    if (s.trim() === "" || !Number.isFinite(n)) return;
    let v = Math.max(min, n);
    if (max !== undefined) v = Math.min(max, v);
    onChange(v);
  };
  return (
    <div className={`relative flex items-center ${className}`}>
      {prefix && <span className="absolute left-3 text-sm font-dm text-[#7A8FA6] pointer-events-none">{prefix}</span>}
      <input
        id={id}
        type="number"
        inputMode="decimal"
        aria-label={ariaLabel}
        value={text}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        onFocus={() => (focused.current = true)}
        onBlur={() => {
          focused.current = false;
          setText(String(roundTo(value, step)));
        }}
        onChange={(e) => {
          setText(e.target.value);
          commit(e.target.value);
        }}
        className={`${inputCls} ${prefix ? "pl-7" : ""} ${suffix ? "pr-14" : ""} tabular-nums`}
      />
      {suffix && (
        <span className="absolute right-3 text-xs font-dm text-[#7A8FA6] pointer-events-none whitespace-nowrap">{suffix}</span>
      )}
    </div>
  );
}

export function Field({
  label,
  tip,
  hint,
  children,
  htmlFor,
}: {
  label: string;
  tip?: string;
  hint?: React.ReactNode;
  children: React.ReactNode;
  htmlFor?: string;
}) {
  return (
    <div>
      <div className="flex items-center mb-1.5 min-h-[20px]">
        <label htmlFor={htmlFor} className={labelCls}>
          {label}
        </label>
        {tip && <InfoTip text={tip} label={label} />}
      </div>
      {children}
      {hint && <p className="font-dm text-xs text-[#7A8FA6] mt-1">{hint}</p>}
    </div>
  );
}

/** Label + number input in one. */
export function NumField(props: {
  label: string;
  tip?: string;
  hint?: React.ReactNode;
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  step?: number;
  prefix?: string;
  suffix?: string;
  disabled?: boolean;
}) {
  const id = useId();
  const { label, tip, hint, ...rest } = props;
  return (
    <Field label={label} tip={tip} hint={hint} htmlFor={id}>
      <NumberInput id={id} {...rest} />
    </Field>
  );
}

/** A slider with a number box beside it. */
export function SliderField({
  label,
  tip,
  hint,
  value,
  onChange,
  min,
  max,
  step = 1,
  suffix = "%",
}: {
  label: string;
  tip?: string;
  hint?: React.ReactNode;
  value: number;
  onChange: (n: number) => void;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
}) {
  const id = useId();
  return (
    <Field label={label} tip={tip} hint={hint} htmlFor={id}>
      <div className="flex items-center gap-3">
        <input
          type="range"
          aria-label={label}
          min={min}
          max={max}
          step={step}
          value={Math.min(Math.max(value, min), max)}
          onChange={(e) => onChange(Number(e.target.value))}
          className="flex-1 min-w-0 accent-[#B8500A] h-8 no-print"
        />
        <NumberInput id={id} value={value} onChange={onChange} min={min} max={max} step={step} suffix={suffix} className="w-[104px] shrink-0" />
      </div>
    </Field>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}) {
  const id = useId();
  return (
    <label
      htmlFor={id}
      className={`flex items-start gap-3 rounded-xl border p-3 cursor-pointer transition-colors ${
        checked ? "border-[#2251A3] bg-[#EEF3FB]" : "border-[#D2DCE8] bg-white hover:border-[#9FB3CE]"
      }`}
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 w-4 h-4 accent-[#1B3A6B] shrink-0"
      />
      <span className="min-w-0">
        <span className="block font-dm text-sm font-semibold text-[#0D1B2A]">{label}</span>
        {description && <span className="block font-dm text-xs text-[#7A8FA6] mt-0.5 leading-snug">{description}</span>}
      </span>
    </label>
  );
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  ariaLabel,
  className = "",
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; sub?: string }[];
  ariaLabel: string;
  className?: string;
}) {
  return (
    <div role="radiogroup" aria-label={ariaLabel} className={`grid gap-2 ${className}`}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={`text-left rounded-xl border px-3 py-2.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2251A3] ${
              active ? "bg-[#1B3A6B] border-[#1B3A6B] text-white" : "bg-white border-[#D2DCE8] text-[#3A4A5C] hover:border-[#2251A3]"
            }`}
          >
            <span className="block font-dm text-sm font-semibold">{o.label}</span>
            {o.sub && <span className={`block font-dm text-xs mt-0.5 ${active ? "text-white/75" : "text-[#7A8FA6]"}`}>{o.sub}</span>}
          </button>
        );
      })}
    </div>
  );
}

export function Stat({
  label,
  value,
  sub,
  tone = "default",
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "default" | "good" | "bad" | "warn";
}) {
  const color = { default: "text-[#0D1B2A]", good: "text-[#166534]", bad: "text-[#B42318]", warn: "text-[#9A4A00]" }[tone];
  return (
    <div className="rounded-xl bg-[#F4F7FB] p-3.5 min-w-0">
      <p className="font-dm text-xs text-[#5B6B7F] leading-snug">{label}</p>
      <p className={`font-syne font-bold text-lg sm:text-xl mt-1 tabular-nums break-words ${color}`}>{value}</p>
      {sub && <p className="font-dm text-xs text-[#7A8FA6] mt-0.5 leading-snug">{sub}</p>}
    </div>
  );
}

export function Row({ label, value, strong, muted }: { label: string; value: string; strong?: boolean; muted?: boolean }) {
  return (
    <div className={`flex items-baseline justify-between gap-3 font-dm text-sm ${strong ? "font-bold text-[#0D1B2A]" : muted ? "text-[#7A8FA6]" : "text-[#3A4A5C]"}`}>
      <span className="min-w-0">{label}</span>
      <span className="tabular-nums shrink-0 whitespace-nowrap">{value}</span>
    </div>
  );
}

export function PlaceholderNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-dm text-xs text-[#7A5A00] bg-[#FFF7E6] border border-[#F5D9A8] rounded-lg px-3 py-2 leading-relaxed">{children}</p>
  );
}
