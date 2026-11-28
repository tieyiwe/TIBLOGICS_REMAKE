import type { CheckResult, Category, Finding } from "../types";

/** Builds a module's findings and checks with less noise. */
export class Out {
  findings: Finding[] = [];
  checks: CheckResult[] = [];
  notes: string[] = [];
  constructor(private category: Category) {}
  pass(id: string, title: string, note?: string) {
    this.checks.push({ id, category: this.category, title, status: "pass", ...(note ? { note } : {}) });
  }
  skip(id: string, title: string, note: string) {
    this.checks.push({ id, category: this.category, title, status: "skipped", note });
  }
  info(id: string, title: string, note?: string) {
    this.checks.push({ id, category: this.category, title, status: "info", ...(note ? { note } : {}) });
  }
  fail(f: Omit<Finding, "category">, checkTitle?: string) {
    this.findings.push({ ...f, category: this.category });
    this.checks.push({ id: f.id, category: this.category, title: checkTitle ?? f.title, status: f.severity === "low" || f.severity === "info" ? "warn" : "fail" });
  }
}

export const OWASP = {
  crypto: "OWASP A02:2021 Cryptographic Failures",
  misconfig: "OWASP A05:2021 Security Misconfiguration",
  components: "OWASP A06:2021 Vulnerable and Outdated Components",
  auth: "OWASP A07:2021 Identification and Authentication Failures",
  integrity: "OWASP A08:2021 Software and Data Integrity Failures",
  access: "OWASP A01:2021 Broken Access Control",
  logging: "OWASP A09:2021 Security Logging and Monitoring Failures",
};

export const MDN = (h: string) => ({ label: `MDN: ${h}`, url: `https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/${h}` });

/** Header value, case-insensitive. */
export const hdr = (h: Record<string, string>, name: string) => h[name.toLowerCase()] ?? null;
