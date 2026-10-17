"use client";

import { useId } from "react";
import { Trash2, X } from "lucide-react";
import { ACTIONS, AI_TASKS, DELAYS, TRIGGERS, type CondOp, type FlowNode, type NodeConfig } from "./model";
import type { FieldDef } from "./engine";
import { KIND_STYLE, P, type T } from "./ui";

const selectCls =
  "mt-1 w-full rounded-lg border border-[#D2DCE8] bg-white px-2.5 py-2 text-sm text-[var(--ink)] focus:border-[#F47C20] focus:outline-none focus:ring-2 focus:ring-[#F47C20]/30";

function Row({ label, children }: { label: string; children: (id: string) => React.ReactNode }) {
  const id = useId();
  return (
    <div className="mt-3">
      <label htmlFor={id} className="text-xs font-bold text-[var(--ink2)]">
        {label}
      </label>
      {children(id)}
    </div>
  );
}

export default function Settings({
  t,
  node,
  fields,
  onChange,
  onDelete,
  onClose,
}: {
  t: T;
  node: FlowNode;
  fields: FieldDef[];
  onChange: (cfg: NodeConfig) => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const c = node.cfg;
  const set = (patch: Partial<NodeConfig>) => onChange({ ...c, ...patch });
  const style = KIND_STYLE[node.kind];
  const Icon = style.icon;
  const field = fields.find((f) => f.name === c.field);
  const ops: CondOp[] = !field ? ["equals"] : field.type === "number" ? ["equals", "gt", "lt"] : field.type === "tags" ? ["contains"] : ["equals"];

  return (
    <section className="rounded-2xl border border-[#D2DCE8] bg-white p-4 shadow-sm" aria-label={t(`${P}.settings`)}>
      <div className="flex items-start gap-2">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ background: style.bg, color: style.color }}>
          <Icon size={17} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold text-[var(--ink)]">{t(`${P}.kind.${node.kind}`)}</h3>
          <p className="text-xs leading-relaxed text-[var(--ink2)]">{t(`${P}.kindDesc.${node.kind}`)}</p>
        </div>
        <button type="button" onClick={onClose} className="rounded-lg p-1 text-[var(--ink3)] hover:bg-[var(--s2)]" aria-label={t(`${P}.closeSettings`)}>
          <X size={16} aria-hidden="true" />
        </button>
      </div>

      {node.kind === "trigger" && (
        <Row label={t(`${P}.set.trigger`)}>
          {(id) => (
            <select id={id} className={selectCls} value={c.trigger} onChange={(e) => set({ trigger: e.target.value as NodeConfig["trigger"] })}>
              {TRIGGERS.map((x) => (
                <option key={x} value={x}>{t(`${P}.trigger.${x}`)}</option>
              ))}
            </select>
          )}
        </Row>
      )}

      {node.kind === "condition" && (
        <>
          <Row label={t(`${P}.set.field`)}>
            {(id) => (
              <select
                id={id}
                className={selectCls}
                value={c.field ?? ""}
                onChange={(e) => {
                  const f = fields.find((x) => x.name === e.target.value);
                  set({
                    field: e.target.value,
                    op: f?.type === "tags" ? "contains" : f?.type === "number" ? "gt" : "equals",
                    value: f?.values?.[0] ?? "0",
                  });
                }}
              >
                {fields.map((f) => (
                  <option key={f.name} value={f.name}>
                    {t(`${P}.field.${f.name}`)}{f.fromAi ? ` (${t(`${P}.fromAi.${f.fromAi}`)})` : ""}
                  </option>
                ))}
              </select>
            )}
          </Row>
          <div className="grid grid-cols-2 gap-2">
            <Row label={t(`${P}.set.op`)}>
              {(id) => (
                <select id={id} className={selectCls} value={c.op} onChange={(e) => set({ op: e.target.value as CondOp })}>
                  {ops.map((o) => (
                    <option key={o} value={o}>{t(`${P}.op.${o}`)}</option>
                  ))}
                </select>
              )}
            </Row>
            <Row label={t(`${P}.set.value`)}>
              {(id) =>
                field?.type === "number" ? (
                  <input id={id} type="number" inputMode="numeric" className={selectCls} value={c.value ?? ""} onChange={(e) => set({ value: e.target.value })} />
                ) : (
                  <select id={id} className={selectCls} value={c.value ?? ""} onChange={(e) => set({ value: e.target.value })}>
                    {(field?.values ?? []).map((v) => (
                      <option key={v} value={v}>{t(`${P}.val.${v}`)}</option>
                    ))}
                  </select>
                )
              }
            </Row>
          </div>
          <p className="mt-2 text-xs text-[var(--ink3)]">{t(`${P}.set.condHint`)}</p>
        </>
      )}

      {node.kind === "ai" && (
        <>
          <Row label={t(`${P}.set.task`)}>
            {(id) => (
              <select id={id} className={selectCls} value={c.task} onChange={(e) => set({ task: e.target.value as NodeConfig["task"] })}>
                {AI_TASKS.map((x) => (
                  <option key={x} value={x}>{t(`${P}.task.${x}`)}</option>
                ))}
              </select>
            )}
          </Row>
          <Row label={t(`${P}.set.confidence`, { n: c.confidence ?? 80 })}>
            {(id) => (
              <input id={id} type="range" min={50} max={95} step={5} value={c.confidence ?? 80} onChange={(e) => set({ confidence: Number(e.target.value) })} className="mt-2 w-full accent-[#F47C20]" />
            )}
          </Row>
          <Row label={t(`${P}.set.failRate`, { n: c.failRate ?? 0 })}>
            {(id) => (
              <input id={id} type="range" min={0} max={40} step={5} value={c.failRate ?? 0} onChange={(e) => set({ failRate: Number(e.target.value) })} className="mt-2 w-full accent-[#F47C20]" />
            )}
          </Row>
          <p className="mt-2 text-xs text-[var(--ink3)]">{t(`${P}.set.aiHint`)}</p>
        </>
      )}

      {node.kind === "action" && (
        <div className="grid grid-cols-2 gap-2">
          <Row label={t(`${P}.set.action`)}>
            {(id) => (
              <select id={id} className={selectCls} value={c.action} onChange={(e) => set({ action: e.target.value as NodeConfig["action"] })}>
                {ACTIONS.map((x) => (
                  <option key={x} value={x}>{t(`${P}.act.${x}`)}</option>
                ))}
              </select>
            )}
          </Row>
          <Row label={t(`${P}.set.to`)}>
            {(id) => (
              <select id={id} className={selectCls} value={c.to} onChange={(e) => set({ to: e.target.value as NodeConfig["to"] })}>
                <option value="team">{t(`${P}.to.team`)}</option>
                <option value="customer">{t(`${P}.to.customer`)}</option>
              </select>
            )}
          </Row>
        </div>
      )}

      {node.kind === "delay" && (
        <Row label={t(`${P}.set.hours`)}>
          {(id) => (
            <select id={id} className={selectCls} value={c.hours ?? 24} onChange={(e) => set({ hours: Number(e.target.value) })}>
              {DELAYS.map((h) => (
                <option key={h} value={h}>{t(`${P}.hours`, { n: h })}</option>
              ))}
            </select>
          )}
        </Row>
      )}

      {node.kind === "error" && (
        <>
          <Row label={t(`${P}.set.channel`)}>
            {(id) => (
              <select id={id} className={selectCls} value={c.channel ?? "chat"} onChange={(e) => set({ channel: e.target.value as NodeConfig["channel"] })}>
                <option value="chat">{t(`${P}.channel.chat`)}</option>
                <option value="email">{t(`${P}.channel.email`)}</option>
              </select>
            )}
          </Row>
          <label className="mt-3 flex items-center gap-2 text-sm text-[var(--ink)]">
            <input type="checkbox" checked={!!c.retry} onChange={(e) => set({ retry: e.target.checked })} className="h-4 w-4 accent-[#F47C20]" />
            {t(`${P}.set.retry`)}
          </label>
        </>
      )}

      <button
        type="button"
        onClick={onDelete}
        className="mt-4 inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
      >
        <Trash2 size={13} aria-hidden="true" /> {t(`${P}.deleteStep`, { step: t(`${P}.kind.${node.kind}`) })}
      </button>
    </section>
  );
}
