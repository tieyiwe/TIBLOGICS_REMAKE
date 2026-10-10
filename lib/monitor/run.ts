import { randomUUID } from "crypto";
import prisma from "@/lib/prisma";
import { scanSite } from "@/lib/scanner/scan";
import { ensureMonitorTables } from "./db";
import { SCAN_INTERVAL_DAYS, STALE_RUN_MINUTES } from "./config";
import { changesBetween, competitorGaps, rankOf, summarise, type ScanRow } from "./report";
import { sendMonitorReportEmail } from "./email";
import { monitorLink } from "./token";

// One Readiness Monitor pass: scan the subscriber's site and each competitor,
// store the scores, and email the subscriber if anything moved.

export type RunResult =
  | { ran: true; runId: string; emailed: boolean; changes: number }
  | { ran: false; reason: "not-active" | "busy" };

/** Previous run's scans, or null on the first run. */
async function previousRun(subscriptionId: string) {
  const last = await prisma.monitorScan.findFirst({
    where: { subscriptionId },
    orderBy: { createdAt: "desc" },
    select: { runId: true },
  });
  if (!last) return null;
  return prisma.monitorScan.findMany({ where: { runId: last.runId } });
}

export async function runMonitor(id: string, opts: { manual?: boolean } = {}): Promise<RunResult> {
  await ensureMonitorTables();
  const now = new Date();

  // Claim the subscription in one statement. Two cron invocations, or a cron
  // run and a "Run now" click, would otherwise scan the same sites twice and
  // send two emails. A claim older than STALE_RUN_MINUTES belonged to a
  // process that died mid-run and can be taken over.
  const claimed = await prisma.monitorSubscription.updateMany({
    where: {
      id,
      status: "active",
      OR: [{ runStartedAt: null }, { runStartedAt: { lt: new Date(now.getTime() - STALE_RUN_MINUTES * 60_000) } }],
    },
    data: { runStartedAt: now },
  });
  if (claimed.count === 0) {
    const sub = await prisma.monitorSubscription.findUnique({ where: { id }, select: { status: true } });
    return { ran: false, reason: sub?.status === "active" ? "busy" : "not-active" };
  }

  try {
    const sub = await prisma.monitorSubscription.findUniqueOrThrow({ where: { id } });
    const prev = await previousRun(id);

    const targets = [
      { url: sub.siteUrl, isOwn: true },
      ...sub.competitors.map((url) => ({ url, isOwn: false })),
    ];
    // In parallel: four sites at up to 20 seconds each would otherwise be over
    // a minute per subscriber.
    const results = await Promise.all(
      targets.map((t) =>
        scanSite(t.url).catch((err) => ({ ok: false as const, status: 502 as const, error: err instanceof Error ? err.message : "Scan failed" })),
      ),
    );

    const runId = randomUUID();
    const rows = targets.map((t, i) => {
      const r = results[i];
      return {
        subscriptionId: id,
        runId,
        // The configured URL, not the post-redirect one, so the next run can
        // match this site even if its redirect target changes.
        url: t.url,
        isOwn: t.isOwn,
        ok: r.ok,
        error: r.ok ? null : r.error.slice(0, 300),
        overallScore: r.ok ? r.overallScore : null,
        seoScore: r.ok ? r.seoScore : null,
        perfScore: r.ok ? r.perfScore : null,
        uxScore: r.ok ? r.uxScore : null,
        aiScore: r.ok ? r.aiScore : null,
        findings: r.ok ? JSON.parse(JSON.stringify(r.findings)) : undefined,
      };
    });
    await prisma.monitorScan.createMany({ data: rows });

    const curr = summarise(rows.map((r) => ({ ...r, findings: r.findings ?? null, createdAt: now })) as ScanRow[]);
    const before = prev ? summarise(prev) : null;
    const changes = before ? changesBetween(before, curr) : [];

    await prisma.monitorSubscription.update({
      where: { id },
      data: {
        lastRunAt: now,
        nextRunAt: new Date(now.getTime() + SCAN_INTERVAL_DAYS * 86_400_000),
        runStartedAt: null,
        ...(opts.manual ? { lastManualRunAt: now } : {}),
      },
    });

    // The first report always goes out; after that only when something moved,
    // so a quiet week does not become a habit of ignoring these emails.
    let emailed = false;
    if (!before || changes.length > 0) {
      try {
        await sendMonitorReportEmail({
          email: sub.email,
          link: await monitorLink(sub),
          sites: curr,
          gaps: competitorGaps(curr),
          changes,
          rank: rankOf(curr),
          first: !before,
        });
        emailed = true;
      } catch (err) {
        // The scan is stored and visible on the dashboard; a mail outage
        // should not make the run count as failed and rescan.
        console.error("[monitor] report email failed", id, err instanceof Error ? err.message : err);
      }
    }

    return { ran: true, runId, emailed, changes: changes.length };
  } catch (err) {
    // Release the claim so the next cron call can retry, rather than waiting
    // out the stale window.
    await prisma.monitorSubscription.update({ where: { id }, data: { runStartedAt: null } }).catch(() => {});
    throw err;
  }
}

/** Subscriptions whose next scan is due, oldest first. */
export async function dueMonitors(limit: number): Promise<string[]> {
  await ensureMonitorTables();
  const rows = await prisma.monitorSubscription.findMany({
    where: { status: "active", nextRunAt: { lte: new Date() } },
    orderBy: { nextRunAt: "asc" },
    take: limit,
    select: { id: true },
  });
  return rows.map((r) => r.id);
}
