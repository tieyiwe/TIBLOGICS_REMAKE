import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";

/** Returns null if authenticated, or a 401 NextResponse to return immediately */
export async function requireAdmin(): Promise<NextResponse | null> {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

/** Escape user-supplied strings before embedding in HTML email templates */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

/** Basic email format check */
export function isValidEmail(email: unknown): email is string {
  return (
    typeof email === "string" &&
    email.length <= 320 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)
  );
}

/** Anonymise IP to /24 block (removes last octet) for GDPR-friendly storage */
export function anonymiseIp(ip: string): string {
  if (!ip || ip === "unknown") return "unknown";
  // IPv4
  const v4 = ip.match(/^(\d{1,3}\.\d{1,3}\.\d{1,3})\.\d{1,3}$/);
  if (v4) return v4[1] + ".0";
  // IPv6 — keep first 4 groups
  const v6 = ip.split(":");
  if (v6.length >= 4) return v6.slice(0, 4).join(":") + "::";
  return "unknown";
}
