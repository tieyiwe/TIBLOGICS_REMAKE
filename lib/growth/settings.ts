import prisma from "@/lib/prisma";
import { ensureGrowthTables } from "./db";
import { isLanguage, isPlatform, type Language, type Platform } from "./content/platforms";

// Brand voice and audiences: every Growth generation (kits, repurposed posts)
// is written against these. One row, id "default", in GrowthSettings.

export interface Audience {
  id: string;
  name: string;
  region: string;
  /** IANA zone used for best-time suggestions. */
  timezone: string;
  language: Language;
  pains: string;
  goals: string;
  channels: Platform[];
}

export interface GrowthSettingsData {
  brandName: string;
  voice: string;
  offers: string[];
  proofPoints: string[];
  bannedClaims: string[];
  brandHashtags: string[];
  audiences: Audience[];
  defaultLanguage: Language;
}

export const DEFAULT_SETTINGS: GrowthSettingsData = {
  brandName: "TIBLOGICS",
  voice:
    "Practical, warm and confident. Plain language over jargon. We show how AI saves time and money in real businesses, with concrete examples. Never hype, never fear-mongering. Short sentences. We speak to owners and professionals as peers.",
  offers: [
    "AI implementation services: custom AI agents and workflow automation for businesses",
    "TIBLOGICS AI Academy (ARFA: AI Readiness For All): self-paced AI tracks with certificates",
    "Free AI tools: Website AI Scanner, AI Product Cost Calculator",
  ],
  proofPoints: [],
  bannedClaims: [
    "guaranteed results",
    "get rich",
    "replace all your staff",
    "100% accurate",
    "risk-free",
    "#1",
  ],
  brandHashtags: ["TIBLOGICS"],
  audiences: [
    {
      id: "smb-na",
      name: "SMB owners, North America",
      region: "United States and Canada",
      timezone: "America/New_York",
      language: "en",
      pains: "Too much admin work, slow follow-up with leads, not sure which AI tools are worth paying for.",
      goals: "Save hours each week, respond faster to customers, grow without hiring.",
      channels: ["linkedin", "facebook", "x"],
    },
    {
      id: "francophone-africa",
      name: "Francophone Africa (business owners and professionals)",
      region: "Côte d'Ivoire, Burkina Faso, Senegal, Cameroon and neighbours",
      timezone: "Africa/Abidjan",
      language: "fr",
      pains: "Few AI resources in French, limited budgets, mobile-first customers on WhatsApp.",
      goals: "Use AI tools practically in French, gain skills that create income and jobs.",
      channels: ["whatsapp", "facebook", "linkedin"],
    },
    {
      id: "parents",
      name: "Parents",
      region: "North America and Africa",
      timezone: "America/New_York",
      language: "en",
      pains: "Worried about how kids use AI, unsure how to guide them safely.",
      goals: "Understand AI well enough to set rules and help with homework responsibly.",
      channels: ["facebook", "instagram", "whatsapp"],
    },
    {
      id: "professionals",
      name: "Working professionals",
      region: "North America",
      timezone: "America/New_York",
      language: "en",
      pains: "Fear of falling behind, AI tools change every week, no time for long courses.",
      goals: "Become the AI-fluent person on the team; a certificate to show for it.",
      channels: ["linkedin", "x"],
    },
  ],
  defaultLanguage: "en",
};

const str = (v: unknown, max: number, fallback = "") => (typeof v === "string" ? v.trim().slice(0, max) : fallback);
const list = (v: unknown, maxItems: number, maxLen: number) =>
  (Array.isArray(v) ? v : typeof v === "string" ? v.split("\n") : [])
    .map((x) => (typeof x === "string" ? x.trim().slice(0, maxLen) : ""))
    .filter(Boolean)
    .slice(0, maxItems);

