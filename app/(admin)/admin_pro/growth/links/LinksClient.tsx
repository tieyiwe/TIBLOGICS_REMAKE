"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, Copy, Download, Link2 } from "lucide-react";
import type { LinkReport, Row } from "@/lib/growth/reports";
import { PLATFORMS } from "@/lib/growth/content/platforms";
import { btn, Card, input, label, money, Stat } from "../_components/ui";

const pct = (n: number, d: number) => (d ? `${Math.round((n / d) * 100)}%` : "–");

function Table({ rows, kind }: { rows: Row[]; kind: "links" | "campaigns" | "platforms" }) {
  if (!rows.length) return <p className="font-dm text-sm text-[#7A8FA6]">No data yet.</p>;
  return (
    <div className="overflow-x-auto -mx-1">
      <table className="w-full min-w-[560px] font-dm text-sm">
        <thead>
          <tr className="text-left text-xs text-[#7A8FA6]">
            <th className="py-1.5 px-1">{kind === "links" ? "Link" : kind === "campaigns" ? "Campaign" : "Platform"}</th>
            <th className="py-1.5 px-1 text-right">Clicks</th>
            <th className="py-1.5 px-1 text-right">Sign-ups</th>
            <th className="py-1.5 px-1 text-right">Conversions</th>
            <th className="py-1.5 px-1 text-right">Conv. / click</th>
            <th className="py-1.5 px-1 text-right">Revenue</th>
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, 200).map((r) => (
            <tr key={r.key} className="border-t border-[#E6ECF3]">
              <td className="py-1.5 px-1 max-w-[360px]">
                <span className="block truncate text-[#0D1B2A]" title={r.label}>{r.label}</span>
                {kind === "links" && <span className="block truncate text-[11px] text-[#7A8FA6]">/go/{r.key} · {r.source}/{r.medium} · {r.campaign}</span>}
              </td>
              <td className="py-1.5 px-1 text-right tabular-nums">{r.clicks}</td>
              <td className="py-1.5 px-1 text-right tabular-nums">{r.signups}</td>
              <td className="py-1.5 px-1 text-right tabular-nums">{r.conversions}</td>
              <td className="py-1.5 px-1 text-right tabular-nums text-[#7A8FA6]">{pct(r.signups + r.conversions, r.clicks)}</td>
              <td className="py-1.5 px-1 text-right tabular-nums font-semibold">{money(r.revenueCents)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const Csv = ({ view, days }: { view: string; days: number }) => (
  <a href={`/api/admin/growth/links/export?view=${view}&days=${days}`} className="inline-flex items-center gap-1 rounded-lg border border-[#D2DCE8] px-2.5 py-1 font-dm text-xs text-[#2251A3] hover:bg-[#F4F7FB]">
    <Download size={12} /> CSV
  </a>
);

export default function LinksClient({ report, days, ranges, site }: { report: LinkReport; days: number; ranges: number[]; site: string }) {
  const router = useRouter();
  const t = report.totals;
  const [form, setForm] = useState({ targetUrl: "/", utmSource: "linkedin", utmMedium: "social", utmCampaign: "", utmContent: "", label: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [created, setCreated] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    setCreated(null);
    const res = await fetch("/api/admin/growth/links", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const j = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setErr(j.error ?? "Could not create the link");
    setCreated(j.link.shortUrl);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <nav className="inline-flex rounded-xl border border-[#D2DCE8] bg-white p-1" aria-label="Date range">
        {ranges.map((d) => (
          <Link key={d} href={`/admin_pro/growth/links?days=${d}`} aria-current={d === days ? "page" : undefined}
            className={`px-3 py-1.5 rounded-lg font-dm text-sm font-medium ${d === days ? "bg-[#1B3A6B] text-white" : "text-[#3A4A5C] hover:bg-[#F4F7FB]"}`}>
            {d === 365 ? "1 year" : `${d} days`}
          </Link>
        ))}
      </nav>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label={`Unique clicks, last ${days} days`} value={t.clicks.toLocaleString("en-US")} note="One per visitor, link and day; bots excluded" />
        <Stat label="Learn sign-ups" value={t.signups.toLocaleString("en-US")} note={`${pct(t.signups, t.clicks)} of clicks`} />
        <Stat label="Conversions" value={t.conversions.toLocaleString("en-US")} note="Paid purchases, subscriptions, registrations, bookings" />
        <Stat label="Attributed revenue" value={money(t.revenueCents)} tone={t.revenueCents ? "good" : undefined} note="Paid records only" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="By campaign" action={<Csv view="campaigns" days={days} />}><Table rows={report.byCampaign} kind="campaigns" /></Card>
        <Card title="By platform (utm_source)" action={<Csv view="platforms" days={days} />}><Table rows={report.byPlatform} kind="platforms" /></Card>
      </div>
      <Card title="By link" action={<Csv view="links" days={days} />}><Table rows={report.byLink} kind="links" /></Card>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Card title="Conversions by type">
          {report.byKind.length === 0 ? <p className="font-dm text-sm text-[#7A8FA6]">No attributed conversions yet.</p> : (
            <ul className="divide-y divide-[#E6ECF3] font-dm text-sm">
              {report.byKind.map((k) => (
                <li key={k.kind} className="flex items-center justify-between gap-2 py-1.5">
                  <span>{k.label}</span>
                  <span className="tabular-nums text-[#3A4A5C]">{k.converted}/{k.count} {k.revenueCents ? `· ${money(k.revenueCents)}` : ""}</span>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-2 font-dm text-[11px] text-[#7A8FA6]">Started / converted. A started checkout counts once it is paid.</p>
        </Card>

        <Card title={<span id="new" className="inline-flex items-center gap-1.5"><Link2 size={16} /> New tracked link</span>} subtitle={`Targets must be https on ${new URL(site).host} or a host in GROWTH_LINK_ALLOWED_HOSTS.`}>
          <form onSubmit={create} className="space-y-2">
            <div><label className={label} htmlFor="l-target">Target (path or URL)</label><input id="l-target" className={input} required value={form.targetUrl} onChange={(e) => setForm({ ...form, targetUrl: e.target.value })} placeholder="/learning-box" /></div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={label} htmlFor="l-src">Source</label>
                <input id="l-src" list="l-sources" className={input} required value={form.utmSource} onChange={(e) => setForm({ ...form, utmSource: e.target.value })} />
                <datalist id="l-sources">{[...PLATFORMS, "newsletter", "google", "partner"].map((s) => <option key={s} value={s} />)}</datalist>
              </div>
              <div>
                <label className={label} htmlFor="l-med">Medium</label>
                <select id="l-med" className={input} value={form.utmMedium} onChange={(e) => setForm({ ...form, utmMedium: e.target.value })}>
                  {["social", "email", "outreach", "ads", "referral"].map((m) => <option key={m}>{m}</option>)}
                </select>
              </div>
              <div><label className={label} htmlFor="l-camp">Campaign</label><input id="l-camp" className={input} required value={form.utmCampaign} onChange={(e) => setForm({ ...form, utmCampaign: e.target.value })} placeholder="spring-launch" /></div>
              <div><label className={label} htmlFor="l-cont">Content (optional)</label><input id="l-cont" className={input} value={form.utmContent} onChange={(e) => setForm({ ...form, utmContent: e.target.value })} /></div>
            </div>
            <div><label className={label} htmlFor="l-label">Label (optional)</label><input id="l-label" className={input} value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} /></div>
            {err && <p role="alert" className="font-dm text-sm text-[#B42318]">{err}</p>}
            <button className={btn.primary} disabled={busy}>{busy ? "Creating…" : "Create link"}</button>
            {created && (
              <div className="flex items-center gap-2 rounded-lg bg-[#E7F6F0] border border-[#B6E2D0] px-3 py-2">
                <code className="font-mono text-sm text-[#0F6E56] break-all" data-testid="new-link">{created}</code>
                <button type="button" className="ml-auto p-1" aria-label="Copy link" onClick={async () => { await navigator.clipboard.writeText(created).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 1500); }}>
                  {copied ? <Check size={15} /> : <Copy size={15} />}
                </button>
              </div>
            )}
          </form>
        </Card>
      </div>
    </div>
  );
}
