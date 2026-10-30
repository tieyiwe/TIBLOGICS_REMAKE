import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { fetchPageSpeed, pageSpeedFindings } from "./extra";
import { readExtra } from "./view";

// Finishing an unlocked report (paid, booked call, staff or a paid re-scan):
// Google PageSpeed for the site (optional key), then the "your full report
// is ready" email with the PDF. Once per scan; the scanner cron job retries.
//
// There is no written fix plan: the report says what is wrong and why it
// matters, and fixing it is what TIBLOGICS is booked for.

const STALE_MS = 15 * 60_000;
export const MAX_REPORT_ATTEMPTS = 3;

/** Claims the lead. Only an unlocked lead not finished yet (or a failed or stale attempt) is claimed. */
async function claim(id: string): Promise<boolean> {
  const n = await prisma.$executeRawUnsafe(
    `UPDATE "ScannerLead" SET "reportStatus" = 'writing', "followupAt" = NULL,
       "extra" = jsonb_set(COALESCE("extra", '{}'::jsonb), '{writingAt}', to_jsonb(NOW()))
     WHERE "id" = $1 AND "unlockedAt" IS NOT NULL
       AND ("reportStatus" IS NULL
            OR ("reportStatus" LIKE 'failed:%' AND split_part("reportStatus", ':', 2)::int < ${MAX_REPORT_ATTEMPTS})
            OR ("reportStatus" = 'writing' AND COALESCE(("extra"->>'writingAt')::timestamptz, 'epoch') < NOW() - INTERVAL '${STALE_MS / 60_000} minutes'))`,
    id,
  );
  return n === 1;
}

export async function finishReport(id: string): Promise<"ready" | "skipped" | "failed"> {
  const before = await prisma.scannerLead.findUnique({ where: { id }, select: { reportStatus: true } });
  const previousFailures = Number(/^failed:(\d+)$/.exec(before?.reportStatus ?? "")?.[1] ?? 0);
  if (!(await claim(id))) return "skipped";
  const lead = await prisma.scannerLead.findUnique({ where: { id } });
  if (!lead) return "skipped";
  try {
    const extra = readExtra(lead.extra);
    const data: Prisma.ScannerLeadUpdateInput = { reportStatus: "ready" };
    if (extra && !extra.pageSpeedAt) {
      const ps = await fetchPageSpeed(lead.url).catch(() => null);
      data.extra = { ...extra, pageSpeed: ps, pageSpeedFindings: ps ? pageSpeedFindings(ps) : [], pageSpeedAt: new Date().toISOString() } as unknown as Prisma.InputJsonValue;
    }
    await prisma.scannerLead.update({ where: { id }, data });
    const { sendReportReadyEmail } = await import("./email");
    await sendReportReadyEmail(id).catch((err) => console.error("[scanner] report email", id, err instanceof Error ? err.message : err));
    return "ready";
  } catch (err) {
    console.error("[scanner] report", id, err instanceof Error ? err.message : err);
    await prisma.scannerLead.update({ where: { id }, data: { reportStatus: `failed:${previousFailures + 1}` } }).catch(() => {});
    return "failed";
  }
}

/** Unlocked scans not finished yet (for the cron job). */
export async function pendingReports(limit: number): Promise<string[]> {
  const rows = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
    `SELECT "id" FROM "ScannerLead"
     WHERE "unlockedAt" IS NOT NULL
       AND ("reportStatus" IS NULL
            OR ("reportStatus" LIKE 'failed:%' AND split_part("reportStatus", ':', 2)::int < ${MAX_REPORT_ATTEMPTS})
            OR ("reportStatus" = 'writing' AND COALESCE(("extra"->>'writingAt')::timestamptz, 'epoch') < NOW() - INTERVAL '${STALE_MS / 60_000} minutes'))
     ORDER BY "unlockedAt" ASC LIMIT ${Math.max(1, Math.min(20, limit))}`,
  );
  return rows.map((r) => r.id);
}