function validZone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/** Accepts anything (stored JSON or a request body) and returns clean settings. */
export function normalizeSettings(raw: unknown): GrowthSettingsData {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const audiences = (Array.isArray(r.audiences) ? r.audiences : DEFAULT_SETTINGS.audiences)
    .slice(0, 12)
    .map((a, i): Audience | null => {
      const o = (a && typeof a === "object" ? a : {}) as Record<string, unknown>;
      const name = str(o.name, 120);
      if (!name) return null;
      const id = str(o.id, 40).toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/^-+|-+$/g, "") || `audience-${i + 1}`;
      const tz = str(o.timezone, 60, "UTC");
      return {
        id,
        name,
        region: str(o.region, 200),
        timezone: validZone(tz) ? tz : "UTC",
        language: isLanguage(o.language) ? o.language : "en",
        pains: str(o.pains, 1000),
        goals: str(o.goals, 1000),
        channels: (Array.isArray(o.channels) ? o.channels : []).filter(isPlatform).slice(0, 5),
      };
    })
    .filter((a): a is Audience => !!a);
  // Ids must be unique; later duplicates get a suffix.
  const seen = new Set<string>();
  for (const a of audiences) {
    let id = a.id;
    for (let n = 2; seen.has(id); n++) id = `${a.id}-${n}`;
    a.id = id;
    seen.add(id);
  }
  return {
    brandName: str(r.brandName, 80, DEFAULT_SETTINGS.brandName) || DEFAULT_SETTINGS.brandName,
    voice: str(r.voice, 3000, DEFAULT_SETTINGS.voice),
    offers: r.offers === undefined ? DEFAULT_SETTINGS.offers : list(r.offers, 30, 300),
    proofPoints: r.proofPoints === undefined ? DEFAULT_SETTINGS.proofPoints : list(r.proofPoints, 30, 300),
    bannedClaims: r.bannedClaims === undefined ? DEFAULT_SETTINGS.bannedClaims : list(r.bannedClaims, 50, 120),
    brandHashtags: (r.brandHashtags === undefined ? DEFAULT_SETTINGS.brandHashtags : list(r.brandHashtags, 10, 40)).map((h) =>
      h.replace(/^#/, "").replace(/\s+/g, ""),
    ),
    audiences: audiences.length ? audiences : DEFAULT_SETTINGS.audiences,
    defaultLanguage: isLanguage(r.defaultLanguage) ? r.defaultLanguage : "en",
  };
}

export async function getGrowthSettings(): Promise<GrowthSettingsData> {
  try {
    await ensureGrowthTables();
    const row = await prisma.growthSettings.findUnique({ where: { id: "default" } });
    return row ? normalizeSettings(row.data) : DEFAULT_SETTINGS;
  } catch (err) {
    console.error("[growth/settings] read", err);
    return DEFAULT_SETTINGS;
  }
}

export async function saveGrowthSettings(raw: unknown): Promise<GrowthSettingsData> {
  await ensureGrowthTables();
  const data = normalizeSettings(raw);
  const json = JSON.parse(JSON.stringify(data));
  await prisma.growthSettings.upsert({
    where: { id: "default" },
    create: { id: "default", data: json },
    update: { data: json },
  });
  return data;
}

export function findAudience(s: GrowthSettingsData, id: string | null | undefined): Audience | null {
  return s.audiences.find((a) => a.id === id) ?? null;
}

const LANG_NAME: Record<Language, string> = { en: "English", fr: "French (as written in West/Central Africa: clear, warm, vous form)", sw: "Swahili" };

/** The brand block every Growth system prompt starts with. */
export function brandBrief(s: GrowthSettingsData, audience: Audience | null, language: Language): string {
  const lines = [
    `Brand: ${s.brandName}.`,
    `Brand voice: ${s.voice}`,
    s.offers.length ? `What the brand sells (context only):\n${s.offers.map((o) => `- ${o}`).join("\n")}` : "",
    s.proofPoints.length
      ? `Approved proof points (the ONLY brand-level facts, numbers or results you may cite):\n${s.proofPoints.map((o) => `- ${o}`).join("\n")}`
      : "There are no approved brand proof points: do not cite any results, client counts or statistics about the brand.",
    s.bannedClaims.length ? `Never say or imply any of these banned claims:\n${s.bannedClaims.map((o) => `- ${o}`).join("\n")}` : "",
    audience
      ? `Target audience: ${audience.name} (${audience.region}). Their pains: ${audience.pains} Their goals: ${audience.goals}`
      : "Target audience: small business owners and professionals interested in practical AI.",
    `Write every piece of copy in ${LANG_NAME[language]}. Hashtags may stay in English when that is what the audience searches.`,
    s.brandHashtags.length ? `Brand hashtags you may add: ${s.brandHashtags.map((h) => `#${h}`).join(" ")}` : "",
  ];
  return lines.filter(Boolean).join("\n\n");
}
