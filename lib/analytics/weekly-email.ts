import prisma from "@/lib/prisma";
import { parseFilters } from "./filters";
import { getKpis, whatChanged, weeklyEmailEnabled, type Kpi } from "./insights";
import { getAcquisition } from "./acquisition";
import { biggestLeak, getFunnels } from "./funnels";
import { arfaFeatures, topPages } from "./usage";
import { getRevenue, LINES } from "./revenue";

// The weekly growth email to the owner: last week's KPIs and what changed,
// top sources, funnel leaks, top pages, least-used ARFA features and revenue.
// Sent from the hourly reminders cron on Monday from 8:00 owner time (once a
// week, claimed in AdminSettings), to ADMIN_NOTIFY_EMAIL or sales@. The owner
// can turn it off in Settings (AdminSettings analytics_weekly_email = off).

export const OWNER_TZ = (() => {
  const tz = process.env.OWNER_TIMEZONE?.trim();
  try {
    if (tz) new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return tz || "America/New_York";
  } catch {
    return "America/New_York";
  }
})();
const SENT_KEY = "analytics_weekly_email_sent";

export function weeklyRecipient(): string {
  return process.env.ADMIN_NOTIFY_EMAIL?.trim() || "sales@tiblogics.com";
}

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#x27;" })[c]!);
}
const money = (c: number) => `$${(c / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
const fmtKpi = (k: Kpi, v: number) => (k.money ? money(v) : k.pct ? `${v}%` : v.toLocaleString("en-US"));
function delta(cur: number, prev: number): string {
  if (cur === prev) return "no change";
  if (!prev) return "new";
  const p = Math.round(((cur - prev) / prev) * 100);
  return `${p > 0 ? "▲" : "▼"} ${Math.abs(p)}%`;
}

/** Monday 8:00 or later in the owner's time zone, and the ISO-ish week key. */
export function ownerClock(now = new Date()): { monday: boolean; hour: number; week: string } {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", { timeZone: OWNER_TZ, weekday: "short", hour: "numeric", hour12: false, year: "numeric", month: "2-digit", day: "2-digit" })
      .formatToParts(now)
      .map((p) => [p.type, p.value]),
  );
  const hour = Number(parts.hour) % 24;
  const local = new Date(`${parts.year}-${parts.month}-${parts.day}T00:00:00Z`);
  const monday = new Date(local.getTime() - ((local.getUTCDay() + 6) % 7) * 86_400_000);
  return { monday: parts.weekday === "Mon", hour, week: monday.toISOString().slice(0, 10) };
}

export async function buildWeeklyEmail(): Promise<{ subject: string; html: string; text: string }> {
  const f = parseFilters({ range: "7" });
  const [kpis, movers, acq, funnels, pages, features, rev] = await Promise.all([
    getKpis(f, true),
    whatChanged(f),
    getAcquisition(f),
    getFunnels(f),
    topPages(f),
    arfaFeatures(f),
    getRevenue(f),
  ]);
  const base = (process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "https://tiblogics.com").replace(/\/$/, "");
  const rows = (items: Array<[string, string]>) =>
    items.map(([k, v]) => `<tr><td style="padding:5px 12px 5px 0;color:#3A4A5C;font-size:13px;">${esc(k)}</td><td style="padding:5px 0;color:#0D1B2A;font-size:13px;font-weight:700;text-align:right;white-space:nowrap;">${esc(v)}</td></tr>`).join("");
  const section = (title: string, body: string) =>
    `<h3 style="margin:22px 0 6px;color:#1B3A6B;font-size:15px;">${esc(title)}</h3>${body}`;
  const table = (items: Array<[string, string]>) => (items.length ? `<table style="border-collapse:collapse;width:100%;">${rows(items)}</table>` : `<p style="color:#7A8FA6;font-size:13px;margin:0;">Nothing yet.</p>`);

  const leaks = funnels
    .map((fn) => ({ fn, leak: biggestLeak(fn) }))
    .filter((x) => x.leak)
    .map((x) => [`${x.fn.label}: ${x.leak!.from.label} → ${x.leak!.to.label}`, `${Math.round(x.leak!.rate * 100)}% continue`] as [string, string]);

  const html = `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#F4F7FB;font-family:Arial,sans-serif;">
