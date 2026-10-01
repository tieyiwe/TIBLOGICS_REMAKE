import { randomBytes } from "crypto";
import { existsSync } from "fs";
import path from "path";
import type { GrowthCampaign, Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { runClaude } from "@/lib/claude";
import { ensureGrowthTables } from "./db";
import { ensureOutreachTables } from "./outreach/db";
import { getCatalog, getCatalogItem, type CatalogItem } from "./catalog";
import { brandBrief, findAudience, getGrowthSettings } from "./settings";
import { createLink, shortUrl } from "./links";
import { getLinkReport, getReportRange, kindCount, type LinkReport, type Row } from "./reports";
import { extractJson, generateKit, KitError, queueKitPosts } from "./content/kit";
import { isLanguage, isPlatform, PLATFORM_INFO, type Language } from "./content/platforms";
import { OFFERS } from "./outreach/offers";
import { STAGE_KEYS } from "./outreach/shared";
import { DEFAULT_STEPS, parseSteps, slugify, type SequenceStep } from "./outreach/templates";
import { checkText, claimContext } from "./content/claims";

// Campaign Copilot: a goal ("20 Learn sign-ups by the 30th"), products,
// audience, budget and dates become a plan (one Sonnet call: channel mix,
// cadence, outreach target criteria, a lead magnet idea, KPIs). One click
// then creates everything as DRAFTS under one utm_campaign: a content kit
// with its posts queued on the calendar (each with a tracked link), share
// links per channel, and an outreach sequence with its lead filter. Nothing
// publishes or sends without the usual approvals.

export const GOAL_TYPES = [
  { key: "signups", label: "Learn sign-ups", unit: "sign-ups" },
  { key: "calls", label: "Discovery calls booked", unit: "calls" },
  { key: "sales", label: "Sales", unit: "sales" },
  { key: "revenue", label: "Revenue (USD)", unit: "USD" },
  { key: "leads", label: "Warm leads (replies and bookings)", unit: "leads" },
] as const;
export type GoalType = (typeof GOAL_TYPES)[number]["key"];
export const isGoalType = (v: unknown): v is GoalType => GOAL_TYPES.some((g) => g.key === v);

export const PLAN_CHANNELS = ["linkedin", "x", "facebook", "instagram", "whatsapp", "email", "outreach", "ads"] as const;
export type PlanChannel = (typeof PLAN_CHANNELS)[number];
export const CHANNEL_LABEL: Record<PlanChannel, string> = {
  linkedin: "LinkedIn", x: "X", facebook: "Facebook", instagram: "Instagram", whatsapp: "WhatsApp Status",
  email: "Newsletter email", outreach: "Cold outreach", ads: "Paid ads",
};

export interface CampaignInput {
  goalType: GoalType;
  goalTarget: number;
  goalLabel: string;
  productKeys: string[];
  audienceId: string | null;
  language: Language;
  hoursPerWeek: number;
  adBudget: number;
  startDate: string;
  endDate: string;
  notes: string;
}

export interface LeadFilter {
  industries: string[];
  areas: string[];
  minScore: number;
  stages: string[];
  hasEmail: boolean;
}

export interface CampaignPlan {
  name: string;
  summary: string;
  channels: { channel: PlanChannel; share: number; why: string }[];
  cadence: { channel: PlanChannel; perWeek: number; note: string }[];
  weekly: { week: number; focus: string; actions: string[] }[];
  outreach: { enabled: boolean; filter: LeadFilter; offerKey: string | null; why: string; steps: SequenceStep[] };
  leadMagnet: { title: string; format: string; hook: string; why: string } | null;
  kpis: { name: string; target: string; how: string }[];
  risks: string[];
  warnings: string[];
}

export class CampaignError extends Error {}

const str = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/[—–]/g, ",").trim().slice(0, max) : "");
const arr = (v: unknown) => (Array.isArray(v) ? v : []);
const strs = (v: unknown, n: number, max = 200) => arr(v).map((x) => str(x, max)).filter(Boolean).slice(0, n);
const ymdOk = (v: unknown): v is string => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v));

