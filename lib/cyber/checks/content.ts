import type { CyberContext, ModuleOutput, PageInfo } from "../context";
import { Out, OWASP } from "./util";

// Page content and third parties: mixed content, outside scripts without
// integrity checks, forms that post insecurely, security.txt and what
// robots.txt reveals. Two small requests (security.txt, robots.txt).

export async function content(ctx: CyberContext, page: PageInfo): Promise<ModuleOutput> {
  const o = new Out("content");
  const html = page.html;
  const origin = new URL(page.finalUrl).origin;

  if (page.https) {
    const mixed = [...html.matchAll(/<(?:script|iframe|img|link|source|audio|video)[^>]+(?:src|href)=["'](http:\/\/[^"']+)["']/gi)].map((m) => m[1]);
    const active = mixed.filter((u) => /<script|<iframe|stylesheet/i.test(html.slice(Math.max(0, html.indexOf(u) - 200), html.indexOf(u))));
    if (mixed.length) {
      o.fail({
        id: "mixed-content", severity: active.length ? "medium" : "low", title: "The page loads files over insecure HTTP",
        evidence: [...new Set(mixed)].slice(0, 5).join(", "),
        impact: "Insecure scripts or styles can be swapped by an attacker on the network, which compromises the whole page; images break the padlock and trigger browser warnings.",
        fix: ["Change these addresses to https:// (most services support it).", "Add the CSP directive upgrade-insecure-requests as a safety net."],
        effort: "minutes", standard: OWASP.crypto,
      }, "No mixed content");
    } else o.pass("mixed-content", "No mixed content");
  }

  // Third-party scripts and SRI
  const scripts = [...html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi)].map((m) => ({ tag: m[0], src: m[1] }));
  const external = scripts.filter((s) => {
    try { return new URL(s.src, origin).origin !== origin; } catch { return false; }
  });
  const hosts = [...new Set(external.map((s) => { try { return new URL(s.src, origin).hostname; } catch { return ""; } }).filter(Boolean))];
  o.info("third-party", "Third-party script sources", hosts.length ? hosts.slice(0, 12).join(", ") : "None");
  const cdnNoSri = external.filter((s) => /cdn|unpkg|jsdelivr|cdnjs|googleapis|bootstrapcdn|code\.jquery/i.test(s.src) && !/\bintegrity=/i.test(s.tag));
  if (cdnNoSri.length) {
    o.fail({
      id: "sri-missing", severity: "low", title: "Scripts from public CDNs have no integrity check",
      evidence: cdnNoSri.slice(0, 5).map((s) => s.src).join(", "),
      impact: "If the CDN copy is ever tampered with, the altered script runs on this site (a supply-chain attack, as in the 2024 polyfill.io incident).",
      fix: ["Add integrity=\"sha384-...\" and crossorigin=\"anonymous\" to each tag (the CDN page shows the hash), or host the files yourself."],
      refs: [{ label: "MDN: Subresource Integrity", url: "https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity" }],
      effort: "minutes", standard: OWASP.integrity,
    }, "CDN scripts pinned");
  }
  if (hosts.length > 12) o.fail({ id: "many-third-parties", severity: "info", title: `Scripts load from ${hosts.length} outside domains`, evidence: hosts.slice(0, 15).join(", "), impact: "Every outside script runs with full access to the page and visitors' data; each one is a supplier you must trust.", fix: ["Remove tags you no longer use (old analytics, chat widgets, pixels).", "Load the rest through a tag manager you control."], effort: "hours", standard: OWASP.integrity });

  // Forms
  const forms = [...html.matchAll(/<form\b[^>]*>/gi)].map((m) => m[0]);
  const insecure = forms.filter((f) => /action=["']http:\/\//i.test(f));
  const password = /<input[^>]+type=["']password["']/i.test(html);
  if (insecure.length || (!page.https && password)) {
    o.fail({ id: "insecure-form", severity: "critical", title: "A form sends data without encryption", evidence: insecure.length ? insecure[0].slice(0, 160) : "A password field on a page served over HTTP.", impact: "Whatever visitors type (passwords, contact details, payment information) is sent in clear text and can be read by anyone on the network.", fix: ["Make every form post to an https:// address.", "Serve the whole site over HTTPS."], effort: "minutes", standard: OWASP.crypto }, "Forms post securely");
  } else if (forms.length) o.pass("insecure-form", "Forms post securely");

  // security.txt and robots.txt
  const [sec, robots] = await Promise.all([
    ctx.http(`${origin}/.well-known/security.txt`, { max: 20_000, timeoutMs: 6000 }).catch(() => null),
    ctx.http(`${origin}/robots.txt`, { max: 50_000, timeoutMs: 6000 }).catch(() => null),
  ]);
  if (!(sec && sec.status === 200 && /contact:/i.test(sec.body))) {
    o.fail({ id: "security-txt", severity: "info", title: "No security.txt", evidence: "No /.well-known/security.txt with a Contact line.", impact: "People who find a security problem on the site have no clear way to report it privately, so problems may be published or exploited instead.", fix: ["Publish /.well-known/security.txt with a contact address and an expiry date."], snippets: [{ label: "/.well-known/security.txt", code: `Contact: mailto:security@${page.apex}\nExpires: ${new Date(Date.now() + 365 * 86_400_000).toISOString().slice(0, 10)}T00:00:00.000Z\nPreferred-Languages: en, fr` }], refs: [{ label: "securitytxt.org", url: "https://securitytxt.org/" }], effort: "minutes" }, "security.txt");
  } else o.pass("security-txt", "security.txt");
  if (robots && robots.status === 200) {
    const revealing = [...robots.body.matchAll(/^disallow:\s*(\S+)/gim)].map((m) => m[1]).filter((p) => /admin|backup|bak|private|secret|internal|dev|staging|test|old|config|sql|dump|\.env|\.git/i.test(p));
    if (revealing.length) o.fail({ id: "robots-reveals", severity: "info", title: "robots.txt points to sensitive areas", evidence: revealing.slice(0, 8).join(", "), impact: "robots.txt is public. Listing private paths there tells attackers exactly where to look.", fix: ["Protect those areas with a login instead, and remove them from robots.txt."], effort: "minutes", standard: OWASP.misconfig });
  }
  return o;
}