<div style="max-width:600px;margin:24px auto;background:#fff;border-radius:14px;overflow:hidden;border:1px solid #E3E9F1;">
  <div style="background:#1B3A6B;padding:18px 24px;"><span style="color:#fff;font-size:18px;font-weight:700;">TIB<span style="color:#F47C20;">LOGICS</span></span><span style="color:#C9D6EA;font-size:13px;margin-left:8px;">Weekly growth report</span></div>
  <div style="padding:22px 24px;">
    <p style="margin:0;color:#3A4A5C;font-size:14px;">The last 7 days compared with the 7 days before.</p>
    ${section("Key numbers", table(kpis.map((k) => [k.label, `${fmtKpi(k, k.cur)}  (${delta(k.cur, k.prev)})`])))}
    ${section("What changed", movers.length ? `<ul style="margin:0;padding-left:18px;color:#0D1B2A;font-size:13px;line-height:1.6;">${movers.map((m) => `<li>${esc(m.text)}</li>`).join("")}</ul>` : `<p style="color:#7A8FA6;font-size:13px;margin:0;">No big moves this week.</p>`)}
    ${section("Top sources", table(acq.sources.slice(0, 6).map((s) => [`${s.source}${s.medium ? ` / ${s.medium}` : ""}`, `${s.sessions} visits · ${s.signups + s.bookings + s.leads} conversions`])))}
    ${section("Revenue", table([["Total", `${money(rev.total.cur)} (${delta(rev.total.cur, rev.total.prev)})`], ...rev.lines.filter((l) => l.cur > 0).map((l) => [LINES[l.key] ?? l.label, money(l.cur)] as [string, string])]))}
    ${section("Funnel leaks (worst step)", table(leaks))}
    ${section("Top pages", table(pages.slice(0, 6).map((p) => [p.page, `${p.views} views`])))}
    ${section("Least-used ARFA features", table(features.slice(0, 4).map((x) => [x.label, `${x.views + x.clicks} uses`])))}
    <p style="margin:24px 0 0;"><a href="${base}/admin_pro/analytics" style="display:inline-block;background:#B8500A;color:#fff;text-decoration:none;padding:10px 18px;border-radius:10px;font-size:14px;font-weight:700;">Open analytics</a></p>
    <p style="margin:16px 0 0;color:#5A6E84;font-size:12px;">Sent to ${esc(weeklyRecipient())}. Turn it off in Admin → Settings → Notifications (weekly growth email).</p>
  </div>
</div></body></html>`;
  const text = [
    "TIBLOGICS weekly growth report (last 7 days vs the 7 before)",
    ...kpis.map((k) => `${k.label}: ${fmtKpi(k, k.cur)} (${delta(k.cur, k.prev)})`),
    "",
    ...movers.map((m) => `- ${m.text}`),
    "",
    `${base}/admin_pro/analytics`,
  ].join("\n");
  const rk = kpis.find((k) => k.key === "revenue");
  return { subject: `Weekly growth: ${kpis[0].cur} visitors, ${rk ? money(rk.cur) : ""} revenue`.replace(/,\s+revenue$/, ""), html, text };
}

/**
 * Called every hour by the reminders cron. Sends once per week, on Monday from
 * 8:00 owner time; `force` sends now (cron ?weekly=force, for a test).
 */
export async function maybeSendWeeklyEmail(opts: { force?: boolean } = {}): Promise<"sent" | "off" | "not-due" | "already" | "failed"> {
  try {
    if (!(await weeklyEmailEnabled())) return "off";
    const clock = ownerClock();
    if (!opts.force && (!clock.monday || clock.hour < 8)) return "not-due";
    // Claim the week first, so two overlapping runs send once.
    if (!opts.force) {
      const prev = await prisma.adminSettings.findUnique({ where: { key: SENT_KEY } }).catch(() => null);
      if (prev?.value === clock.week) return "already";
      const claimed = prev
        ? await prisma.adminSettings.updateMany({ where: { key: SENT_KEY, value: prev.value }, data: { value: clock.week } })
        : await prisma.adminSettings.create({ data: { key: SENT_KEY, value: clock.week } }).then(() => ({ count: 1 })).catch(() => ({ count: 0 }));
      if (claimed.count !== 1) return "already";
    }
    const mail = await buildWeeklyEmail();
    const { default: mailer } = await import("@/lib/resend");
    await mailer.emails.send({ to: weeklyRecipient(), subject: mail.subject, html: mail.html });
    return "sent";
  } catch (err) {
    console.error("[analytics/weekly-email]", err instanceof Error ? err.message : err);
    return "failed";
  }
}
