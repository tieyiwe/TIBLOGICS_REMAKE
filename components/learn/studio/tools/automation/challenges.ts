// Automation Builder challenges: goal, sample events and the three star checks.
// Text lives in lib/i18n/messages/studio-automation-builder.ts under
// "studio.automation-builder.ch.<id>.*" and ".ev.<eventId>".

import type { ActionType, FlowNode, TriggerType } from "./model";
import { allEnded, customerEmails, noSilent, person, type FieldDef, type Run, type SampleEvent, type Trace } from "./engine";

export interface CheckCtx {
  flow: FlowNode | null;
  clean: Run;
  stress: Run;
  events: SampleEvent[];
}

export interface AutomationChallenge {
  id: string;
  difficulty: 1 | 2 | 3;
  trigger: TriggerType;
  fields: FieldDef[];
  events: SampleEvent[];
  /** Minutes a person spends per event by hand. */
  manualMin: number;
  /** Events a month, for the time-saved estimate. */
  monthly: number;
  defaultAction: ActionType;
  checks: [(c: CheckCtx) => boolean, (c: CheckCtx) => boolean, (c: CheckCtx) => boolean];
}

const byId = (r: Run, id: string): Trace => r.traces.find((t) => t.eventId === id)!;
const evs = (c: CheckCtx, f: (e: SampleEvent) => boolean) => c.events.filter(f).map((e) => byId(c.clean, e.id));
const allApproved = (r: Run) => r.traces.every((t) => customerEmails(t).every((a) => a.approved));

