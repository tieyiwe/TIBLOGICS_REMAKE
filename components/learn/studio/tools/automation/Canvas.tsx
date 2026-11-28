"use client";

import { useState, type ReactNode } from "react";
import { Plus, Trash2 } from "lucide-react";
import { allowedKinds, OPTIONAL_SLOTS, SLOTS, type FlowNode, type NodeKind, type SlotName } from "./model";
import type { FieldDef, SampleEvent } from "./engine";
import { KIND_STYLE, nodeSummary, P, type T } from "./ui";

export interface CanvasProps {
  t: T;
  root: FlowNode | null;
  fields: FieldDef[];
  events: SampleEvent[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onAdd: (parentId: string | null, slot: SlotName | "root", kind: NodeKind) => void;
  onDelete: (id: string) => void;
  /** Event indices currently sitting on each node (simulation tokens). */
  tokens: Map<string, number[]>;
  /** Nodes visited by the current run, for a trail highlight. */
  trail: Set<string>;
  armed: NodeKind | null;
  dragKind: NodeKind | null;
  stacked: boolean;
  /** Rendered under the selected node when settings are shown inline. */
  inlineSettings?: ReactNode;
}

export default function Canvas(p: CanvasProps) {
  return (
    <div className="overflow-x-auto pb-2" role="region" aria-label={p.t(`${P}.canvasLabel`)}>
      {p.root ? <NodeView {...p} node={p.root} depth={1} /> : <EmptySlot {...p} parentId={null} slot="root" />}
    </div>
  );
}

function NodeView(p: CanvasProps & { node: FlowNode; depth: number }) {
  const { node, t } = p;
  const style = KIND_STYLE[node.kind];
  const Icon = style.icon;
  const selected = p.selectedId === node.id;
  const toks = p.tokens.get(node.id) ?? [];
  const onTrail = p.trail.has(node.id);
  const required = SLOTS[node.kind].filter((s) => !OPTIONAL_SLOTS.includes(s));
  const optional = SLOTS[node.kind].filter((s) => OPTIONAL_SLOTS.includes(s));
  const branches = [...required, ...optional.filter((s) => node.slots[s])];
  const emptyOptional = optional.filter((s) => !node.slots[s]);

  return (
    <div>
      <div
        className={`relative ${p.stacked ? "w-full max-w-[280px]" : "w-[250px]"} rounded-2xl border-2 bg-white shadow-sm transition-shadow ${
          selected ? "border-[#F47C20] shadow-md" : onTrail ? "border-[#F5B400]" : "border-[#D2DCE8]"
        }`}
      >
        <div className="flex items-start gap-2 p-2.5">
          <button
            type="button"
            onClick={() => p.onSelect(selected ? null : node.id)}
            className="flex min-w-0 flex-1 items-start gap-2.5 rounded-xl text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F47C20]"
            aria-pressed={selected}
            aria-label={`${t(`${P}.kind.${node.kind}`)}: ${nodeSummary(t, node, p.fields)}. ${t(`${P}.editStep`)}`}
          >
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ background: style.bg, color: style.color }}>
              <Icon size={17} aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block text-[11px] font-bold uppercase tracking-wide" style={{ color: style.color }}>
                {t(`${P}.kind.${node.kind}`)}
              </span>
              <span className="block text-sm font-semibold leading-snug text-[var(--ink)]">{nodeSummary(t, node, p.fields)}</span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => p.onDelete(node.id)}
            className="rounded-lg p-1.5 text-[var(--ink3)] hover:bg-red-50 hover:text-red-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
            aria-label={t(`${P}.deleteStep`, { step: t(`${P}.kind.${node.kind}`) })}
          >
            <Trash2 size={15} aria-hidden="true" />
          </button>
        </div>
        {emptyOptional.length > 0 && (
          <div className="flex flex-wrap gap-1.5 border-t border-dashed border-[#D2DCE8] px-2.5 py-1.5">
            {emptyOptional.map((s) => (
              <OptionalSlotButton key={s} {...p} parentId={node.id} slot={s} />
            ))}
          </div>
        )}
        {toks.length > 0 && (
          <div className="absolute -right-2 -top-3 flex gap-0.5" aria-hidden="true">
            {toks.slice(0, 4).map((i) => (
              <span key={i} className="ab-token flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-[#F47C20] text-xs shadow">
                {p.events[i]?.emoji}
              </span>
            ))}
            {toks.length > 4 && <span className="rounded-full bg-[var(--ink)] px-1.5 text-[10px] font-bold text-white">+{toks.length - 4}</span>}
          </div>
        )}
      </div>
      {selected && p.inlineSettings && <div className="mt-2 max-w-[340px]">{p.inlineSettings}</div>}

      {branches.length === 1 && (
        <div className="ml-6 border-l-2 border-[#D2DCE8] pl-0 pt-3">
          <div className="-ml-[2px]">
            <SlotView {...p} parent={node} slot={branches[0]} depth={p.depth + 1} labelled={false} />
          </div>
        </div>
      )}
      {branches.length > 1 && (
        <div className={`mt-3 flex gap-3 ${p.stacked ? "flex-col" : "flex-row items-start"}`}>
          {branches.map((s) => (
            <div key={s} className={`${p.stacked ? "ml-3 border-l-2 pl-3" : "shrink-0 border-t-2 pt-2"}`} style={{ borderColor: slotColor(s) }}>
              <SlotView {...p} parent={node} slot={s} depth={p.depth + 1} labelled />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function slotColor(s: SlotName): string {
  if (s === "yes" || s === "approve") return "#1BAF7A";
  if (s === "no" || s === "reject") return "#E34948";
  if (s === "onError") return "#B91C1C";
  if (s === "unsure") return "#6D28D9";
  return "#D2DCE8";
}

function SlotView(p: CanvasProps & { parent: FlowNode; slot: SlotName; depth: number; labelled: boolean }) {
  const child = p.parent.slots[p.slot];
  return (
    <div>
      {p.labelled && (
        <span className="mb-2 inline-block rounded-full px-2 py-0.5 text-[11px] font-bold text-white" style={{ background: slotColor(p.slot) === "#D2DCE8" ? "#7A8FA6" : slotColor(p.slot) }}>
          {p.t(`${P}.slot.${p.slot}`)}
        </span>
      )}
      {child ? <NodeView {...p} node={child} depth={p.depth} /> : <EmptySlot {...p} parentId={p.parent.id} slot={p.slot} />}
    </div>
  );
}

function EmptySlot(p: CanvasProps & { parentId: string | null; slot: SlotName | "root" }) {
  const { t } = p;
  const [open, setOpen] = useState(false);
  const [over, setOver] = useState(false);
  const kinds = allowedKinds(p.slot);
  const armedOk = p.armed && kinds.includes(p.armed);
  const dragOk = p.dragKind && kinds.includes(p.dragKind);

  const place = (k: NodeKind) => {
    setOpen(false);
    p.onAdd(p.parentId, p.slot, k);
  };

  return (
    <div>
      <button
        type="button"
        onClick={() => (armedOk ? place(p.armed!) : kinds.length === 1 ? place(kinds[0]) : setOpen((o) => !o))}
        onDragOver={(e) => {
          if (!dragOk) return;
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          if (dragOk) place(p.dragKind!);
        }}
        aria-expanded={kinds.length > 1 ? open : undefined}
        className={`flex ${p.stacked ? "w-full max-w-[280px]" : "w-[250px]"} items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed px-3 py-3 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F47C20] ${
          over || armedOk || dragOk
            ? "ab-slot-hot border-[#F47C20] bg-[#FEF0E3] text-[#C45A0A]"
            : "border-[#B8C4D3] bg-[var(--s2)] text-[var(--ink3)] hover:border-[#F47C20] hover:text-[#C45A0A]"
        }`}
      >
        <Plus size={16} aria-hidden="true" />
        {armedOk
          ? t(`${P}.placeHere`, { step: t(`${P}.kind.${p.armed}`) })
          : p.slot === "root"
            ? t(`${P}.addTrigger`)
            : t(`${P}.addStep`)}
      </button>
      {open && (
        <div className="mt-2 grid w-full max-w-[250px] grid-cols-2 gap-1.5 rounded-2xl border border-[#D2DCE8] bg-white p-2 shadow-md" role="menu" aria-label={t(`${P}.chooseStep`)}>
          {kinds.map((k) => {
            const s = KIND_STYLE[k];
            const Icon = s.icon;
            return (
              <button
                key={k}
                type="button"
                role="menuitem"
                onClick={() => place(k)}
                onKeyDown={(e) => {
                  // Claim Escape so a full-screen Studio stays open.
                  if (e.key === "Escape") {
                    e.preventDefault();
                    setOpen(false);
                  }
                }}
                className="flex items-center gap-1.5 rounded-lg px-2 py-2 text-left text-xs font-semibold text-[var(--ink)] hover:bg-[var(--s2)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F47C20]"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-md" style={{ background: s.bg, color: s.color }}>
                  <Icon size={14} aria-hidden="true" />
                </span>
                {t(`${P}.kind.${k}`)}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function OptionalSlotButton(p: CanvasProps & { parentId: string; slot: SlotName }) {
  const kinds = allowedKinds(p.slot);
  const armedOk = p.armed && kinds.includes(p.armed);
  const [open, setOpen] = useState(false);
  const place = (k: NodeKind) => {
    setOpen(false);
    p.onAdd(p.parentId, p.slot, k);
  };
  return (
    <span className="relative">
      <button
        type="button"
        onClick={() => (armedOk ? place(p.armed!) : kinds.length === 1 ? place(kinds[0]) : setOpen((o) => !o))}
        onDragOver={(e) => p.dragKind && kinds.includes(p.dragKind) && e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          if (p.dragKind && kinds.includes(p.dragKind)) place(p.dragKind);
        }}
        className={`inline-flex items-center gap-1 rounded-full border border-dashed px-2 py-1 text-[11px] font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F47C20] ${
          armedOk ? "border-[#F47C20] bg-[#FEF0E3] text-[#C45A0A]" : "text-[var(--ink3)] hover:text-[var(--ink)]"
        }`}
        style={{ borderColor: armedOk ? undefined : slotColor(p.slot) }}
      >
        <Plus size={11} aria-hidden="true" /> {p.t(`${P}.slotAdd.${p.slot}`)}
      </button>
      {open && (
        <span className="absolute left-0 top-full z-10 mt-1 grid w-44 gap-1 rounded-xl border border-[#D2DCE8] bg-white p-1.5 shadow-md" role="menu">
          {kinds.map((k) => (
            <button
              key={k}
              type="button"
              role="menuitem"
              onClick={() => place(k)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  e.preventDefault();
                  setOpen(false);
                }
              }}
              className="rounded-lg px-2 py-1.5 text-left text-xs font-semibold hover:bg-[var(--s2)]"
            >
              {p.t(`${P}.kind.${k}`)}
            </button>
          ))}
        </span>
      )}
    </span>
  );
}
