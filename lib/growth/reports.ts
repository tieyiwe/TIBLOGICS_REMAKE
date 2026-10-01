import prisma from "@/lib/prisma";
import { ensureGrowthTables } from "./db";

// Attribution reporting for /admin_pro/growth/links and the hub:
// clicks → sign-ups → conversions → revenue, per link, campaign and platform
// (utm_source). Paid status and revenue are read from the real records
// (orders, purchases, subscriptions, bookings...) at report time, so an
// abandoned checkout or a cancelled booking never counts.

const DAY = 86_400_000;

export const KIND_LABEL: Record<string, string> = {
  learn_signup: "Learn sign-up",
  track_checkout: "Track purchase",
  learn_subscription_checkout: "Learn subscription",
  toolkit_checkout: "Toolkit subscription",
  blueprint: "Blueprint",
  order: "Store order",
  event_registration: "Event registration",
  appointment: "Booking",
};

export interface Row {
  key: string;
  label: string;
  campaign?: string;
  source?: string;
  medium?: string;
  target?: string;
  createdAt?: string;
  clicks: number;
  signups: number;
  conversions: number;
  revenueCents: number;
}

export interface LinkReport {
  days: number;
  from: string;
  totals: Row;
  byLink: Row[];
  byCampaign: Row[];
  byPlatform: Row[];
  byKind: { kind: string; label: string; count: number; converted: number; revenueCents: number }[];
}

interface Resolved {
  kind: string;
  linkCode: string | null;
  campaign: string;
  source: string;
  signup: boolean;
  converted: boolean;
  revenueCents: number;
}

async function tryMany<T>(fn: () => Promise<T[]>): Promise<T[]> {
  try {
    return await fn();
  } catch {
    return []; // table not created yet (runtime-created features)
  }
}

async function resolveAttributions(from: Date): Promise<Resolved[]> {
  const rows = await prisma.conversionAttribution.findMany({ where: { createdAt: { gte: from } }, take: 50_000 });
  const ids = (kind: string) => rows.filter((r) => r.kind === kind).map((r) => r.refId);

  const trackPairs = ids("track_checkout").map((r) => r.split(":"));
  const [purchases, subs, toolkit, blueprints, orders, regs, appts] = await Promise.all([
    trackPairs.length ? tryMany(() => prisma.trackPurchase.findMany({ where: { studentId: { in: trackPairs.map((p) => p[0]) } }, select: { studentId: true, trackId: true, amountCents: true } })) : [],
    ids("learn_subscription_checkout").length ? tryMany(() => prisma.learnSubscription.findMany({ where: { studentId: { in: ids("learn_subscription_checkout") } }, select: { studentId: true, status: true } })) : [],
    ids("toolkit_checkout").length ? tryMany(() => prisma.toolkitSubscription.findMany({ where: { studentId: { in: ids("toolkit_checkout") } }, select: { studentId: true, status: true } })) : [],
    ids("blueprint").length ? tryMany(() => prisma.blueprint.findMany({ where: { id: { in: ids("blueprint") } }, select: { id: true, paidAt: true, amountPaid: true } })) : [],
    ids("order").length ? tryMany(() => prisma.order.findMany({ where: { id: { in: ids("order") } }, select: { id: true, status: true, total: true } })) : [],
    ids("event_registration").length ? tryMany(() => prisma.eventRegistration.findMany({ where: { id: { in: ids("event_registration") } }, select: { id: true, status: true, price: true } })) : [],
    ids("appointment").length ? tryMany(() => prisma.appointment.findMany({ where: { id: { in: ids("appointment") } }, select: { id: true, status: true, paymentStatus: true, totalAmount: true } })) : [],
  ]);
  const purchaseMap = new Map(purchases.map((p) => [`${p.studentId}:${p.trackId}`, p.amountCents]));
  const subMap = new Map(subs.map((s) => [s.studentId, s.status]));
  const tkMap = new Map(toolkit.map((s) => [s.studentId, s.status]));
  const bpMap = new Map(blueprints.map((b) => [b.id, b]));
  const orderMap = new Map(orders.map((o) => [o.id, o]));
  const regMap = new Map(regs.map((r) => [r.id, r]));
  const apptMap = new Map(appts.map((a) => [a.id, a]));

  return rows.map((r) => {
    let converted = false;
    let revenue = 0;
    switch (r.kind) {
      case "track_checkout": {
        const amt = purchaseMap.get(r.refId);
        if (amt !== undefined) { converted = true; revenue = amt; }
        break;
      }
      case "learn_subscription_checkout":
        if (subMap.has(r.refId)) { converted = true; revenue = r.amountCents ?? 0; }
        break;
      case "toolkit_checkout":
        if (tkMap.has(r.refId)) { converted = true; revenue = r.amountCents ?? 0; }
        break;
      case "blueprint": {
        const b = bpMap.get(r.refId);
        if (b?.paidAt) { converted = true; revenue = b.amountPaid; }
        break;
      }
      case "order": {
        const o = orderMap.get(r.refId);
        if (o && (o.status === "paid" || o.status === "fulfilled")) { converted = true; revenue = o.total; }
        break;
      }
      case "event_registration": {
        const g = regMap.get(r.refId);
        if (g && g.status === "paid") { converted = true; revenue = g.price; }
        else if (g && g.price === 0 && g.status !== "cancelled") converted = true;
        break;
      }
      case "appointment": {
        const a = apptMap.get(r.refId);
        if (a && (a.status === "CONFIRMED" || a.status === "COMPLETED")) {
          converted = true;
          if (a.paymentStatus === "paid") revenue = a.totalAmount;
        }
        break;
      }
    }
    return {
      kind: r.kind,
      linkCode: r.linkCode,
      campaign: r.utmCampaign ?? "(none)",
      source: r.utmSource ?? "(none)",
      signup: r.kind === "learn_signup",
      converted,
      revenueCents: revenue,
    };
  });
}

