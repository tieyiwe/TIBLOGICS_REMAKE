"use client";

import { useState } from "react";
import { AlertTriangle, Check, Copy, Globe2, Languages, MapPin, Minimize2, Plus, RefreshCw, Shuffle, X, Zap } from "lucide-react";
import { Badge, Button, useToast } from "@/components/admin/ui";
import type { RewriteKind, RewriteOp } from "@/lib/growth/content/rewrite";

// Per-item AI actions for the kit editor (Haiku via /kits/[id]/rewrite).
// Results come back as suggestions with their own claim-check warnings; the
// owner replaces the item, adds a variant as a new post, or dismisses.

export interface Suggestion<T> {
  op: RewriteOp;
  items: T[];
  warnings: string[][];
  language: string;
}

const OPS: { op: RewriteOp; label: string; icon: typeof Zap; title: string }[] = [
  { op: "regenerate", label: "Regenerate", icon: RefreshCw, title: "A fresh version with a new angle" },
  { op: "shorter", label: "Shorter", icon: Minimize2, title: "About 40% shorter" },
  { op: "punchier", label: "Punchier", icon: Zap, title: "Stronger hook, tighter sentences" },
  { op: "local-africa", label: "Africa", icon: MapPin, title: "More local for business owners in Africa" },
  { op: "local-na", label: "North America", icon: Globe2, title: "More local for US small businesses" },
  { op: "variants", label: "2 A/B variants", icon: Shuffle, title: "Two different hooks to test" },
];

export function AiActions<T>({
  kitId,
  kind,
  index,
  item,
  language,
  onSuggest,
  disabled,
}: {
  kitId: string;
  kind: RewriteKind;
  index: number;
  item: T;
  language: string;
  onSuggest: (s: Suggestion<T>) => void;
  disabled?: boolean;
}) {
  const toast = useToast();
  const [busy, setBusy] = useState<RewriteOp | null>(null);
  const to = language === "fr" ? "en" : "fr";

  async function run(op: RewriteOp) {
    setBusy(op);
    try {
      const res = await fetch(`/api/admin/growth/kits/${kitId}/rewrite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, index, item, op, to }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error ?? "Rewrite failed");
      onSuggest({ op, items: j.items, warnings: j.warnings, language: j.language });
    } catch (e) {
      toast.error("Rewrite failed", e instanceof Error ? e.message : undefined);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-wrap gap-1.5" role="toolbar" aria-label="AI actions" data-testid="ai-actions">
      {OPS.map((o) => (
        <Button key={o.op} size="sm" variant="secondary" icon={o.icon} title={o.title} loading={busy === o.op} disabled={disabled || (!!busy && busy !== o.op)} onClick={() => run(o.op)} data-op={o.op}>
          {o.label}
        </Button>
      ))}
      <Button size="sm" variant="secondary" icon={Languages} title={`Translate to ${to === "fr" ? "French" : "English"}`} loading={busy === "translate"} disabled={disabled || (!!busy && busy !== "translate")} onClick={() => run("translate")} data-op="translate">
        {language === "fr" ? "FR to EN" : "EN to FR"}
      </Button>
    </div>
  );
}

const OP_LABEL: Record<RewriteOp, string> = {
  regenerate: "New version",
  shorter: "Shorter",
  punchier: "Punchier",
  "local-africa": "Africa",
  "local-na": "North America",
  variants: "A/B variant",
  translate: "Translation",
};

/** Suggestion cards: replace, add as new (posts), copy, or dismiss. */
export function Suggestions<T>({
  s,
  render,
  onReplace,
  onAdd,
  onDismiss,
  copyText,
}: {
  s: Suggestion<T>;
  render: (item: T) => React.ReactNode;
  onReplace: (item: T) => void;
  onAdd?: (item: T) => void;
  onDismiss: () => void;
  copyText?: (item: T) => string;
}) {
  return (
    <div className="space-y-2 rounded-[var(--a-radius-card)] border border-[#d3def3] bg-[var(--a-info-bg)]/60 p-3" data-testid="suggestions">
      <div className="flex items-center justify-between gap-2">
        <p className="a-micro">AI suggestion{s.items.length > 1 ? "s" : ""}: {OP_LABEL[s.op]}{s.op === "translate" ? ` (${s.language.toUpperCase()})` : ""}</p>
        <button type="button" onClick={onDismiss} className="rounded p-1 text-[var(--a-ink-3)] hover:bg-white" aria-label="Dismiss suggestions"><X size={14} /></button>
      </div>
      <div className={`grid gap-2 ${s.items.length > 1 ? "md:grid-cols-2" : ""}`}>
        {s.items.map((it, i) => (
          <div key={i} className="flex min-w-0 flex-col rounded-[var(--a-radius-control)] border border-[var(--a-border)] bg-white p-3" data-testid="suggestion">
            {s.items.length > 1 && <Badge tone="info" className="mb-2 self-start">Variant {String.fromCharCode(65 + i)}</Badge>}
            <div className="min-w-0 flex-1">{render(it)}</div>
            {s.warnings[i]?.length > 0 && (
              <ul className="mt-2 space-y-1">
                {s.warnings[i].map((w, k) => (
                  <li key={k} className="flex gap-1.5 font-dm text-[11.5px] text-[var(--a-warn)]"><AlertTriangle size={12} className="mt-0.5 shrink-0" aria-hidden />{w}</li>
                ))}
              </ul>
            )}
            <div className="mt-3 flex flex-wrap gap-1.5">
              <Button size="sm" variant="primary" icon={Check} onClick={() => onReplace(it)} data-testid="use-suggestion">Use this</Button>
              {onAdd && <Button size="sm" icon={Plus} onClick={() => onAdd(it)}>Add as new post</Button>}
              {copyText && <Button size="sm" variant="ghost" icon={Copy} onClick={() => navigator.clipboard.writeText(copyText(it)).catch(() => {})}>Copy</Button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
