import { createHash } from "crypto";
import prisma from "@/lib/prisma";
import { runClaude } from "@/lib/claude";
import { ensureGrowthTables } from "./db";
import { ensureOutreachTables } from "./outreach/db";
import { getGrowthSettings } from "./settings";
import { getLinkReport, getReportRange, kindCount } from "./reports";
import { composePost, deepLink, isPlatform, PLATFORM_INFO } from "./content/platforms";
import { shortUrl } from "./links";
import { addDays, isoWeekday, ymdIn, zonedToUtc } from "./content/times";

// Mission control for /admin_pro/growth: a prioritised "next best actions"
// feed computed from the data with deterministic rules (no model needed),
// weekly goals with progress from attribution, and a consistency streak.
// An optional one-paragraph Haiku summary is cached per distinct feed.

const DAY = 86_400_000;

export type ActionTone = "danger" | "warn" | "info" | "success" | "orange";

export type ActionButton =
  | { type: "approve-posts"; label: string; ids: string[] }
  | { type: "link"; label: string; href: string }
  | { type: "copy-open"; label: string; text: string; url: string; postId: string }
  | { type: "open-post"; label: string; postId: string };

export interface NextAction {
  id: string;
  kind: string;
  priority: number;
  tone: ActionTone;
  title: string;
  detail: string;
  primary: ActionButton;
  secondary?: ActionButton[];
}

async function attempt<T>(label: string, fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    console.error(`[growth/mission] ${label}`, err instanceof Error ? err.message : err);
    return fallback;
  }
}

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
const times = (n: number) => (n === 1 ? "once" : n === 2 ? "twice" : `${n} times`);
const SOURCE_KIND: Record<string, string> = { blog: "New article published", track: "New Learn track", lessons: "New lessons", product: "New store product", event: "New event", live: "New live session" };

// ── Next best actions ───────────────────────────────────────────────────────

