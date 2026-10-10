import { z } from "zod";
import {
  CURRENCIES,
  EXPENSE_CATEGORY_VALUES,
  HEALTH_VALUES,
  INCOME_STATUS_VALUES,
  NOTE_KIND_VALUES,
  PROJECT_CATEGORY_VALUES,
  PROJECT_PRIORITY_VALUES,
  PROJECT_STATUS_VALUES,
  TASK_PRIORITY_VALUES,
  TASK_STATUS_VALUES,
} from "./constants";
import { isDayKey } from "./dates";

// Request bodies for the Command Center and Finance APIs. Strict objects:
// unknown keys are refused rather than written through.

const id = z.string().min(1).max(64).regex(/^[A-Za-z0-9_-]+$/);
const day = z.string().refine(isDayKey, "Expected a date (YYYY-MM-DD)");
const nullableDay = day.nullable();
const text = (max: number) => z.string().trim().max(max);
const url = z
  .string()
  .trim()
  .max(2000)
  .refine((v) => /^https?:\/\//i.test(v), "Links must start with http:// or https://");
export const linkSchema = z.object({ label: text(120).default(""), url }).strict();
const links = z.array(linkSchema).max(30);
const staffId = z.string().min(1).max(64).regex(/^(owner|[A-Za-z0-9_-]+)$/);
const label = z.string().trim().toLowerCase().min(1).max(30).regex(/^[\p{L}\p{N} _-]+$/u, "Labels use letters, numbers, spaces, - and _");

export const projectCreateSchema = z
  .object({
    name: text(120).min(1, "Name the project"),
    description: text(4000).optional(),
    category: z.enum(PROJECT_CATEGORY_VALUES).default("INTERNAL"),
    status: z.enum(PROJECT_STATUS_VALUES).default("ACTIVE"),
    priority: z.enum(PROJECT_PRIORITY_VALUES).default("MEDIUM"),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
    ownerId: staffId.nullable().optional(),
    startKey: nullableDay.optional(),
    deadlineKey: nullableDay.optional(),
    templateKey: z.string().max(40).nullable().optional(),
    clientName: text(160).nullable().optional(),
    revenuePotential: z.number().int().min(0).max(100_000_000).optional(),
  })
  .strict();

export const projectPatchSchema = z
  .object({
    name: text(120).min(1),
    description: text(8000).nullable(),
    category: z.enum(PROJECT_CATEGORY_VALUES),
    status: z.enum(PROJECT_STATUS_VALUES),
    priority: z.enum(PROJECT_PRIORITY_VALUES),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    progress: z.number().int().min(0).max(100),
    progressMode: z.enum(["auto", "manual"]),
    revenueEarned: z.number().int().min(0).max(100_000_000),
    revenuePotential: z.number().int().min(0).max(100_000_000),
    monthlyRecurring: z.number().int().min(0).max(10_000_000),
    startKey: nullableDay,
    deadlineKey: nullableDay,
    starred: z.boolean(),
    archived: z.boolean(),
    notes: text(20000).nullable(),
    ownerId: staffId.nullable(),
    health: z.enum(HEALTH_VALUES),
    healthNote: text(1000).nullable(),
    goals: text(8000).nullable(),
    links,
    hourlyRateCents: z.number().int().min(0).max(10_000_000).nullable(),
    clientName: text(160).nullable(),
    clientEmail: z.string().trim().email().max(320).nullable().or(z.literal("").transform(() => null)),
    prospectId: id.nullable(),
  })
  .partial()
  .strict();

export const taskCreateSchema = z
  .object({
    projectId: id,
    title: text(500).min(1, "Give the task a title"),
    description: text(20000).optional(),
    status: z.enum(TASK_STATUS_VALUES).optional(),
    priority: z.enum(TASK_PRIORITY_VALUES).optional(),
    assigneeId: staffId.nullable().optional(),
    labels: z.array(label).max(12).optional(),
    parentId: id.nullable().optional(),
    startKey: nullableDay.optional(),
    dueKey: nullableDay.optional(),
    estimateMinutes: z.number().int().min(0).max(100_000).nullable().optional(),
    recurrence: z.enum(["weekly", "monthly"]).nullable().optional(),
    milestoneId: id.nullable().optional(),
  })
  .strict();

export const taskPatchSchema = z
  .object({
    title: text(500).min(1),
    description: text(20000).nullable(),
    status: z.enum(TASK_STATUS_VALUES),
    priority: z.enum(TASK_PRIORITY_VALUES),
    assigneeId: staffId.nullable(),
    labels: z.array(label).max(12),
    parentId: id.nullable(),
    startKey: nullableDay,
    dueKey: nullableDay,
    estimateMinutes: z.number().int().min(0).max(100_000).nullable(),
    recurrence: z.enum(["weekly", "monthly"]).nullable(),
    milestoneId: id.nullable(),
    blockedBy: z.array(id).max(20),
    links,
    projectId: id,
    order: z.number().int().min(0).max(1_000_000),
    /** Complete even when blockers are still open. */
    force: z.boolean(),
  })
  .partial()
  .strict();

export const bulkSchema = z
  .object({
    ids: z.array(id).min(1).max(200),
    action: z.enum(["status", "priority", "assign", "due", "move", "delete", "label"]),
    status: z.enum(TASK_STATUS_VALUES).optional(),
    priority: z.enum(TASK_PRIORITY_VALUES).optional(),
    assigneeId: staffId.nullable().optional(),
    dueKey: nullableDay.optional(),
    projectId: id.optional(),
    label: label.optional(),
  })
  .strict();

export const commentSchema = z
  .object({ body: text(5000).min(1, "Write a comment"), mentions: z.array(staffId).max(20).default([]) })
  .strict();

export const milestoneCreateSchema = z
  .object({ projectId: id, title: text(200).min(1), dueKey: day, description: text(2000).optional() })
  .strict();
export const milestonePatchSchema = z
  .object({ title: text(200).min(1), dueKey: day, description: text(2000).nullable(), done: z.boolean() })
  .partial()
  .strict();

export const noteCreateSchema = z
  .object({
    projectId: id,
    title: text(200).optional(),
    bodyMd: text(100_000).default(""),
    kind: z.enum(NOTE_KIND_VALUES).default("note"),
    pinned: z.boolean().optional(),
  })
  .strict();
export const notePatchSchema = z
  .object({ title: text(200).min(1), bodyMd: text(100_000), kind: z.enum(NOTE_KIND_VALUES), pinned: z.boolean() })
  .partial()
  .strict();
export const actionItemSchema = z
  .object({ line: z.number().int().min(0).max(5000), today: day })
  .strict();

export const updateCreateSchema = z
  .object({
    projectId: id,
    health: z.enum(HEALTH_VALUES),
    progress: z.number().int().min(0).max(100).optional(),
    doneMd: text(8000).default(""),
    nextMd: text(8000).default(""),
    blockersMd: text(8000).default(""),
  })
  .strict();

export const timeSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("start"), projectId: id, taskId: id.nullable().optional(), note: text(300).optional() }).strict(),
  z.object({ action: z.literal("stop") }).strict(),
  z
    .object({
      action: z.literal("log"),
      projectId: id,
      taskId: id.nullable().optional(),
      minutes: z.number().int().min(1).max(24 * 60),
      dayKey: day,
      note: text(300).optional(),
    })
    .strict(),
]);

