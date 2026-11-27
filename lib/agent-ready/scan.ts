import { checkTargetUrl, safeFetch, readTextLimited, SsrfBlockedError } from "@/lib/ssrf";
import { AGENTS, BROWSER_UA, LIVE_TEST_AGENTS, type AgentRole } from "./agents";
import { isAllowed, parseRobots, type ParsedRobots } from "./robots";

// The AI agent readiness check: can AI assistants, AI search and shopping
// agents reach the site, read it, and understand what it sells?
//
// Passive, like a visitor: the home page (once as a browser, once as each of
// six AI agents), robots.txt, llms.txt, the sitemap and one product page.
// About a dozen requests, all through the internal-address guard
// (lib/ssrf.ts). Nothing is guessed, nothing is posted, nothing logged into.
//
// The result is data (check ids, statuses and facts), never sentences: the
// page and the emails write it in the reader's language.

export type Area = "access" | "read" | "data" | "guide";
export type Status = "pass" | "warn" | "fail" | "info";

export type CheckId =
  | "assistants" | "search" | "firewall"
  | "rendered" | "basics" | "noBlockTags" | "speed" | "https"
  | "org" | "product" | "content" | "social"
  | "sitemap" | "llms" | "robotsFile"
  | "training";

export interface Check {
  id: CheckId;
  area: Area;
  status: Status;
  points: number;
  max: number;
  /** Evidence for the report and the fix guide. */
  facts: Record<string, string | number | boolean | string[] | null>;
}

export type RobotsVerdict = "allowed" | "partial" | "blocked";
export type LiveVerdict = "ok" | "blocked" | "challenge" | "inconclusive";

export interface AgentResult {
  token: string;
  company: string;
  role: AgentRole;
  powers: string;
  robots: RobotsVerdict;
  /** The robots.txt line that blocks it, quoted. */
  rule: { line: number; text: string } | null;
  /** Paths it may not fetch among those tested. */
  blockedPaths: string[];
  live: LiveVerdict | null;
  liveStatus: number | null;
}

export interface ProductInfo {
  url: string;
  hasSchema: boolean;
  name: string | null;
  price: string | null;
  currency: string | null;
  availability: string | null;
  missing: string[];
}

export interface PageInfo {
  title: string;
  description: string;
  siteName: string;
  lang: string;
  logo: string | null;
  socials: string[];
  /** Main internal links (text, absolute URL), for llms.txt. */
  links: Array<{ text: string; url: string }>;
}

export interface AgentScan {
  url: string;
  origin: string;
  host: string;
  scannedAt: string;
  score: number;
  verdict: "ready" | "partial" | "notReady";
  platform: string | null;
  cdn: string | null;
  shop: boolean;
  checks: Check[];
  agents: AgentResult[];
  testedPaths: string[];
  robotsTxt: string | null;
  page: PageInfo;
  product: ProductInfo | null;
}

export type AgentScanOutcome = { ok: true; scan: AgentScan } | { ok: false; error: "invalid" | "private" | "unreachable" | "refused" | "timeout" };

// ---------------------------------------------------------------------------
// Fetching
// ---------------------------------------------------------------------------

export interface Fetched {
  status: number;
  headers: Headers;
  body: string;
  url: string;
  ms: number;
}

export type Fetcher = (url: string, ua: string, signal: AbortSignal, maxBytes?: number) => Promise<Fetched>;

const SCANNER_UA = "TIBLOGICS-AgentReady/1.0 (+https://tiblogics.com/tools/ai-agent-ready)";