export async function getNextActions(): Promise<NextAction[]> {
  await ensureGrowthTables();
  const now = Date.now();
  const actions: NextAction[] = [];

  const [drafts, ready, failed, upcoming] = await Promise.all([
    prisma.growthPost.findMany({ where: { status: "draft" }, orderBy: { scheduledAt: { sort: "asc", nulls: "last" } }, take: 500 }),
    prisma.growthPost.findMany({ where: { status: "ready" }, orderBy: { scheduledAt: "asc" }, take: 20 }),
    prisma.growthPost.findMany({ where: { status: "failed" }, select: { id: true, platform: true }, take: 50 }),
    prisma.growthPost.count({ where: { status: { in: ["scheduled", "draft"] }, scheduledAt: { gte: new Date(now), lt: new Date(now + 3 * DAY) } } }),
  ]);

  // 1. Hand-posted platforms that are due now.
  for (const p of ready.slice(0, 3)) {
    if (!isPlatform(p.platform)) continue;
    const url = p.linkCode ? shortUrl(p.linkCode) : null;
    const text = composePost({ platform: p.platform, body: p.body, hashtags: p.hashtags, shortUrl: url });
    actions.push({
      id: `ready:${p.id}`,
      kind: "manual-post",
      priority: 85,
      tone: "orange",
      title: `${PLATFORM_INFO[p.platform].label} post due now: copy & open`,
      detail: p.body.replace(/\s+/g, " ").slice(0, 110),
      primary: { type: "copy-open", label: `Copy & open ${PLATFORM_INFO[p.platform].label}`, text, url: deepLink(p.platform, text, url), postId: p.id },
      secondary: [{ type: "open-post", label: "Review", postId: p.id }],
    });
  }

  // 2. Fresh drafts from new content (repurpose automation), per item.
  const fresh = drafts.filter((d) => d.source === "repurpose" && d.sourceKey && d.createdAt.getTime() > now - 4 * DAY);
  const groups = new Map<string, typeof fresh>();
  for (const d of fresh) {
    const [kind, id] = (d.sourceKey ?? "").split(":");
    const k = `${kind}:${id}`;
    groups.set(k, [...(groups.get(k) ?? []), d]);
  }
  const blogIds = [...groups.keys()].filter((k) => k.startsWith("blog:")).map((k) => k.slice(5));
  const titles = blogIds.length
    ? new Map((await attempt("blog titles", () => prisma.blogPost.findMany({ where: { id: { in: blogIds } }, select: { id: true, title: true } }), [])).map((b) => [b.id, b.title]))
    : new Map<string, string>();
  const groupedIds = new Set<string>();
  for (const [k, list] of [...groups.entries()].slice(0, 3)) {
    const [kind, id] = k.split(":");
    list.forEach((x) => groupedIds.add(x.id));
    actions.push({
      id: `fresh:${k}`,
      kind: "new-content",
      priority: 75,
      tone: "info",
      title: `${SOURCE_KIND[kind] ?? "New content"}: ${plural(list.length, "draft")} ready`,
      detail: titles.get(id) ? `“${titles.get(id)}” on ${[...new Set(list.map((x) => (isPlatform(x.platform) ? PLATFORM_INFO[x.platform].label : x.platform)))].join(", ")}` : "Drafted automatically. Review, then approve in one click.",
      primary: { type: "approve-posts", label: `Approve ${list.length}`, ids: list.map((x) => x.id) },
      secondary: [{ type: "open-post", label: "Review first", postId: list[0].id }],
    });
  }

  // 3. The rest of this week's drafts.
  const week = drafts.filter((d) => !groupedIds.has(d.id) && d.scheduledAt && d.scheduledAt.getTime() < now + 7 * DAY);
  if (week.length) {
    const byPlat = new Map<string, number>();
    for (const d of week) byPlat.set(d.platform, (byPlat.get(d.platform) ?? 0) + 1);
    actions.push({
      id: "approve-week",
      kind: "approve-posts",
      priority: 80,
      tone: "warn",
      title: `Approve ${plural(week.length, "post")} for this week (one click)`,
      detail: [...byPlat.entries()].map(([p, n]) => `${n} ${isPlatform(p) ? PLATFORM_INFO[p].label : p}`).join(" · "),
      primary: { type: "approve-posts", label: `Approve all ${week.length}`, ids: week.map((d) => d.id) },
      secondary: [{ type: "link", label: "Review in calendar", href: "/admin_pro/growth/calendar" }],
    });
  }

  if (failed.length) {
    actions.push({
      id: "failed",
      kind: "failed-posts",
      priority: 70,
      tone: "danger",
      title: `${plural(failed.length, "post")} failed to publish: fix and retry`,
      detail: "Open the post to see the platform's error.",
      primary: { type: "open-post", label: "Open", postId: failed[0].id },
      secondary: [{ type: "link", label: "Calendar", href: "/admin_pro/growth/calendar" }],
    });
  }

  if (upcoming === 0) {
    actions.push({
      id: "empty-schedule",
      kind: "empty-week",
      priority: 60,
      tone: "info",
      title: "Nothing scheduled for the next 3 days: queue a kit",
      detail: "Pick a product and get 10 posts, 3 emails and ads in one click, or start a campaign.",
      primary: { type: "link", label: "Plan a campaign", href: "/admin_pro/growth/campaigns/new" },
      secondary: [{ type: "link", label: "New kit", href: "/admin_pro/growth/content" }],
    });
  }

  // 4. Leads: replies and link clicks (outreach tables may not exist yet).
  const leadActions = await attempt("leads", async () => {
    await ensureOutreachTables();
    const out: NextAction[] = [];
    const replied = await prisma.growthLead.findMany({
      where: { stage: { in: ["replied", "interested", "hot"] }, repliedAt: { gte: new Date(now - 14 * DAY) }, handedOverAt: null, convertedAt: null },
      orderBy: { repliedAt: "desc" },
      take: 10,
      select: { id: true, companyName: true, stage: true },
    });
    if (replied.length) {
      out.push({
        id: "replies",
        kind: "reply",
        priority: 100,
        tone: "danger",
        title: `${plural(replied.length, "hot lead")} replied: reply now`,
        detail: replied.slice(0, 4).map((l) => l.companyName).join(", ") + (replied.length > 4 ? ` and ${replied.length - 4} more` : ""),
        primary: { type: "link", label: `Open ${replied[0].companyName}`, href: `/admin_pro/growth/leads?open=${replied[0].id}` },
        secondary: [{ type: "link", label: "All leads", href: "/admin_pro/growth/leads" }],
      });
    }
    const enrolls = await prisma.outreachEnrollment.findMany({ where: { linkCode: { not: null } }, select: { leadId: true, linkCode: true }, take: 5000 });
    if (enrolls.length) {
      const byCode = new Map(enrolls.map((e) => [e.linkCode as string, e.leadId]));
      const clicks = await prisma.$queryRaw<{ linkCode: string; n: bigint }[]>`
        SELECT "linkCode", COUNT(*)::bigint AS n FROM "GrowthClick" WHERE "createdAt" >= ${new Date(now - 7 * DAY)} AND "linkCode" = ANY(${[...byCode.keys()]}::text[]) GROUP BY "linkCode" ORDER BY n DESC LIMIT 20`;
      const perLead = new Map<string, number>();
      for (const c of clicks) {
        const id = byCode.get(c.linkCode);
        if (id) perLead.set(id, (perLead.get(id) ?? 0) + Number(c.n));
      }
      const leads = perLead.size
        ? await prisma.growthLead.findMany({ where: { id: { in: [...perLead.keys()] }, stage: { notIn: ["converted", "lost"] }, doNotContact: false }, select: { id: true, companyName: true } })
        : [];
      for (const l of leads.sort((a, b) => (perLead.get(b.id) ?? 0) - (perLead.get(a.id) ?? 0)).slice(0, 3)) {
        const n = perLead.get(l.id) ?? 0;
        out.push({
          id: `clicked:${l.id}`,
          kind: "lead-clicked",
          priority: 88 + Math.min(n, 5),
          tone: "orange",
          title: `${l.companyName} opened your booking link ${times(n)}: follow up`,
          detail: "They clicked the link in your outreach email this week. A short personal note now beats the next automated step.",
          primary: { type: "link", label: "Open lead", href: `/admin_pro/growth/leads?open=${l.id}` },
        });
      }
    }
    const awaiting = await prisma.outreachMessage.count({ where: { status: "draft" } });
    if (awaiting) {
      out.push({
        id: "outreach-approve",
        kind: "approve-outreach",
        priority: 65,
        tone: "warn",
        title: `Approve ${plural(awaiting, "outreach email")}`,
        detail: "Drafted and personalised. Nothing sends until you approve. Use A, E and S to fly through the inbox.",
        primary: { type: "link", label: "Open approval inbox", href: "/admin_pro/growth/outreach" },
      });
    }
    const toEnrich = await prisma.growthLead.count({ where: { stage: "new", enrichStatus: "idle", doNotContact: false } });
    if (toEnrich >= 5) {
      out.push({
        id: "enrich",
        kind: "enrich",
        priority: 40,
        tone: "info",
        title: `Enrich and score ${toEnrich} new leads`,
        detail: "Find public emails, website gaps and the best offer for each, so outreach picks the right ones.",
        primary: { type: "link", label: "Open leads", href: "/admin_pro/growth/leads" },
      });
    }
    return out;
  }, [] as NextAction[]);
  actions.push(...leadActions);

  // 5. Channel insight from 30 days of attribution.
  const insight = await attempt("insight", async () => {
    const r = await getLinkReport(30);
    const rows = r.byPlatform.filter((p) => p.clicks >= 20 && p.key !== "(none)");
    if (rows.length < 2) return null;
    const rate = (x: typeof rows[number]) => x.signups / x.clicks;
    const sorted = [...rows].sort((a, b) => rate(b) - rate(a));
    const best = sorted[0];
    const worst = sorted[sorted.length - 1];
    if (best.signups < 3 || best === worst) return null;
    const label = (k: string) => (isPlatform(k) ? PLATFORM_INFO[k].label : k);
    const ratio = rate(worst) > 0 ? rate(best) / rate(worst) : Infinity;
    if (ratio < 2) return null;
    const title = Number.isFinite(ratio)
      ? `Your Learn sign-ups from ${label(best.key)} convert ${ratio >= 10 ? Math.round(ratio) : ratio.toFixed(1)}x ${label(worst.key)}: shift effort`
      : `${label(best.key)} brings Learn sign-ups, ${label(worst.key)} none from ${worst.clicks} clicks: shift effort`;
    return {
      id: `insight:${best.key}:${worst.key}`,
      kind: "channel-insight",
      priority: 50,
      tone: "success" as const,
      title,
      detail: `Last 30 days: ${label(best.key)} ${best.signups} sign-ups from ${best.clicks} clicks; ${label(worst.key)} ${worst.signups} from ${worst.clicks}.`,
      primary: { type: "link" as const, label: `Plan a ${label(best.key)} campaign`, href: `/admin_pro/growth/campaigns/new?channel=${encodeURIComponent(best.key)}` },
      secondary: [{ type: "link" as const, label: "See attribution", href: "/admin_pro/growth/links?days=30" }],
    };
  }, null);
  if (insight) actions.push(insight);

  // 6. News that has no trend post yet.
  const trend = await attempt("trend", async () => {
    const recent = await prisma.blogPost.findMany({ where: { published: true, createdAt: { gte: new Date(now - 2 * DAY) } }, select: { id: true, title: true }, take: 5, orderBy: { createdAt: "desc" } });
    if (!recent.length) return null;
    const done = await prisma.growthPost.count({ where: { sourceKey: { startsWith: `trend:${recent[0].id}:` } } });
    if (done) return null;
    return {
      id: `trend:${recent[0].id}`,
      kind: "trend",
      priority: 45,
      tone: "info" as const,
      title: `Trending now: turn “${recent[0].title.slice(0, 70)}” into a post`,
      detail: "Connect today's AI news to one of your products while it is fresh.",
      primary: { type: "link" as const, label: "See trend ideas", href: "/admin_pro/growth#trends" },
    };
  }, null);
  if (trend) actions.push(trend);

  // 7. Goal pace.
  const pace = await attempt("pace", async () => {
    const goals = await getGoals();
    if (!goals.signups && !goals.leads && !goals.revenueCents) return null;
    const prog = await getGoalProgress(goals);
    const frac = prog.elapsed;
    if (frac < 0.35) return null;
    const behind = prog.items.filter((i) => i.target > 0 && i.value < i.target * frac * 0.8);
    if (!behind.length) return null;
    const b = behind[0];
    return {
      id: `pace:${b.key}`,
      kind: "goal-pace",
      priority: 55,
      tone: "warn" as const,
      title: `Behind on ${b.label.toLowerCase()}: ${b.display} of ${b.targetDisplay} this week`,
      detail: "A focused campaign plans the content, links and outreach for you in a minute.",
      primary: { type: "link" as const, label: "Launch a campaign", href: "/admin_pro/growth/campaigns/new" },
    };
  }, null);
  if (pace) actions.push(pace);

  return actions.sort((a, b) => b.priority - a.priority).slice(0, 12);
}

