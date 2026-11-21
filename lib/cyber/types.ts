// The admin cyber scanner (lib/cyber): types shared by the checks, the
// scoring, the report page, the PDF and the email.

export type Severity = "critical" | "high" | "medium" | "low" | "info";
export const SEVERITIES: Severity[] = ["critical", "high", "medium", "low", "info"];

export type Category = "transport" | "headers" | "cookies" | "email" | "dns" | "surface" | "software" | "content" | "exposure" | "pentest";
export const CATEGORIES: Category[] = ["transport", "headers", "cookies", "email", "dns", "software", "content", "surface", "exposure", "pentest"];

export const CATEGORY_LABEL: Record<Category, string> = {
  transport: "Encryption (HTTPS and TLS)",
  headers: "Browser protections (security headers)",
  cookies: "Cookies and sessions",
  email: "Email spoofing protection",
  dns: "Domain and DNS",
  surface: "Attack surface (subdomains)",
  software: "Software and versions",
  content: "Page content and third parties",
  exposure: "Exposed files and admin areas",
  pentest: "Active tests (how the site handles input)",
};

export type Effort = "minutes" | "hours" | "days";

export interface Snippet {
  /** "nginx", "Apache (.htaccess)", "Cloudflare", "DNS record"... */
  label: string;
  code: string;
}

export interface Finding {
  /** Stable id, e.g. "hsts-missing"; also used to compare scans. */
  id: string;
  category: Category;
  severity: Severity;
  title: string;
  /** What we saw, factual and safe to share (never secrets or file contents). */
  evidence: string;
  /** Why it matters to the business, in plain language. */
  impact: string;
  /** How to fix it, in order. */
  fix: string[];
  snippets?: Snippet[];
  refs?: { label: string; url: string }[];
  effort: Effort;
  /** One-line practical tip: the fastest way to fix it (lib/cyber/tips.ts). */
  tip?: string;
  /** OWASP Top 10 (2021) or similar, for the technical reader. */
  standard?: string;
}

export interface CheckResult {
  id: string;
  category: Category;
  title: string;
  status: "pass" | "fail" | "warn" | "info" | "skipped";
  note?: string;
}

export interface Subdomain {
  name: string;
  /** Resolves to addresses, a CNAME target, or nothing. */
  addresses: string[];
  cname: string | null;
  status: "live" | "dangling" | "no-dns";
  /** Looks like a non-production or sensitive host (dev, staging, admin...). */
  sensitive: boolean;
}

export interface Platform {
  server: string | null;
  poweredBy: string | null;
  cdn: string | null;
  cms: string | null;
  cmsVersion: string | null;
  libraries: { name: string; version: string | null; outdated: boolean }[];
}

export interface CyberResult {
  url: string;
  finalUrl: string;
  domain: string;
  startedAt: string;
  finishedAt: string;
  deep: boolean;
  score: number;
  grade: "A" | "B" | "C" | "D" | "F";
  counts: Record<Severity, number>;
  categoryScores: Partial<Record<Category, number>>;
  findings: Finding[];
  checks: CheckResult[];
  platform: Platform;
  subdomains: Subdomain[];
  /** Fix first / next / hardening, ids of findings. */
  plan: { now: string[]; next: string[]; later: string[] };
  /** Notes on what could not be checked (timeouts, refused). */
  notes: string[];
}