const defaultFetcher: Fetcher = async (url, ua, signal, maxBytes = 1_500_000) => {
  const start = performance.now();
  const res = await safeFetch(url, {
    signal,
    headers: { "User-Agent": ua, Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,text/plain;q=0.8,*/*;q=0.5", "Accept-Encoding": "gzip, deflate, br" },
  });
  const ms = Math.round(performance.now() - start);
  const body = await readTextLimited(res, maxBytes);
  return { status: res.status, headers: res.headers, body, url: res.url || url, ms };
};

/** Tests (and only tests) swap the network for a fake one. */
function fetcher(): Fetcher {
  const g = globalThis as { __agentReadyFetch?: Fetcher };
  return g.__agentReadyFetch ?? defaultFetcher;
}

// ---------------------------------------------------------------------------
// HTML helpers (no DOM on the server: plain, bounded regexes)
// ---------------------------------------------------------------------------

const decode = (s: string) =>
  s.replace(/&amp;/g, "&").replace(/&#0?39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();

function metaContent(html: string, attr: "name" | "property", key: string): string {
  const k = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const a = new RegExp(`<meta[^>]+${attr}=["']${k}["'][^>]*content=["']([^"']*)["']`, "i").exec(html)?.[1];
  const b = new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]*${attr}=["']${k}["']`, "i").exec(html)?.[1];
  return decode(a ?? b ?? "");
}

export function visibleText(html: string): string {
  const body = /<body[^>]*>([\s\S]*)<\/body>/i.exec(html)?.[1] ?? html;
  return decode(
    body
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
      .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
      .replace(/<template[\s\S]*?<\/template>/gi, " ")
      .replace(/<[^>]+>/g, " "),
  );
}

type Json = Record<string, unknown>;

export function jsonLdNodes(html: string): Json[] {
  const out: Json[] = [];
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  let n = 0;
  while ((m = re.exec(html)) && n++ < 40) {
    let data: unknown;
    try {
      data = JSON.parse(m[1].trim().replace(/^<!\[CDATA\[|\]\]>$/g, ""));
    } catch {
      continue;
    }
    const walk = (v: unknown, depth: number) => {
      if (depth > 6 || out.length > 200) return;
      if (Array.isArray(v)) return v.forEach((x) => walk(x, depth + 1));
      if (v && typeof v === "object") {
        const o = v as Json;
        if (o["@type"]) out.push(o);
        if (o["@graph"]) walk(o["@graph"], depth + 1);
      }
    };
    walk(data, 0);
  }
  return out;
}

function types(node: Json): string[] {
  const t = node["@type"];
  return (Array.isArray(t) ? t : [t]).filter((x): x is string => typeof x === "string");
}

const ORG_TYPE = /^(Organization|Corporation|LocalBusiness|OnlineStore|OnlineBusiness|Store|Restaurant|Hotel|ProfessionalService|MedicalBusiness|LegalService|FinancialService|EducationalOrganization|NGO|.*Store|.*Business|.*Shop)$/;
const CONTENT_TYPE = /^(WebSite|WebPage|Article|NewsArticle|BlogPosting|FAQPage|Service|BreadcrumbList|Event|Course|HowTo|Product|ItemList|CollectionPage|SoftwareApplication)$/;

function str(v: unknown): string | null {
  if (typeof v === "string" && v.trim()) return v.trim().slice(0, 200);
  if (typeof v === "number") return String(v);
  return null;
}

function productOf(nodes: Json[]): { name: string | null; price: string | null; currency: string | null; availability: string | null; image: boolean; id: boolean } | null {
  const p = nodes.find((n) => types(n).some((t) => t === "Product" || t === "ProductGroup"));
  if (!p) return null;
  const offersRaw = p.offers ?? (Array.isArray(p.hasVariant) ? (p.hasVariant[0] as Json | undefined)?.offers : undefined);
  const offer = (Array.isArray(offersRaw) ? offersRaw[0] : offersRaw) as Json | undefined;
  const spec = offer?.priceSpecification as Json | undefined;
  return {
    name: str(p.name),
    price: str(offer?.price) ?? str(offer?.lowPrice) ?? str(spec?.price),
    currency: str(offer?.priceCurrency) ?? str(spec?.priceCurrency),
    availability: str(offer?.availability)?.replace(/^https?:\/\/schema\.org\//, "") ?? null,
    image: !!p.image,
    id: !!(p.sku || p.gtin || p.gtin13 || p.gtin12 || p.gtin8 || p.mpn),
  };
}

function links(html: string, origin: string): Array<{ text: string; url: string }> {
  const out: Array<{ text: string; url: string }> = [];
  const seen = new Set<string>();
  const re = /<a\b[^>]*href=["']([^"'#]+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let m: RegExpExecArray | null;
  let n = 0;
  while ((m = re.exec(html)) && n++ < 2000) {
    let u: URL;
    try {
      u = new URL(decode(m[1]), origin);
    } catch {
      continue;
    }
    if (u.origin !== origin || !/^https?:$/.test(u.protocol)) continue;
    u.hash = "";
    const key = u.toString();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ text: decode(m[2].replace(/<[^>]+>/g, " ")).slice(0, 80), url: key });
  }
  return out;
}

const PRODUCT_PATH = /\/(products?|item|items|p|shop\/[^/]+)\/[^/?#]{2,}\/?$/i;
const CATEGORY_PATH = /\/(collections|category|categories|product-category|shop|store|catalog)(\/[^/?#]+)?\/?$/i;

export function detectPlatform(html: string, headers: Headers): string | null {
  const h = (k: string) => headers.get(k) ?? "";
  if (/cdn\.shopify\.com|Shopify\.theme|myshopify\.com/i.test(html) || h("x-shopid") || h("x-shopify-stage")) return "shopify";
  if (/woocommerce|wc-ajax|wc-block/i.test(html)) return "woocommerce";
  if (/wp-content|wp-includes|wp-json/i.test(html)) return "wordpress";
  if (/static\.wixstatic\.com|wix-bolt|_wixCssImports/i.test(html) || h("x-wix-request-id")) return "wix";
  if (/static1\.squarespace\.com|squarespace-cdn|Static\.SQUARESPACE_CONTEXT/i.test(html)) return "squarespace";
  if (/data-wf-site|webflow\.js|assets\.website-files\.com|cdn\.prod\.website-files\.com/i.test(html)) return "webflow";
  if (/cdn\d*\.bigcommerce\.com|BCData|stencil-utils/i.test(html)) return "bigcommerce";
  if (/Magento_|mage\/cookies|data-mage-init/i.test(html)) return "magento";
  if (/prestashop/i.test(html)) return "prestashop";
  if (/img1\.wsimg\.com|godaddy/i.test(html)) return "godaddy";
  if (/framerusercontent\.com|data-framer/i.test(html)) return "framer";
  if (/\/_next\/static|__NEXT_DATA__/i.test(html)) return "nextjs";
  return null;
}

export function detectCdn(headers: Headers): string | null {
  const server = (headers.get("server") ?? "").toLowerCase();
  if (headers.get("cf-ray") || server.includes("cloudflare")) return "cloudflare";
  if (headers.get("x-vercel-id")) return "vercel";
  if (headers.get("x-sucuri-id") || server.includes("sucuri")) return "sucuri";
  if (headers.get("x-iinfo") || headers.get("x-cdn") === "Imperva") return "imperva";
  if (server.includes("akamai") || headers.get("x-akamai-transformed")) return "akamai";
  if (headers.get("x-served-by")?.includes("cache-") || headers.get("fastly-debug-digest")) return "fastly";
  if (headers.get("x-amz-cf-id")) return "cloudfront";
  if (headers.get("x-nf-request-id")) return "netlify";
  return null;
}

const SHOP_PLATFORMS = new Set(["shopify", "woocommerce", "bigcommerce", "magento", "prestashop"]);

const CHALLENGE = /cf-chl|challenge-platform|cf_chl_opt|Just a moment\.\.\.|Attention Required! \| Cloudflare|px-captcha|_Incapsula_Resource|Pardon Our Interruption|Request unsuccessful\. Incapsula|Access Denied<\/h1>|ddos-guard|sucuri_cloudproxy|captcha-delivery\.com|DataDome|verify you are (a )?human/i;

export function isChallenge(f: Fetched): boolean {
  return CHALLENGE.test(f.body.slice(0, 60_000)) && (f.status >= 400 || visibleText(f.body).split(" ").length < 120);
}

// ---------------------------------------------------------------------------
// The scan
// ---------------------------------------------------------------------------

const WEIGHTS: Record<CheckId, number> = {
  assistants: 15, search: 15, firewall: 15,
  rendered: 8, basics: 5, noBlockTags: 4, speed: 4, https: 4,
  org: 6, product: 10, content: 10, social: 4,
  sitemap: 4, llms: 4, robotsFile: 2,
  training: 0,
};

function check(id: CheckId, area: Area, status: Status, facts: Check["facts"] = {}, partial = 0.5): Check {
  const max = WEIGHTS[id];
  const points = status === "pass" || status === "info" ? max : status === "warn" ? Math.round(max * partial) : 0;
  return { id, area, status, points, max, facts };
}

export async function scanAgentReady(raw: string, timeoutMs = 25_000): Promise<AgentScanOutcome> {
  const fetch1 = fetcher();
  const usingFake = fetch1 !== defaultFetcher;
  let target: URL;
  if (usingFake) {
    try {
      target = new URL(/^https?:\/\//i.test(raw.trim()) ? raw.trim() : `https://${raw.trim()}`);
    } catch {
      return { ok: false, error: "invalid" };
    }
  } else {
    const checked = await checkTargetUrl(raw);
    if (!checked.ok) return { ok: false, error: checked.reason === "private" ? "private" : "invalid" };
    target = checked.url;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const signal = controller.signal;
  const get = (url: string, ua: string, max?: number) => fetch1(url, ua, signal, max);
  try {
    // 1. The home page as a normal browser: the baseline.
    let home: Fetched;
    try {
      home = await get(target.toString(), BROWSER_UA);
    } catch (err) {
      if (err instanceof SsrfBlockedError) return { ok: false, error: err.reason === "private" ? "private" : "invalid" };
      return { ok: false, error: signal.aborted ? "timeout" : "unreachable" };
    }
    const browserBlocked = home.status >= 400 || isChallenge(home);
    if (browserBlocked && home.status !== 404 && home.status !== 410) {
      // Even a browser is refused: nothing meaningful to measure.
      if (home.status === 401 || home.status === 403 || home.status === 429 || isChallenge(home)) return { ok: false, error: "refused" };
      if (home.status >= 500) return { ok: false, error: "unreachable" };
    }
    const finalUrl = new URL(home.url || target.toString());
    const origin = finalUrl.origin;
    const homePath = finalUrl.pathname + finalUrl.search;
    const html = home.body.slice(0, 1_200_000);

    // 2. robots.txt, llms.txt, sitemap and each AI agent's own view of the home page, together.
    const textFile = (f: Fetched | null) => {
      if (!f || f.status !== 200) return null;
      const type = f.headers.get("content-type") ?? "";
      if (/html/i.test(type) || /^\s*<(!doctype|html|head|body)/i.test(f.body) || !f.body.trim()) return null;
      return f.body.slice(0, 64_000);
    };
    const soft = (p: Promise<Fetched>) => p.catch(() => null);
    const liveAgents = AGENTS.filter((a) => LIVE_TEST_AGENTS.includes(a.token) && a.ua);
    const [robotsRes, llmsRes, sitemapRes, ...liveRes] = await Promise.all([
      soft(get(`${origin}/robots.txt`, SCANNER_UA, 200_000)),
      soft(get(`${origin}/llms.txt`, SCANNER_UA, 200_000)),
      soft(get(`${origin}/sitemap.xml`, SCANNER_UA, 400_000)),
      ...liveAgents.map((a) => soft(get(finalUrl.toString(), a.ua!, 400_000))),
    ]);
    const robotsTxt = textFile(robotsRes);
    const robots: ParsedRobots = parseRobots(robotsTxt ?? "");
    const llms = textFile(llmsRes);
    const sitemapBody = sitemapRes && sitemapRes.status === 200 ? sitemapRes.body : "";
    const sitemapFound = /<(urlset|sitemapindex)\b/i.test(sitemapBody) || robots.sitemaps.length > 0;

    // 3. What the site is: platform, shop, links, a product page.
    const platform = detectPlatform(html, home.headers);
    const cdn = detectCdn(home.headers);
    const pageLinks = links(html, origin);
    const productLink = pageLinks.find((l) => PRODUCT_PATH.test(new URL(l.url).pathname) && !CATEGORY_PATH.test(new URL(l.url).pathname));
    const categoryLink = pageLinks.find((l) => CATEGORY_PATH.test(new URL(l.url).pathname) && new URL(l.url).pathname !== "/");
    const homeNodes = jsonLdNodes(html);
    const cartSignals = /add[ -]to[ -]cart|ajouter au panier|\/cart\b|\/checkout\b|data-product-id|"@type"\s*:\s*"(Product|Offer)"/i.test(html);
    const shop = (platform !== null && SHOP_PLATFORMS.has(platform)) || (!!productLink && cartSignals) || !!productOf(homeNodes);

    let productPage: Fetched | null = null;
    if (productLink) productPage = await soft(get(productLink.url, BROWSER_UA, 1_200_000));

    // 4. Who may come in, according to robots.txt.
    const testedPaths = Array.from(new Set([homePath || "/", productLink ? new URL(productLink.url).pathname : null, categoryLink ? new URL(categoryLink.url).pathname : null].filter((p): p is string => !!p))).slice(0, 3);
    const robotsLines = (robotsTxt ?? "").split(/\r\n|\r|\n/);
    const agents: AgentResult[] = AGENTS.map((a) => {
      const results = testedPaths.map((p) => ({ p, r: isAllowed(robots, a.token, p) }));
      const rootBlocked = !results[0].r.allowed;
      const blockedPaths = results.filter((x) => !x.r.allowed).map((x) => x.p);
      const firstBlock = results.find((x) => !x.r.allowed)?.r.rule ?? null;
      const idx = liveAgents.findIndex((l) => l.token === a.token);
      let live: LiveVerdict | null = null;
      let liveStatus: number | null = null;
      if (idx >= 0) {
        const f = liveRes[idx];
        liveStatus = f?.status ?? null;
        if (browserBlocked) live = "inconclusive";
        else if (!f) live = "inconclusive";
        else if (isChallenge(f)) live = "challenge";
        else if ([401, 403, 406, 429, 451, 503].includes(f.status) || (f.status >= 400 && home.status < 400)) live = "blocked";
        else live = "ok";
      }
      return {
        token: a.token,
        company: a.company,
        role: a.role,
        powers: a.powers,
        robots: rootBlocked ? "blocked" : blockedPaths.length ? "partial" : "allowed",
        rule: firstBlock ? { line: firstBlock.line, text: (robotsLines[firstBlock.line - 1] ?? "").trim().slice(0, 200) } : null,
        blockedPaths,
        live,
        liveStatus,
      };
    });

    // 5. The checks.
    const checks: Check[] = [];
    const roleCheck = (role: AgentRole, id: CheckId) => {
      const list = agents.filter((a) => a.role === role);
      const blocked = list.filter((a) => a.robots === "blocked").map((a) => a.token);
      const partial = list.filter((a) => a.robots === "partial").map((a) => a.token);
      const status: Status = blocked.length ? (blocked.length >= list.length / 2 ? "fail" : "warn") : partial.length ? "warn" : "pass";
      checks.push(check(id, "access", status, { blocked, partial, total: list.length }, blocked.length ? 0.4 : 0.6));
    };
    roleCheck("assistant", "assistants");
    roleCheck("search", "search");
    {
      const tested = agents.filter((a) => a.live !== null);
      const refused = tested.filter((a) => a.live === "blocked" || a.live === "challenge");
      const usefulRefused = refused.filter((a) => a.role !== "training");
      const status: Status = browserBlocked
        ? "info"
        : usefulRefused.length
        ? "fail"
        : refused.length
        ? "info"
        : "pass";
      checks.push(check("firewall", "access", status, {
        refused: refused.map((a) => a.token),
        refusedUseful: usefulRefused.map((a) => a.token),
        statuses: tested.map((a) => `${a.token}:${a.liveStatus ?? "-"}`),
        cdn,
        inconclusive: browserBlocked,
      }));
    }
    {
      const training = agents.filter((a) => a.role === "training");
      checks.push(check("training", "access", "info", { blocked: training.filter((a) => a.robots === "blocked").map((a) => a.token), total: training.length }));
    }

    // Readable without running scripts (most agents do not run JavaScript).
    const words = visibleText(html).split(" ").filter((w) => /\w/.test(w)).length;
    checks.push(check("rendered", "read", words >= 150 ? "pass" : words >= 50 ? "warn" : "fail", { words }));
    const title = decode(/<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1] ?? "").slice(0, 200);
    const description = metaContent(html, "name", "description").slice(0, 300);
    const h1 = /<h1\b/i.test(html);
    const lang = /<html[^>]*\blang=["']([^"']+)["']/i.exec(html)?.[1] ?? "";
    const missingBasics = [!title && "title", !description && "description", !h1 && "h1", !lang && "lang"].filter((x): x is string => !!x);
    checks.push(check("basics", "read", missingBasics.length === 0 ? "pass" : missingBasics.length <= 2 ? "warn" : "fail", { missing: missingBasics }));
    const metaRobots = [metaContent(html, "name", "robots"), metaContent(html, "name", "googlebot")].join(",").toLowerCase();
    const xRobots = (home.headers.get("x-robots-tag") ?? "").toLowerCase();
    const blockTags = Array.from(new Set(`${metaRobots},${xRobots}`.split(/[,\s:]+/).filter((v) => ["noindex", "none", "noai", "noimageai", "nosnippet"].includes(v))));
    checks.push(check("noBlockTags", "read", blockTags.some((v) => v === "noindex" || v === "none") ? "fail" : blockTags.length ? "warn" : "pass", { tags: blockTags }));
    checks.push(check("speed", "read", home.ms <= 1200 ? "pass" : home.ms <= 3000 ? "warn" : "fail", { ms: home.ms }));
    checks.push(check("https", "read", finalUrl.protocol === "https:" ? "pass" : "fail", {}));

    // Machine-readable: who you are, what you sell.
    const org = homeNodes.find((n) => types(n).some((t) => ORG_TYPE.test(t)));
    const orgFields = org ? [!org.name && "name", !org.url && "url", !org.logo && !org.image && "logo", !(org.contactPoint || org.telephone || org.email || org.address) && "contact"].filter((x): x is string => !!x) : [];
    checks.push(check("org", "data", !org ? "fail" : orgFields.length === 0 ? "pass" : "warn", { type: org ? types(org)[0] : null, missing: orgFields }, 0.6));
    let product: ProductInfo | null = null;
    if (shop) {
      const pNodes = productPage ? jsonLdNodes(productPage.body) : homeNodes;
      const p = productOf(pNodes);
      const missing = p ? [!p.name && "name", !p.price && "price", !p.currency && "currency", !p.availability && "availability", !p.image && "image", !p.id && "sku"].filter((x): x is string => !!x) : ["schema"];
      product = {
        url: productLink?.url ?? finalUrl.toString(),
        hasSchema: !!p,
        name: p?.name ?? null,
        price: p?.price ?? null,
        currency: p?.currency ?? null,
        availability: p?.availability ?? null,
        missing,
      };
      const core = ["schema", "price", "currency", "availability"].filter((k) => missing.includes(k));
      checks.push(check("product", "data", !p ? "fail" : core.length ? "warn" : missing.length ? "warn" : "pass", { url: product.url, missing, found: !!productLink }, core.length ? 0.4 : 0.8));
    } else {
      const found = Array.from(new Set(homeNodes.flatMap(types).filter((t) => CONTENT_TYPE.test(t))));
      checks.push(check("content", "data", found.length >= 2 ? "pass" : found.length === 1 ? "warn" : "fail", { types: found }));
    }
    const og = { title: metaContent(html, "property", "og:title"), description: metaContent(html, "property", "og:description"), image: metaContent(html, "property", "og:image") };
    const ogMissing = Object.entries(og).filter(([, v]) => !v).map(([k]) => k);
    checks.push(check("social", "data", ogMissing.length === 0 ? "pass" : ogMissing.length < 3 ? "warn" : "fail", { missing: ogMissing }));

    // Guidance for agents.
    checks.push(check("sitemap", "guide", sitemapFound ? (robots.sitemaps.length ? "pass" : "warn") : "fail", { declared: robots.sitemaps.length > 0, found: sitemapFound }, 0.75));
    const llmsValid = !!llms && /^\s*#\s+\S/.test(llms);
    checks.push(check("llms", "guide", llmsValid ? "pass" : llms ? "warn" : "fail", { found: !!llms }));
    checks.push(check("robotsFile", "guide", robotsTxt ? (robots.unknown.length ? "warn" : "pass") : "warn", {
      found: !!robotsTxt,
      typos: robots.unknown.slice(0, 5).map((u) => `${u.line}: ${u.text}`),
    }));

    const max = checks.reduce((s, c) => s + c.max, 0);
    const got = checks.reduce((s, c) => s + c.points, 0);
    let score = Math.round((got / max) * 100);
    // Turning away the people asking AI about you caps the verdict whatever else is right.
    const assistants = checks.find((c) => c.id === "assistants")!;
    const firewall = checks.find((c) => c.id === "firewall")!;
    if (assistants.status === "fail" || firewall.status === "fail") score = Math.min(score, 49);
    const verdict = score >= 80 ? "ready" : score >= 50 ? "partial" : "notReady";

    const sameAs = org && Array.isArray(org.sameAs) ? (org.sameAs as unknown[]).filter((s): s is string => typeof s === "string") : [];
    const socialLinks = Array.from(new Set([
      ...sameAs,
      ...Array.from(html.matchAll(/href=["'](https:\/\/(?:www\.)?(?:facebook|instagram|linkedin|x|twitter|youtube|tiktok)\.com\/[^"'?#\s]{2,80})["']/gi)).map((m) => m[1]),
    ])).slice(0, 8);
    const logo = typeof org?.logo === "string" ? org.logo : typeof (org?.logo as Json | undefined)?.url === "string" ? ((org!.logo as Json).url as string) : null;

    return {
      ok: true,
      scan: {
        url: finalUrl.toString(),
        origin,
        host: finalUrl.hostname.replace(/^www\./, ""),
        scannedAt: new Date().toISOString(),
        score,
        verdict,
        platform,
        cdn,
        shop,
        checks,
        agents,
        testedPaths,
        robotsTxt,
        page: {
          title,
          description,
          siteName: metaContent(html, "property", "og:site_name") || str(org?.name) || title.split(/\s[|\-–·]\s/)[0] || finalUrl.hostname,
          lang,
          logo,
          socials: socialLinks,
          links: pageLinks.filter((l) => l.text && l.text.length >= 2 && !/login|sign in|cart|panier|account|privacy|cookie/i.test(l.text)).slice(0, 25),
        },
        product,
      },
    };
  } finally {
    clearTimeout(timer);
  }
}