// ── Weekly goals ────────────────────────────────────────────────────────────

export interface Goals {
  signups: number;
  leads: number;
  revenueCents: number;
  posts: number;
}
const GOALS_KEY = "goals";
const EMPTY_GOALS: Goals = { signups: 0, leads: 0, revenueCents: 0, posts: 0 };

const int = (v: unknown, max: number) => Math.max(0, Math.min(max, Math.round(Number(v) || 0)));

export function normalizeGoals(raw: unknown): Goals {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  return { signups: int(r.signups, 100_000), leads: int(r.leads, 100_000), revenueCents: int(r.revenueCents, 1_000_000_000), posts: int(r.posts, 1000) };
}

export async function getGoals(): Promise<Goals> {
  await ensureGrowthTables();
  const row = await prisma.growthContentState.findUnique({ where: { key: GOALS_KEY } });
  return row ? normalizeGoals(row.value) : EMPTY_GOALS;
}

export async function saveGoals(raw: unknown): Promise<Goals> {
  await ensureGrowthTables();
  const g = normalizeGoals(raw);
  const value = JSON.parse(JSON.stringify(g));
  await prisma.growthContentState.upsert({ where: { key: GOALS_KEY }, create: { key: GOALS_KEY, value }, update: { value } });
  return g;
}

