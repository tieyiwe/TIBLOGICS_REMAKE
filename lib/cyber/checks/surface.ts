import type { CyberContext, ModuleOutput, PageInfo } from "../context";
import type { Subdomain } from "../types";
import { Out, OWASP } from "./util";

// Attack surface: subdomains from Certificate Transparency logs (public: every
// certificate ever issued is logged), resolved in DNS. Flags names that point
// at a service that no longer exists (dangling CNAME: a "subdomain takeover"
// risk) and non-production hosts left public (dev, staging, admin...).
// DNS lookups only; the subdomains themselves are not visited.

const SENSITIVE = /(^|[.-])(dev|develop|staging|stage|stg|test|testing|qa|uat|preprod|old|backup|bak|admin|internal|intranet|vpn|jenkins|git|gitlab|jira|db|database|phpmyadmin|cpanel|webmail|ftp|beta|demo|sandbox)([.-]|$)/;
// CNAME targets of services where an unclaimed name can be registered by anyone.
const TAKEOVER = /\.(s3[.-][a-z0-9-]*amazonaws\.com|s3\.amazonaws\.com|cloudfront\.net|herokuapp\.com|herokudns\.com|github\.io|azurewebsites\.net|cloudapp\.net|trafficmanager\.net|blob\.core\.windows\.net|myshopify\.com|wpengine\.com|pantheonsite\.io|ghost\.io|surge\.sh|bitbucket\.io|netlify\.app|vercel\.app|fly\.dev|readme\.io|zendesk\.com|helpscoutdocs\.com|unbouncepages\.com|webflow\.io)\.?$/i;

async function pool<T, R>(items: T[], n: number, fn: (x: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => {
    while (i < items.length) {
      const k = i++;
      out[k] = await fn(items[k]);
    }
  }));
  return out;
}

export async function surface(ctx: CyberContext, page: PageInfo): Promise<ModuleOutput> {
  const o = new Out("surface");
  const names = await ctx.ctNames(page.apex);
  if (names === null) {
    o.skip("subdomains", "Subdomains", "Certificate Transparency logs were unavailable; try again later");
    o.notes.push("Subdomain discovery skipped: crt.sh did not answer.");
    return { ...o, subdomains: [] };
  }
  const list = [...new Set(names)].filter((n) => /^[a-z0-9.-]+$/.test(n)).slice(0, 80);
  const subdomains: Subdomain[] = await pool(list, 8, async (name) => {
    const [addresses, cname] = await Promise.all([ctx.addresses(name), ctx.cname(name)]);
    let status: Subdomain["status"] = (addresses?.length ?? 0) > 0 ? "live" : "no-dns";
    if (cname && !(addresses?.length)) {
      const target = await ctx.addresses(cname.replace(/\.$/, ""));
      if (!target?.length) status = "dangling";
    }
    return { name, addresses: (addresses ?? []).slice(0, 4), cname, status, sensitive: SENSITIVE.test(name.slice(0, -page.apex.length)) };
  });
  o.info("subdomains", "Subdomains found", `${subdomains.length} in certificate logs, ${subdomains.filter((s) => s.status === "live").length} live`);

  const dangling = subdomains.filter((s) => s.status === "dangling");
  const risky = dangling.filter((s) => s.cname && TAKEOVER.test(s.cname));
  if (dangling.length) {
    o.fail({
      id: "dangling-cname", severity: risky.length ? "high" : "medium",
      title: risky.length ? "Subdomains could be taken over" : "Subdomains point at services that no longer exist",
      evidence: dangling.slice(0, 8).map((s) => `${s.name} → ${s.cname}`).join("; "),
      impact: "A subdomain that still points at a deleted cloud service (a bucket, an app, a page) can often be claimed by anyone. They then host phishing pages or malware on the business's own name, with a valid certificate.",
      fix: ["For each listed subdomain: delete the DNS record if the service is no longer used.", "If it is still needed, recreate the service so the name is claimed by you again."],
      refs: [{ label: "OWASP: subdomain takeover testing", url: "https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/02-Configuration_and_Deployment_Management_Testing/10-Test_for_Subdomain_Takeover" }],
      effort: "minutes", standard: OWASP.misconfig,
    }, "No dangling subdomains");
  } else o.pass("dangling-cname", "No dangling subdomains");

  const exposed = subdomains.filter((s) => s.sensitive && s.status === "live");
  if (exposed.length) {
    o.fail({
      id: "nonprod-exposed", severity: "low", title: "Test, staging or admin hosts are public",
      evidence: exposed.slice(0, 10).map((s) => s.name).join(", "),
      impact: "Development and admin systems are usually less protected and less updated than the main site, and they often hold real data. They are a common way in.",
      fix: ["Put these hosts behind a login, a VPN or an IP allow-list (Cloudflare Access is free for small teams).", "Delete the ones nobody uses any more.", "Make sure test copies do not contain real customer data."],
      effort: "hours", standard: OWASP.misconfig,
    }, "Non-production hosts private");
  }
  return { ...o, subdomains };
}