export function normalizeInput(raw: unknown): CampaignInput {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  if (!isGoalType(r.goalType)) throw new CampaignError("Pick a goal.");
  const goalTarget = Math.round(Number(r.goalTarget));
  if (!(goalTarget >= 1 && goalTarget <= 10_000_000)) throw new CampaignError("Set a target number for the goal.");
  const productKeys = [...new Set(strs(r.productKeys, 3, 200))];
  if (!productKeys.length) throw new CampaignError("Pick at least one product.");
  const today = new Date().toISOString().slice(0, 10);
  const startDate = ymdOk(r.startDate) ? r.startDate : today;
  const endDate = ymdOk(r.endDate) && r.endDate > startDate ? r.endDate : new Date(Date.parse(startDate) + 27 * 86_400_000).toISOString().slice(0, 10);
  if (Date.parse(endDate) - Date.parse(startDate) > 180 * 86_400_000) throw new CampaignError("Keep a campaign under six months.");
  const g = GOAL_TYPES.find((x) => x.key === r.goalType)!;
  return {
    goalType: r.goalType,
    goalTarget,
    goalLabel: str(r.goalLabel, 120) || `${goalTarget} ${g.unit}`,
    productKeys,
    audienceId: str(r.audienceId, 60) || null,
    language: isLanguage(r.language) ? r.language : "en",
    hoursPerWeek: Math.max(0, Math.min(60, Math.round(Number(r.hoursPerWeek) || 2))),
    adBudget: Math.max(0, Math.min(1_000_000, Math.round(Number(r.adBudget) || 0))),
    startDate,
    endDate,
    notes: str(r.notes, 600),
  };
}

function normalizeFilter(raw: unknown): LeadFilter {
  const o = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  return {
    industries: strs(o.industries, 8, 60),
    areas: strs(o.areas, 8, 60),
    minScore: Math.max(0, Math.min(100, Math.round(Number(o.minScore) || 0))),
    stages: strs(o.stages, 8, 30).filter((s) => STAGE_KEYS.includes(s) && !["replied", "interested", "hot", "converted", "lost"].includes(s)),
    hasEmail: o.hasEmail !== false,
  };
}

export function normalizePlan(raw: unknown): CampaignPlan {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const isCh = (c: unknown): c is PlanChannel => typeof c === "string" && (PLAN_CHANNELS as readonly string[]).includes(c);
  const chan = (c: unknown) => (c === "twitter" ? "x" : c);
  const channels = arr(r.channels)
    .map((x) => {
      const o = (x ?? {}) as Record<string, unknown>;
      const c = chan(o.channel);
      return isCh(c) ? { channel: c, share: Math.max(0, Math.min(100, Math.round(Number(o.share) || 0))), why: str(o.why, 240) } : null;
    })
    .filter((x): x is CampaignPlan["channels"][number] => !!x)
    .slice(0, 8);
  const cadence = arr(r.cadence)
    .map((x) => {
      const o = (x ?? {}) as Record<string, unknown>;
      const c = chan(o.channel);
      return isCh(c) ? { channel: c, perWeek: Math.max(0, Math.min(21, Math.round(Number(o.perWeek) || 0))), note: str(o.note, 200) } : null;
    })
    .filter((x): x is CampaignPlan["cadence"][number] => !!x)
    .slice(0, 8);
  const weekly = arr(r.weekly)
    .map((x, i) => {
      const o = (x ?? {}) as Record<string, unknown>;
      return { week: Math.max(1, Math.round(Number(o.week) || i + 1)), focus: str(o.focus, 160), actions: strs(o.actions, 6, 200) };
    })
    .filter((w) => w.focus || w.actions.length)
    .slice(0, 12);
  const o = (r.outreach && typeof r.outreach === "object" ? r.outreach : {}) as Record<string, unknown>;
  const steps = parseSteps(o.steps).map((s) => ({ ...s, subject: s.subject.replace(/^\s*(re|fwd?)\s*:\s*/i, "") }));
  const lm = (r.leadMagnet && typeof r.leadMagnet === "object" ? r.leadMagnet : null) as Record<string, unknown> | null;
  const kpis = arr(r.kpis)
    .map((x) => {
      const k = (x ?? {}) as Record<string, unknown>;
      return { name: str(k.name, 80), target: str(typeof k.target === "number" ? String(k.target) : k.target, 40), how: str(k.how, 200) };
    })
    .filter((k) => k.name)
    .slice(0, 8);
  return {
    name: str(r.name, 80) || "New campaign",
    summary: str(r.summary, 700),
    channels,
    cadence,
    weekly,
    outreach: {
      enabled: o.enabled !== false && (steps.length > 0 || o.enabled === true),
      filter: normalizeFilter(o.filter ?? o.criteria),
      offerKey: OFFERS.some((x) => x.key === o.offerKey) ? (o.offerKey as string) : null,
      why: str(o.why, 300),
      steps: steps.length ? steps : DEFAULT_STEPS,
    },
    leadMagnet: lm && str(lm.title, 120) ? { title: str(lm.title, 120), format: str(lm.format, 60), hook: str(lm.hook, 200), why: str(lm.why, 240) } : null,
    kpis,
    risks: strs(r.risks, 5, 240),
    warnings: strs(r.warnings, 20, 300),
  };
}

