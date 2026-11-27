import { AGENTS } from "./agents";
import { parseRobots, groupFor } from "./robots";
import type { AgentScan, Check, CheckId } from "./scan";

// The paid kit: a fix guide written for the site's own platform, and the files
// to download (robots.txt in two versions, llms.txt, structured data).
//
// Steps are message keys with values, so the page writes them in the
// reader's language (lib/i18n/messages/agent-ready.ts).

export type GuidePlatform = "shopify" | "wordpress" | "wix" | "squarespace" | "webflow" | "bigcommerce" | "other";

export function guidePlatform(platform: string | null): GuidePlatform {
  switch (platform) {
    case "shopify":
    case "wix":
    case "squarespace":
    case "webflow":
    case "bigcommerce":
      return platform;
    case "woocommerce":
    case "wordpress":
      return "wordpress";
    default:
      return "other";
  }
}

export interface Step {
  key: string;
  vars?: Record<string, string>;
}

export interface Fix {
  check: CheckId;
  steps: Step[];
  /** The download that does this fix, if any. */
  file?: KitFileName;
}

const list = (v: unknown) => (Array.isArray(v) ? (v as string[]).join(", ") : "");

export function fixGuide(scan: AgentScan): Fix[] {
  const p = guidePlatform(scan.platform);
  const where = (topic: "robots" | "files" | "head" | "product"): Step => ({ key: `tools.agent.where.${topic}.${p}` });
  const out: Fix[] = [];
  const bad = (c: Check) => c.status === "fail" || c.status === "warn";
  for (const c of scan.checks) {
    if (c.id === "training") {
      const blocked = c.facts.blocked as string[];
      if (blocked.length) out.push({ check: c.id, steps: [{ key: "tools.agent.fix.training", vars: { agents: blocked.join(", ") } }] });
      continue;
    }
    if (!bad(c)) continue;
    switch (c.id) {
      case "assistants":
      case "search": {
        const agents = [...(c.facts.blocked as string[]), ...(c.facts.partial as string[])].join(", ");
        out.push({ check: c.id, file: "robots.txt", steps: [{ key: "tools.agent.fix.robots", vars: { agents } }, where("robots"), { key: "tools.agent.fix.robotsUse" }] });
        break;
      }
      case "firewall": {
        const cdn = scan.cdn === "cloudflare" ? "cloudflare" : scan.cdn ? "cdn" : "server";
        out.push({ check: c.id, steps: [{ key: "tools.agent.fix.firewall", vars: { agents: list(c.facts.refusedUseful) } }, { key: `tools.agent.fix.firewall.${cdn}`, vars: { cdn: scan.cdn ?? "", agents: list(c.facts.refusedUseful) } }, { key: "tools.agent.fix.firewallCheck" }] });
        break;
      }
      case "rendered":
        out.push({ check: c.id, steps: [{ key: "tools.agent.fix.rendered", vars: { words: String(c.facts.words) } }, { key: scan.platform === "nextjs" ? "tools.agent.fix.rendered.nextjs" : "tools.agent.fix.rendered.other" }] });
        break;
      case "basics":
        out.push({ check: c.id, steps: [{ key: "tools.agent.fix.basics", vars: { missing: list(c.facts.missing) } }, where("head")] });
        break;
      case "noBlockTags":
        out.push({ check: c.id, steps: [{ key: "tools.agent.fix.noBlockTags", vars: { tags: list(c.facts.tags) } }, where("head")] });
        break;
      case "speed":
        out.push({ check: c.id, steps: [{ key: "tools.agent.fix.speed", vars: { ms: String(c.facts.ms) } }] });
        break;
      case "https":
        out.push({ check: c.id, steps: [{ key: "tools.agent.fix.https" }] });
        break;
      case "org":
        out.push({ check: c.id, file: "schema.html", steps: [{ key: c.facts.type ? "tools.agent.fix.orgMissing" : "tools.agent.fix.org", vars: { missing: list(c.facts.missing) } }, where("head"), { key: "tools.agent.fix.schemaUse" }] });
        break;
      case "product":
        out.push({ check: c.id, file: "schema.html", steps: [{ key: "tools.agent.fix.product", vars: { missing: list(c.facts.missing), url: String(c.facts.url ?? "") } }, where("product"), { key: "tools.agent.fix.productTest" }] });
        break;
      case "content":
        out.push({ check: c.id, file: "schema.html", steps: [{ key: "tools.agent.fix.content" }, where("head"), { key: "tools.agent.fix.schemaUse" }] });
        break;
      case "social":
        out.push({ check: c.id, steps: [{ key: "tools.agent.fix.social", vars: { missing: list(c.facts.missing) } }, where("head")] });
        break;
      case "sitemap":
        out.push({ check: c.id, file: "robots.txt", steps: [{ key: c.facts.found ? "tools.agent.fix.sitemapDeclare" : "tools.agent.fix.sitemap" }, where("robots")] });
        break;
      case "llms":
        out.push({ check: c.id, file: "llms.txt", steps: [{ key: "tools.agent.fix.llms" }, where("files")] });
        break;
      case "robotsFile":
        out.push({
          check: c.id,
          file: "robots.txt",
          steps: c.facts.found
            ? [{ key: "tools.agent.fix.robotsTypos", vars: { lines: list(c.facts.typos) } }, where("robots")]
            : [{ key: "tools.agent.fix.robotsMissing" }, where("robots")],
        });
        break;
    }
  }
  // Most valuable first: getting in, then being read, then being understood.
  const order: CheckId[] = ["firewall", "assistants", "search", "noBlockTags", "rendered", "product", "org", "content", "robotsFile", "sitemap", "basics", "speed", "https", "social", "llms", "training"];
  out.sort((a, b) => order.indexOf(a.check) - order.indexOf(b.check));
  // A "where to do it" step given once: later fixes in the same place point back to it.
  const firstAt = new Map<string, number>();
  out.forEach((f, i) => {
    f.steps = f.steps.map((st) => {
      if (!st.key.startsWith("tools.agent.where.")) return st;
      const seen = firstAt.get(st.key);
      if (seen === undefined) {
        firstAt.set(st.key, i);
        return st;
      }
      return { key: "tools.agent.where.same", vars: { n: String(seen + 1) } };
    });
  });
  return out;
}