const blank = (key: string, label: string): Row => ({ key, label, clicks: 0, signups: 0, conversions: 0, revenueCents: 0 });

export async function getLinkReport(days: number): Promise<LinkReport> {
  await ensureGrowthTables();
  const from = new Date(Date.now() - days * DAY);
  const [links, clicks, resolved] = await Promise.all([
    prisma.growthLink.findMany({ orderBy: { createdAt: "desc" }, take: 5000 }),
    prisma.$queryRaw<{ linkCode: string; n: bigint }[]>`SELECT "linkCode", COUNT(*)::bigint AS n FROM "GrowthClick" WHERE "createdAt" >= ${from} GROUP BY "linkCode"`,
    resolveAttributions(from),
  ]);
  const clickMap = new Map(clicks.map((c) => [c.linkCode, Number(c.n)]));
  const linkMap = new Map(links.map((l) => [l.code, l]));

  const byLink = new Map<string, Row>();
  const byCampaign = new Map<string, Row>();
  const byPlatform = new Map<string, Row>();
  const totals = blank("total", "All campaigns");
  const get = (m: Map<string, Row>, key: string, label: string) => {
    let r = m.get(key);
    if (!r) m.set(key, (r = blank(key, label)));
    return r;
  };

  for (const l of links) {
    const n = clickMap.get(l.code) ?? 0;
    const row = get(byLink, l.code, l.label || l.code);
    Object.assign(row, { campaign: l.utmCampaign, source: l.utmSource, medium: l.utmMedium, target: l.targetUrl, createdAt: l.createdAt.toISOString() });
    row.clicks += n;
    get(byCampaign, l.utmCampaign, l.utmCampaign).clicks += n;
    get(byPlatform, l.utmSource, l.utmSource).clicks += n;
    totals.clicks += n;
  }

  const byKind = new Map<string, { kind: string; label: string; count: number; converted: number; revenueCents: number }>();
  for (const r of resolved) {
    const link = r.linkCode ? linkMap.get(r.linkCode) : undefined;
    const campaign = link?.utmCampaign ?? r.campaign;
    const source = link?.utmSource ?? r.source;
    const targets = [get(byCampaign, campaign, campaign), get(byPlatform, source, source), totals];
    if (link) targets.push(get(byLink, link.code, link.label || link.code));
    for (const t of targets) {
      if (r.signup) t.signups++;
      if (r.converted) t.conversions++;
      t.revenueCents += r.revenueCents;
    }
    const k = byKind.get(r.kind) ?? { kind: r.kind, label: KIND_LABEL[r.kind] ?? r.kind, count: 0, converted: 0, revenueCents: 0 };
    k.count++;
    if (r.converted || r.signup) k.converted++;
    k.revenueCents += r.revenueCents;
    byKind.set(r.kind, k);
  }

  const sort = (a: Row, b: Row) => b.revenueCents - a.revenueCents || b.conversions - a.conversions || b.signups - a.signups || b.clicks - a.clicks;
  return {
    days,
    from: from.toISOString(),
    totals,
    byLink: [...byLink.values()].sort(sort),
    byCampaign: [...byCampaign.values()].sort(sort),
    byPlatform: [...byPlatform.values()].sort(sort),
    byKind: [...byKind.values()].sort((a, b) => b.count - a.count),
  };
}

const csvCell = (v: unknown) => {
  const s = v === null || v === undefined ? "" : String(v);
  // Neutralise spreadsheet formulas, then quote.
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return `"${safe.replace(/"/g, '""')}"`;
};

export function linkReportCsv(r: LinkReport, view: "links" | "campaigns" | "platforms"): string {
  const rows = view === "campaigns" ? r.byCampaign : view === "platforms" ? r.byPlatform : r.byLink;
  const head = view === "links"
    ? ["code", "label", "campaign", "source", "medium", "target", "created", "clicks", "signups", "conversions", "revenue_usd"]
    : [view === "campaigns" ? "campaign" : "platform", "clicks", "signups", "conversions", "revenue_usd"];
  const lines = [head.map(csvCell).join(",")];
  for (const x of rows) {
    const money = (x.revenueCents / 100).toFixed(2);
    lines.push(
      (view === "links"
        ? [x.key, x.label, x.campaign, x.source, x.medium, x.target, x.createdAt?.slice(0, 10), x.clicks, x.signups, x.conversions, money]
        : [x.key, x.clicks, x.signups, x.conversions, money]
      ).map(csvCell).join(","),
    );
  }
  return lines.join("\r\n") + "\r\n";
}
