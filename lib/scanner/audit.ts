// The scoring engine behind the AI Scanner.
//
// Every number this produces comes from something measured on the page. The
// previous implementation returned a hardcoded 91 for tiblogics.com and
// Math.random() for everyone else, which meant two scans of the same site
// disagreed and the stored ScannerLead scores were noise.
//
// Rules this follows:
//   - Deterministic. Same HTML in, same score out, so a rescan is comparable.
//   - Every finding names the evidence, so a score can be argued with.
//   - No site is special-cased. tiblogics.com is scored by the same checks as
//     everyone else; if it scores well that has to be because it is good.

export type FindingType = "good" | "warning" | "bad";

export interface Finding {
  /** Which check produced this, stable across runs (see Check.key). */
  check: string;
  type: FindingType;
  text: string;
  /** Which sub-score this contributed to, for grouping in the UI. */
  area: "seo" | "perf" | "ux" | "ai";
}

export interface Signals {
  html: string;
  finalUrl: string;
  statusCode: number;
  ttfb: number | null;
  totalTime: number | null;
  bytes: number;
  compressed: boolean;
  cached: boolean;
  https: boolean;
  robotsTxt: string | null;
  sitemapFound: boolean;
  llmsTxt: boolean;
}

export interface AuditResult {
  overallScore: number;
  seoScore: number;
  perfScore: number;
  uxScore: number;
  aiScore: number;
  findings: Finding[];
  measured: {
    ttfb: number | null;
    totalTime: number | null;
    bytesKb: number;
    compressed: boolean;
    cached: boolean;
    https: boolean;
    imagesTotal: number;
    imagesWithAlt: number;
    schemaTypes: string[];
    headings: { h1: number; h2: number };
  };
}

/** One scored check. `weight` is its share of the category. */
interface Check {
  /** Stable identifier, so a rescan can say which check changed. */
  key: string;
  area: Finding["area"];
  weight: number;
  pass: boolean;
  /** Partial credit, 0..1. Defaults to pass ? 1 : 0. */
  score?: number;
  good: string;
  bad: string;
  /** A failed check that is a nice-to-have rather than a defect. */
  soft?: boolean;
}

/** Entities are source encoding, not characters a searcher sees: a title
 *  containing "&amp;" measured four characters longer than it displays. */
