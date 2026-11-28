import type { Platform, Snippet } from "./types";

// Copy-paste fixes, written for the server the site runs on when we can tell
// (Server / X-Powered-By / CDN headers, the CMS), with the common
// alternatives after it. Generic and safe: setting a header, a DNS record or
// a config flag, never anything that needs the site's secrets.

export type Stack = "nginx" | "apache" | "iis" | "cloudflare" | "wordpress" | "node" | "litespeed" | "unknown";

export function stackOf(p: Partial<Platform>): Stack[] {
  const s = `${p.server ?? ""} ${p.poweredBy ?? ""}`.toLowerCase();
  const out: Stack[] = [];
  if (p.cdn === "Cloudflare") out.push("cloudflare");
  if (p.cms === "WordPress") out.push("wordpress");
  if (/nginx|openresty/.test(s)) out.push("nginx");
  if (/apache/.test(s)) out.push("apache");
  if (/litespeed/.test(s)) out.push("litespeed");
  if (/iis|asp\.net/.test(s)) out.push("iis");
  if (/express|next\.js|node/.test(s)) out.push("node");
  return out.length ? out : ["unknown"];
}

/** A response header, for each server type; the detected ones first. */
export function headerSnippets(stack: Stack[], name: string, value: string): Snippet[] {
  const all: Record<Exclude<Stack, "unknown">, Snippet> = {
    nginx: { label: "nginx (server block)", code: `add_header ${name} "${value.replace(/"/g, '\\"')}" always;` },
    apache: { label: "Apache (.htaccess or vhost)", code: `<IfModule mod_headers.c>\n  Header always set ${name} "${value.replace(/"/g, '\\"')}"\n</IfModule>` },
    litespeed: { label: "LiteSpeed (.htaccess)", code: `<IfModule mod_headers.c>\n  Header always set ${name} "${value.replace(/"/g, '\\"')}"\n</IfModule>` },
    iis: { label: "IIS (web.config)", code: `<system.webServer>\n  <httpProtocol>\n    <customHeaders>\n      <add name="${name}" value="${value.replace(/"/g, "&quot;")}" />\n    </customHeaders>\n  </httpProtocol>\n</system.webServer>` },
    cloudflare: { label: "Cloudflare (Rules > Transform Rules > Modify Response Header)", code: `Set static header\n  Header name: ${name}\n  Value: ${value}` },
    wordpress: { label: "WordPress (theme functions.php or a headers plugin)", code: `add_action('send_headers', function () {\n  header('${name}: ${value.replace(/'/g, "\\'")}');\n});` },
    node: { label: "Node / Next.js (next.config.js headers())", code: `{ source: "/(.*)", headers: [{ key: "${name}", value: "${value.replace(/"/g, '\\"')}" }] }` },
  };
  const order: Exclude<Stack, "unknown">[] = [...stack.filter((s): s is Exclude<Stack, "unknown"> => s !== "unknown"), "nginx", "apache", "cloudflare", "iis"];
  return [...new Set(order)].slice(0, 4).map((k) => all[k]);
}

/** Hiding version numbers in Server / X-Powered-By. */
export function hideVersionSnippets(stack: Stack[]): Snippet[] {
  const all: Partial<Record<Stack, Snippet>> = {
    nginx: { label: "nginx (http block)", code: "server_tokens off;" },
    apache: { label: "Apache (main config)", code: "ServerTokens Prod\nServerSignature Off" },
    iis: { label: "IIS (web.config)", code: `<system.webServer>\n  <security><requestFiltering removeServerHeader="true" /></security>\n  <httpProtocol><customHeaders><remove name="X-Powered-By" /></customHeaders></httpProtocol>\n</system.webServer>` },
    node: { label: "Express", code: `app.disable("x-powered-by");` },
  };
  const php: Snippet = { label: "PHP (php.ini)", code: "expose_php = Off" };
  const out = stack.map((s) => all[s]).filter((x): x is Snippet => !!x);
  return [...(out.length ? out : [all.nginx!, all.apache!]), php];
}

export const CSP_STARTER =
  "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data: https:; connect-src 'self'; frame-ancestors 'self'; base-uri 'self'; form-action 'self'; object-src 'none'; upgrade-insecure-requests";
