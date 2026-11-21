import type { ModuleOutput, PageInfo } from "../context";
import type { Platform } from "../types";
import { Out, OWASP } from "./util";

// Software and versions: the CMS and its version, JavaScript libraries (with
// known vulnerabilities from the public OSV.dev database), the PHP version
// the server announces, and the CDN or firewall in front.

export interface OsvVuln { id: string; summary: string; fixed: string | null; severity: string | null }
export type OsvLookup = (pkg: string, version: string) => Promise<OsvVuln[] | null>;

const NPM: Record<string, string> = { jQuery: "jquery", "jQuery UI": "jquery-ui", Bootstrap: "bootstrap", AngularJS: "angular", "Moment.js": "moment", Lodash: "lodash", Vue: "vue", Handlebars: "handlebars", DOMPurify: "dompurify" };

/** Public vulnerability database (osv.dev), npm packages. */
export const osvLive: OsvLookup = async (pkg, version) => {
  try {
    const res = await fetch("https://api.osv.dev/v1/query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ package: { name: pkg, ecosystem: "npm" }, version }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const j = (await res.json()) as { vulns?: Array<{ id: string; aliases?: string[]; summary?: string; affected?: Array<{ ranges?: Array<{ events?: Array<{ fixed?: string }> }> }>; database_specific?: { severity?: string } }> };
    return (j.vulns ?? []).slice(0, 12).map((v) => ({
      id: v.aliases?.find((a) => a.startsWith("CVE-")) ?? v.id,
      summary: (v.summary ?? "").slice(0, 160),
      fixed: v.affected?.[0]?.ranges?.[0]?.events?.find((e) => e.fixed)?.fixed ?? null,
      severity: v.database_specific?.severity ?? null,
    }));
  } catch {
    return null;
  }
};

// PHP branches and their end of security support.
const PHP_EOL: Record<string, string> = { "5": "2018-12-31", "7.0": "2019-01-10", "7.1": "2019-12-01", "7.2": "2020-11-30", "7.3": "2021-12-06", "7.4": "2022-11-28", "8.0": "2023-11-26", "8.1": "2025-12-31", "8.2": "2026-12-31", "8.3": "2027-12-31", "8.4": "2028-12-31" };

export function detectPlatform(page: PageInfo, tech: { cms: string | null; cmsVersion: string | null; libraries: Platform["libraries"] }): Platform {
  const h = page.headers;
  const server = h["server"] ?? null;
  const cdn = h["cf-ray"] ? "Cloudflare" : h["x-sucuri-id"] ? "Sucuri" : h["x-akamai-transformed"] || /akamai/i.test(server ?? "") ? "Akamai" : h["x-amz-cf-id"] ? "Amazon CloudFront" : h["x-vercel-id"] ? "Vercel" : h["x-nf-request-id"] ? "Netlify" : h["x-fastly-request-id"] || /fastly/i.test(h["via"] ?? "") ? "Fastly" : null;
  return { server, poweredBy: h["x-powered-by"] ?? null, cdn, cms: tech.cms, cmsVersion: tech.cmsVersion, libraries: tech.libraries };
}

export async function software(page: PageInfo, platform: Platform, osv: OsvLookup): Promise<ModuleOutput> {
  const o = new Out("software");
  o.info("platform", "Platform detected", [platform.cms && `${platform.cms}${platform.cmsVersion ? ` ${platform.cmsVersion}` : ""}`, platform.server, platform.cdn && `behind ${platform.cdn}`].filter(Boolean).join(" · ") || "Not identified");

  // JavaScript libraries with known vulnerabilities
  const libs = platform.libraries.filter((l) => l.version && NPM[l.name]);
  const results = await Promise.all(libs.map(async (l) => ({ l, vulns: await osv(NPM[l.name], l.version!) })));
  let osvDown = false;
  for (const { l, vulns } of results) {
    if (vulns === null) { osvDown = true; continue; }
    if (!vulns.length) { o.pass(`lib-${NPM[l.name]}`, `${l.name} ${l.version}`, "No known vulnerabilities"); continue; }
    const fixedIn = vulns.map((v) => v.fixed).filter((x): x is string => !!x).sort((a, b) => a.localeCompare(b, undefined, { numeric: true })).pop();
    const high = vulns.some((v) => /high|critical/i.test(v.severity ?? ""));
    o.fail({
      id: `vuln-lib-${NPM[l.name]}`, severity: high ? "high" : "medium",
      title: `${l.name} ${l.version} has ${vulns.length} known vulnerabilit${vulns.length === 1 ? "y" : "ies"}`,
      evidence: vulns.slice(0, 5).map((v) => `${v.id}${v.summary ? `: ${v.summary}` : ""}`).join(" | "),
      impact: "Published vulnerabilities come with public attack code. Old JavaScript libraries are a common route to cross-site scripting: running an attacker's code in visitors' browsers.",
      fix: [`Update ${l.name} to ${fixedIn ? `${fixedIn} or later` : "the latest version"}.`, "If it comes with a theme or plugin, update that (or replace it if it is no longer maintained).", "Test the pages that use it (menus, sliders, forms) after the update."],
      refs: vulns.slice(0, 3).map((v) => ({ label: v.id, url: `https://osv.dev/vulnerability/${encodeURIComponent(v.id)}` })),
      effort: "hours", standard: OWASP.components,
    }, `${l.name} up to date`);
  }
  if (osvDown) o.notes.push("The vulnerability database (osv.dev) did not answer for some libraries.");
  for (const l of platform.libraries.filter((x) => x.outdated && !(x.version && NPM[x.name]))) {
    o.fail({ id: `outdated-${l.name.toLowerCase().replace(/\W+/g, "-")}`, severity: "medium", title: `${l.name} is out of date${l.version ? ` (${l.version})` : ""}`, evidence: `${l.name}${l.version ? ` ${l.version}` : ""} is loaded by the page.`, impact: "This library is no longer maintained or this version has known problems; it will not get security fixes.", fix: [`Replace or update ${l.name}.`], effort: "days", standard: OWASP.components });
  }

  // PHP
  const php = /PHP\/(\d+)\.(\d+)(?:\.(\d+))?/i.exec(`${platform.poweredBy ?? ""} ${platform.server ?? ""}`);
  if (php) {
    const branch = php[1] === "5" ? "5" : `${php[1]}.${php[2]}`;
    const eol = PHP_EOL[branch];
    if (eol && new Date(eol) < new Date()) {
      o.fail({
        id: "php-eol", severity: "high", title: `PHP ${php[0].split("/")[1]} no longer gets security fixes`,
        evidence: `The server announces PHP ${php[0].split("/")[1]}; security support for PHP ${branch} ended on ${eol}.`,
        impact: "New PHP vulnerabilities are not fixed for this version. Sites on unsupported PHP are routinely compromised.",
        fix: ["Ask the host to move the site to a supported PHP version (8.3 or newer).", "Check that the CMS, theme and plugins support it first (test on a staging copy)."],
        refs: [{ label: "PHP supported versions", url: "https://www.php.net/supported-versions.php" }], effort: "hours", standard: OWASP.components,
      }, "Supported PHP version");
    } else o.pass("php-eol", "Supported PHP version", php[0]);
  }

  // WordPress core
  if (platform.cms === "WordPress" && platform.cmsVersion) {
    o.fail({
      id: "wp-version-public", severity: "low", title: `WordPress version ${platform.cmsVersion} is visible`,
      evidence: `The page source reveals WordPress ${platform.cmsVersion}.`,
      impact: "Attackers match the version against known holes. Keep WordPress, themes and plugins updated; hiding the number helps a little.",
      fix: ["Turn on automatic updates for WordPress core and plugins (Dashboard > Updates).", "Remove plugins and themes you do not use.", "Hide the generator tag (remove_action('wp_head', 'wp_generator');)."],
      refs: [{ label: "WordPress: Hardening", url: "https://developer.wordpress.org/advanced-administration/security/hardening/" }],
      effort: "hours", standard: OWASP.components,
    });
  }
  if (!platform.cdn) o.info("waf", "Web application firewall / CDN", "None detected in front of the site");
  else o.pass("waf", "Web application firewall / CDN", platform.cdn);
  return o;
}
