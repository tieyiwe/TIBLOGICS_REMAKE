import { z } from "zod";
import prisma from "@/lib/prisma";
import { cachedPublicData } from "@/lib/cache/public-data";

// AI agents vs humans: the share of web traffic made by bots and AI agents,
// from published studies, updated by staff once or twice a month
// (Admin > AI Times > AI vs Humans). Shown on the home page and at
// /ai-vs-humans with every past reading and its source. Nothing here is
// measured by us: each figure names who measured it and links to it.
//
// Stored as one AdminSettings row (key "ai_traffic_meter"), newest first.

export const AI_TRAFFIC_KEY = "ai_traffic_meter";

const url = z.string().trim().url().max(500).refine((u) => /^https:\/\//i.test(u), "https only");

export const Entry = z
  .object({
    id: z.string().regex(/^[a-z0-9]{6,32}$/),
    /** When the figure was published (YYYY-MM-DD). */
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    /** Share of traffic from bots and AI agents, 0 to 100. */
    botsPct: z.number().min(0).max(100),
    humansPct: z.number().min(0).max(100),
    /** Who measured it ("Cloudflare"). */
    source: z.string().trim().min(2).max(80),
    sourceUrl: url,
    /** What was measured ("requests to websites Cloudflare serves"). */
    scope: z.string().trim().max(160).default(""),
    /** Optional: growth of AI agent traffic over a year, in percent. */
    growthPct: z.number().min(-100).max(100000).nullable().default(null),
    growthSource: z.string().trim().max(80).default(""),
    growthUrl: z.union([url, z.literal("")]).default(""),
  })
  .refine((e) => Math.abs(e.botsPct + e.humansPct - 100) <= 1, { message: "Bots and humans should add up to 100%" });

export type TrafficEntry = z.infer<typeof Entry>;

/** The first reading, used until staff save their own. */
export const DEFAULT_ENTRIES: TrafficEntry[] = [
  {
    id: "cf202606",
    date: "2026-06-04",
    botsPct: 57.4,
    humansPct: 42.6,
    source: "Cloudflare",
    sourceUrl: "https://siliconangle.com/2026/06/04/ai-agent-web-traffic-surpassed-humans-lending-weight-dead-internet-theory/",
    scope: "Requests to websites Cloudflare serves",
    growthPct: 1700,
    growthSource: "Cloudflare (via Forbes, Oct 2026)",
    growthUrl: "https://www.forbes.com/sites/jonmarkman/2026/10/01/cloudflare-says-ai-agent-traffic-grew-more-than-1700-in-the-past-year/",
  },
];

function parse(raw: string | null | undefined): TrafficEntry[] {
  if (!raw) return DEFAULT_ENTRIES;
  try {
    const data = JSON.parse(raw) as { entries?: unknown[] };
    const list = (data.entries ?? []).map((e) => Entry.safeParse(e)).filter((r) => r.success).map((r) => r.data!);
    return list.length ? sortEntries(list) : DEFAULT_ENTRIES;
  } catch {
    return DEFAULT_ENTRIES;
  }
}

export const sortEntries = (list: TrafficEntry[]) => [...list].sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));

/** Every reading, newest first (never empty). */
export async function trafficEntries(): Promise<TrafficEntry[]> {
  return cachedPublicData("site", AI_TRAFFIC_KEY, async () => {
    const row = await prisma.adminSettings.findUnique({ where: { key: AI_TRAFFIC_KEY } }).catch(() => null);
    return parse(row?.value);
  });
}

export async function saveTrafficEntries(list: TrafficEntry[]): Promise<void> {
  const value = JSON.stringify({ entries: sortEntries(list).slice(0, 120) });
  await prisma.adminSettings.upsert({ where: { key: AI_TRAFFIC_KEY }, create: { key: AI_TRAFFIC_KEY, value }, update: { value } });
}

/** For the admin: what is saved (no defaults). */
export async function savedTrafficEntries(): Promise<TrafficEntry[] | null> {
  const row = await prisma.adminSettings.findUnique({ where: { key: AI_TRAFFIC_KEY } });
  return row ? parse(row.value) : null;
}
