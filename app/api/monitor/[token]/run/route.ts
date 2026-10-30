import { NextRequest, NextResponse } from "next/server";
import { findMonitorByToken } from "@/lib/monitor/access";
import { runMonitor } from "@/lib/monitor/run";
import { MANUAL_RUN_COOLDOWN_HOURS } from "@/lib/monitor/config";
import { getT } from "@/lib/i18n/server";

// "Rescan now", once per MANUAL_RUN_COOLDOWN_HOURS. Runs inline: four sites in
// parallel finish well inside the limit, and the subscriber is waiting for it.

export const maxDuration = 60;

export async function POST(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const t = await getT();
  const sub = await findMonitorByToken(token);
  if (!sub) return NextResponse.json({ error: t("tools.api.notFound") }, { status: 404 });
  if (sub.status !== "active") {
    return NextResponse.json({ error: t("tools.monitor.api.runInactive") }, { status: 409 });
  }

  const cooldownMs = MANUAL_RUN_COOLDOWN_HOURS * 3_600_000;
  const since = sub.lastManualRunAt ? Date.now() - sub.lastManualRunAt.getTime() : Infinity;
  if (since < cooldownMs) {
    const hours = Math.ceil((cooldownMs - since) / 3_600_000);
    return NextResponse.json({ error: hours === 1 ? t("tools.monitor.api.cooldown.one") : t("tools.monitor.api.cooldown.other", { n: hours }) }, { status: 429 });
  }

  try {
    const result = await runMonitor(sub.id, { manual: true });
    if (!result.ran) {
      return NextResponse.json({ error: t("tools.monitor.api.running") }, { status: 409 });
    }
    return NextResponse.json({ ok: true, changes: result.changes });
  } catch (err) {
    console.error("[monitor/run]", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: t("tools.monitor.api.runFailed") }, { status: 500 });
  }
}
