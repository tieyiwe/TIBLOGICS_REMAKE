import type { ModuleOutput, PageInfo } from "../context";
import { CSP_STARTER, headerSnippets, hideVersionSnippets, type Stack } from "../fixes";
import { Out, OWASP, MDN, hdr } from "./util";

// Browser protections (security headers), information disclosure in headers,
// CORS as the main page answers it, and the cookies it sets. Read from the
// one page load: no extra requests.

export function headers(page: PageInfo, stack: Stack[]): ModuleOutput {
  const o = new Out("headers");
  const h = page.headers;

  // Content-Security-Policy
  const csp = hdr(h, "content-security-policy");
  const cspRo = hdr(h, "content-security-policy-report-only");
  if (!csp) {
    o.fail({
      id: "csp-missing", severity: "medium", title: "No Content-Security-Policy",
      evidence: cspRo ? "Only a report-only policy is set, which blocks nothing." : "No Content-Security-Policy header.",
      impact: "If an attacker manages to inject a script (through a form, a comment, a compromised plugin or ad), the browser runs it with full access to the page and its visitors' sessions. A CSP is the safety net that stops it.",
      fix: ["Start with a Content-Security-Policy-Report-Only header to see what would be blocked.", "List the outside sources the site really uses (analytics, fonts, payment widgets).", "Switch to the enforcing header once reports are clean."],
      snippets: headerSnippets(stack, "Content-Security-Policy-Report-Only", CSP_STARTER),
      refs: [MDN("Content-Security-Policy"), { label: "Google CSP Evaluator", url: "https://csp-evaluator.withgoogle.com/" }],
      effort: "days", standard: OWASP.misconfig,
    }, "Content-Security-Policy set");
  } else {
    const weak: string[] = [];
    const script = /script-src([^;]*)/i.exec(csp)?.[1] ?? /default-src([^;]*)/i.exec(csp)?.[1] ?? "";
    if (/'unsafe-inline'/.test(script) && !/'nonce-|'sha(256|384|512)-|'strict-dynamic'/.test(script)) weak.push("'unsafe-inline' scripts are allowed");
    if (/'unsafe-eval'/.test(script)) weak.push("'unsafe-eval' is allowed");
    if (/(^|\s)(\*|https:|http:)(\s|$)/.test(script)) weak.push("scripts may load from any site");
    if (!/object-src\s+'none'/i.test(csp) && !/default-src\s+'none'/i.test(csp)) weak.push("object-src is not 'none'");
    if (!/base-uri/i.test(csp)) weak.push("base-uri is not restricted");
    if (weak.length >= 2 || weak.some((w) => /any site|unsafe-inline/.test(w))) {
      o.fail({
        id: "csp-weak", severity: "low", title: "The Content-Security-Policy is weak",
        evidence: weak.join("; ") + ".",
        impact: "The policy exists but leaves the main door open, so an injected script would still run.",
        fix: ["Remove 'unsafe-inline' and 'unsafe-eval' from script-src (use nonces or hashes for the inline scripts you need).", "Replace wildcards with the exact domains you use.", "Add object-src 'none' and base-uri 'self'."],
        refs: [{ label: "Google CSP Evaluator", url: "https://csp-evaluator.withgoogle.com/" }],
        effort: "days", standard: OWASP.misconfig,
      }, "Content-Security-Policy strong");
    } else o.pass("csp-missing", "Content-Security-Policy set");
  }

  // Clickjacking
  const xfo = hdr(h, "x-frame-options");
  const frameAncestors = csp && /frame-ancestors/i.test(csp);
  if (!xfo && !frameAncestors) {
    o.fail({
      id: "clickjacking", severity: "medium", title: "Pages can be framed by other sites (clickjacking)",
      evidence: "No X-Frame-Options header and no frame-ancestors in a CSP.",
      impact: "Another site can load these pages invisibly inside its own and trick visitors into clicking buttons (buy, delete, change settings, log in) without realising.",
      fix: ["Send X-Frame-Options: SAMEORIGIN (or frame-ancestors 'self' in the CSP)."],
      snippets: headerSnippets(stack, "X-Frame-Options", "SAMEORIGIN"), refs: [MDN("X-Frame-Options")], effort: "minutes", standard: OWASP.misconfig,
    }, "Framing restricted");
  } else o.pass("clickjacking", "Framing restricted");

  if ((hdr(h, "x-content-type-options") ?? "").toLowerCase() !== "nosniff") {
    o.fail({
      id: "nosniff", severity: "low", title: "MIME sniffing is not disabled",
      evidence: "No X-Content-Type-Options: nosniff header.",
      impact: "Browsers may guess file types, which can turn an uploaded text or image file into something that runs as a script.",
      fix: ["Send X-Content-Type-Options: nosniff on every response."],
      snippets: headerSnippets(stack, "X-Content-Type-Options", "nosniff"), refs: [MDN("X-Content-Type-Options")], effort: "minutes", standard: OWASP.misconfig,
    }, "MIME sniffing disabled");
  } else o.pass("nosniff", "MIME sniffing disabled");

  const ref = (hdr(h, "referrer-policy") ?? "").toLowerCase();
  if (!ref || /unsafe-url|no-referrer-when-downgrade/.test(ref)) {
    o.fail({
      id: "referrer-policy", severity: "low", title: ref ? "The referrer policy leaks full addresses" : "No referrer policy",
      evidence: ref ? `Referrer-Policy: ${ref}` : "No Referrer-Policy header.",
      impact: "Full page addresses, which can contain search terms, IDs or reset tokens, are sent to every outside site the page links to or loads from.",
      fix: ["Send Referrer-Policy: strict-origin-when-cross-origin."],
      snippets: headerSnippets(stack, "Referrer-Policy", "strict-origin-when-cross-origin"), refs: [MDN("Referrer-Policy")], effort: "minutes", standard: OWASP.misconfig,
    }, "Referrer policy");
  } else o.pass("referrer-policy", "Referrer policy", ref);

  if (!hdr(h, "permissions-policy")) {
    o.fail({
      id: "permissions-policy", severity: "info", title: "No Permissions-Policy",
      evidence: "No Permissions-Policy header.",
      impact: "Scripts on the page (including third-party ones) can ask for the camera, microphone or location. Turning off what the site does not use reduces the damage a bad script can do.",
      fix: ["Send a Permissions-Policy that turns off the features you do not use."],
      snippets: headerSnippets(stack, "Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()"), refs: [MDN("Permissions-Policy")], effort: "minutes", standard: OWASP.misconfig,
    }, "Permissions-Policy");
  } else o.pass("permissions-policy", "Permissions-Policy");

  // Information disclosure
  const server = hdr(h, "server");
  const powered = hdr(h, "x-powered-by");
  const aspnet = hdr(h, "x-aspnet-version") ?? hdr(h, "x-aspnetmvc-version");
  const leaks = [server && /\d/.test(server) ? `Server: ${server}` : null, powered ? `X-Powered-By: ${powered}` : null, aspnet ? `X-AspNet-Version: ${aspnet}` : null].filter(Boolean) as string[];
  if (leaks.length) {
    o.fail({
      id: "version-disclosure", severity: "low", title: "The server announces its software versions",
      evidence: leaks.join("; ").slice(0, 200),
      impact: "Attackers scan the internet for exact version numbers with known holes. Announcing them makes the site an easy match.",
      fix: ["Hide version numbers in the server configuration.", "Keep the software itself updated (hiding the number is not a patch)."],
      snippets: hideVersionSnippets(stack), effort: "minutes", standard: OWASP.misconfig,
    }, "No version numbers in headers");
  } else o.pass("version-disclosure", "No version numbers in headers");

  // CORS as the page answers without an Origin
  const acao = hdr(h, "access-control-allow-origin");
  if (acao === "*" && /true/i.test(hdr(h, "access-control-allow-credentials") ?? "")) {
    o.fail({
      id: "cors-wildcard-credentials", severity: "high", title: "CORS allows any site with credentials",
      evidence: "Access-Control-Allow-Origin: * with Access-Control-Allow-Credentials: true.",
      impact: "Any website a logged-in visitor opens could read their data from this site.",
      fix: ["Allow only the exact origins that need access, and never combine a wildcard with credentials."],
      refs: [MDN("Access-Control-Allow-Origin")], effort: "hours", standard: OWASP.access,
    });
  }

  // Cookies
  const c = new Out("cookies");
  const cookies = page.setCookies;
  if (!cookies.length) c.info("cookies", "Cookies", "The home page sets no cookies");
  const bad: { name: string; missing: string[]; session: boolean }[] = [];
  for (const raw of cookies.slice(0, 30)) {
    const [nv, ...attrs] = raw.split(";").map((x) => x.trim());
    const name = nv.split("=")[0] ?? "?";
    const a = attrs.map((x) => x.toLowerCase());
    const missing: string[] = [];
    if (page.https && !a.includes("secure")) missing.push("Secure");
    const session = /sess|sid|auth|token|login|jwt|remember|wordpress_logged_in|laravel_session|phpsessid|asp\.net|jsessionid/i.test(name);
    if (session && !a.includes("httponly")) missing.push("HttpOnly");
    if (!a.some((x) => x.startsWith("samesite="))) missing.push("SameSite");
    if (missing.length) bad.push({ name, missing, session });
  }
  if (bad.length) {
    const serious = bad.some((b) => b.session && (b.missing.includes("Secure") || b.missing.includes("HttpOnly")));
    c.fail({
      id: "cookie-flags", severity: serious ? "high" : "low",
      title: serious ? "Session cookies are missing protection flags" : "Some cookies are missing protection flags",
      evidence: bad.slice(0, 8).map((b) => `${b.name}: no ${b.missing.join(", ")}`).join("; "),
      impact: serious
        ? "A session cookie without Secure can be stolen on an unencrypted connection, and one without HttpOnly can be read by an injected script. Either lets an attacker log in as the visitor."
        : "Cookies without these flags are easier to leak or misuse across sites.",
      fix: ["Set Secure on every cookie (the site is HTTPS).", "Set HttpOnly on session and login cookies.", "Set SameSite=Lax (or Strict) unless a cookie must work across sites."],
      snippets: [
        { label: "PHP (php.ini)", code: "session.cookie_secure = 1\nsession.cookie_httponly = 1\nsession.cookie_samesite = \"Lax\"" },
        { label: "Apache (mod_headers, adds flags to every cookie)", code: "Header always edit Set-Cookie ^(.*)$ \"$1; Secure; HttpOnly; SameSite=Lax\"" },
        { label: "nginx", code: "proxy_cookie_flags ~ secure httponly samesite=lax;" },
      ],
      effort: "hours", standard: OWASP.auth,
    }, "Cookie flags");
  } else if (cookies.length) c.pass("cookie-flags", "Cookie flags", `${cookies.length} cookie(s) checked`);

  return { findings: [...o.findings, ...c.findings], checks: [...o.checks, ...c.checks] };
}
