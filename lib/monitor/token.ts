import { createHash, createHmac, randomBytes } from "crypto";
import prisma from "@/lib/prisma";

// The dashboard link is the subscriber's credential, like a download link.
//
// The token is HMAC(NEXTAUTH_SECRET, id:salt). The database holds the salt and
// a hash of the token, never the token: a leaked table alone opens nothing,
// yet every report email can still carry a working link because the server can
// recompute it. Emailing a fresh link rotates the salt, which kills the old
// one — the answer to "I forwarded my link to the wrong person".

function secret(): string {
  const s = process.env.NEXTAUTH_SECRET;
  if (!s) throw new Error("NEXTAUTH_SECRET is required for monitor links");
  return s;
}

export function newTokenSalt(): string {
  return randomBytes(16).toString("hex");
}

export function monitorToken(id: string, salt: string): string {
  return createHmac("sha256", secret()).update(`monitor:${id}:${salt}`).digest("base64url").slice(0, 32);
}

export function hashMonitorToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Shape check before touching the database. */
export function looksLikeMonitorToken(token: unknown): token is string {
  return typeof token === "string" && /^[A-Za-z0-9_-]{32}$/.test(token);
}

function siteBase(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL ?? "https://tiblogics.com").replace(/\/$/, "");
}

/**
 * The working dashboard URL for a subscription, for an email.
 *
 * If NEXTAUTH_SECRET has changed since the hash was stored, the recomputed
 * token would not match and the emailed link would be dead; the stored hash is
 * brought up to date so it always opens.
 */
export async function monitorLink(sub: { id: string; tokenSalt: string; tokenHash: string }): Promise<string> {
  const token = monitorToken(sub.id, sub.tokenSalt);
  const hash = hashMonitorToken(token);
  if (hash !== sub.tokenHash) {
    await prisma.monitorSubscription.update({ where: { id: sub.id }, data: { tokenHash: hash } });
  }
  return `${siteBase()}/monitor/${token}`;
}

/** New salt, new link; the previous link stops working. */
export async function rotateMonitorLink(id: string): Promise<string> {
  const tokenSalt = newTokenSalt();
  const token = monitorToken(id, tokenSalt);
  await prisma.monitorSubscription.update({
    where: { id },
    data: { tokenSalt, tokenHash: hashMonitorToken(token) },
  });
  return `${siteBase()}/monitor/${token}`;
}
