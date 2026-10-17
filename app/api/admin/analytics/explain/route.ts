import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/require-admin";
import { staffAiLimit } from "@/lib/rate-limit";
import { isAiBudgetError, runClaude } from "@/lib/claude";
import { parseFilters } from "@/lib/analytics/filters";
import { getKpis, whatChanged } from "@/lib/analytics/insights";
import { getAcquisition } from "@/lib/analytics/acquisition";
import { biggestLeak, getFunnels } from "@/lib/analytics/funnels";
import { arfaFeatures, topPages } from "@/lib/analytics/usage";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// "Explain this week": a short plain-language summary of the analytics, by
// the platform's cheap model (lib/claude.ts "analytics-summary", Haiku), under
// the admin AI rate limit and the platform AI budget. Only aggregates are
// sent: counts, percentages, sources (host names), normalised page paths and
// country codes. No person, email, address or id ever reaches the model.
// Owner, admins and Business analytics holders (same as the Insights page).

const Body = z.object({ range: z.enum(["7", "30", "90"]).default("7") });

export async function POST(req: NextRequest) {
  const denied = await requirePermission("insights");
  if (denied) return denied;
  const limited = await staffAiLimit("analytics-explain", 10);
  if (limited) return limited;
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Bad request" }, { status: 400 });
  const f = parseFilters({ range: parsed.data.range });

  const [kpis, movers, acq, funnels, pages, features] = await Promise.all([getKpis(f, true), whatChanged(f), getAcquisition(f), getFunnels(f), topPages(f), arfaFeatures(f)]);
  const facts = {
    period: `last ${f.days} days vs the ${f.days} days before`,
    kpis: kpis.map((k) => ({ metric: k.label, now: k.money ? `$${Math.round(k.cur / 100)}` : k.cur, before: k.money ? `$${Math.round(k.prev / 100)}` : k.prev })),
    biggest_changes: movers.map((m) => m.text),
    top_sources: acq.sources.slice(0, 8).map((s) => ({ source: s.source, medium: s.medium, visits: s.sessions, before: s.prevSessions, signups: s.signups, bookings: s.bookings, leads: s.leads })),
    funnels: funnels.map((fn) => ({ funnel: fn.label, steps: fn.steps.map((s) => `${s.label}: ${s.n}`), worst_step: biggestLeak(fn) ? `${biggestLeak(fn)!.to.label} (${Math.round(biggestLeak(fn)!.rate * 100)}% continue)` : null })),
    top_pages: pages.slice(0, 8).map((p) => ({ page: p.page, views: p.views, before: p.prevViews })),
    least_used_arfa_features: features.slice(0, 4).map((x) => ({ feature: x.label, uses: x.views + x.clicks })),
  };

  try {
    const { text } = await runClaude("analytics-summary", {
      system:
        "You are a growth analyst for TIBLOGICS, a small AI services company with an online AI academy (ARFA), a website scanner, a store and a youth programme. " +
        "Given aggregate analytics as JSON, write a short summary for the owner: 3 to 5 bullet points on what changed and why it may matter, then 2 or 3 concrete next actions. " +
        "Plain English, no jargon, no more than 180 words. Use only the numbers given; say when volumes are too small to conclude anything. Do not invent data.",
      messages: [{ role: "user", content: JSON.stringify(facts) }],
    });
    return NextResponse.json({ summary: text.trim().slice(0, 4000) });
  } catch (err) {
    if (isAiBudgetError(err)) return NextResponse.json({ error: "The AI budget for today is used up. Try again tomorrow." }, { status: 503 });
    console.error("[analytics/explain]", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "The summary could not be written. Try again in a minute." }, { status: 502 });
  }
}
