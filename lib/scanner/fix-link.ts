import { createHmac } from "crypto";
import { secretEquals } from "@/lib/require-admin";
import type { AnyFinding } from "./view";

// "Fix this for me" links in the scanner's emails:
//   /services/get-started?scan=<token>&fix=<check|all|security>&k=<signature>
// open the service request form already filled in with the site, the
// problem(s) and the matching service. The signature proves the link came
// from our email: the report token alone is shareable (the share buttons on a
// report), and the problems are only ever sent to the address that asked.

const SITE = (process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL ?? "https://tiblogics.com").replace(/\/$/, "");

export type FixScope = "all" | "security" | string;

function sign(token: string, fix: FixScope): string | null {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) return null;
  return createHmac("sha256", secret).update(`scanner-fix:${token}:${fix}`).digest("base64url").slice(0, 24);
}

export function fixUrl(token: string, fix: FixScope): string {
  const k = sign(token, fix);
  return `${SITE}/services/get-started?scan=${encodeURIComponent(token)}&fix=${encodeURIComponent(fix)}${k ? `&k=${k}` : ""}`;
}

export function validFixLink(token: string, fix: string, k: string | null): boolean {
  const want = sign(token, fix);
  return !!want && !!k && secretEquals(k, want);
}

/** The service on the request form that fixes a finding (values of SERVICES in get-started). */
export function serviceFor(f: Pick<AnyFinding, "area"> & { service?: string }): string {
  const s = "service" in f ? f.service : undefined;
  if (f.area === "security" || s === "security" || s === "email") return "Cybersecurity";
  if (s === "automation") return "Workflow Automation";
  if (s === "ai-assistant") return "AI Implementation & Agents";
  if (s === "analytics") return "Data Analytics";
  return "Web & App Development";
}
