import { randomUUID } from "crypto";
import prisma from "@/lib/prisma";
import { ensureScholarshipTables } from "./db";
import { sponsorReport } from "./admin";
import { sendSponsorReport } from "./emails";

// The automatic monthly impact report to each sponsor (daily scholarship
// cron). From the 1st of each month, every sponsor named with an email on an
// approved or accepted award gets the report once (cumulative impact plus
// last month's lessons and certificates), sent only to the sponsor email
// stored on their awards. Claimed before sending in ScholarshipSponsorReport
// ("auto:<sponsor>:<YYYY-MM>"); a failed send releases the claim and the next
// run retries. Staff can pause it (AdminSettings, below). Reports sent by
// hand from admin are logged in the same table, for "last sent".

const SETTING = "scholarship.sponsorReports.auto";
export const sponsorKey = (name: string) => name.trim().toLowerCase();

/** Last calendar month (UTC): its key (YYYY-MM) and [start, end). */
function previousMonth(now: Date): { key: string; start: Date; end: Date } {
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const start = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() - 1, 1));
  return { key: start.toISOString().slice(0, 7), start, end };
}

export async function autoSponsorReportsOn(): Promise<boolean> {
  const row = await prisma.adminSettings.findUnique({ where: { key: SETTING } }).catch(() => null);
  return row?.value !== "off";
}

export async function setAutoSponsorReports(on: boolean): Promise<void> {
  const value = on ? "on" : "off";
  await prisma.adminSettings.upsert({ where: { key: SETTING }, create: { key: SETTING, value }, update: { value } });
}

/** Logs a report sent by hand from admin. */
export async function logManualSponsorReport(sponsor: string, to: string): Promise<void> {
  await ensureScholarshipTables();
  await prisma.$executeRawUnsafe(
    `INSERT INTO "ScholarshipSponsorReport" ("key", "sponsor", "month", "sentTo") VALUES ($1, $2, NULL, $3) ON CONFLICT ("key") DO NOTHING`,
    `manual:${randomUUID()}`,
    sponsorKey(sponsor),
    to,
  );
}

export interface LastSponsorReport {
  at: Date;
  to: string | null;
  automatic: boolean;
}

/** The latest report sent to each sponsor (by sponsorKey). */
export async function lastSponsorReports(): Promise<Map<string, LastSponsorReport>> {
  await ensureScholarshipTables();
  const rows = await prisma.$queryRawUnsafe<Array<{ sponsor: string; sentAt: Date; sentTo: string | null; month: string | null }>>(
    `SELECT DISTINCT ON ("sponsor") "sponsor", "sentAt", "sentTo", "month" FROM "ScholarshipSponsorReport" ORDER BY "sponsor", "sentAt" DESC`,
  );
  return new Map(rows.map((r) => [r.sponsor, { at: r.sentAt, to: r.sentTo, automatic: r.month != null }]));
}

async function claim(key: string, sponsor: string, month: string, to: string): Promise<boolean> {
  const rows = await prisma.$queryRawUnsafe<Array<{ key: string }>>(
    `INSERT INTO "ScholarshipSponsorReport" ("key", "sponsor", "month", "sentTo") VALUES ($1, $2, $3, $4) ON CONFLICT ("key") DO NOTHING RETURNING "key"`,
    key,
    sponsor,
    month,
    to,
  );
  return rows.length === 1;
}

const release = (key: string) => prisma.$executeRawUnsafe(`DELETE FROM "ScholarshipSponsorReport" WHERE "key" = $1`, key).catch(() => undefined);

export interface SponsorRun {
  month: string;
  paused?: boolean;
  sent: number;
  skipped: number;
  failed: number;
  /** Dry run only: the sponsors that would get a report now. */
  wouldSend?: string[];
}

export async function runSponsorReports(opts: { now?: Date; dry?: boolean; deadline?: number } = {}): Promise<SponsorRun> {
  await ensureScholarshipTables();
  const now = opts.now ?? new Date();
  const stop = opts.deadline ?? Date.now() + 40_000;
  const month = previousMonth(now);
  const out: SponsorRun = { month: month.key, sent: 0, skipped: 0, failed: 0, ...(opts.dry ? { wouldSend: [] } : {}) };
  if (!(await autoSponsorReportsOn())) return { ...out, paused: true };

  // Sponsors with an email on an approved or accepted award made before the
  // end of the month (nothing to report for an award made since).
  const awards = await prisma.scholarship.findMany({
    where: { status: { in: ["approved", "claimed"] }, sponsorName: { not: null }, sponsorEmail: { not: null } },
    select: { sponsorName: true, approvedAt: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
  const sponsors = new Map<string, string>();
  for (const a of awards) {
    // The name as stored: sponsorReport() matches it exactly (any case).
    const name = a.sponsorName;
    if (!name?.trim() || (a.approvedAt ?? a.createdAt) >= month.end) continue;
    if (!sponsors.has(sponsorKey(name))) sponsors.set(sponsorKey(name), name);
  }
  if (!sponsors.size) return out;
  const keys = [...sponsors.keys()].map((k) => `auto:${k}:${month.key}`);
  const done = new Set(
    (await prisma.$queryRawUnsafe<Array<{ key: string }>>(`SELECT "key" FROM "ScholarshipSponsorReport" WHERE "key" = ANY($1)`, keys)).map((r) => r.key),
  );

  for (const [k, name] of sponsors) {
    if (Date.now() > stop) break;
    const key = `auto:${k}:${month.key}`;
    if (done.has(key)) {
      out.skipped++;
      continue;
    }
    try {
      const report = await sponsorReport(name, { month });
      // Only the address stored on the sponsor's own awards.
      const to = report.email;
      if (!report.awarded || !to) continue;
      if (opts.dry) {
        out.wouldSend!.push(report.sponsor);
        continue;
      }
      if (!(await claim(key, k, month.key, to))) {
        out.skipped++;
        continue;
      }
      try {
        await sendSponsorReport(to, report, { monthly: true });
        out.sent++;
      } catch (err) {
        await release(key);
        throw err;
      }
    } catch (err) {
      out.failed++;
      console.error("[scholarship] sponsor report", name, err instanceof Error ? err.message : err);
    }
  }
  return out;
}
