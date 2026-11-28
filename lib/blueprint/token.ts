import { createHash, createHmac, randomBytes } from "crypto";
import prisma from "@/lib/prisma";

// The blueprint's private link, built the same way as the Readiness Monitor's
// (lib/monitor/token.ts): HMAC(NEXTAUTH_SECRET, id:salt), with only the salt
// and a hash stored. A new link rotates the salt and kills the old one.

function secret(): string {
  const s = process.env.NEXTAUTH_SECRET;
  if (!s) throw new Error("NEXTAUTH_SECRET is required for blueprint links");
  return s;
}

export const newSalt = () => randomBytes(16).toString("hex");
export const blueprintToken = (id: string, salt: string) =>
  createHmac("sha256", secret()).update(`blueprint:${id}:${salt}`).digest("base64url").slice(0, 32);
export const hashToken = (t: string) => createHash("sha256").update(t).digest("hex");
export const looksLikeToken = (t: unknown): t is string => typeof t === "string" && /^[A-Za-z0-9_-]{32}$/.test(t);

const base = () => (process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL ?? "https://tiblogics.com").replace(/\/$/, "");

export async function blueprintLink(bp: { id: string; tokenSalt: string; tokenHash: string }): Promise<string> {
  const token = blueprintToken(bp.id, bp.tokenSalt);
  const hash = hashToken(token);
  if (hash !== bp.tokenHash) await prisma.blueprint.update({ where: { id: bp.id }, data: { tokenHash: hash } });
  return `${base()}/blueprint/${token}`;
}

export async function rotateBlueprintLink(id: string): Promise<string> {
  const tokenSalt = newSalt();
  const token = blueprintToken(id, tokenSalt);
  await prisma.blueprint.update({ where: { id }, data: { tokenSalt, tokenHash: hashToken(token) } });
  return `${base()}/blueprint/${token}`;
}

/** Short, unambiguous, quotable on a call: BP-7KQ2XM. */
export function newCreditCode(): string {
  const alphabet = "23456789ABCDEFGHJKMNPQRSTVWXYZ";
  const bytes = randomBytes(6);
  return "BP-" + Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}
