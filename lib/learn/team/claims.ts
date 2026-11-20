import prisma from "@/lib/prisma";

// Claim-before-send for team emails (TeamEmailClaim, see ./db.ts). A sender
// first inserts the email's key; only the caller whose insert succeeded sends.
// A failed send releases the key so the next run retries it.

export async function claimEmail(key: string, teamId: string): Promise<boolean> {
  const rows = await prisma.$queryRaw<Array<{ key: string }>>`
    INSERT INTO "TeamEmailClaim" ("key", "teamId") VALUES (${key}, ${teamId})
    ON CONFLICT ("key") DO NOTHING RETURNING "key"`;
  return rows.length === 1;
}

export async function releaseClaim(key: string): Promise<void> {
  await prisma.$executeRaw`DELETE FROM "TeamEmailClaim" WHERE "key" = ${key}`.catch(() => undefined);
}

/** Old keys are only an audit trail; keep a year. */
export async function pruneClaims(): Promise<void> {
  await prisma.$executeRaw`DELETE FROM "TeamEmailClaim" WHERE "createdAt" < NOW() - INTERVAL '400 days'`.catch(() => undefined);
}
