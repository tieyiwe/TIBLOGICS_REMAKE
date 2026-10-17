// Automation Builder: runs sample events through a flow, deterministically,
// and finds design risks. Pure functions, no React.

import { OPTIONAL_SLOTS, SLOTS, walk, type ActionType, type FlowNode, type Recipient, type TriggerType } from "./model";

export type FieldType = "enum" | "number" | "tags";
export type Val = string | number | string[];

export interface FieldDef {
  name: string;
  type: FieldType;
  values?: string[];
  /** Only known after an AI step of this task has run. */
  fromAi?: "classify" | "extract";
}

export interface SampleEvent {
  id: string;
  emoji: string;
  /** Known from the start. */
  fields: Record<string, Val>;
  /** True values an AI step can find (classify / extract). */
  ai?: Record<string, Val>;
  /** How clear the input is for the AI, 0-1. Below 0.7 the AI gets it wrong. */
  clarity?: number;
  /** What the AI says when it gets it wrong. */
  wrong?: Record<string, Val>;
  /** A built-in failure: the first AI step, action, or either. */
  failAt?: "ai" | "action" | "any";
  /** What the human reviewer decides (default approve). */
  approve?: boolean;
  /** Field changes over time (e.g. an invoice gets paid after 60 hours). */
  timeline?: { field: string; after: number; value: Val }[];
}

export type Outcome = "done" | "escalated" | "dropped" | "alerted" | "silent" | "stuck" | "notrun";
export const OUTCOMES: Outcome[] = ["done", "escalated", "dropped", "alerted", "silent", "stuck", "notrun"];
export const OUTCOME_EMOJI: Record<Outcome, string> = {
  done: "✅",
  escalated: "🙋",
  dropped: "🗑️",
  alerted: "🚨",
  silent: "💥",
  stuck: "🕳️",
  notrun: "💤",
};

export interface ActionRec {
  action: ActionType;
  to: Recipient;
  hours: number;
  fields: Record<string, Val>;
  /** AI-drafted content went out. */
  draft: boolean;
  summary: boolean;
  /** A person approved it on the way. */
  approved: boolean;
}

export interface Trace {
  eventId: string;
  path: string[];
  outcome: Outcome;
  humans: number;
  actions: ActionRec[];
  alerted: boolean;
  wrongAi: boolean;
  unsure: boolean;
  errors: number;
  retried: boolean;
  hours: number;
}

export interface RunOptions {
  trigger: TriggerType;
  injectAi: boolean;
  injectApi: boolean;
  /** Apply each AI step's own random failure rate. */
  useRates: boolean;
}

export interface Run {
  traces: Trace[];
  counts: Record<Outcome, number>;
}

function rand(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10000) / 10000;
}

/** Events hit by injected failures (fixed so results are repeatable). */
export const aiHit = (i: number) => i % 3 === 1;
export const apiHit = (i: number) => i % 4 === 2;

function evalCond(v: Val | undefined, op: string | undefined, value: string | undefined): boolean {
  if (v === undefined || value === undefined) return false;
  if (Array.isArray(v)) return op === "contains" || op === "equals" ? v.includes(value) : false;
  if (op === "gt") return Number(v) > Number(value);
  if (op === "lt") return Number(v) < Number(value);
  if (op === "contains") return String(v).toLowerCase().includes(value.toLowerCase());
  return String(v) === String(value);
}

