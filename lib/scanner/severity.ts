// How serious a security finding is, and the security grade.
//
//   critical  visitors are exposed now: expired or untrusted certificate,
//             logins or forms sent unencrypted
//   high      a known, exploitable weakness: old TLS, no HTTPS redirect,
//             outdated libraries with published fixes, unprotected session
//             cookies, insecure content, no DMARC (domain can be spoofed)
//   medium    a missing defence: HSTS, CSP, framing, version banners, SPF, DKIM
//   low       good practice: nosniff, Referrer-Policy, Permissions-Policy, CAA,
//             integrity checks on CDN scripts
//
// A finding the scanner marks "warning" (partial, or a nice-to-have) sits one
// level below its check's level. Critical and high findings are the paid
// part of the report: their text is never sent to a visitor who has not
// unlocked it.

export type Severity = "critical" | "high" | "medium" | "low";
export const SEVERITIES: Severity[] = ["critical", "high", "medium", "low"];

const BY_CHECK: Record<string, Severity> = {
  "tls-cert": "critical",
  "insecure-form": "critical",
  "tls-legacy": "high",
  "https-redirect": "high",
  "outdated-libs": "high",
  "cookie-flags": "high",
  "mixed-content": "high",
  dmarc: "high",
  hsts: "medium",
  csp: "medium",
  "x-frame": "medium",
  "server-banner": "medium",
  "cms-version": "medium",
  spf: "medium",
  dkim: "medium",
  "x-content-type": "low",
  "referrer-policy": "low",
  "permissions-policy": "low",
  caa: "low",
  sri: "low",
};

const DOWN: Record<Severity, Severity> = { critical: "high", high: "medium", medium: "low", low: "low" };

/** Severity of a failed security finding; null for a passed one or another area. */
export function severityOf(f: { check: string; area: string; type: "good" | "warning" | "bad" }): Severity | null {
  if (f.area !== "security" || f.type === "good") return null;
  const base = BY_CHECK[f.check] ?? "medium";
  return f.type === "warning" ? DOWN[base] : base;
}

/** Locked until the report is unlocked (paid, booked call or staff). */
export const isLockedSeverity = (s: Severity | null) => s === "critical" || s === "high";

/** A–F from the security score, held down while critical or high issues remain. */
export function securityGrade(score: number, counts: Record<Severity, number>): "A" | "B" | "C" | "D" | "F" {
  let g: "A" | "B" | "C" | "D" | "F" = score >= 90 ? "A" : score >= 80 ? "B" : score >= 70 ? "C" : score >= 55 ? "D" : "F";
  const order = ["A", "B", "C", "D", "F"] as const;
  const cap = (max: (typeof order)[number]) => {
    if (order.indexOf(g) < order.indexOf(max)) g = max;
  };
  if (counts.critical > 0) cap("D");
  else if (counts.high > 0) cap("C");
  return g;
}