/** Monday 00:00 of this week (and of next week) in the brand's main zone. */
async function weekBounds(): Promise<{ start: Date; end: Date; tz: string }> {
  const s = await getGrowthSettings();
  const tz = s.audiences.find((a) => a.language === s.defaultLanguage)?.timezone ?? "America/New_York";
  const today = ymdIn(new Date(), tz);
  const monday = addDays(today, 1 - isoWeekday(today));
  return { start: zonedToUtc(monday, "00:00", tz), end: zonedToUtc(addDays(monday, 7), "00:00", tz), tz };
}

export interface GoalItem {
  key: keyof Goals;
  label: string;
  value: number;
  target: number;
  display: string;
  targetDisplay: string;
  lastWeek: number;
  source: string;
}

const money = (c: number) => `$${(c / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

export async function getGoalProgress(goals?: Goals): Promise<{ items: GoalItem[]; elapsed: number; weekStart: string; tz: string }> {
  const g = goals ?? (await getGoals());
  const { start, end, tz } = await weekBounds();
  const prevStart = new Date(start.getTime() - 7 * DAY);
  const [cur, prev, leads, prevLeads, posts, prevPosts] = await Promise.all([
    getReportRange({ from: start, to: end }),
    getReportRange({ from: prevStart, to: start }),
    attempt("leads", async () => { await ensureOutreachTables(); return prisma.growthLead.count({ where: { createdAt: { gte: start, lt: end } } }); }, 0),
    attempt("leads prev", async () => { await ensureOutreachTables(); return prisma.growthLead.count({ where: { createdAt: { gte: prevStart, lt: start } } }); }, 0),
    prisma.growthPost.count({ where: { status: "published", publishedAt: { gte: start, lt: end } } }),
    prisma.growthPost.count({ where: { status: "published", publishedAt: { gte: prevStart, lt: start } } }),
  ]);
  const signups = kindCount(cur, ["learn_signup"], "count");
  const items: GoalItem[] = [
    { key: "signups", label: "Learn sign-ups", value: signups, target: g.signups, display: String(signups), targetDisplay: String(g.signups), lastWeek: kindCount(prev, ["learn_signup"], "count"), source: "Attributed to a tracked campaign" },
    { key: "leads", label: "New leads", value: leads, target: g.leads, display: String(leads), targetDisplay: String(g.leads), lastWeek: prevLeads, source: "Added to the lead workspace" },
    { key: "revenueCents", label: "Attributed revenue", value: cur.totals.revenueCents, target: g.revenueCents, display: money(cur.totals.revenueCents), targetDisplay: money(g.revenueCents), lastWeek: prev.totals.revenueCents, source: "Paid records from tracked links" },
    { key: "posts", label: "Posts published", value: posts, target: g.posts, display: String(posts), targetDisplay: String(g.posts), lastWeek: prevPosts, source: "Published or marked posted" },
  ];
  const elapsed = Math.max(0, Math.min(1, (Date.now() - start.getTime()) / (end.getTime() - start.getTime())));
  return { items, elapsed, weekStart: start.toISOString(), tz };
}

// ── Consistency streak ──────────────────────────────────────────────────────

export interface Streak {
  current: number;
  best: number;
  /** Last 14 days, oldest first: did anything go out (or get approved)? */
  days: { day: string; active: boolean; count: number }[];
}

/**
 * A day counts when marketing actually moved: a post published (or marked
 * posted), or outreach emails approved or sent.
 */
export async function getStreak(): Promise<Streak> {
  const { tz } = await weekBounds();
  const since = new Date(Date.now() - 60 * DAY);
  const [posts, msgs] = await Promise.all([
    prisma.growthPost.findMany({ where: { publishedAt: { gte: since } }, select: { publishedAt: true } }),
    attempt("msgs", async () => {
      await ensureOutreachTables();
      return prisma.outreachMessage.findMany({ where: { OR: [{ approvedAt: { gte: since } }, { sentAt: { gte: since } }] }, select: { approvedAt: true, sentAt: true } });
    }, [] as { approvedAt: Date | null; sentAt: Date | null }[]),
  ]);
  const count = new Map<string, number>();
  const bump = (d: Date | null) => {
    if (!d) return;
    const k = ymdIn(d, tz);
    count.set(k, (count.get(k) ?? 0) + 1);
  };
  posts.forEach((p) => bump(p.publishedAt));
  msgs.forEach((m) => bump(m.approvedAt ?? m.sentAt));
  const today = ymdIn(new Date(), tz);
  let current = 0;
  // Today still counts as "in progress": the streak runs to yesterday if today is empty.
  let d = count.has(today) ? today : addDays(today, -1);
  while (count.has(d)) {
    current++;
    d = addDays(d, -1);
  }
  let best = 0;
  let run = 0;
  for (let i = 59; i >= 0; i--) {
    const k = addDays(today, -i);
    run = count.has(k) ? run + 1 : 0;
    best = Math.max(best, run);
  }
  const days = Array.from({ length: 14 }, (_, i) => {
    const k = addDays(today, i - 13);
    return { day: k, active: count.has(k), count: count.get(k) ?? 0 };
  });
  return { current, best, days };
}

// ── Optional AI summary ─────────────────────────────────────────────────────

const SUMMARY_KEY = "mission-summary";

/** Two sentences on what matters today, from the action feed only (Haiku, cached per feed). */
export async function missionSummary(actions: NextAction[]): Promise<{ text: string; cached: boolean }> {
  await ensureGrowthTables();
  if (!actions.length) return { text: "You are all caught up. A good moment to plan the next campaign.", cached: true };
  const lines = actions.slice(0, 8).map((a) => `- ${a.title}${a.detail ? ` (${a.detail})` : ""}`);
  const hash = createHash("sha256").update(lines.join("\n")).digest("hex").slice(0, 24);
  const row = await prisma.growthContentState.findUnique({ where: { key: SUMMARY_KEY } });
  const v = (row?.value ?? {}) as { hash?: string; text?: string; at?: string };
  if (v.hash === hash && v.text && v.at && Date.now() - Date.parse(v.at) < 6 * 3_600_000) return { text: v.text, cached: true };
  const { text } = await runClaude("growth-ideas", {
    system: "You are a calm, practical marketing chief of staff for a solo founder who builds products and has little time for marketing. Write exactly two short sentences: what to do first today and why, based ONLY on the list given. Do not add numbers, names or facts that are not in the list. No em dashes, no hype, no greeting.",
    messages: [{ role: "user", content: `Today's action list, most important first:\n${lines.join("\n")}` }],
    maxTokens: 160,
    meta: { ref: "growth-mission" },
  });
  const clean = text.replace(/\s+/g, " ").replace(/[—–]/g, ",").trim().slice(0, 400);
  const value = { hash, text: clean, at: new Date().toISOString() };
  await prisma.growthContentState.upsert({ where: { key: SUMMARY_KEY }, create: { key: SUMMARY_KEY, value }, update: { value } });
  return { text: clean, cached: false };
}
