import prisma from "@/lib/prisma";
import { ensureAnalyticsTables } from "./db";
import { cached } from "./cache";
import type { Filters } from "./filters";
import { SCAN_OUTCOMES, type ScanLogRow } from "./scan-log";

// Queries behind the scan log (/admin_pro/scanner-leads/scan-log): newest
// scans with filters, and summary tiles. Bound parameters only.

const OWNER_TZ = "America/New_York";

function where(f: Filters): { sql: string; args: unknown[] } {
  const parts = [`"createdAt" >= $1`, `"createdAt" < $2`];
  const args: unknown[] = [f.from, f.to];
  const add = (sql: string, v: unknown) => {
    args.push(v);
    parts.push(sql.replace("?", `$${args.length}`));
  };
  if (f.outcome && (SCAN_OUTCOMES as readonly string[]).includes(f.outcome)) add(`"outcome" = ?`, f.outcome);
  if (f.device) add(`"device" = ?`, f.device);
  if (f.country) add(`"country" = ?`, f.country);
  if (f.q) {
    args.push(`%${f.q}%`);
    parts.push(`("domain" LIKE $${args.length} OR "url" ILIKE $${args.length})`);
  }
  return { sql: parts.join(" AND "), args };
}

export type ScanLogListRow = ScanLogRow & { leadToken: string | null };

export async function scanLogRows(f: Filters, page = 0, limit = 100): Promise<{ rows: ScanLogListRow[]; total: number }> {
  await ensureAnalyticsTables();
  const w = where(f);
  const [rows, total] = await Promise.all([
    prisma.$queryRawUnsafe<ScanLogListRow[]>(
      `SELECT s."id", s."createdAt", s."url", s."domain", s."outcome", s."errorCode", s."leadId", s."country", s."countryName", s."region", s."city",
              s."device", s."browser", s."os", s."locale", s."fromPage", s."staff", l."token" AS "leadToken"
       FROM "ScanLog" s LEFT JOIN "ScannerLead" l ON l."id" = s."leadId"
       WHERE ${w.sql.replace(/"(createdAt|outcome|device|country|domain|url)"/g, 's."$1"')}
       ORDER BY s."createdAt" DESC LIMIT ${Math.min(5000, Math.max(1, limit))} OFFSET ${Math.max(0, page) * limit}`,
      ...w.args,
    ),
    prisma.$queryRawUnsafe<Array<{ n: number }>>(`SELECT count(*)::int AS n FROM "ScanLog" WHERE ${w.sql}`, ...w.args),
  ]);
  return { rows, total: total[0]?.n ?? 0 };
}

export interface ScanSummary {
  today: number;
  week: number;
  month: number;
  domains: Array<{ key: string; n: number }>;
  countries: Array<{ key: string; name: string | null; n: number }>;
  devices: Array<{ key: string; n: number }>;
  outcomes: Array<{ key: string; n: number }>;
}

export async function scanSummary(f: Filters): Promise<ScanSummary> {
  return cached(`scanlog:summary:${f.from.toISOString().slice(0, 13)}:${f.to.toISOString().slice(0, 13)}:${f.outcome}:${f.device}:${f.country}:${f.q}`, async () => {
    await ensureAnalyticsTables();
    const w = where(f);
    const [counts, domains, countries, devices, outcomes] = await Promise.all([
      prisma.$queryRawUnsafe<Array<{ today: number; week: number; month: number }>>(
        `SELECT count(*) FILTER (WHERE "createdAt" >= (date_trunc('day', now() AT TIME ZONE '${OWNER_TZ}') AT TIME ZONE '${OWNER_TZ}'))::int AS today,
                count(*) FILTER (WHERE "createdAt" >= now() - interval '7 days')::int AS week,
                count(*)::int AS month
         FROM "ScanLog" WHERE "createdAt" >= now() - interval '30 days'`,
      ),
      prisma.$queryRawUnsafe<Array<{ key: string; n: number }>>(
        `SELECT COALESCE("domain", '(none)') AS key, count(*)::int AS n FROM "ScanLog" WHERE ${w.sql} GROUP BY 1 ORDER BY n DESC, key LIMIT 10`,
        ...w.args,
      ),
      prisma.$queryRawUnsafe<Array<{ key: string; name: string | null; n: number }>>(
        `SELECT COALESCE("country", '??') AS key, max("countryName") AS name, count(*)::int AS n FROM "ScanLog" WHERE ${w.sql} GROUP BY 1 ORDER BY n DESC, key LIMIT 10`,
        ...w.args,
      ),
      prisma.$queryRawUnsafe<Array<{ key: string; n: number }>>(
        `SELECT COALESCE("device", 'unknown') AS key, count(*)::int AS n FROM "ScanLog" WHERE ${w.sql} GROUP BY 1 ORDER BY n DESC`,
        ...w.args,
      ),
      prisma.$queryRawUnsafe<Array<{ key: string; n: number }>>(
        `SELECT "outcome" AS key, count(*)::int AS n FROM "ScanLog" WHERE ${w.sql} GROUP BY 1 ORDER BY n DESC`,
        ...w.args,
      ),
    ]);
    const c = counts[0] ?? { today: 0, week: 0, month: 0 };
    return { ...c, domains, countries, devices, outcomes };
  });
}

export function scanLogCsvRows(rows: ScanLogRow[]): unknown[][] {
  return [
    ["time_utc", "url", "domain", "outcome", "error_code", "lead_id", "country", "country_name", "region", "city", "device", "browser", "os", "locale", "started_from", "staff"],
    ...rows.map((r) => [
      r.createdAt, r.url, r.domain, r.outcome, r.errorCode, r.leadId, r.country, r.countryName, r.region, r.city, r.device, r.browser, r.os, r.locale, r.fromPage, r.staff ? "yes" : "no",
    ]),
  ];
}
