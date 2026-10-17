"use client";

import type { ReactNode } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { Button, IconButton } from "@/components/admin/ui";
import { inputCls, labelCls, textareaCls } from "./form";

// Small list editors shared by the magnet and landing page editors.

export function move<T>(list: T[], i: number, d: -1 | 1): T[] {
  const j = i + d;
  if (j < 0 || j >= list.length) return list;
  const out = list.slice();
  [out[i], out[j]] = [out[j], out[i]];
  return out;
}

export function RowTools({ i, n, onMove, onRemove, label }: { i: number; n: number; onMove: (d: -1 | 1) => void; onRemove: () => void; label: string }) {
  return (
    <div className="flex shrink-0 items-center gap-0.5">
      <IconButton icon={ArrowUp} size="sm" aria-label={`Move ${label} up`} disabled={i === 0} onClick={() => onMove(-1)} />
      <IconButton icon={ArrowDown} size="sm" aria-label={`Move ${label} down`} disabled={i === n - 1} onClick={() => onMove(1)} />
      <IconButton icon={Trash2} size="sm" aria-label={`Remove ${label}`} onClick={onRemove} />
    </div>
  );
}

/** Editable list of short strings (bullets, pains, takeaways...). */
export function StringList({
  label,
  items,
  onChange,
  placeholder,
  max = 10,
  multiline = false,
  addLabel = "Add",
  id,
}: {
  label: string;
  items: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
  max?: number;
  multiline?: boolean;
  addLabel?: string;
  id: string;
}) {
  return (
    <div>
      <p className={labelCls} id={`${id}-label`}>{label}</p>
      <ul className="space-y-2" aria-labelledby={`${id}-label`}>
        {items.map((it, i) => (
          <li key={i} className="flex items-start gap-2">
            {multiline ? (
              <textarea
                aria-label={`${label} ${i + 1}`}
                className={textareaCls}
                rows={2}
                value={it}
                placeholder={placeholder}
                onChange={(e) => onChange(items.map((x, j) => (j === i ? e.target.value : x)))}
              />
            ) : (
              <input
                aria-label={`${label} ${i + 1}`}
                className={inputCls}
                value={it}
                placeholder={placeholder}
                onChange={(e) => onChange(items.map((x, j) => (j === i ? e.target.value : x)))}
              />
            )}
            <RowTools i={i} n={items.length} label={`${label} ${i + 1}`} onMove={(d) => onChange(move(items, i, d))} onRemove={() => onChange(items.filter((_, j) => j !== i))} />
          </li>
        ))}
      </ul>
      {items.length < max && (
        <Button size="sm" variant="ghost" icon={Plus} className="mt-2" onClick={() => onChange([...items, ""])}>
          {addLabel}
        </Button>
      )}
    </div>
  );
}

export function Field({ id, label, hint, children }: { id: string; label: string; hint?: ReactNode; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className={labelCls}>
        {label}
      </label>
      {children}
      {hint ? <p className="mt-1 font-dm text-[12px] text-[var(--a-ink-3)]">{hint}</p> : null}
    </div>
  );
}

/** A bordered block inside a list (a checklist section, a question...). */
export function Block({ title, tools, children }: { title: ReactNode; tools?: ReactNode; children: ReactNode }) {
  return (
    <div className="rounded-[var(--a-radius-control)] border border-[var(--a-border)] bg-[var(--a-surface)]">
      <div className="flex items-center justify-between gap-2 border-b border-[var(--a-border)] bg-[var(--a-surface-2)] px-3 py-1.5">
        <span className="min-w-0 truncate font-dm text-[12.5px] font-semibold text-[var(--a-ink-2)]">{title}</span>
        {tools}
      </div>
      <div className="space-y-3 p-3">{children}</div>
    </div>
  );
}