export function runEvent(root: FlowNode | null, ev: SampleEvent, index: number, fields: FieldDef[], o: RunOptions): Trace {
  const t: Trace = { eventId: ev.id, path: [], outcome: "stuck", humans: 0, actions: [], alerted: false, wrongAi: false, unsure: false, errors: 0, retried: false, hours: 0 };
  if (!root) return t;
  if (root.kind !== "trigger" || root.cfg.trigger !== o.trigger) {
    t.path.push(root.id);
    t.outcome = "notrun";
    return t;
  }
  const vars: Record<string, Val> = { ...ev.fields };
  const flags = { draft: false, summary: false, approved: false };
  let builtInFailUsed = false;

  const applyTimeline = () => {
    for (const tl of ev.timeline ?? []) if (tl.after <= t.hours) vars[tl.field] = tl.value;
  };
  applyTimeline();

  const fails = (node: FlowNode): boolean => {
    const isAi = node.kind === "ai";
    if (!builtInFailUsed && ev.failAt && (ev.failAt === "any" || (ev.failAt === "ai") === isAi)) {
      builtInFailUsed = true;
      return true;
    }
    if (isAi && o.injectAi && aiHit(index)) return true;
    if (!isAi && o.injectApi && apiHit(index)) return true;
    if (isAi && o.useRates && rand(`${ev.id}:${node.id}`) * 100 < (node.cfg.failRate ?? 0)) return true;
    return false;
  };

  let node: FlowNode | undefined = root.slots.next;
  t.path.push(root.id);
  let steps = 0;
  while (steps++ < 80) {
    if (!node) {
      t.outcome = "stuck";
      return t;
    }
    t.path.push(node.id);
    let next: FlowNode | undefined;
    switch (node.kind) {
      case "trigger":
      case "error":
        next = node.slots.next;
        break;
      case "condition": {
        const ok = evalCond(vars[node.cfg.field ?? ""], node.cfg.op, node.cfg.value);
        next = ok ? node.slots.yes : node.slots.no;
        break;
      }
      case "delay":
        t.hours += node.cfg.hours ?? 24;
        applyTimeline();
        next = node.slots.next;
        break;
      case "human": {
        t.humans += 1;
        const yes = ev.approve !== false;
        if (yes) flags.approved = true;
        next = yes ? node.slots.approve : node.slots.reject;
        break;
      }
      case "end":
        t.outcome = t.alerted ? "alerted" : t.humans > 0 ? "escalated" : t.actions.length > 0 ? "done" : "dropped";
        return t;
      case "ai":
      case "action": {
        if (fails(node)) {
          t.errors += 1;
          const handler = node.slots.onError;
          if (!handler) {
            t.outcome = "silent";
            return t;
          }
          t.path.push(handler.id);
          if (handler.cfg.retry && rand(`${ev.id}:${node.id}:retry`) < 0.5) {
            t.retried = true;
            t.path.push(node.id);
          } else {
            t.alerted = true;
            next = handler.slots.next;
            break;
          }
        }
        if (node.kind === "action") {
          t.actions.push({ action: node.cfg.action ?? "email", to: node.cfg.to ?? "team", hours: t.hours, fields: { ...vars }, ...flags });
          next = node.slots.next;
          break;
        }
        const clarity = ev.clarity ?? 0.95;
        const right = clarity >= 0.7;
        const task = node.cfg.task ?? "classify";
        const target = task === "classify" || task === "extract" ? task : null;
        if (target) {
          for (const f of fields) {
            if (f.fromAi !== target) continue;
            const v = right ? ev.ai?.[f.name] : ev.wrong?.[f.name] ?? ev.ai?.[f.name];
            if (v !== undefined) vars[f.name] = v;
          }
          if (!right) t.wrongAi = true;
        }
        if (task === "summarise") flags.summary = true;
        if (task === "draft") flags.draft = true;
        const sure = clarity * 100 >= (node.cfg.confidence ?? 80);
        if (!sure && node.slots.unsure) {
          t.unsure = true;
          next = node.slots.unsure;
        } else next = node.slots.next;
        break;
      }
    }
    node = next;
  }
  return t;
}

export function runAll(root: FlowNode | null, events: SampleEvent[], fields: FieldDef[], o: RunOptions): Run {
  const traces = events.map((ev, i) => runEvent(root, ev, i, fields, o));
  const counts = Object.fromEntries(OUTCOMES.map((k) => [k, 0])) as Record<Outcome, number>;
  for (const tr of traces) counts[tr.outcome] += 1;
  return { traces, counts };
}