// ---------------------------------------------------------------------------
// Files
// ---------------------------------------------------------------------------

export const KIT_FILES = ["robots.txt", "robots-no-training.txt", "llms.txt", "schema.html"] as const;
export type KitFileName = (typeof KIT_FILES)[number];

const PLATFORM_PRIVATE: Record<string, string[]> = {
  shopify: ["/admin", "/cart", "/checkout", "/checkouts/", "/account", "/orders", "/*?*oseid=", "/search"],
  woocommerce: ["/wp-admin/", "/cart/", "/checkout/", "/my-account/", "/*?add-to-cart="],
  wordpress: ["/wp-admin/"],
  bigcommerce: ["/account.php", "/cart.php", "/checkout", "/login.php"],
  magento: ["/checkout/", "/customer/", "/catalogsearch/"],
  prestashop: ["/order", "/my-account", "/cart"],
};

/**
 * A robots.txt that welcomes AI assistants and AI search, keeps private pages
 * (cart, checkout, account) private for them too, and keeps every other rule
 * of the current file. `training`: whether model-training crawlers may come.
 *
 * A crawler named in a group obeys only that group, so the private paths of
 * the current "*" group are repeated in the AI groups; otherwise naming the
 * AI agents would open the checkout to them.
 */
export function robotsFile(scan: AgentScan, training: boolean): string {
  const parsed = parseRobots(scan.robotsTxt ?? "");
  const star = groupFor(parsed, "*-no-such-agent-*");
  const fromStar = (star?.rules ?? []).filter((r) => !r.allow && r.path !== "/" && r.path !== "/*").map((r) => r.path);
  const privatePaths = Array.from(new Set(fromStar.length ? fromStar : PLATFORM_PRIVATE[scan.platform ?? ""] ?? [])).slice(0, 40);
  const wpAjax = scan.platform === "wordpress" || scan.platform === "woocommerce";

  const ours = new Set(AGENTS.map((a) => a.token.toLowerCase()));
  const welcome = AGENTS.filter((a) => a.role !== "training");
  const trainers = AGENTS.filter((a) => a.role === "training");
  const lines: string[] = [];
  const date = new Date().toISOString().slice(0, 10);
  lines.push(`# robots.txt for ${scan.host}`);
  lines.push(`# Prepared ${date} by the TIBLOGICS AI Agent Readiness check (tiblogics.com/tools/ai-agent-ready)`);
  lines.push("");
  lines.push("# AI assistants and AI search: welcome. They visit when people ask an AI");
  lines.push("# about you, and decide whether AI answers recommend you.");
  for (const a of welcome) lines.push(`User-agent: ${a.token}`);
  lines.push("Allow: /");
  if (wpAjax) lines.push("Allow: /wp-admin/admin-ajax.php");
  for (const p of privatePaths) lines.push(`Disallow: ${p}`);
  lines.push("");
  if (training) {
    lines.push("# AI model training crawlers: allowed (your public pages may help train future models).");
    for (const a of trainers) lines.push(`User-agent: ${a.token}`);
    lines.push("Allow: /");
    for (const p of privatePaths) lines.push(`Disallow: ${p}`);
  } else {
    lines.push("# AI model training crawlers: not allowed. This does not affect AI search or assistants.");
    for (const a of trainers) lines.push(`User-agent: ${a.token}`);
    lines.push("Disallow: /");
  }
  lines.push("");

  // The rest of the current file, without the AI agents now handled above.
  const kept = parsed.groups
    .map((g) => ({ ...g, agents: g.agents.filter((a) => !ours.has(a)) }))
    .filter((g) => g.agents.length > 0);
  if (kept.length) {
    lines.push("# Your existing rules for everyone else (unchanged)");
    for (const g of kept) {
      for (const a of g.agents) lines.push(`User-agent: ${a === "*" ? "*" : originalCase(scan.robotsTxt ?? "", a)}`);
      if (!g.rules.length) lines.push("Disallow:");
      for (const r of g.rules) lines.push(`${r.allow ? "Allow" : "Disallow"}: ${r.path}`);
      lines.push("");
    }
  } else {
    lines.push("User-agent: *");
    if (wpAjax) lines.push("Allow: /wp-admin/admin-ajax.php");
    if (privatePaths.length) for (const p of privatePaths) lines.push(`Disallow: ${p}`);
    else lines.push("Disallow:");
    lines.push("");
  }
  const sitemaps = parsed.sitemaps.length ? parsed.sitemaps : [`${scan.origin}/sitemap.xml`];
  for (const s of sitemaps) lines.push(`Sitemap: ${s}`);
  return lines.join("\n") + "\n";
}

