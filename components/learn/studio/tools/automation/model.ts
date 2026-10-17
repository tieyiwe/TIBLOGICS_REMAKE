// Automation Builder: the flow model (a tree of steps) and helpers to edit it.
// Pure data, no React.

export type NodeKind = "trigger" | "condition" | "ai" | "action" | "human" | "delay" | "error" | "end";
export type SlotName = "next" | "yes" | "no" | "unsure" | "approve" | "reject" | "onError";
export type TriggerType = "form" | "email" | "schedule" | "row" | "webhook";
export type CondOp = "contains" | "equals" | "gt" | "lt";
export type AiTask = "classify" | "summarise" | "extract" | "draft";
export type ActionType = "email" | "row" | "chat" | "task" | "crm" | "publish";
export type Recipient = "customer" | "team";
export type Channel = "chat" | "email";

export interface NodeConfig {
  trigger?: TriggerType;
  field?: string;
  op?: CondOp;
  value?: string;
  task?: AiTask;
  /** Minimum confidence (50-95) below which the AI step takes its "unsure" path. */
  confidence?: number;
  /** Simulated random failure rate in percent (0-40). */
  failRate?: number;
  action?: ActionType;
  to?: Recipient;
  hours?: number;
  retry?: boolean;
  channel?: Channel;
}

export interface FlowNode {
  id: string;
  kind: NodeKind;
  cfg: NodeConfig;
  slots: Partial<Record<SlotName, FlowNode>>;
}

export const KINDS: NodeKind[] = ["trigger", "condition", "ai", "action", "human", "delay", "error", "end"];
export const TRIGGERS: TriggerType[] = ["form", "email", "schedule", "row", "webhook"];
export const AI_TASKS: AiTask[] = ["classify", "summarise", "extract", "draft"];
export const ACTIONS: ActionType[] = ["email", "row", "chat", "task", "crm", "publish"];
export const DELAYS = [1, 4, 24, 72, 168];

export const SLOTS: Record<NodeKind, SlotName[]> = {
  trigger: ["next"],
  condition: ["yes", "no"],
  ai: ["next", "unsure", "onError"],
  action: ["next", "onError"],
  human: ["approve", "reject"],
  delay: ["next"],
  error: ["next"],
  end: [],
};

/** Slots that may stay empty without leaving a branch open. */
export const OPTIONAL_SLOTS: SlotName[] = ["unsure", "onError"];

/** Which step kinds can go in a slot. "root" is the first step of the flow. */
export function allowedKinds(slot: SlotName | "root"): NodeKind[] {
  if (slot === "root") return ["trigger"];
  if (slot === "onError") return ["error"];
  return ["condition", "ai", "action", "human", "delay", "end"];
}

let counter = 0;
export function newId(): string {
  counter += 1;
  return `n${Date.now().toString(36)}${counter.toString(36)}`;
}

export function walk(node: FlowNode | null | undefined, fn: (n: FlowNode, parent: FlowNode | null) => void, parent: FlowNode | null = null) {
  if (!node) return;
  fn(node, parent);
  for (const s of SLOTS[node.kind]) walk(node.slots[s], fn, node);
}

export function findNode(root: FlowNode | null, id: string): FlowNode | null {
  let hit: FlowNode | null = null;
  walk(root, (n) => {
    if (n.id === id) hit = n;
  });
  return hit;
}

export function countNodes(root: FlowNode | null): number {
  let n = 0;
  walk(root, () => {
    n += 1;
  });
  return n;
}

/** Returns a new tree with node `id` replaced by fn(node). */
export function updateNode(root: FlowNode | null, id: string, fn: (n: FlowNode) => FlowNode): FlowNode | null {
  if (!root) return root;
  if (root.id === id) return fn(root);
  let changed = false;
  const slots: FlowNode["slots"] = {};
  for (const s of SLOTS[root.kind]) {
    const child = root.slots[s];
    if (!child) continue;
    const next = updateNode(child, id, fn);
    if (next !== child) changed = true;
    if (next) slots[s] = next;
  }
  return changed ? { ...root, slots } : root;
}

/** Put `child` into `parentId`'s slot. */
export function setSlot(root: FlowNode | null, parentId: string, slot: SlotName, child: FlowNode | undefined): FlowNode | null {
  return updateNode(root, parentId, (n) => {
    const slots = { ...n.slots };
    if (child) slots[slot] = child;
    else delete slots[slot];
    return { ...n, slots };
  });
}

/** Remove node `id` and everything under it. */
export function removeNode(root: FlowNode | null, id: string): FlowNode | null {
  if (!root || root.id === id) return null;
  let parentId: string | null = null;
  let slotName: SlotName | null = null;
  walk(root, (n) => {
    for (const s of SLOTS[n.kind]) if (n.slots[s]?.id === id) {
      parentId = n.id;
      slotName = s;
    }
  });
  if (!parentId || !slotName) return root;
  return setSlot(root, parentId, slotName, undefined);
}

/** Basic validation of a tree loaded from storage. */
export function isFlowNode(x: unknown, depth = 0): x is FlowNode {
  if (!x || typeof x !== "object" || depth > 40) return false;
  const n = x as FlowNode;
  if (typeof n.id !== "string" || !KINDS.includes(n.kind) || typeof n.cfg !== "object" || typeof n.slots !== "object") return false;
  return Object.values(n.slots).every((c) => isFlowNode(c, depth + 1));
}
