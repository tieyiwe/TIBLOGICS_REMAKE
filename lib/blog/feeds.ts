// Advanced-tech news sources for the AI Times news agent
// (app/api/blog/auto-refresh/route.ts).
//
// Hacker News and DEV.to are the agent's AI sources. These RSS/Atom feeds add
// reputable coverage of frontier tech beyond AI software: chips, quantum,
// robotics, space, biotech, energy and EVs. Feed URLs are fixed here; the item
// links they return come from third parties, so the article text is still read
// through the SSRF-guarded fetchSourceText before anything is written.

export interface FeedSource {
  /** Shown as the article's source label. */
  name: string;
  url: string;
  /** Topic-specific feeds: every item is on topic. General feeds are filtered by headline. */
  focused?: boolean;
}

export const ADVANCED_TECH_FEEDS: FeedSource[] = [
  { name: "IEEE Spectrum", url: "https://spectrum.ieee.org/feeds/feed.rss" },
  { name: "MIT Technology Review", url: "https://www.technologyreview.com/feed/" },
  { name: "Ars Technica", url: "https://feeds.arstechnica.com/arstechnica/science" },
  { name: "The Verge", url: "https://www.theverge.com/rss/science/index.xml" },
  { name: "SpaceNews", url: "https://spacenews.com/feed/", focused: true },
  { name: "Quanta Magazine", url: "https://www.quantamagazine.org/feed/" },
  { name: "Nature", url: "https://www.nature.com/nature.rss" },
  { name: "Electrek", url: "https://electrek.co/feed/", focused: true },
  { name: "InsideEVs", url: "https://insideevs.com/rss/articles/all/", focused: true },
  { name: "The Robot Report", url: "https://www.therobotreport.com/feed/", focused: true },
];

export interface FeedItem {
  title: string;
  url: string;
  source: string;
  /** ISO date, or null when the feed gave none. */
  publishedAt: string | null;
}

// Headline terms that make a general-feed item an advanced-tech story.
// Matched on word boundaries (same approach as the agent's AI terms).
export const ADVANCED_TECH_TERMS = [
  // Semiconductors and AI chips
  "chip", "chips", "chipmaker", "semiconductor", "semiconductors", "gpu", "gpus",
  "tpu", "silicon", "transistor", "lithography", "euv", "foundry", "fab", "tsmc",
  "nvidia", "intel", "amd", "asml", "arm",
  // Quantum
  "quantum", "qubit", "qubits", "post-quantum",
  // Robotics and autonomy
  "robot", "robots", "robotic", "robotics", "humanoid", "humanoids",
  "autonomous", "self-driving", "robotaxi", "robotaxis", "waymo", "drone", "drones", "lidar",
  // Space
  "space", "spacex", "rocket", "launch vehicle", "satellite", "satellites", "orbit",
  "orbital", "starlink", "nasa", "esa", "lunar", "moon", "mars", "starship",
  // Biotech and health tech
  "biotech", "crispr", "gene", "gene editing", "gene therapy", "protein", "mrna",
  "synthetic biology", "wearable", "wearables", "medical device",
  // Energy and climate tech
  "battery", "batteries", "solid-state", "sodium-ion", "lithium", "fusion", "nuclear",
  "reactor", "grid", "solar", "geothermal", "hydrogen", "ev", "evs", "electric vehicle",
  "charging", "carbon capture",
  // AR/VR and spatial computing
  "ar", "vr", "xr", "augmented reality", "virtual reality", "mixed reality",
  "spatial computing", "headset", "smart glasses",
  // Networks
  "6g", "5g", "satellite internet", "fiber", "subsea cable", "spectrum",
  // Frontier cybersecurity
  "zero-day", "ransomware", "cyberattack", "encryption", "cryptography",
  // Brain-computer interfaces
  "brain-computer interface", "brain computer interface", "bci", "neural implant",
  "neuralink", "neurotech",
  // Compute
  "supercomputer", "exascale", "data center", "data centers", "photonic", "photonics",
];

function compile(terms: string[]): RegExp {
  const escaped = terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  return new RegExp(`\\b(?:${escaped.join("|")})\\b`, "i");
}

export const ADVANCED_TECH_RE = compile(ADVANCED_TECH_TERMS);

export function isAdvancedTechHeadline(title: string): boolean {
  return ADVANCED_TECH_RE.test(title);
}

/** A numeric character reference, or nothing when it is not a valid code point (fromCodePoint would throw). */
function codePoint(n: number): string {
  return Number.isInteger(n) && n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : "";
}

