"use client";

// Generic, schema-free editor for the training landing-page content tree.
// Renders a labeled input for every string/number, and add/remove list editors
// for arrays — so an admin can edit ANY text on the event page. Styling and
// layout of the public page never change; only the copy does.

import { useState } from "react";
import { Plus, Trash2, ChevronDown, ChevronRight } from "lucide-react";

type Json = string | number | boolean | Json[] | { [k: string]: Json };

function humanize(key: string) {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/[_-]/g, " ")
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}

function cloneTemplate(v: Json): Json {
  if (Array.isArray(v)) return v.length ? [cloneTemplate(v[0])] : [];
  if (v && typeof v === "object") {
    const out: { [k: string]: Json } = {};
    for (const k of Object.keys(v)) out[k] = cloneTemplate(v[k]);
    return out;
  }
  if (typeof v === "number") return 0;
  if (typeof v === "boolean") return false;
  // keep short style hints (hex colors) so new cards inherit a sensible default
  if (typeof v === "string" && /^#([0-9a-f]{3,8})$/i.test(v)) return v;
  return "";
}

function ScalarField({ label, value, onChange }: { label: string; value: string | number; onChange: (v: string | number) => void }) {
  const isNumber = typeof value === "number";
  const str = String(value);
  const long = !isNumber && (str.length > 48 || str.includes("\n"));
  return (
    <label className="block">
      <span className="block font-dm text-xs font-semibold text-[#3A4A5C] mb-1">{label}</span>
      {long ? (
        <textarea
          value={str}
          onChange={(e) => onChange(e.target.value)}
          rows={Math.min(6, Math.max(2, Math.ceil(str.length / 60)))}
          className="w-full border border-[#D2DCE8] rounded-lg px-3 py-2 font-dm text-sm text-[#0D1B2A] focus:outline-none focus:ring-2 focus:ring-[#2251A3]/30 focus:border-[#2251A3] resize-y"
        />
      ) : (
        <input
          type={isNumber ? "number" : "text"}
          value={str}
          onChange={(e) => onChange(isNumber ? Number(e.target.value) : e.target.value)}
          className="w-full border border-[#D2DCE8] rounded-lg px-3 py-2 font-dm text-sm text-[#0D1B2A] focus:outline-none focus:ring-2 focus:ring-[#2251A3]/30 focus:border-[#2251A3]"
        />
      )}
    </label>
  );
}

function Node({ label, value, onChange, depth }: { label: string; value: Json; onChange: (v: Json) => void; depth: number }) {
  const [open, setOpen] = useState(depth < 1);

  // Scalars
  if (typeof value === "string" || typeof value === "number") {
    return <ScalarField label={label} value={value} onChange={onChange as (v: string | number) => void} />;
  }
  if (typeof value === "boolean") {
    return (
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} className="w-4 h-4 rounded border-[#D2DCE8]" />
        <span className="font-dm text-sm text-[#3A4A5C]">{label}</span>
      </label>
    );
  }

  // Arrays
  if (Array.isArray(value)) {
    return (
      <div className="border border-[#E2E8F0] rounded-xl overflow-hidden">
        <button type="button" onClick={() => setOpen((o) => !o)}
          className="w-full flex items-center justify-between px-3 py-2 bg-[#F4F7FB] hover:bg-[#EBF0FA] transition-colors">
          <span className="font-dm text-sm font-semibold text-[#1B3A6B] flex items-center gap-1.5">
            {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}{label}
            <span className="text-[#7A8FA6] font-normal">({value.length})</span>
          </span>
        </button>
        {open && (
          <div className="p-3 flex flex-col gap-3">
            {value.map((item, i) => (
              <div key={i} className="relative border border-[#E2E8F0] rounded-lg p-3 pt-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-dm text-[11px] font-semibold uppercase tracking-wider text-[#7A8FA6]">{humanize(label.replace(/s$/, ""))} {i + 1}</span>
                  <button type="button" aria-label="Remove" onClick={() => onChange(value.filter((_, j) => j !== i))}
                    className="p-1 rounded text-[#7A8FA6] hover:text-red-600 hover:bg-red-50 transition-colors">
                    <Trash2 size={13} />
                  </button>
                </div>
                <Node label={`Item ${i + 1}`} value={item} depth={depth + 1}
                  onChange={(nv) => onChange(value.map((v, j) => (j === i ? nv : v)))} />
              </div>
            ))}
            <button type="button"
              onClick={() => onChange([...value, value.length ? cloneTemplate(value[0]) : ""])}
              className="inline-flex items-center gap-1.5 self-start text-xs font-dm font-semibold px-3 py-1.5 rounded-lg border border-dashed border-[#2251A3]/40 text-[#2251A3] hover:bg-[#EBF0FA] transition-colors">
              <Plus size={12} /> Add {humanize(label.replace(/s$/, ""))}
            </button>
          </div>
        )}
      </div>
    );
  }

  // Objects
  const obj = value as { [k: string]: Json };
  const keys = Object.keys(obj);
  // A "leaf object" (only scalar values) renders inline without a collapse header.
  const allScalar = keys.every((k) => typeof obj[k] === "string" || typeof obj[k] === "number" || typeof obj[k] === "boolean");

  const body = (
    <div className="flex flex-col gap-3">
      {keys.map((k) => (
        <Node key={k} label={humanize(k)} value={obj[k]} depth={depth + 1}
          onChange={(nv) => onChange({ ...obj, [k]: nv })} />
      ))}
    </div>
  );

  if (allScalar && depth > 0) return body;

  return (
    <div className="border border-[#E2E8F0] rounded-xl overflow-hidden">
      <button type="button" onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-1.5 px-3 py-2 bg-[#F4F7FB] hover:bg-[#EBF0FA] transition-colors">
        {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        <span className="font-dm text-sm font-semibold text-[#1B3A6B]">{label}</span>
      </button>
      {open && <div className="p-3">{body}</div>}
    </div>
  );
}

export default function ContentEditor({ value, onChange }: { value: Record<string, Json>; onChange: (v: Record<string, Json>) => void }) {
  return (
    <div className="flex flex-col gap-3">
      {Object.keys(value).map((k) => (
        <Node key={k} label={humanize(k)} value={value[k]} depth={0}
          onChange={(nv) => onChange({ ...value, [k]: nv })} />
      ))}
    </div>
  );
}
