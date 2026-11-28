import type { CyberContext, ModuleOutput, PageInfo } from "../context";
import { Out, OWASP } from "./util";

// Domain hygiene: CAA (who may issue certificates), name servers, DNSSEC.

export async function dns(ctx: CyberContext, page: PageInfo): Promise<ModuleOutput> {
  const o = new Out("dns");
  const d = page.apex;
  const [caa, ns, dnssec] = await Promise.all([ctx.caa(d), ctx.ns(d), ctx.dnssec(d)]);
  if (caa === false) {
    o.fail({
      id: "caa-missing", severity: "low", title: "No CAA record",
      evidence: `No CAA record on ${d}.`,
      impact: "Any certificate authority may issue a certificate for the domain. A CAA record limits that to the ones you use, which makes a fraudulent certificate harder to obtain.",
      fix: ["Add CAA records for the certificate authorities you use (e.g. Let's Encrypt, your host's CA)."],
      snippets: [{ label: "DNS records, example for Let's Encrypt", code: `${d}.  CAA  0 issue "letsencrypt.org"\n${d}.  CAA  0 iodef "mailto:security@${d}"` }],
      refs: [{ label: "Let's Encrypt: CAA", url: "https://letsencrypt.org/docs/caa/" }], effort: "minutes", standard: OWASP.misconfig,
    }, "CAA record");
  } else if (caa) o.pass("caa-missing", "CAA record");
  else o.skip("caa-missing", "CAA record", "DNS lookup failed");

  if (ns && ns.length === 1) {
    o.fail({ id: "single-ns", severity: "low", title: "Only one name server", evidence: `NS: ${ns[0]}`, impact: "If that one server fails, the website and email stop working.", fix: ["Use at least two name servers on separate networks (most DNS providers give you two or four)."], effort: "minutes" });
  } else if (ns?.length) o.pass("single-ns", "Redundant name servers", ns.slice(0, 4).join(", "));

  if (dnssec === false) {
    o.fail({ id: "dnssec-off", severity: "info", title: "DNSSEC is not enabled", evidence: `No DS record for ${d}.`, impact: "DNS answers for the domain are not signed, so in rare targeted attacks visitors can be sent to a fake server. Most registrars enable it in one click.", fix: ["Enable DNSSEC at your DNS provider, then add the DS record at your registrar (often automatic)."], effort: "minutes" });
  } else if (dnssec) o.pass("dnssec-off", "DNSSEC enabled");
  return o;
}
