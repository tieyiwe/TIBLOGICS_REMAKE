import { randomBytes } from "crypto";
import prisma from "@/lib/prisma";
import { ensureCyberTables, type EngagementRow } from "./db";

// Authorised testing. Active checks (exposed files, input tests, the manual
// tools) send requests a site owner has not asked for, which is only
// acceptable, and in many countries only legal, with the owner's written
// permission. An engagement records that permission: the client, who
// authorised it, the domains in scope and the dates. Active work runs only on
// a host inside an engagement's scope, between its dates, until revoked.

export const newId = () => "c" + Array.from(randomBytes(24), (b) => "abcdefghijklmnopqrstuvwxyz0123456789"[b % 36]).join("");

/** Normalised scope entry: a lower-case domain without scheme, path or "www.". */
export function normDomain(raw: string): string | null {
  let v = raw.trim().toLowerCase();
  if (!v) return null;
  v = v.replace(/^[a-z]+:\/\//, "").replace(/[/?#].*$/, "").replace(/:\d+$/, "").replace(/^\*\./, "").replace(/^www\./, "").replace(/\.$/, "");
  return /^(?=.{3,253}$)([a-z0-9-]+\.)+[a-z]{2,63}$/.test(v) ? v : null;
}

/** The host is the scope domain or one of its subdomains. */
export function inScope(host: string, scope: string[]): boolean {
  const h = host.toLowerCase().replace(/\.$/, "");
  return scope.some((d) => h === d || h.endsWith(`.${d}`));
}

export function isActive(e: Pick<EngagementRow, "startsAt" | "endsAt" | "revokedAt">, now = new Date()): boolean {
  return !e.revokedAt && e.startsAt <= now && e.endsAt >= now;
}

export async function listEngagements(): Promise<EngagementRow[]> {
  await ensureCyberTables();
  return prisma.$queryRawUnsafe<EngagementRow[]>(`SELECT * FROM "CyberEngagement" ORDER BY "createdAt" DESC LIMIT 200`);
}

export async function getEngagement(id: string): Promise<EngagementRow | null> {
  if (!/^[a-z0-9]{10,40}$/.test(id)) return null;
  await ensureCyberTables();
  return (await prisma.$queryRawUnsafe<EngagementRow[]>(`SELECT * FROM "CyberEngagement" WHERE "id" = $1`, id))[0] ?? null;
}

/** The active engagement that covers this host, if any. */
export async function engagementFor(host: string, id?: string | null): Promise<EngagementRow | null> {
  const list = id ? [await getEngagement(id)].filter((x): x is EngagementRow => !!x) : await listEngagements();
  return list.find((e) => isActive(e) && inScope(host, e.scope)) ?? null;
}

export async function createEngagement(e: Omit<EngagementRow, "id" | "createdAt" | "revokedAt">): Promise<string> {
  await ensureCyberTables();
  const id = newId();
  await prisma.$executeRawUnsafe(
    `INSERT INTO "CyberEngagement" ("id","createdBy","client","contactName","contactEmail","authorizedBy","scope","startsAt","endsAt","note")
     VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9,$10)`,
    id, e.createdBy, e.client, e.contactName, e.contactEmail, e.authorizedBy, JSON.stringify(e.scope), e.startsAt, e.endsAt, e.note,
  );
  return id;
}

export async function revokeEngagement(id: string): Promise<boolean> {
  await ensureCyberTables();
  return (await prisma.$executeRawUnsafe(`UPDATE "CyberEngagement" SET "revokedAt" = now() WHERE "id" = $1 AND "revokedAt" IS NULL`, id)) === 1;
}