function decodeEntities(v: string): string {
  return v
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#0?39;|&apos;/g, "'").replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

const tag = (html: string, re: RegExp): string | null => {
  const m = re.exec(html);
  return m ? decodeEntities((m[1] ?? "").trim()) : null;
};

const count = (html: string, re: RegExp): number => (html.match(re) ?? []).length;

function metaContent(html: string, name: string): string | null {
  const re = new RegExp(
    `<meta[^>]+(?:name|property)=["']${name}["'][^>]*content=["']([^"']*)["']`,
    "i",
  );
  const direct = tag(html, re);
  if (direct) return direct;
  // content= can precede name=
  const re2 = new RegExp(
    `<meta[^>]+content=["']([^"']*)["'][^>]*(?:name|property)=["']${name}["']`,
    "i",
  );
  return tag(html, re2);
}

function jsonLdTypes(html: string): string[] {
  const types = new Set<string>();
  const blocks = html.match(
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  );
  for (const block of blocks ?? []) {
    const body = block.replace(/^[\s\S]*?>/, "").replace(/<\/script>$/i, "");
    for (const m of body.matchAll(/"@type"\s*:\s*"([^"]+)"/g)) types.add(m[1]);
  }
  return [...types];
}

export function audit(s: Signals): AuditResult {
  const html = s.html;
  const lower = html.toLowerCase();

  const title = tag(html, /<title[^>]*>([\s\S]*?)<\/title>/i) ?? "";
  const desc = metaContent(html, "description") ?? "";
  const canonical = /<link[^>]+rel=["']canonical["']/i.test(html);
  const ogTitle = metaContent(html, "og:title");
  const ogImage = metaContent(html, "og:image");
  const twitterCard = metaContent(html, "twitter:card");
  const viewport = metaContent(html, "viewport");
  const h1 = count(html, /<h1[\s>]/gi);
  const h2 = count(html, /<h2[\s>]/gi);
  const langAttr = /<html[^>]+lang=["'][a-z]{2}/i.test(html);
  const favicon = /<link[^>]+rel=["'][^"']*icon[^"']*["']/i.test(html);

  const imgTags = html.match(/<img\b[^>]*>/gi) ?? [];
  const imagesTotal = imgTags.length;
  const imagesWithAlt = imgTags.filter((t) => /\balt=["'][^"']+["']/i.test(t)).length;
  const altRatio = imagesTotal === 0 ? 1 : imagesWithAlt / imagesTotal;

  const schema = jsonLdTypes(html);
  const semantic = ["<main", "<header", "<footer", "<nav", "<article", "<section"].filter((t) =>
    lower.includes(t),
  ).length;

  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const words = text ? text.split(" ").length : 0;

  const robots = s.robotsTxt ?? "";
  // Blocking the AI crawlers is a choice, but it is the opposite of AI-ready.
  const blocksAiCrawlers = /user-agent:\s*(gptbot|claudebot|perplexitybot|ccbot|google-extended)/i.test(
    robots,
  ) && /disallow:\s*\//i.test(robots);

  const checks: Check[] = [
    // ── SEO ────────────────────────────────────────────────────────────────
    {
      key: "title", area: "seo", weight: 3, pass: title.length >= 10 && title.length <= 70,
      score: title.length === 0 ? 0 : title.length <= 70 ? 1 : 0.5,
      good: `Page title is present and well-sized (${title.length} characters)`,
      bad: title.length === 0 ? "No <title> tag — search results have nothing to show"
        : `Title is ${title.length} characters; aim for 10–70 so it is not truncated`,
    },
    {
      key: "description", area: "seo", weight: 3, pass: desc.length >= 50 && desc.length <= 160,
      // Full marks inside the target range. This used to score 0.6 for any
      // non-empty description, so a perfectly sized one still showed a warning.
      score: desc.length === 0 ? 0 : desc.length >= 50 && desc.length <= 160 ? 1 : 0.6,
      good: `Meta description is present and well-sized (${desc.length} characters)`,
      bad: desc.length === 0 ? "No meta description — search engines will invent one"
        : `Meta description is ${desc.length} characters; aim for 50–160`,
    },
    { key: "canonical", area: "seo", weight: 2, pass: canonical,
      good: "Canonical URL is declared", bad: "No canonical URL — duplicate pages can compete with each other" },
    { key: "open-graph", area: "seo", weight: 2, pass: !!ogTitle && !!ogImage,
      good: "Open Graph tags present — links preview correctly when shared",
      bad: "Missing Open Graph title or image — shared links will look broken" },
    { key: "twitter-card", area: "seo", weight: 1, pass: !!twitterCard, soft: true,
      good: "Twitter Card metadata present", bad: "No Twitter Card metadata" },
    { key: "h1", area: "seo", weight: 2, pass: h1 === 1,
      score: h1 === 1 ? 1 : h1 === 0 ? 0 : 0.5,
      good: "Exactly one H1, as search engines expect",
      bad: h1 === 0 ? "No H1 heading on the page" : `${h1} H1 headings — there should be exactly one` },
    { key: "sitemap", area: "seo", weight: 2, pass: s.sitemapFound,
      good: "XML sitemap found", bad: "No sitemap.xml found — crawlers have to guess your page list" },
    { key: "robots", area: "seo", weight: 1, pass: !!s.robotsTxt,
      good: "robots.txt is present", bad: "No robots.txt" },

    // ── Performance ────────────────────────────────────────────────────────
    {
      key: "ttfb", area: "perf", weight: 4, pass: (s.ttfb ?? 9999) < 600,
      score: s.ttfb == null ? 0 : s.ttfb < 400 ? 1 : s.ttfb < 800 ? 0.7 : s.ttfb < 1500 ? 0.4 : 0.1,
      good: `Server responds quickly (${s.ttfb}ms to first byte)`,
      bad: `Slow first byte (${s.ttfb}ms) — under 600ms is the target`,
    },
    {
      key: "page-weight", area: "perf", weight: 3, pass: s.bytes < 500_000,
      score: s.bytes < 150_000 ? 1 : s.bytes < 500_000 ? 0.7 : s.bytes < 1_500_000 ? 0.4 : 0.1,
      good: `Page weight is reasonable (${Math.round(s.bytes / 1024)}KB of HTML)`,
      bad: `Heavy page (${Math.round(s.bytes / 1024)}KB of HTML) — slow on mobile data`,
    },
    { key: "compression", area: "perf", weight: 2, pass: s.compressed,
      good: "Responses are compressed (gzip/brotli)", bad: "No compression — pages transfer larger than they need to" },
    { key: "caching", area: "perf", weight: 2, pass: s.cached,
      good: "Caching headers are set", bad: "No caching headers — repeat visits re-download everything" },
    { key: "https", area: "perf", weight: 2, pass: s.https,
      good: "Served over HTTPS", bad: "Not served over HTTPS — browsers will warn visitors" },

    // ── UX ─────────────────────────────────────────────────────────────────
    { key: "viewport", area: "ux", weight: 4, pass: !!viewport,
      good: "Mobile viewport is configured", bad: "No viewport meta tag — the site will not scale on phones" },
    { key: "alt-text", area: "ux", weight: 3, pass: altRatio >= 0.9,
      score: altRatio,
      good: `Images have alt text (${imagesWithAlt}/${imagesTotal})`,
      bad: `Only ${imagesWithAlt} of ${imagesTotal} images have alt text — screen readers and image search cannot read the rest` },
    { key: "headings", area: "ux", weight: 2, pass: h1 >= 1 && h2 >= 1,
      good: "Heading structure is in place", bad: "Thin heading structure — headings are how scanners and screen readers navigate" },
    { key: "lang", area: "ux", weight: 2, pass: langAttr,
      good: "Page language is declared", bad: "No lang attribute on <html> — assistive tech cannot pick a voice" },
    { key: "favicon", area: "ux", weight: 1, pass: favicon, soft: true,
      good: "Favicon is set", bad: "No favicon" },
    { key: "status", area: "ux", weight: 2, pass: s.statusCode >= 200 && s.statusCode < 300,
      good: `Page returns ${s.statusCode}`, bad: `Page returns ${s.statusCode} rather than 200` },

    // ── AI readiness ───────────────────────────────────────────────────────
    {
      key: "structured-data", area: "ai", weight: 5, pass: schema.length > 0,
      score: schema.length === 0 ? 0 : schema.length >= 3 ? 1 : 0.6,
      good: `Structured data found (${schema.slice(0, 4).join(", ")}) — AI assistants can read what this business is`,
      bad: "No JSON-LD structured data — AI assistants and search engines have to guess what this page is about",
    },
    { key: "semantic-html", area: "ai", weight: 3, pass: semantic >= 4,
      score: Math.min(1, semantic / 4),
      good: `Semantic HTML used (${semantic} landmark elements) — machines can find the parts of the page`,
      bad: "Little semantic HTML — hard for AI agents to tell navigation from content" },
    { key: "content-depth", area: "ai", weight: 3, pass: words >= 300,
      score: words >= 600 ? 1 : words >= 300 ? 0.7 : words >= 120 ? 0.35 : 0.1,
      good: `Substantive page content (${words} words) for models to work from`,
      bad: `Only ${words} words of readable text — an AI summarising this page has little to go on` },
    { key: "ai-crawlers", area: "ai", weight: 2, pass: !blocksAiCrawlers,
      good: "AI crawlers are not blocked in robots.txt",
      bad: "robots.txt blocks AI crawlers — your business will be absent from AI answers" },
    { key: "ai-summary", area: "ai", weight: 2, pass: desc.length >= 50,
      good: "Descriptive metadata gives assistants a summary to quote",
      bad: "Weak or missing description — assistants have no summary to quote" },
    { key: "llms-txt", area: "ai", weight: 1, pass: s.llmsTxt, soft: true,
      good: "llms.txt published — an explicit guide for AI crawlers",
      bad: "No llms.txt — an emerging standard for telling AI systems what matters on your site" },
  ];

  const byArea = (area: Finding["area"]) => {
    const list = checks.filter((c) => c.area === area);
    const total = list.reduce((n, c) => n + c.weight, 0);
    const got = list.reduce((n, c) => n + c.weight * (c.score ?? (c.pass ? 1 : 0)), 0);
    return total === 0 ? 0 : Math.round((got / total) * 100);
  };

  const seoScore = byArea("seo");
  const perfScore = byArea("perf");
  const uxScore = byArea("ux");
  const aiScore = byArea("ai");

  // AI readiness is what this scanner is for, so it carries the most weight.
  const overallScore = Math.round(
    seoScore * 0.25 + perfScore * 0.25 + uxScore * 0.2 + aiScore * 0.3,
  );

  const findings: Finding[] = checks.map((c) => {
    const passed = (c.score ?? (c.pass ? 1 : 0)) >= 0.9;
    return {
      check: c.key,
      area: c.area,
      type: passed ? "good" : c.soft || (c.score ?? 0) >= 0.5 ? "warning" : "bad",
      text: passed ? c.good : c.bad,
    };
  });

  // Problems first — a report that opens with praise buries the point.
  const order: Record<FindingType, number> = { bad: 0, warning: 1, good: 2 };
  findings.sort((a, b) => order[a.type] - order[b.type]);

  return {
    overallScore, seoScore, perfScore, uxScore, aiScore, findings,
    measured: {
      ttfb: s.ttfb, totalTime: s.totalTime, bytesKb: Math.round(s.bytes / 1024),
      compressed: s.compressed, cached: s.cached, https: s.https,
      imagesTotal, imagesWithAlt, schemaTypes: schema, headings: { h1, h2 },
    },
  };
}
