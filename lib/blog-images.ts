// Shared, entity-aware cover-image resolver for the blog article agents
// (News Agent chat → CREATE_POST / GENERATE_POST_FROM_TITLE, and the
// /api/blog/posts manual-create endpoint).
//
// Goal: every article the agent creates gets a real, non-null cover +
// social-preview image that actually reflects what the article is about —
// a specific person/company photo when the title names one, falling back
// to a category-relevant stock photo (never a blank/gradient-only cover).

type EntityImage = { keywords: string[]; image: string };

// Checked in order — first keyword match (case-insensitive substring of
// "title tags") wins. Keep entries to real, freely-licensed, verifiable
// photos — not generic stock.
export const ENTITY_COVER_IMAGES: EntityImage[] = [
  {
    // Elon Musk / Neuralink coverage — an actual photo of Musk, not a
    // generic "technology" stock image. NASA / Bill Ingalls, public domain
    // (US government work): Musk giving President Obama a tour of SpaceX's
    // Falcon 9 / Dragon hardware at Cape Canaveral, April 15 2010 — Musk
    // mid-explanation, gesturing/pointing at the hardware for Obama.
    keywords: ["neuralink", "elon musk"],
    image: "https://commons.wikimedia.org/wiki/Special:FilePath/Elon%20Musk%20gives%20tour%20for%20President%20Barack%20Obama.jpg?width=1200",
  },
  {
    keywords: ["openai", "chatgpt", "sam altman", "gpt-4", "gpt-5", "gpt-3"],
    image: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80",
  },
  {
    keywords: ["claude", "anthropic"],
    image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1200&q=80",
  },
  {
    keywords: ["google", "gemini", "deepmind"],
    image: "https://images.unsplash.com/photo-1573164713988-8665fc963095?auto=format&fit=crop&w=1200&q=80",
  },
  {
    keywords: ["meta", "llama", "mark zuckerberg"],
    image: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&w=1200&q=80",
  },
];

/** Case-insensitive keyword match against a title (+ optional tags). Returns the matched image, or null. */
export function findEntityCoverImage(title: string, tags: string[] = []): string | null {
  const haystack = `${title} ${tags.join(" ")}`.toLowerCase();
  for (const entry of ENTITY_COVER_IMAGES) {
    if (entry.keywords.some((k) => haystack.includes(k))) return entry.image;
  }
  return null;
}

// Category-relevant stock photo pools — used only when no specific entity
// is named in the title. Curated, real Unsplash photography (not blank
// gradients), one deterministic pick per title so re-generating the same
// title is stable.
export const CATEGORY_COVER_POOL: Record<string, string[]> = {
  "breaking": [
    "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1200&q=80",
  ],
  "ai-business": [
    "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1664575602276-acd073f104c1?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=80",
  ],
  "tips": [
    "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1484557052118-f32bd25b45b5?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1434030216411-0b793f4b6f6d?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1513258496099-48168024aec0?auto=format&fit=crop&w=1200&q=80",
  ],
  "tools": [
    "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1555949963-aa79dcee981c?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1587620962725-abab7fe55159?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=1200&q=80",
  ],
  "case-studies": [
    "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1200&q=80",
  ],
  "industry": [
    "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1573164713988-8665fc963095?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1200&q=80",
  ],
};

function pickFromPool(category: string, title: string): string {
  const pool = CATEGORY_COVER_POOL[category] ?? CATEGORY_COVER_POOL["industry"];
  const hash = title.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return pool[hash % pool.length];
}

/**
 * Resolve a real, non-null cover image for a new article: a specific
 * entity photo when the title/tags name one (e.g. "Elon Musk", "Neuralink",
 * "OpenAI"), otherwise a category-relevant stock photo. Never returns null.
 */
export function resolveCoverImage(title: string, category: string, tags: string[] = []): string {
  return findEntityCoverImage(title, tags) ?? pickFromPool(category, title);
}