function originalCase(text: string, lower: string): string {
  const m = new RegExp(`^\\s*user-agent\\s*:\\s*(${lower.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})\\s*(#.*)?$`, "im").exec(text);
  return m?.[1] ?? lower;
}

const md = (s: string) => s.replace(/[\[\]\r\n]/g, " ").replace(/\s+/g, " ").trim();

/** llms.txt (llmstxt.org): who you are and where the important pages are, for AI agents. */
export function llmsFile(scan: AgentScan): string {
  const name = md(scan.page.siteName || scan.host);
  const lines: string[] = [`# ${name}`, ""];
  const desc = md(scan.page.description || scan.page.title || "");
  lines.push(`> ${desc || `Official website of ${name}.`}`, "");
  lines.push(`Website: ${scan.origin}`);
  if (scan.shop) lines.push("We sell online: product pages list current prices and availability.");
  lines.push("");
  const pages = scan.page.links.filter((l) => !/^https?:\/\/[^/]+\/?$/.test(l.url)).slice(0, 20);
  lines.push("## Main pages", "");
  lines.push(`- [Home](${scan.origin}/)`);
  for (const l of pages) lines.push(`- [${md(l.text)}](${l.url})`);
  if (scan.product?.url) {
    lines.push("", "## Products", "", `- [Example product](${scan.product.url})`);
  }
  if (scan.page.socials.length) {
    lines.push("", "## Elsewhere", "");
    for (const s of scan.page.socials) lines.push(`- ${s}`);
  }
  lines.push("", "## Optional", "", `- [Sitemap](${scan.origin}/sitemap.xml): every public page`);
  return lines.join("\n") + "\n";
}

const esc = (s: string) => s.replace(/</g, "\\u003c");

/** Structured data to paste in the page <head>: the business, and a product template for shops. */
export function schemaFile(scan: AgentScan): string {
  const org: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": scan.shop ? "OnlineStore" : "Organization",
    name: scan.page.siteName || scan.host,
    url: `${scan.origin}/`,
    logo: scan.page.logo ?? `${scan.origin}/REPLACE-with-your-logo.png`,
    description: scan.page.description || "REPLACE with one sentence on what you do",
    contactPoint: { "@type": "ContactPoint", contactType: "customer service", email: "REPLACE@your-domain", telephone: "+REPLACE" },
    ...(scan.page.socials.length ? { sameAs: scan.page.socials } : {}),
  };
  const site = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: scan.page.siteName || scan.host,
    url: `${scan.origin}/`,
  };
  const parts = [
    "<!-- 1. Your business and website: paste once, in the <head> of every page. Replace the REPLACE values. -->",
    `<script type="application/ld+json">\n${esc(JSON.stringify([org, site], null, 2))}\n</script>`,
  ];
  if (scan.shop) {
    const product = {
      "@context": "https://schema.org",
      "@type": "Product",
      name: "{{ product name }}",
      image: ["{{ product image URL }}"],
      description: "{{ short product description }}",
      sku: "{{ SKU }}",
      brand: { "@type": "Brand", name: scan.page.siteName || scan.host },
      offers: {
        "@type": "Offer",
        url: "{{ product page URL }}",
        price: "{{ price, digits only, e.g. 49.99 }}",
        priceCurrency: "{{ currency code, e.g. USD }}",
        availability: "https://schema.org/InStock",
        itemCondition: "https://schema.org/NewCondition",
      },
    };
    parts.push(
      "",
      "<!-- 2. Each product page: your platform's product template fills the {{ }} values from your catalog.",
      "     Availability: InStock, OutOfStock or PreOrder. Test with https://search.google.com/test/rich-results -->",
      `<script type="application/ld+json">\n${esc(JSON.stringify(product, null, 2))}\n</script>`,
    );
  }
  return parts.join("\n") + "\n";
}

export function kitFile(scan: AgentScan, name: KitFileName): { body: string; type: string } {
  switch (name) {
    case "robots.txt":
      return { body: robotsFile(scan, true), type: "text/plain; charset=utf-8" };
    case "robots-no-training.txt":
      return { body: robotsFile(scan, false), type: "text/plain; charset=utf-8" };
    case "llms.txt":
      return { body: llmsFile(scan), type: "text/plain; charset=utf-8" };
    case "schema.html":
      return { body: schemaFile(scan), type: "text/plain; charset=utf-8" };
  }
}