// ── Check helpers (used by challenges) ─────────────────────────────────────
const ENDED: Outcome[] = ["done", "escalated", "dropped", "alerted"];
export const ended = (t: Trace) => ENDED.includes(t.outcome);
export const allEnded = (r: Run) => r.traces.length > 0 && r.traces.every(ended);
export const noSilent = (r: Run) => r.traces.every((t) => t.outcome !== "silent" && t.outcome !== "stuck" && t.outcome !== "notrun");
export const person = (t: Trace) => t.humans > 0 || t.actions.some((a) => a.action === "task");
export const customerEmails = (t: Trace) => t.actions.filter((a) => a.action === "email" && a.to === "customer");

// ── Static risks ──────────────────────────────────────────────────────────
export type Risk =
  | { key: "noTrigger" }
  | { key: "triggerMismatch"; expected: TriggerType }
  | { key: "openSlots"; n: number }
  | { key: "aiToCustomer" }
  | { key: "noErrorHandler"; n: number }
  | { key: "lowConfidence" }
  | { key: "fieldBeforeAi"; field: string };

export function findRisks(root: FlowNode | null, trigger: TriggerType, fields: FieldDef[]): Risk[] {
  const risks: Risk[] = [];
  if (!root) return [{ key: "noTrigger" }];
  if (root.cfg.trigger !== trigger) risks.push({ key: "triggerMismatch", expected: trigger });
  let open = 0;
  let unhandled = 0;
  let aiCustomer = false;
  let lowConf = false;
  const badFields = new Set<string>();
  walk(root, (n) => {
    for (const s of SLOTS[n.kind]) if (!n.slots[s] && !OPTIONAL_SLOTS.includes(s)) open += 1;
    if ((n.kind === "ai" || n.kind === "action") && !n.slots.onError) unhandled += 1;
    if (n.kind === "ai" && !n.slots.unsure && (n.cfg.confidence ?? 80) < 70) lowConf = true;
  });
  // Path-based checks: AI output reaching customers without a person, and
  // conditions on AI-only fields before any AI step.
  // An AI step with an "unsure" route counts as a safeguard, like a person.
  const visit = (n: FlowNode | undefined, sawAi: boolean, sawHuman: boolean, tasks: Set<string>) => {
    if (!n) return;
    let ai = sawAi;
    let human = sawHuman;
    const known = new Set(tasks);
    if (n.kind === "ai") {
      ai = true;
      if (n.slots.unsure) human = true;
      known.add(n.cfg.task ?? "classify");
    }
    if (n.kind === "human") human = true;
    if (n.kind === "action" && n.cfg.action === "email" && n.cfg.to === "customer" && ai && !human) aiCustomer = true;
    if (n.kind === "action" && n.cfg.action === "publish" && ai && !human) aiCustomer = true;
    if (n.kind === "condition") {
      const f = fields.find((x) => x.name === n.cfg.field);
      if (f?.fromAi && !known.has(f.fromAi)) badFields.add(f.name);
    }
    for (const s of SLOTS[n.kind]) visit(n.slots[s], ai, human, known);
  };
  visit(root, false, false, new Set());
  if (open > 0) risks.push({ key: "openSlots", n: open });
  if (aiCustomer) risks.push({ key: "aiToCustomer" });
  if (unhandled > 0) risks.push({ key: "noErrorHandler", n: unhandled });
  if (lowConf) risks.push({ key: "lowConfidence" });
  for (const f of badFields) risks.push({ key: "fieldBeforeAi", field: f });
  return risks;
}

/** Minutes saved on this batch versus doing it all by hand. */
export function minutesSaved(run: Run, manualMin: number): number {
  let cost = 0;
  for (const t of run.traces) {
    cost += t.humans * 2;
    cost += t.actions.filter((a) => a.action === "task").length * 4;
    if (t.outcome === "alerted") cost += 5;
    if (t.outcome === "silent" || t.outcome === "stuck" || t.outcome === "notrun") cost += manualMin + 10;
  }
  return Math.round(run.traces.length * manualMin - cost);
}