const PLAN_RULES = `You are a pragmatic growth strategist for TIBLOGICS, a small AI company run by a founder who builds products and has little time for marketing. Plan ONE focused campaign that reaches the goal with minimum effort. Return ONE JSON object and nothing else:
{
  "name": "short campaign name, max 5 words",
  "summary": "3 sentences: the angle, why it should work for this audience, and the effort it needs",
  "channels": [{"channel":"linkedin|x|facebook|instagram|whatsapp|email|outreach|ads","share":40,"why":"..."}],
  "cadence": [{"channel":"...","perWeek":3,"note":"best days/times"}],
  "weekly": [{"week":1,"focus":"...","actions":["concrete action", "..."]}],
  "outreach": {"enabled": true, "why":"...", "offerKey":"<key from OFFERS or null>", "filter":{"industries":["..."],"areas":["..."],"minScore":50,"stages":["new","enriched"],"hasEmail":true}, "steps":[{"dayOffset":0,"subject":"...","body":"...","personalise":true}]},
  "leadMagnet": {"title":"...","format":"checklist|template|mini-course|calculator|guide","hook":"one line","why":"..."},
  "kpis": [{"name":"...","target":"...","how":"how it is measured in TIBLOGICS Growth (tracked links, attribution)"}],
  "risks": ["..."]
}

Rules:
- Channel shares add up to 100. Use at most 4 channels. Respect the time budget: fewer channels when time is short. Use "ads" only when an ad budget is given.
- Use the PAST PERFORMANCE numbers if given to pick channels; never invent statistics, benchmarks, conversion rates, client names or results. KPI targets are targets, derived from the goal.
- Product claims only from PRODUCT FACTS. Never use a banned claim.
- Outreach is B2B cold email that the owner approves one by one: only enable it when the goal fits business buyers. Steps: 2-3, plain text under 110 words, merge fields {{firstName}} {{company}} {{industry}} {{area}} {{opener}} {{offer}} {{offerUrl}} {{bookingUrl}} {{senderName}}; step 1 uses {{opener}} with personalise true; every step ends with {{senderName}}; honest subjects (no "Re:"). If outreach is off, return "enabled": false and empty steps.
- Weekly plan covers every week of the campaign window, 2-4 concrete actions each. No em dashes.`;

function productBlock(items: CatalogItem[]): string {
  return items.map((i) => `PRODUCT ${i.key}: ${i.title} (${i.type})${i.price ? `, ${i.price}` : ""}\nLanding page: ${i.url}\nPRODUCT FACTS:\n${i.facts.map((f) => `- ${f}`).join("\n")}`).join("\n\n");
}

function perfBlock(r: LinkReport): string {
  const rows = r.byPlatform.filter((p) => p.clicks > 0 || p.signups > 0 || p.conversions > 0).slice(0, 8);
  if (!rows.length) return "PAST PERFORMANCE: no tracked data yet.";
  return `PAST PERFORMANCE (last 30 days, by utm_source): ${rows.map((p: Row) => `${p.key}: ${p.clicks} clicks, ${p.signups} sign-ups, ${p.conversions} conversions`).join("; ")}.`;
}