export const CHALLENGES: AutomationChallenge[] = [
  {
    id: "support-triage",
    difficulty: 1,
    trigger: "email",
    manualMin: 6,
    monthly: 400,
    defaultAction: "task",
    fields: [
      { name: "urgency", type: "enum", values: ["high", "normal"] },
      { name: "tier", type: "enum", values: ["free", "pro"] },
      { name: "keywords", type: "tags", values: ["refund", "password", "invoice", "bug"] },
    ],
    events: [
      { id: "st1", emoji: "🔥", fields: { urgency: "high", tier: "pro", keywords: ["bug"] } },
      { id: "st2", emoji: "🔑", fields: { urgency: "normal", tier: "free", keywords: ["password"] } },
      { id: "st3", emoji: "🧾", fields: { urgency: "normal", tier: "pro", keywords: ["invoice"] } },
      { id: "st4", emoji: "💸", fields: { urgency: "high", tier: "pro", keywords: ["refund", "invoice"] } },
      { id: "st5", emoji: "💡", fields: { urgency: "normal", tier: "free", keywords: [] } },
      { id: "st6", emoji: "⏰", fields: { urgency: "high", tier: "free", keywords: ["password"] } },
      { id: "st7", emoji: "↩️", fields: { urgency: "normal", tier: "free", keywords: ["refund"] } },
      { id: "st8", emoji: "🐛", fields: { urgency: "normal", tier: "pro", keywords: ["bug"] } },
    ],
    checks: [
      (c) => allEnded(c.clean),
      (c) =>
        evs(c, (e) => e.fields.urgency === "high").every(person) &&
        evs(c, (e) => e.fields.urgency !== "high").filter((t) => !person(t) && t.actions.length > 0).length >= 3,
      (c) => noSilent(c.stress) && allApproved(c.clean),
    ],
  },
  {
    id: "weekly-report",
    difficulty: 1,
    trigger: "schedule",
    manualMin: 45,
    monthly: 4,
    defaultAction: "email",
    fields: [
      { name: "week", type: "number" },
      { name: "rows", type: "number" },
    ],
    events: [
      { id: "wr1", emoji: "📊", fields: { week: 1, rows: 120 } },
      { id: "wr2", emoji: "📊", fields: { week: 2, rows: 98 } },
      { id: "wr3", emoji: "🔌", fields: { week: 3, rows: 0 }, failAt: "any" },
      { id: "wr4", emoji: "📊", fields: { week: 4, rows: 143 } },
    ],
    checks: [
      (c) =>
        evs(c, (e) => e.id !== "wr3").every((t) => t.actions.some((a) => (a.action === "email" || a.action === "chat") && a.to === "team")),
      (c) => allEnded(c.clean) && byId(c.clean, "wr3").alerted,
      (c) =>
        evs(c, (e) => e.id !== "wr3").every((t) => t.actions.some((a) => a.summary && a.to === "team")) &&
        c.clean.traces.every((t) => customerEmails(t).length === 0) &&
        noSilent(c.stress),
    ],
  },
  {
    id: "faq-autoreply",
    difficulty: 2,
    trigger: "email",
    manualMin: 5,
    monthly: 600,
    defaultAction: "email",
    fields: [
      { name: "tier", type: "enum", values: ["free", "pro"] },
      { name: "category", type: "enum", values: ["faq", "refund", "other"], fromAi: "classify" },
    ],
    events: [
      { id: "fq1", emoji: "🕘", fields: { tier: "free" }, ai: { category: "faq" }, clarity: 0.95 },
      { id: "fq2", emoji: "🚚", fields: { tier: "pro" }, ai: { category: "faq" }, clarity: 0.9 },
      { id: "fq3", emoji: "💰", fields: { tier: "free" }, ai: { category: "refund" }, clarity: 0.92 },
      { id: "fq4", emoji: "📦", fields: { tier: "pro" }, ai: { category: "refund" }, clarity: 0.62, wrong: { category: "faq" } },
      { id: "fq5", emoji: "🏠", fields: { tier: "free" }, ai: { category: "faq" }, clarity: 0.88 },
      { id: "fq6", emoji: "🤝", fields: { tier: "pro" }, ai: { category: "other" }, clarity: 0.85 },
      { id: "fq7", emoji: "🏷️", fields: { tier: "free" }, ai: { category: "faq" }, clarity: 0.65, wrong: { category: "refund" } },
      { id: "fq8", emoji: "✂️", fields: { tier: "pro" }, ai: { category: "refund" }, clarity: 0.9 },
    ],
    checks: [
      (c) => allEnded(c.clean),
      (c) =>
        evs(c, (e) => e.ai?.category === "refund").every((t) => person(t) && customerEmails(t).every((a) => a.approved)) &&
        evs(c, (e) => e.ai?.category === "faq" && (e.clarity ?? 1) >= 0.75).every((t) => customerEmails(t).length > 0),
      (c) => evs(c, (e) => (e.clarity ?? 1) < 0.7).every(person) && noSilent(c.stress),
    ],
  },
  {
    id: "invoice-chaser",
    difficulty: 2,
    trigger: "row",
    manualMin: 8,
    monthly: 60,
    defaultAction: "email",
    fields: [
      { name: "amount", type: "number" },
      { name: "paid", type: "enum", values: ["yes", "no"] },
    ],
    events: [
      { id: "iv1", emoji: "🧾", fields: { amount: 450, paid: "no" }, timeline: [{ field: "paid", after: 12, value: "yes" }] },
      { id: "iv2", emoji: "🧾", fields: { amount: 1200, paid: "no" } },
      { id: "iv3", emoji: "🧾", fields: { amount: 80, paid: "yes" } },
      { id: "iv4", emoji: "🧾", fields: { amount: 300, paid: "no" }, timeline: [{ field: "paid", after: 60, value: "yes" }] },
      { id: "iv5", emoji: "🧾", fields: { amount: 2500, paid: "no" }, timeline: [{ field: "paid", after: 100, value: "yes" }] },
      { id: "iv6", emoji: "🧾", fields: { amount: 150, paid: "no" } },
    ],
    checks: [
      (c) => allEnded(c.clean),
      (c) =>
        c.clean.traces.every((t) => customerEmails(t).every((a) => a.fields.paid !== "yes")) &&
        ["iv2", "iv4", "iv5", "iv6"].every((id) => customerEmails(byId(c.clean, id)).length > 0),
      (c) => ["iv2", "iv6"].every((id) => person(byId(c.clean, id))) && noSilent(c.stress),
    ],
  },
  {
    id: "content-pipeline",
    difficulty: 2,
    trigger: "row",
    manualMin: 30,
    monthly: 20,
    defaultAction: "publish",
    fields: [{ name: "channel", type: "enum", values: ["blog", "social"] }],
    events: [
      { id: "cp1", emoji: "✍️", fields: { channel: "blog" } },
      { id: "cp2", emoji: "📣", fields: { channel: "social" } },
      { id: "cp3", emoji: "🙈", fields: { channel: "social" }, approve: false },
      { id: "cp4", emoji: "✍️", fields: { channel: "blog" } },
      { id: "cp5", emoji: "📣", fields: { channel: "social" } },
    ],
    checks: [
      (c) => allEnded(c.clean) && evs(c, (e) => e.approve !== false).every((t) => t.actions.some((a) => a.action === "publish")),
      (c) =>
        c.clean.traces.every((t) => t.actions.filter((a) => a.action === "publish").every((a) => a.approved)) &&
        byId(c.clean, "cp3").actions.some((a) => a.action === "task"),
      (c) => noSilent(c.stress) && evs(c, (e) => e.approve !== false).every((t) => t.actions.some((a) => a.action === "publish" && a.draft)),
    ],
  },
  {
    id: "lead-intake",
    difficulty: 3,
    trigger: "form",
    manualMin: 10,
    monthly: 150,
    defaultAction: "crm",
    fields: [
      { name: "duplicate", type: "enum", values: ["yes", "no"] },
      { name: "budget", type: "number" },
      { name: "company_size", type: "number", fromAi: "extract" },
    ],
    events: [
      { id: "ld1", emoji: "🏪", fields: { duplicate: "no", budget: 500 }, ai: { company_size: 12 } },
      { id: "ld2", emoji: "🏢", fields: { duplicate: "no", budget: 8000 }, ai: { company_size: 250 } },
      { id: "ld3", emoji: "♻️", fields: { duplicate: "yes", budget: 500 }, ai: { company_size: 5 } },
      { id: "ld4", emoji: "🏭", fields: { duplicate: "no", budget: 3000 }, ai: { company_size: 80 } },
      { id: "ld5", emoji: "🛠️", fields: { duplicate: "no", budget: 1200 }, ai: { company_size: 30 } },
      { id: "ld6", emoji: "🏙️", fields: { duplicate: "no", budget: 20000 }, ai: { company_size: 600 } },
      { id: "ld7", emoji: "♻️", fields: { duplicate: "yes", budget: 900 }, ai: { company_size: 3 } },
      { id: "ld8", emoji: "🧑‍💻", fields: { duplicate: "no", budget: 700 }, ai: { company_size: 45 } },
    ],
    checks: [
      (c) => allEnded(c.clean),
      (c) =>
        evs(c, (e) => e.fields.duplicate === "yes").every((t) => !t.actions.some((a) => a.action === "row")) &&
        evs(c, (e) => e.fields.duplicate === "no").every((t) => t.actions.some((a) => a.action === "row" || a.action === "crm")),
      (c) => {
        const sales = (t: Trace) => person(t) || t.actions.some((a) => a.action === "chat" && a.to === "team");
        const fresh = (e: SampleEvent) => e.fields.duplicate === "no";
        return (
          evs(c, (e) => fresh(e) && Number(e.ai?.company_size) > 50).every(sales) &&
          evs(c, (e) => fresh(e) && Number(e.ai?.company_size) <= 50).every((t) => !sales(t)) &&
          noSilent(c.stress)
        );
      },
    ],
  },
  {
    id: "social-monitor",
    difficulty: 3,
    trigger: "webhook",
    manualMin: 4,
    monthly: 900,
    defaultAction: "chat",
    fields: [
      { name: "followers", type: "number" },
      { name: "sentiment", type: "enum", values: ["positive", "negative", "neutral", "spam"], fromAi: "classify" },
    ],
    events: [
      { id: "sm1", emoji: "😍", fields: { followers: 25000 }, ai: { sentiment: "positive" }, clarity: 0.93 },
      { id: "sm2", emoji: "😠", fields: { followers: 1200 }, ai: { sentiment: "negative" }, clarity: 0.9 },
      { id: "sm3", emoji: "🤖", fields: { followers: 5 }, ai: { sentiment: "spam" }, clarity: 0.95 },
      { id: "sm4", emoji: "😐", fields: { followers: 300 }, ai: { sentiment: "neutral" }, clarity: 0.85 },
      { id: "sm5", emoji: "🙃", fields: { followers: 48000 }, ai: { sentiment: "negative" }, clarity: 0.6, wrong: { sentiment: "neutral" } },
      { id: "sm6", emoji: "🙂", fields: { followers: 800 }, ai: { sentiment: "positive" }, clarity: 0.9 },
      { id: "sm7", emoji: "🎁", fields: { followers: 12 }, ai: { sentiment: "spam" }, clarity: 0.66, wrong: { sentiment: "positive" }, approve: false },
      { id: "sm8", emoji: "🤩", fields: { followers: 15000 }, ai: { sentiment: "positive" }, clarity: 0.88 },
    ],
    checks: [
      (c) => allEnded(c.clean),
      (c) =>
        evs(c, (e) => e.ai?.sentiment === "spam").every((t) => t.actions.length === 0) &&
        evs(c, (e) => e.ai?.sentiment === "negative").every(person),
      (c) =>
        evs(c, (e) => e.ai?.sentiment === "positive" && Number(e.fields.followers) > 10000).every((t) =>
          t.actions.some((a) => a.action === "chat" && a.to === "team"),
        ) &&
        evs(c, (e) => (e.clarity ?? 1) < 0.7).every((t) => t.humans > 0) &&
        noSilent(c.stress),
    ],
  },
];

export const CHALLENGE_BY_ID = new Map(CHALLENGES.map((c) => [c.id, c]));
