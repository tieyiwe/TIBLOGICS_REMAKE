"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Bot, Clock, Flag, GitBranch, Send, UserCheck, Zap, type LucideIcon } from "lucide-react";
import type { FieldDef } from "./engine";
import type { FlowNode, NodeKind } from "./model";

export const P = "studio.automation-builder";
export type T = (key: string, vars?: Record<string, string | number>) => string;

export const KIND_STYLE: Record<NodeKind, { icon: LucideIcon; color: string; bg: string }> = {
  trigger: { icon: Zap, color: "#C45A0A", bg: "#FEF0E3" },
  condition: { icon: GitBranch, color: "#2251A3", bg: "#EBF0FA" },
  ai: { icon: Bot, color: "#6D28D9", bg: "#F3EEFF" },
  action: { icon: Send, color: "#0F7B45", bg: "#E8F7EF" },
  human: { icon: UserCheck, color: "#B4235F", bg: "#FDEEF4" },
  delay: { icon: Clock, color: "#475569", bg: "#F1F5F9" },
  error: { icon: AlertTriangle, color: "#B91C1C", bg: "#FDECEC" },
  end: { icon: Flag, color: "#0D1B2A", bg: "#E8EFF8" },
};

export function valueLabel(t: T, field: FieldDef | undefined, v: string | number | undefined): string {
  if (v === undefined || v === "") return "?";
  if (!field || field.type === "number") return String(v);
  return t(`${P}.val.${v}`);
}

export function fieldValueText(t: T, field: FieldDef, v: unknown): string {
  if (Array.isArray(v)) return v.length ? v.map((x) => t(`${P}.val.${x}`)).join(", ") : "–";
  return valueLabel(t, field, v as string | number | undefined);
}

/** One-line description of a step's settings. */
export function nodeSummary(t: T, n: FlowNode, fields: FieldDef[]): string {
  const c = n.cfg;
  switch (n.kind) {
    case "trigger":
      return t(`${P}.trigger.${c.trigger ?? "email"}`);
    case "condition": {
      const f = fields.find((x) => x.name === c.field);
      return t(`${P}.sum.cond`, {
        field: c.field ? t(`${P}.field.${c.field}`) : "?",
        op: t(`${P}.op.${c.op ?? "equals"}`),
        value: valueLabel(t, f, c.value),
      });
    }
    case "ai":
      return t(`${P}.sum.ai`, { task: t(`${P}.task.${c.task ?? "classify"}`), c: c.confidence ?? 80, f: c.failRate ?? 0 });
    case "action":
      return t(`${P}.sum.action`, { action: t(`${P}.act.${c.action ?? "email"}`), to: t(`${P}.to.${c.to ?? "team"}`) });
    case "human":
      return t(`${P}.sum.human`);
    case "delay":
      return t(`${P}.sum.delay`, { n: c.hours ?? 24 });
    case "error":
      return t(`${P}.sum.error`, { channel: t(`${P}.channel.${c.channel ?? "chat"}`) }) + (c.retry ? ` · ${t(`${P}.sum.retry`)}` : "");
    case "end":
      return t(`${P}.sum.end`);
  }
}

export function useMediaQuery(q: string): boolean {
  const [m, setM] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(q);
    setM(mq.matches);
    const on = () => setM(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [q]);
  return m;
}

export function Stars({ n, size = 16, label }: { n: number; size?: number; label?: string }) {
  return (
    <span className="inline-flex items-center gap-0.5" role="img" aria-label={label}>
      {[1, 2, 3].map((i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z"
            fill={i <= n ? "#F5B400" : "none"}
            stroke={i <= n ? "#D99A00" : "#B8C4D3"}
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
        </svg>
      ))}
    </span>
  );
}

export function Difficulty({ d, label }: { d: 1 | 2 | 3; label: string }) {
  return (
    <span className="inline-flex items-center gap-0.5" role="img" aria-label={label} title={label}>
      {[1, 2, 3].map((i) => (
        <span key={i} className={`h-1.5 w-1.5 rounded-full ${i <= d ? "bg-[#F47C20]" : "bg-[#D2DCE8]"}`} />
      ))}
    </span>
  );
}
