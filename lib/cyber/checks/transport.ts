import type { CyberContext, ModuleOutput, PageInfo } from "../context";
import { headerSnippets, type Stack } from "../fixes";
import { Out, OWASP, MDN, hdr } from "./util";

// Encryption: HTTPS, the certificate, TLS versions, the HTTP to HTTPS
// redirect and HSTS. Passive: what any browser does.

export async function transport(ctx: CyberContext, page: PageInfo, stack: Stack[]): Promise<ModuleOutput> {
  const o = new Out("transport");
  const host = page.host;

  if (!page.https) {
    o.fail({
      id: "no-https", severity: "critical", title: "The site is not served over HTTPS",
      evidence: `The page loaded over plain HTTP (${page.finalUrl}).`,
      impact: "Everything visitors send or receive, including passwords, form entries and payment details, travels unencrypted and can be read or changed on public Wi-Fi. Browsers mark the site \"Not secure\", which costs trust and search ranking.",
      fix: ["Get a free certificate (Let's Encrypt, or your host's one-click SSL).", "Redirect every http:// address to https:// (permanent 301).", "Then turn on HSTS (see below)."],
      refs: [{ label: "Let's Encrypt: getting started", url: "https://letsencrypt.org/getting-started/" }],
      effort: "hours", standard: OWASP.crypto,
    }, "Served over HTTPS");
  } else o.pass("no-https", "Served over HTTPS");

  const [cert, legacy, redirect] = await Promise.all([
    page.https ? ctx.tls(host) : Promise.resolve(null),
    page.https ? ctx.legacyTls(host) : Promise.resolve(null),
    page.https ? ctx.httpRedirect(host) : Promise.resolve(null),
  ]);

  if (page.https && !cert) o.notes.push("The TLS handshake could not be completed to read the certificate.");
  if (cert) {
    if (!cert.trusted) {
      const expired = cert.error === "CERT_HAS_EXPIRED";
      o.fail({
        id: "cert-untrusted", severity: "critical",
        title: expired ? "The SSL certificate has expired" : "The SSL certificate is not trusted",
        evidence: `Certificate check: ${cert.error ?? "not trusted"}${cert.issuer ? `, issued by ${cert.issuer}` : ""}.`,
        impact: "Visitors get a full-page browser warning and most leave. Anyone who clicks through is exposed to interception, and search engines may drop the site.",
        fix: expired
          ? ["Renew the certificate now (your host's SSL panel, or certbot renew).", "Turn on automatic renewal so it cannot lapse again."]
          : ["Install a certificate from a trusted authority that covers this exact name.", "Include the intermediate certificates (the full chain) in the server configuration."],
        refs: [{ label: "SSL Labs server test", url: `https://www.ssllabs.com/ssltest/analyze.html?d=${encodeURIComponent(host)}` }],
        effort: "hours", standard: OWASP.crypto,
      }, "Certificate trusted");
    } else o.pass("cert-untrusted", "Certificate trusted", cert.issuer ? `Issued by ${cert.issuer}` : undefined);

    if (cert.trusted && cert.daysLeft !== null && cert.daysLeft < 30) {
      o.fail({
        id: "cert-expiring", severity: cert.daysLeft < 14 ? "high" : "medium",
        title: `The SSL certificate expires in ${cert.daysLeft} days`,
        evidence: `Valid until ${cert.validTo?.slice(0, 10)}.`,
        impact: "When it expires, every visitor sees a security warning instead of the site until it is renewed.",
        fix: ["Renew the certificate before it expires.", "Make sure automatic renewal is on and working (a test renewal shows it)."],
        effort: "minutes", standard: OWASP.crypto,
      }, "Certificate not about to expire");
    } else if (cert.daysLeft !== null) o.pass("cert-expiring", "Certificate not about to expire", `${cert.daysLeft} days left`);

    if (cert.bits !== null && !cert.curve && cert.bits < 2048) {
      o.fail({
        id: "cert-weak-key", severity: "high", title: `The certificate uses a weak ${cert.bits}-bit key`,
        evidence: `RSA key of ${cert.bits} bits.`, impact: "Short keys can be broken, which would let an attacker impersonate the site.",
        fix: ["Issue a new certificate with a 2048-bit (or larger) RSA key, or an ECDSA P-256 key."], effort: "hours", standard: OWASP.crypto,
      });
    }
    const apex = page.apex;
    const covers = (n: string) => cert.altNames.some((a) => a === n || (a.startsWith("*.") && n.endsWith(a.slice(1)) && n.split(".").length === a.split(".").length));
    const other = host === apex ? `www.${apex}` : apex;
    if (cert.trusted && cert.altNames.length && !covers(other)) {
      o.fail({
        id: "cert-missing-name", severity: "low", title: `The certificate does not cover ${other}`,
        evidence: `It covers: ${cert.altNames.slice(0, 6).join(", ")}.`,
        impact: `Visitors who type ${other} get a certificate warning (or nothing), and links to that address break.`,
        fix: [`Add ${other} to the certificate (most hosts and Let's Encrypt allow both names).`, `Redirect ${other} to ${host}.`],
        effort: "minutes", standard: OWASP.misconfig,
      });
    }
    if (cert.protocol === "TLSv1.2") {
      o.fail({
        id: "no-tls13", severity: "low", title: "TLS 1.3 is not offered",
        evidence: "A modern client negotiated TLS 1.2.",
        impact: "TLS 1.3 is faster to connect and removes older weak options. Not urgent, but worth enabling.",
        fix: ["Enable TLS 1.3 in the server or CDN settings (nginx: ssl_protocols TLSv1.2 TLSv1.3;)."], effort: "minutes", standard: OWASP.crypto,
      });
    } else if (cert.protocol) o.pass("no-tls13", "Modern TLS version", cert.protocol);
  }

  if (legacy === true) {
    o.fail({
      id: "tls-legacy", severity: "high", title: "Outdated TLS 1.0 / 1.1 is still accepted",
      evidence: "The server completed a handshake when only TLS 1.0 or 1.1 was offered.",
      impact: "These versions have known weaknesses and are banned by PCI DSS for card payments. Keeping them lets attackers downgrade some connections.",
      fix: ["Allow only TLS 1.2 and 1.3 in the server or CDN settings."],
      snippets: [
        { label: "nginx", code: "ssl_protocols TLSv1.2 TLSv1.3;" },
        { label: "Apache", code: "SSLProtocol -all +TLSv1.2 +TLSv1.3" },
        { label: "Cloudflare", code: "SSL/TLS > Edge Certificates > Minimum TLS Version: TLS 1.2" },
      ],
      effort: "minutes", standard: OWASP.crypto,
    }, "Old TLS versions refused");
  } else if (legacy === false) o.pass("tls-legacy", "Old TLS versions refused");

  if (redirect === "http") {
    o.fail({
      id: "http-no-redirect", severity: "high", title: "http:// does not redirect to https://",
      evidence: `http://${host}/ answered without redirecting to HTTPS.`,
      impact: "Visitors who type the address or follow old links use the unencrypted site, where logins and forms can be intercepted.",
      fix: ["Add a permanent (301) redirect from every http:// URL to the same https:// URL."],
      snippets: [
        { label: "nginx", code: "server {\n  listen 80;\n  server_name _;\n  return 301 https://$host$request_uri;\n}" },
        { label: "Apache (.htaccess)", code: "RewriteEngine On\nRewriteCond %{HTTPS} off\nRewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]" },
        { label: "Cloudflare", code: "SSL/TLS > Edge Certificates > Always Use HTTPS: On" },
      ],
      effort: "minutes", standard: OWASP.crypto,
    }, "HTTP redirects to HTTPS");
  } else if (redirect === "https" || redirect === "closed") o.pass("http-no-redirect", "HTTP redirects to HTTPS");

  // HSTS
  const hsts = hdr(page.headers, "strict-transport-security");
  if (page.https) {
    const value = "max-age=31536000; includeSubDomains";
    if (!hsts) {
      o.fail({
        id: "hsts-missing", severity: "medium", title: "HSTS is not enabled",
        evidence: "No Strict-Transport-Security header.",
        impact: "Browsers may still try the insecure http:// version first, which lets an attacker on the same network intercept the visit before the redirect.",
        fix: ["Add the Strict-Transport-Security header once the whole site works over HTTPS.", "Start with a short max-age if you are unsure, then raise it to a year."],
        snippets: headerSnippets(stack, "Strict-Transport-Security", value),
        refs: [MDN("Strict-Transport-Security")], effort: "minutes", standard: OWASP.crypto,
      }, "HSTS enabled");
    } else {
      const age = Number(/max-age=(\d+)/i.exec(hsts)?.[1] ?? 0);
      if (age < 15_552_000) {
        o.fail({
          id: "hsts-short", severity: "low", title: "HSTS is set for too short a time",
          evidence: `Strict-Transport-Security: ${hsts.slice(0, 120)}`,
          impact: "A short max-age means browsers forget to insist on HTTPS quickly, leaving gaps.",
          fix: ["Raise max-age to at least 15552000 (180 days); a year (31536000) is the usual value."],
          snippets: headerSnippets(stack, "Strict-Transport-Security", value), refs: [MDN("Strict-Transport-Security")], effort: "minutes", standard: OWASP.crypto,
        }, "HSTS long enough");
      } else o.pass("hsts-missing", "HSTS enabled", hsts.slice(0, 80));
    }
  }
  return o;
}
