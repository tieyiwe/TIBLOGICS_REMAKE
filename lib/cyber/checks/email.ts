import type { CyberContext, ModuleOutput, PageInfo } from "../context";
import { Out, OWASP } from "./util";

// Email spoofing protection for the domain: SPF, DKIM, DMARC, MTA-STS,
// TLS-RPT. DNS lookups only. Without them, anyone can send email that
// appears to come from the business (invoice fraud, phishing its customers).

const DKIM_SELECTORS = ["google", "selector1", "selector2", "default", "titan1", "k1", "k2", "s1", "s2", "mail", "dkim", "smtp", "zoho", "fm1", "mxvault", "everlytickey1", "protonmail", "mandrill", "sendgrid", "amazonses"];

export async function email(ctx: CyberContext, page: PageInfo): Promise<ModuleOutput> {
  const o = new Out("email");
  const d = page.apex;
  const [mx, root, dmarcTxt, mtaSts, tlsRpt, ...dkim] = await Promise.all([
    ctx.mx(d),
    ctx.txt(d),
    ctx.txt(`_dmarc.${d}`),
    ctx.txt(`_mta-sts.${d}`),
    ctx.txt(`_smtp._tls.${d}`),
    ...DKIM_SELECTORS.map((s) => ctx.txt(`${s}._domainkey.${d}`)),
  ]);
  if (mx === null || root === null) {
    o.notes.push("DNS for the domain could not be read, so email security was not checked.");
    o.skip("spf", "Email security", "DNS lookups failed");
    return o;
  }
  const sendsMail = mx.length > 0 && !(mx.length === 1 && mx[0] === "");
  if (!sendsMail) o.info("mx", "Mail servers", "The domain has no MX records (it receives no email)");
  else o.pass("mx", "Mail servers", mx.slice(0, 3).join(", "));

  // SPF
  const spfs = root.filter((r) => /^v=spf1\b/i.test(r));
  const spfDomainRef = { label: "M3AAWG / Cloudflare: what SPF, DKIM and DMARC do", url: "https://www.cloudflare.com/learning/email-security/dmarc-dkim-spf/" };
  if (spfs.length === 0) {
    o.fail({
      id: "spf-missing", severity: sendsMail ? "high" : "medium", title: "No SPF record",
      evidence: `No v=spf1 TXT record on ${d}.`,
      impact: "Nothing tells receiving mail servers who may send email for this domain, so criminals can send convincing emails \"from\" the business to its customers and suppliers. Its own emails are also more likely to land in spam.",
      fix: ["List every service that sends your email (mail host, newsletter tool, CRM, website forms).", "Publish one SPF record with those includes, ending in ~all (or -all once sure)."],
      snippets: [{ label: "DNS record (TXT on the root domain), example", code: sendsMail ? `v=spf1 mx include:<your-mail-provider> ~all` : "v=spf1 -all" }],
      refs: [spfDomainRef], effort: "hours", standard: OWASP.misconfig,
    }, "SPF published");
  } else if (spfs.length > 1) {
    o.fail({ id: "spf-multiple", severity: "high", title: "More than one SPF record", evidence: `${spfs.length} SPF records found.`, impact: "With two SPF records, receivers treat SPF as broken: the protection does not work at all.", fix: ["Merge them into a single v=spf1 record."], effort: "minutes", standard: OWASP.misconfig });
  } else {
    const spf = spfs[0];
    const lookups = (spf.match(/\b(include:|a\b|a:|mx\b|mx:|ptr|exists:|redirect=)/gi) ?? []).length;
    if (/[+?]all\b/i.test(spf) || !/all\b|redirect=/i.test(spf)) {
      o.fail({ id: "spf-permissive", severity: "high", title: "The SPF record lets anyone send", evidence: spf.slice(0, 200), impact: "The record ends with +all, ?all or no rule, so it allows every server in the world to send as this domain: no protection.", fix: ["End the record with ~all (soft fail) or -all (hard fail)."], effort: "minutes", standard: OWASP.misconfig }, "SPF restrictive");
    } else if (lookups > 10) {
      o.fail({ id: "spf-too-many-lookups", severity: "medium", title: "SPF needs more than 10 DNS lookups", evidence: `About ${lookups} lookups: ${spf.slice(0, 160)}`, impact: "Receivers stop after 10 lookups and treat SPF as failed, so legitimate email can bounce or go to spam.", fix: ["Remove services you no longer use.", "Replace includes with ip4:/ip6: ranges where providers allow it, or use an SPF flattening service."], effort: "hours", standard: OWASP.misconfig });
    } else o.pass("spf-missing", "SPF published", spf.slice(0, 100));
  }

  // DKIM
  const found = DKIM_SELECTORS.filter((_, i) => (dkim[i] ?? []).some((r) => /v=DKIM1|(?:^|;)\s*p=/i.test(r)));
  if (sendsMail && !found.length) {
    o.fail({
      id: "dkim-missing", severity: "medium", title: "No DKIM signature key found",
      evidence: `None of the ${DKIM_SELECTORS.length} common DKIM selectors has a key (a custom selector may exist).`,
      impact: "Without DKIM, emails cannot prove they were really sent by the business and were not altered. Gmail and Yahoo now require it for reliable delivery.",
      fix: ["Turn on DKIM signing in your email provider (Google Workspace, Microsoft 365, Titan, Zoho...).", "Publish the TXT record it gives you, then enable signing."],
      refs: [spfDomainRef], effort: "minutes", standard: OWASP.misconfig,
    }, "DKIM key published");
  } else if (found.length) o.pass("dkim-missing", "DKIM key published", `selector: ${found.join(", ")}`);

  // DMARC
  const dmarc = (dmarcTxt ?? []).find((r) => /^v=DMARC1/i.test(r));
  const dmarcSnippet = { label: "DNS record (TXT on _dmarc)", code: `_dmarc.${d}  TXT  "v=DMARC1; p=quarantine; rua=mailto:dmarc@${d}; adkim=s; aspf=s"` };
  if (!dmarc) {
    o.fail({
      id: "dmarc-missing", severity: "high", title: "No DMARC policy",
      evidence: `No v=DMARC1 record at _dmarc.${d}.`,
      impact: "Receiving servers are not told to reject fake emails using the business's name, so phishing and invoice fraud in its name get delivered. You also get no reports of who is sending as you.",
      fix: ["Publish a DMARC record starting with p=none and a reporting address to see who sends as you.", "Once SPF and DKIM pass for your real senders, move to p=quarantine, then p=reject."],
      snippets: [{ label: "DNS record (TXT on _dmarc), start here", code: `_dmarc.${d}  TXT  "v=DMARC1; p=none; rua=mailto:dmarc@${d}"` }, dmarcSnippet],
      refs: [{ label: "dmarc.org overview", url: "https://dmarc.org/overview/" }], effort: "hours", standard: OWASP.misconfig,
    }, "DMARC policy");
  } else {
    const p = /p=(\w+)/i.exec(dmarc)?.[1]?.toLowerCase() ?? "none";
    if (p === "none") {
      o.fail({ id: "dmarc-none", severity: "medium", title: "DMARC is set to monitor only (p=none)", evidence: dmarc.slice(0, 200), impact: "Fake emails in the business's name are still delivered; p=none only reports them.", fix: ["Check the DMARC reports so your real senders pass SPF and DKIM.", "Move to p=quarantine, then p=reject."], snippets: [dmarcSnippet], effort: "hours", standard: OWASP.misconfig }, "DMARC enforced");
    } else o.pass("dmarc-missing", "DMARC enforced", `p=${p}`);
    if (!/rua=/i.test(dmarc)) o.fail({ id: "dmarc-no-reports", severity: "info", title: "DMARC reports are not collected", evidence: "No rua= address in the DMARC record.", impact: "Nobody sees who is sending email in the business's name, or whether real email is failing.", fix: ["Add rua=mailto:<an address you read> (or a free DMARC report service)."], effort: "minutes" });
  }

  if (sendsMail) {
    if (!(mtaSts ?? []).some((r) => /v=STSv1/i.test(r))) {
      o.fail({ id: "mta-sts-missing", severity: "info", title: "MTA-STS is not set up", evidence: `No _mta-sts.${d} record.`, impact: "Email sent to the business can be downgraded to unencrypted delivery by an attacker in the path. MTA-STS makes encryption mandatory.", fix: ["Publish an MTA-STS policy (a TXT record and a small text file on https://mta-sts." + d + "/.well-known/mta-sts.txt)."], refs: [{ label: "RFC 8461", url: "https://www.rfc-editor.org/rfc/rfc8461" }], effort: "hours" });
    } else o.pass("mta-sts-missing", "MTA-STS");
    if (!(tlsRpt ?? []).some((r) => /v=TLSRPTv1/i.test(r))) o.info("tls-rpt", "TLS reporting (TLS-RPT)", "Not set up (optional)");
    else o.pass("tls-rpt", "TLS reporting (TLS-RPT)");
  }
  return o;
}