export async function planCampaign(input: CampaignInput): Promise<CampaignPlan> {
  const [settings, items, perf] = await Promise.all([
    getGrowthSettings(),
    Promise.all(input.productKeys.map((k) => getCatalogItem(k))),
    getLinkReport(30).catch(() => null),
  ]);
  const products = items.filter((x): x is CatalogItem => !!x);
  if (!products.length) throw new CampaignError("Those products are no longer in the catalog.");
  const audience = findAudience(settings, input.audienceId);
  const goal = GOAL_TYPES.find((g) => g.key === input.goalType)!;
  const weeks = Math.max(1, Math.ceil((Date.parse(input.endDate) - Date.parse(input.startDate) + 86_400_000) / (7 * 86_400_000)));
  const user = [
    `GOAL: ${input.goalTarget} ${goal.unit} (${input.goalLabel}) between ${input.startDate} and ${input.endDate} (${weeks} week${weeks > 1 ? "s" : ""}).`,
    `BUDGET: ${input.hoursPerWeek} hours per week of the founder's time; ${input.adBudget ? `$${input.adBudget} total for ads` : "no ad budget"}.`,
    input.notes ? `NOTES FROM THE FOUNDER: ${input.notes}` : "",
    productBlock(products),
    `OFFERS (for outreach offerKey): ${OFFERS.map((o) => `${o.key} = ${o.name}`).join("; ")}`,
    perf ? perfBlock(perf) : "",
    "Write the plan now as JSON.",
  ].filter(Boolean).join("\n\n");
  const { text, stopReason } = await runClaude("growth-campaign", {
    system: `${PLAN_RULES}\n\n${brandBrief(settings, audience, input.language)}`,
    messages: [{ role: "user", content: user }],
    meta: { ref: `growth-campaign:${input.productKeys[0]}` },
  });
  if (stopReason === "max_tokens") throw new CampaignError("The plan was cut off. Try again.");
  let plan: CampaignPlan;
  try {
    plan = normalizePlan(extractJson(text));
  } catch (err) {
    if (err instanceof KitError) throw new CampaignError(err.message);
    throw err;
  }
  if (!plan.channels.length) throw new CampaignError("The plan had no channels. Try again.");
  // Same claim checks as kits: summary and outreach copy.
  const ctx = claimContext(products.flatMap((p) => p.facts), settings);
  plan.warnings = [
    ...checkText("Summary", plan.summary, ctx),
    ...plan.outreach.steps.flatMap((s, i) => checkText(`Outreach step ${i + 1}`, `${s.subject} ${s.body}`, ctx)),
    ...(plan.leadMagnet ? checkText("Lead magnet", `${plan.leadMagnet.title} ${plan.leadMagnet.hook}`, ctx) : []),
  ];
  return plan;
}

/** Whether the acquisition module (lead magnets, /free) is installed. */
export function acquireAvailable(): boolean {
  try {
    return existsSync(path.join(process.cwd(), "lib", "growth", "acquire")) && existsSync(path.join(process.cwd(), "app", "(admin)", "admin_pro", "growth", "acquire"));
  } catch {
    return false;
  }
}

export interface CampaignAssets {
  kitId?: string | null;
  postsQueued?: number;
  links?: { code: string; channel: string; url: string }[];
  sequenceId?: string | null;
  errors?: string[];
}