function decodeEntities(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&#(\d{1,8});/g, (_, n) => codePoint(Number(n)))
    .replace(/&#x([0-9a-f]{1,8});/gi, (_, n) => codePoint(parseInt(n, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;|&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&");
}

function tag(block: string, name: string): string | null {
  const m = block.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, "i"));
  return m ? m[1] : null;
}

function clean(s: string): string {
  return decodeEntities(s).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

/**
 * Items from an RSS 2.0, RSS 1.0 (RDF) or Atom document. Tolerant by design:
 * a malformed item is skipped, never thrown. Only http(s) links are kept.
 */
export function parseFeed(xml: string, source: string): FeedItem[] {
  const items: FeedItem[] = [];
  const blocks = xml.match(/<(item|entry)(?:\s[^>]*)?>[\s\S]*?<\/\1>/gi) ?? [];
  for (const block of blocks.slice(0, 100)) {
    const rawTitle = tag(block, "title");
    if (!rawTitle) continue;
    const title = clean(rawTitle).slice(0, 300);
    if (title.length < 8) continue;

    // RSS: <link>url</link>. Atom: <link href="url" rel="alternate"/>.
    let link = tag(block, "link");
    link = link ? clean(link) : null;
    if (!link) {
      const alt =
        block.match(/<link\b[^>]*rel=["']alternate["'][^>]*href=["']([^"']+)["']/i) ??
        block.match(/<link\b[^>]*href=["']([^"']+)["'][^>]*rel=["']alternate["']/i) ??
        block.match(/<link\b[^>]*href=["']([^"']+)["']/i);
      link = alt ? decodeEntities(alt[1]).trim() : null;
    }
    if (!link) {
      const guid = tag(block, "guid");
      if (guid && /^https?:\/\//i.test(clean(guid))) link = clean(guid);
    }
    if (!link || !/^https?:\/\//i.test(link)) continue;

    const rawDate = tag(block, "pubDate") ?? tag(block, "published") ?? tag(block, "updated") ?? tag(block, "dc:date");
    const d = rawDate ? new Date(clean(rawDate)) : null;
    items.push({
      title,
      url: link.slice(0, 500),
      source,
      publishedAt: d && !isNaN(d.getTime()) ? d.toISOString() : null,
    });
  }
  return items;
}

const FEED_MAX_BYTES = 3_000_000;

/** The body as text, stopping at `max` bytes (a huge or endless feed is cut, never buffered whole). */
async function readCapped(body: ReadableStream<Uint8Array>, max: number): Promise<string> {
  const reader = body.getReader();
  const parts: Uint8Array[] = [];
  let total = 0;
  try {
    while (total < max) {
      const { done, value } = await reader.read();
      if (done) break;
      parts.push(value);
      total += value.byteLength;
    }
  } finally {
    reader.cancel().catch(() => {});
  }
  return Buffer.concat(parts).subarray(0, max).toString("utf8");
}

export async function fetchFeed(feed: FeedSource): Promise<FeedItem[]> {
  try {
    const res = await fetch(feed.url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; TIBLOGICS-AITimes/1.0; +https://tiblogics.com)",
        Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9",
      },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok || !res.body) return [];
    const xml = await readCapped(res.body, FEED_MAX_BYTES);
    return parseFeed(xml, feed.name);
  } catch {
    return [];
  }
}

/**
 * Recent advanced-tech items across every feed, newest first, at most
 * `perFeed` from any one outlet so one busy feed cannot crowd out the rest.
 */
export async function fetchAdvancedTechNews(
  { maxAgeDays = 14, perFeed = 3, feeds = ADVANCED_TECH_FEEDS }: { maxAgeDays?: number; perFeed?: number; feeds?: FeedSource[] } = {},
): Promise<{ items: FeedItem[]; perSource: Record<string, number> }> {
  const cutoff = Date.now() - maxAgeDays * 24 * 60 * 60 * 1000;
  const results = await Promise.all(feeds.map(async (f) => ({ f, items: await fetchFeed(f) })));
  const perSource: Record<string, number> = {};
  const out: FeedItem[] = [];
  for (const { f, items } of results) {
    perSource[f.name] = items.length;
    const picked = items
      .filter((i) => !i.publishedAt || new Date(i.publishedAt).getTime() >= cutoff)
      .filter((i) => f.focused || isAdvancedTechHeadline(i.title))
      .slice(0, perFeed);
    out.push(...picked);
  }
  out.sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""));
  return { items: out, perSource };
}