export const savedViewSchema = z
  .object({
    name: text(60).min(1),
    filters: z
      .object({
        q: text(80).optional(),
        category: z.string().max(20).optional(),
        status: z.string().max(20).optional(),
        priority: z.string().max(20).optional(),
        owner: z.string().max(64).optional(),
        starred: z.boolean().optional(),
        health: z.string().max(20).optional(),
        view: z.string().max(20).optional(),
      })
      .strict(),
  })
  .strict();

// ── Finance ────────────────────────────────────────────────────────────────

const currency = z.enum(CURRENCIES);
const cents = z.number().int().min(0).max(2_000_000_000);
const fx = z.number().positive().max(100);
const taxLabel = text(30).nullable();

export const incomeSchema = z
  .object({
    dateKey: day,
    client: text(160).min(1, "Who paid or was invoiced?"),
    description: text(1000).nullable().optional(),
    projectId: id.nullable().optional(),
    amountCents: cents.refine((v) => v > 0, "Amount must be more than 0"),
    currency: currency.default("USD"),
    fxRate: fx.default(1),
    taxCents: cents.default(0),
    taxLabel: taxLabel.optional(),
    status: z.enum(INCOME_STATUS_VALUES).default("invoiced"),
    invoiceNumber: text(60).nullable().optional(),
    dueKey: nullableDay.optional(),
    paidKey: nullableDay.optional(),
    notes: text(4000).nullable().optional(),
  })
  .strict();
export const incomePatchSchema = incomeSchema.partial().strict();

export const expenseSchema = z
  .object({
    dateKey: day,
    vendor: text(160).min(1, "Who was paid?"),
    category: z.enum(EXPENSE_CATEGORY_VALUES),
    description: text(1000).nullable().optional(),
    projectId: id.nullable().optional(),
    amountCents: cents.refine((v) => v > 0, "Amount must be more than 0"),
    currency: currency.default("USD"),
    fxRate: fx.default(1),
    taxCents: cents.default(0),
    taxLabel: taxLabel.optional(),
    paymentMethod: text(40).nullable().optional(),
    receiptId: id.nullable().optional(),
    receiptUrl: url.nullable().optional().or(z.literal("").transform(() => null)),
    notes: text(4000).nullable().optional(),
  })
  .strict();
export const expensePatchSchema = expenseSchema.partial().strict();

export const recurringSchema = z
  .object({
    vendor: text(160).min(1),
    category: z.enum(EXPENSE_CATEGORY_VALUES),
    description: text(1000).nullable().optional(),
    projectId: id.nullable().optional(),
    amountCents: cents.refine((v) => v > 0, "Amount must be more than 0"),
    currency: currency.default("USD"),
    fxRate: fx.default(1),
    taxCents: cents.default(0),
    taxLabel: taxLabel.optional(),
    paymentMethod: text(40).nullable().optional(),
    interval: z.enum(["monthly", "annual"]).default("monthly"),
    startKey: day,
    active: z.boolean().default(true),
  })
  .strict();
export const recurringPatchSchema = recurringSchema.partial().strict();

export const budgetsSchema = z
  .object({
    budgets: z
      .array(z.object({ category: z.enum(EXPENSE_CATEGORY_VALUES), monthlyUsdCents: z.number().int().min(0).max(1_000_000_000) }).strict())
      .max(20),
  })
  .strict();

export const financeSettingsSchema = z
  .object({
    stripePercent: z.number().min(0).max(20),
    stripeFixedCents: z.number().int().min(0).max(1000),
    autoAiCosts: z.boolean(),
    autoStripeFees: z.boolean(),
    fx: z.object({ CAD: fx, EUR: fx, XOF: fx }).strict(),
  })
  .partial()
  .strict();