/** Creates the campaign and every asset as drafts. Partial failures are recorded, not fatal. */
export async function launchCampaign(input: CampaignInput, planRaw: unknown): Promise<GrowthCampaign> {
  await ensureGrowthTables();
  const plan = normalizePlan(planRaw);
  const product = await getCatalogItem(input.productKeys[0]);
  if (!product) throw new CampaignError("That product is no longer in the catalog.");
  // One slug for everything: the kit, every link, and the outreach sequence
  // (whose booking links use slugify(sequence name) as their campaign).
  const seqName = `${plan.name.slice(0, 30).trim()} ${randomBytes(2).toString("hex")}`;
  const slug = slugify(seqName);
  const assets: CampaignAssets = { links: [], errors: [] };

  const campaign = await prisma.growthCampaign.create({
    data: {
      slug,
      name: plan.name,
      status: "active",
      goalType: input.goalType,
      goalTarget: input.goalTarget,
      goalLabel: input.goalLabel,
      productKeys: input.productKeys,
      audienceId: input.audienceId,
      language: input.language,
      budget: { hoursPerWeek: input.hoursPerWeek, adBudget: input.adBudget, notes: input.notes },
      startDate: new Date(`${input.startDate}T00:00:00Z`),
      endDate: new Date(`${input.endDate}T23:59:59Z`),
      plan: JSON.parse(JSON.stringify(plan)),
      leadFilter: JSON.parse(JSON.stringify(plan.outreach.filter)),
    },
  });

  // 1. Content kit, renamed to the campaign slug, posts queued as drafts.
  try {
    const kit = await generateKit({ productKey: product.key, language: input.language, audienceId: input.audienceId });
    await prisma.growthKit.update({ where: { id: kit.id }, data: { slug } });
    assets.kitId = kit.id;
    const start = input.startDate > new Date().toISOString().slice(0, 10) ? input.startDate : undefined;
    const q = await queueKitPosts(kit.id, start);
    assets.postsQueued = q.created;
  } catch (err) {
    assets.errors!.push(`Kit: ${err instanceof Error ? err.message : String(err)}`);
  }

  // 2. A share link per channel (bio link, WhatsApp, newsletter...).
  for (const c of plan.channels) {
    if (c.channel === "outreach") continue;
    try {
      const source = c.channel === "email" ? "newsletter" : c.channel === "ads" ? "ads" : c.channel;
      const link = await createLink({
        targetUrl: product.url || "/",
        utmSource: source,
        utmMedium: c.channel === "email" ? "email" : c.channel === "ads" ? "ads" : "social",
        utmCampaign: slug,
        utmContent: "campaign-share",
        label: `${plan.name}: ${CHANNEL_LABEL[c.channel]} share link`,
        kitId: assets.kitId ?? null,
      });
      assets.links!.push({ code: link.code, channel: c.channel, url: shortUrl(link.code) });
    } catch (err) {
      assets.errors!.push(`Link (${c.channel}): ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // 3. Outreach sequence (no one is enrolled: the campaign page shows who matches).
  if (plan.outreach.enabled) {
    try {
      await ensureOutreachTables();
      const f = plan.outreach.filter;
      const seq = await prisma.outreachSequence.create({
        data: {
          name: seqName,
          description: `Campaign "${plan.name}". Targets: ${[f.industries.join(", "), f.areas.join(", "), f.minScore ? `score ${f.minScore}+` : ""].filter(Boolean).join(" · ") || "any lead"}.`,
          status: "active",
          offerKey: plan.outreach.offerKey,
          steps: plan.outreach.steps as unknown as Prisma.InputJsonValue,
        },
      });
      assets.sequenceId = seq.id;
    } catch (err) {
      assets.errors!.push(`Sequence: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return prisma.growthCampaign.update({
    where: { id: campaign.id },
    data: { kitId: assets.kitId ?? null, sequenceId: assets.sequenceId ?? null, assets: JSON.parse(JSON.stringify(assets)) },
  });
}

// ── Leads that match a campaign's filter ────────────────────────────────────

export async function matchLeads(filter: LeadFilter, limit = 200) {
  await ensureOutreachTables();
  const where: Prisma.GrowthLeadWhereInput = {
    doNotContact: false,
    stage: { in: filter.stages.length ? filter.stages : ["new", "enriched", "contacted"] },
    ...(filter.hasEmail ? { email: { not: null } } : {}),
    ...(filter.minScore ? { score: { gte: filter.minScore } } : {}),
  };
  const and: Prisma.GrowthLeadWhereInput[] = [];
  if (filter.industries.length) and.push({ OR: filter.industries.map((i) => ({ industry: { contains: i, mode: "insensitive" as const } })) });
  if (filter.areas.length) and.push({ OR: filter.areas.map((a) => ({ area: { contains: a, mode: "insensitive" as const } })) });
  if (and.length) where.AND = and;
  const [count, leads] = await Promise.all([
    prisma.growthLead.count({ where }),
    prisma.growthLead.findMany({ where, orderBy: [{ score: { sort: "desc", nulls: "last" } }, { updatedAt: "desc" }], take: limit, select: { id: true, companyName: true, industry: true, area: true, score: true, email: true, stage: true } }),
  ]);
  return { count, leads };
}

// ── Progress ────────────────────────────────────────────────────────────────

export interface CampaignProgress {
  value: number;
  target: number;
  display: string;
  targetDisplay: string;
  pct: number;
  /** Fraction of the campaign window elapsed (0-1). */
  elapsed: number;
  daysLeft: number;
  onTrack: boolean;
  report: LinkReport;
  posts: Record<string, number>;
  enrolled: number;
  replied: number;
}

const money = (c: number) => `$${Math.round(c / 100).toLocaleString("en-US")}`;

export async function campaignProgress(c: GrowthCampaign): Promise<CampaignProgress> {
  const to = new Date(Math.min(Date.now() + 86_400_000, c.endDate.getTime() + 86_400_000));
  const [report, postRows, seqStats] = await Promise.all([
    getReportRange({ from: c.startDate < c.createdAt ? c.startDate : c.createdAt, to, campaign: c.slug }),
    c.kitId ? prisma.growthPost.groupBy({ by: ["status"], where: { kitId: c.kitId }, _count: { _all: true } }) : Promise.resolve([]),
    (async () => {
      if (!c.sequenceId) return { enrolled: 0, replied: 0 };
      try {
        await ensureOutreachTables();
        const enr = await prisma.outreachEnrollment.findMany({ where: { sequenceId: c.sequenceId }, select: { leadId: true } });
        const replied = enr.length ? await prisma.growthLead.count({ where: { id: { in: enr.map((e) => e.leadId) }, repliedAt: { not: null } } }) : 0;
        return { enrolled: enr.length, replied };
      } catch {
        return { enrolled: 0, replied: 0 };
      }
    })(),
  ]);
  let value = 0;
  switch (c.goalType) {
    case "signups": value = kindCount(report, ["learn_signup"], "count"); break;
    case "calls": value = kindCount(report, ["appointment"]); break;
    case "sales": value = report.totals.conversions - kindCount(report, ["appointment", "event_registration"]); break;
    case "revenue": value = report.totals.revenueCents; break;
    case "leads": value = seqStats.replied + kindCount(report, ["appointment"]); break;
  }
  const target = c.goalType === "revenue" ? c.goalTarget * 100 : c.goalTarget;
  const span = Math.max(1, c.endDate.getTime() - c.startDate.getTime());
  const elapsed = Math.max(0, Math.min(1, (Date.now() - c.startDate.getTime()) / span));
  const pct = target ? Math.min(100, Math.round((value / target) * 100)) : 0;
  return {
    value,
    target,
    display: c.goalType === "revenue" ? money(value) : String(value),
    targetDisplay: c.goalType === "revenue" ? money(target) : String(target),
    pct,
    elapsed,
    daysLeft: Math.max(0, Math.ceil((c.endDate.getTime() - Date.now()) / 86_400_000)),
    onTrack: value >= target * elapsed * 0.9,
    report,
    posts: Object.fromEntries(postRows.map((r) => [r.status, r._count._all])),
    enrolled: seqStats.enrolled,
    replied: seqStats.replied,
  };
}

export function campaignDTO(c: GrowthCampaign) {
  return {
    id: c.id,
    slug: c.slug,
    name: c.name,
    status: c.status,
    goalType: c.goalType as GoalType,
    goalTarget: c.goalTarget,
    goalLabel: c.goalLabel,
    productKeys: (Array.isArray(c.productKeys) ? c.productKeys : []) as string[],
    audienceId: c.audienceId,
    language: c.language,
    budget: c.budget as { hoursPerWeek?: number; adBudget?: number; notes?: string },
    startDate: c.startDate.toISOString(),
    endDate: c.endDate.toISOString(),
    plan: normalizePlan(c.plan),
    leadFilter: normalizeFilter(c.leadFilter),
    kitId: c.kitId,
    sequenceId: c.sequenceId,
    assets: (c.assets ?? {}) as CampaignAssets,
    createdAt: c.createdAt.toISOString(),
  };
}
export type CampaignDTO = ReturnType<typeof campaignDTO>;

/** Products for the wizard (what can be marketed). */
export async function campaignProducts() {
  const all = await getCatalog();
  return all
    .filter((i) => i.type !== "article")
    .map((i) => ({ key: i.key, type: i.type, title: i.title, summary: i.summary.slice(0, 160), price: i.price ?? null, url: i.url }));
}

export function channelLabel(c: string): string {
  return (CHANNEL_LABEL as Record<string, string>)[c] ?? (isPlatform(c) ? PLATFORM_INFO[c].label : c);
}
